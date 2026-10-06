import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assertGuideFreeForTrek, GuideConflictError } from "@/lib/assignments";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isObjectId = /^[a-f\d]{24}$/i.test(id);

    const trek = await prisma.trek.findFirst({
      where: isObjectId ? { OR: [{ id }, { slug: id }] } : { slug: id },
      include: {
        guide: { select: { id: true, name: true, email: true, phone: true, bio: true } },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        schedules: {
          where: { status: { in: ["OPEN", "FULL"] } },
          orderBy: { startDate: "asc" },
        },
      },
    });

    if (!trek) {
      return NextResponse.json({ error: "Trek not found" }, { status: 404 });
    }

    const totalReviews = trek.reviews.length;
    const avgRating =
      totalReviews > 0
        ? Number((trek.reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1))
        : 0;

    return NextResponse.json({
      trek: { ...trek, avgRating, totalReviews },
      schedules: trek.schedules,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch trek details" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.trek.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Trek not found" }, { status: 404 });
    }

    const nextGuideId =
      body.guideId !== undefined && body.guideId !== null ? body.guideId || null : existing.guideId;

    if (nextGuideId && nextGuideId !== existing.guideId) {
      const guide = await prisma.user.findUnique({ where: { id: nextGuideId } });
      if (!guide || guide.role !== "GUIDE") {
        return NextResponse.json(
          { error: "Please select a valid certified guide to assign." },
          { status: 400 }
        );
      }
      try {
        await assertGuideFreeForTrek(existing.id, nextGuideId, guide.name);
      } catch (e) {
        if (e instanceof GuideConflictError) {
          return NextResponse.json({ error: e.message, conflicts: e.conflicts }, { status: 409 });
        }
        throw e;
      }
    }

    const updated = await prisma.trek.update({
      where: { id },
      data: {
        name: body.name || existing.name,
        location: body.location || existing.location,
        state: body.state || existing.state,
        description: body.description || existing.description,
        distance: body.distance ? Number(body.distance) : existing.distance,
        difficulty: body.difficulty || existing.difficulty,
        basePricePerDay: body.basePricePerDay ? Number(body.basePricePerDay) : existing.basePricePerDay,
        maxParticipants: body.maxParticipants ? Number(body.maxParticipants) : existing.maxParticipants,
        meetingPoint: body.meetingPoint || existing.meetingPoint,
        destination: body.destination || existing.destination,
        elevation: body.elevation ? Number(body.elevation) : existing.elevation,
        imageUrl: body.imageUrl || existing.imageUrl,
        status: body.status || existing.status,
        guideId: nextGuideId,
      },
    });

    if (nextGuideId && nextGuideId !== existing.guideId) {
      await prisma.notification.create({
        data: {
          userId: nextGuideId,
          title: "New Trek Assignment",
          message: `You have been assigned as the lead guide for ${updated.name}.`,
          type: "SYSTEM",
        },
      });
    }

    return NextResponse.json({ success: true, trek: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update trek" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.trek.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete trek" }, { status: 500 });
  }
}
