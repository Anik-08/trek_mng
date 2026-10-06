import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateGroupCentroid, haversineDistance, isValidObjectId } from "@/lib/guardian";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const raw = (groupId || "").trim();
    const query = raw.toUpperCase();

    const whereCondition = isValidObjectId(raw)
      ? { OR: [{ id: raw }, { groupCode: query }] }
      : { groupCode: query };

    const group = await prisma.trekGroup.findFirst({
      where: whereCondition,
      include: {
        trek: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            state: true,
            difficulty: true,
            distance: true,
            elevation: true,
            meetingPoint: true,
            destination: true,
            startLat: true,
            startLng: true,
            destLat: true,
            destLng: true,
            checkpoints: true,
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
            bio: true,
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
                emergencyContact: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Trek group not found" }, { status: 404 });
    }

    const isMember = group.members.some((m) => m.userId === session.id);
    const isGuide = group.guideId === session.id;
    const isAdmin = session.role === "ADMIN";

    if (!isMember && !isGuide && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const liveLocations = await prisma.liveLocation.findMany({
      where: { groupId: group.id },
      orderBy: { timestamp: "desc" },
    });

    const latestLocationMap = new Map<string, any>();
    for (const loc of liveLocations) {
      if (!latestLocationMap.has(loc.userId)) {
        latestLocationMap.set(loc.userId, loc);
      }
    }

    const activePositions: Array<{ latitude: number; longitude: number }> = [];
    for (const member of group.members) {
      if (member.locationSharingStatus === "ACTIVE") {
        const loc = latestLocationMap.get(member.userId);
        if (loc) {
          activePositions.push({
            latitude: loc.latitude,
            longitude: loc.longitude,
          });
        }
      }
    }

    const centroid = calculateGroupCentroid(activePositions);

    const membersWithTelemetry = group.members.map((m) => {
      const loc = latestLocationMap.get(m.userId);
      let distanceFromCentroid = 0;
      if (loc && centroid) {
        distanceFromCentroid = haversineDistance(
          loc.latitude,
          loc.longitude,
          centroid.latitude,
          centroid.longitude
        );
      }

      return {
        id: m.id,
        userId: m.userId,
        role: m.role,
        locationSharingStatus: m.locationSharingStatus,
        lastLocationAt: m.lastLocationAt,
        joinedAt: m.joinedAt,
        user: m.user,
        telemetry: loc
          ? {
              latitude: loc.latitude,
              longitude: loc.longitude,
              accuracy: loc.accuracy,
              speed: loc.speed,
              heading: loc.heading,
              separationStatus: loc.separationStatus,
              distanceFromCentroid: Math.round(distanceFromCentroid),
              distanceFromRoute: Math.round(loc.distanceFromRoute),
              consecutiveDeviations: loc.consecutiveDeviations,
              isSimulated: loc.isSimulated,
              timestamp: loc.timestamp,
            }
          : null,
      };
    });

    const sharingCount = group.members.filter((m) => m.locationSharingStatus === "ACTIVE").length;
    const notSharingCount = group.members.length - sharingCount;
    const separatedCount = membersWithTelemetry.filter(
      (m) =>
        m.telemetry &&
        (m.telemetry.separationStatus === "WARNING" || m.telemetry.separationStatus === "CRITICAL")
    ).length;

    let parsedCheckpoints: string[] = [];
    try {
      parsedCheckpoints = JSON.parse(group.trek.checkpoints);
    } catch {
      parsedCheckpoints = [];
    }

    return NextResponse.json({
      group: {
        id: group.id,
        groupCode: group.groupCode,
        name: group.name,
        status: group.status,
        maxMembers: group.maxMembers,
        separationThresholdMeters: group.separationThresholdMeters,
        createdAt: group.createdAt,
        trek: {
          ...group.trek,
          parsedCheckpoints,
        },
        schedule: group.schedule,
        guide: group.guide,
        members: membersWithTelemetry,
        centroid,
        stats: {
          totalMembers: group.members.length,
          sharingCount,
          notSharingCount,
          separatedCount,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch group details" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const body = await request.json();
    const { status, separationThresholdMeters, maxMembers } = body;

    const raw = (groupId || "").trim();
    const query = raw.toUpperCase();
    const whereCondition = isValidObjectId(raw)
      ? { OR: [{ id: raw }, { groupCode: query }] }
      : { groupCode: query };

    const group = await prisma.trekGroup.findFirst({
      where: whereCondition,
      include: { members: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Trek group not found" }, { status: 404 });
    }

    const isGuideOrAdmin = group.guideId === session.id || session.role === "ADMIN";
    const isLeader = group.members.some((m) => m.userId === session.id && m.role === "LEADER");

    if (!isGuideOrAdmin && !isLeader) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.trekGroup.update({
      where: { id: group.id },
      data: {
        status: status || undefined,
        separationThresholdMeters: separationThresholdMeters
          ? Number(separationThresholdMeters)
          : undefined,
        maxMembers: maxMembers ? Number(maxMembers) : undefined,
      },
    });

    if (status && status !== group.status) {
      const eventType =
        status === "COMPLETED"
          ? "TREK_COMPLETED"
          : status === "ACTIVE"
          ? "TREK_STARTED"
          : "GROUP_STATUS_UPDATED";

      await prisma.trekEvent.create({
        data: {
          groupId: group.id,
          userId: session.id,
          eventType,
          metadata: JSON.stringify({ previousStatus: group.status, newStatus: status }),
        },
      });
    }

    return NextResponse.json({ success: true, group: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}
