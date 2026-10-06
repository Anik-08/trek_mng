import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assertGuideAvailable, GuideConflictError } from "@/lib/assignments";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const trekId = searchParams.get("trekId") || "";

    const schedules = await prisma.trekSchedule.findMany({
      where: trekId ? { trekId } : {},
      include: {
        trek: { select: { id: true, name: true, location: true, state: true } },
        guide: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { trekId, startDate, endDate, duration, capacity, guideId, status } = body;

    if (!trekId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Trek, start date, and end date are required" },
        { status: 400 }
      );
    }

    const trek = await prisma.trek.findUnique({ where: { id: trekId } });
    if (!trek) {
      return NextResponse.json({ error: "Trek not found" }, { status: 404 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return NextResponse.json(
        { error: "Invalid date range. End date must be on or after the start date." },
        { status: 400 }
      );
    }

    const parsedCapacity = Number(capacity);
    if (!parsedCapacity || parsedCapacity <= 0) {
      return NextResponse.json({ error: "Capacity must be a positive number" }, { status: 400 });
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const parsedDuration = Number(duration) || Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs));
    const explicitGuideId = guideId || null;

    const candidateGuideIds = Array.from(
      new Set<string>([explicitGuideId, trek.guideId].filter((g): g is string => Boolean(g)))
    );

    for (const candidateGuideId of candidateGuideIds) {
      const guide = await prisma.user.findUnique({ where: { id: candidateGuideId } });
      if (!guide) {
        return NextResponse.json({ error: "Selected guide not found" }, { status: 404 });
      }
      try {
        await assertGuideAvailable(candidateGuideId, start, end, guide.name, []);
      } catch (e) {
        if (e instanceof GuideConflictError) {
          return NextResponse.json({ error: e.message, conflicts: e.conflicts }, { status: 409 });
        }
        throw e;
      }
    }

    const schedule = await prisma.trekSchedule.create({
      data: {
        trekId,
        startDate: start,
        endDate: end,
        duration: parsedDuration,
        capacity: parsedCapacity,
        guideId: explicitGuideId,
        status: status || "OPEN",
      },
    });

    if (explicitGuideId) {
      await prisma.notification.create({
        data: {
          userId: explicitGuideId,
          title: "New Guide Assignment",
          message: `You have been assigned to lead "${trek.name}" departing ${start.toLocaleDateString(
            "en-IN",
            { day: "numeric", month: "short", year: "numeric" }
          )}.`,
          type: "SYSTEM",
        },
      });
    }

    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }
}