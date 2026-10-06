import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assertGuideAvailable, GuideConflictError } from "@/lib/assignments";

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

    const schedule = await prisma.trekSchedule.findUnique({
      where: { id },
      include: { trek: { select: { id: true, name: true, guideId: true } } },
    });
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const start = body.startDate ? new Date(body.startDate) : schedule.startDate;
    const end = body.endDate ? new Date(body.endDate) : schedule.endDate;
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return NextResponse.json(
        { error: "Invalid date range. End date must be on or after the start date." },
        { status: 400 }
      );
    }

    const capacity = body.capacity !== undefined && body.capacity !== "" ? Number(body.capacity) : schedule.capacity;
    if (!capacity || capacity <= 0) {
      return NextResponse.json({ error: "Capacity must be a positive number" }, { status: 400 });
    }

    const newScheduleGuideId = body.guideId !== undefined ? body.guideId || null : schedule.guideId;
    const datesChanged =
      start.getTime() !== schedule.startDate.getTime() || end.getTime() !== schedule.endDate.getTime();
    const guideChanged = newScheduleGuideId !== schedule.guideId;

    if (datesChanged || guideChanged) {
      const candidateGuideIds = Array.from(
        new Set<string>([newScheduleGuideId, schedule.trek.guideId].filter((g): g is string => Boolean(g)))
      );

      for (const candidateGuideId of candidateGuideIds) {
        const guide = await prisma.user.findUnique({ where: { id: candidateGuideId } });
        if (!guide) {
          return NextResponse.json({ error: "Selected guide not found" }, { status: 404 });
        }
        try {
          await assertGuideAvailable(candidateGuideId, start, end, guide.name, [schedule.id]);
        } catch (e) {
          if (e instanceof GuideConflictError) {
            return NextResponse.json({ error: e.message, conflicts: e.conflicts }, { status: 409 });
          }
          throw e;
        }
      }
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const duration =
      body.duration !== undefined && body.duration !== ""
        ? Number(body.duration)
        : Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs));

    const updated = await prisma.trekSchedule.update({
      where: { id },
      data: {
        startDate: start,
        endDate: end,
        duration,
        capacity,
        guideId: newScheduleGuideId,
        status: body.status || schedule.status,
      },
    });

    const guideChangedBool = newScheduleGuideId && newScheduleGuideId !== schedule.guideId;
    if (guideChangedBool) {
      await prisma.notification.create({
        data: {
          userId: newScheduleGuideId,
          title: "Guide Assignment Updated",
          message: `You have been assigned to lead "${schedule.trek.name}" departing ${start.toLocaleDateString(
            "en-IN",
            { day: "numeric", month: "short", year: "numeric" }
          )}.`,
          type: "SYSTEM",
        },
      });
    }

    return NextResponse.json({ success: true, schedule: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
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
    const schedule = await prisma.trekSchedule.findUnique({ where: { id } });
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const bookingCount = await prisma.booking.count({ where: { scheduleId: id } });
    if (bookingCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a departure that already has bookings." },
        { status: 400 }
      );
    }

    await prisma.trekSchedule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}