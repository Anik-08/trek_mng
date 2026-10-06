import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateGroupCode } from "@/lib/guardian";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");
    const trekId = searchParams.get("trekId");

    const whereClause: any = {};
    if (scheduleId) whereClause.scheduleId = scheduleId;
    if (trekId) whereClause.trekId = trekId;

    if (session.role === "GUIDE") {
      whereClause.OR = [
        { guideId: session.id },
        { members: { some: { userId: session.id } } },
      ];
    } else if (session.role === "USER") {
      whereClause.members = { some: { userId: session.id } };
    }

    const groups = await prisma.trekGroup.findMany({
      where: whereClause,
      include: {
        trek: {
          select: {
            id: true,
            name: true,
            location: true,
            state: true,
            difficulty: true,
            imageUrl: true,
            meetingPoint: true,
            destination: true,
            startLat: true,
            startLng: true,
            destLat: true,
            destLng: true,
          },
        },
        schedule: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            duration: true,
            status: true,
          },
        },
        guide: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const enriched = groups.map((g) => ({
      ...g,
      memberCount: g.members.length,
      activeSharingCount: g.members.filter((m) => m.locationSharingStatus === "ACTIVE").length,
    }));

    return NextResponse.json({ groups: enriched });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch trek groups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Please log in to create a trek group" }, { status: 401 });
    }

    const body = await request.json();
    const { trekId, scheduleId, name, maxMembers, separationThresholdMeters } = body;

    if (!trekId || !scheduleId || !name) {
      return NextResponse.json(
        { error: "Trek, schedule, and group name are required" },
        { status: 400 }
      );
    }

    const trek = await prisma.trek.findUnique({ where: { id: trekId } });
    if (!trek) {
      return NextResponse.json({ error: "Trek not found" }, { status: 404 });
    }

    const schedule = await prisma.trekSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    let bookingId: string | null = null;
    if (session.role === "USER") {
      const validBooking = await prisma.booking.findFirst({
        where: {
          userId: session.id,
          scheduleId: schedule.id,
          bookingStatus: "CONFIRMED",
        },
      });

      if (!validBooking) {
        return NextResponse.json(
          {
            error:
              "You must have a confirmed booking for this trek schedule to create a safety group.",
          },
          { status: 403 }
        );
      }
      bookingId = validBooking.id;
    }

    const assignedGuideId = schedule.guideId || trek.guideId || session.id;

    const groupCode = generateGroupCode(trek.name);
    const parsedMax = maxMembers ? Number(maxMembers) : 15;
    const threshold = separationThresholdMeters ? Number(separationThresholdMeters) : 100.0;

    const group = await prisma.trekGroup.create({
      data: {
        groupCode,
        trekId: trek.id,
        scheduleId: schedule.id,
        guideId: assignedGuideId,
        name,
        maxMembers: parsedMax,
        separationThresholdMeters: threshold,
        status: "ACTIVE",
      },
    });

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: session.id,
        bookingId: bookingId || null,
        role: session.role === "GUIDE" ? "GUIDE" : "LEADER",
        locationSharingStatus: "INACTIVE",
      },
    });

    await prisma.trekEvent.create({
      data: {
        groupId: group.id,
        userId: session.id,
        eventType: "GROUP_CREATED",
        metadata: JSON.stringify({
          groupName: name,
          groupCode,
          createdBy: session.name,
          creatorRole: session.role,
          maxMembers: parsedMax,
          threshold,
        }),
      },
    });

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create trek group" }, { status: 500 });
  }
}
