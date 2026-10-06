import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  calculateGroupCentroid,
  haversineDistance,
  distanceToRouteSegment,
  evaluateSeparation,
  isValidObjectId,
} from "@/lib/guardian";

export async function POST(
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
    const { latitude, longitude, accuracy, speed, heading, isSimulated, targetUserId } = body;

    const effectiveUserId =
      (session.role === "ADMIN" || session.role === "GUIDE") && targetUserId
        ? targetUserId
        : session.id;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Valid numeric latitude and longitude are required" },
        { status: 400 }
      );
    }

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
            startLat: true,
            startLng: true,
            destLat: true,
            destLng: true,
            name: true,
          },
        },
        members: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Trek group not found" }, { status: 404 });
    }

    const member = group.members.find((m) => m.userId === effectiveUserId);
    if (!member) {
      return NextResponse.json({ error: "User is not a member of this group" }, { status: 403 });
    }

    let distanceFromRoute = 0;
    if (
      group.trek.startLat &&
      group.trek.startLng &&
      group.trek.destLat &&
      group.trek.destLng
    ) {
      distanceFromRoute = distanceToRouteSegment(
        latitude,
        longitude,
        group.trek.startLat,
        group.trek.startLng,
        group.trek.destLat,
        group.trek.destLng
      );
    }

    const otherLocations = await prisma.liveLocation.findMany({
      where: {
        groupId: group.id,
        userId: { not: effectiveUserId },
      },
      orderBy: { timestamp: "desc" },
    });

    const activePositions: Array<{ latitude: number; longitude: number }> = [
      { latitude, longitude },
    ];

    const seenUsers = new Set<string>();
    for (const loc of otherLocations) {
      if (!seenUsers.has(loc.userId)) {
        seenUsers.add(loc.userId);
        const m = group.members.find((gm) => gm.userId === loc.userId);
        if (m && m.locationSharingStatus === "ACTIVE") {
          activePositions.push({
            latitude: loc.latitude,
            longitude: loc.longitude,
          });
        }
      }
    }

    const centroid = calculateGroupCentroid(activePositions);

    let rawDistanceToCentroid = 0;
    if (centroid) {
      rawDistanceToCentroid = haversineDistance(
        latitude,
        longitude,
        centroid.latitude,
        centroid.longitude
      );
    }

    const lastLoc = await prisma.liveLocation.findFirst({
      where: {
        groupId: group.id,
        userId: effectiveUserId,
      },
      orderBy: { timestamp: "desc" },
    });

    const prevConsecutive = lastLoc ? lastLoc.consecutiveDeviations : 0;
    const prevStatus = lastLoc ? lastLoc.separationStatus : "NORMAL";

    const { separationStatus, consecutiveDeviations, effectiveDistance, isSeparated } =
      evaluateSeparation(
        rawDistanceToCentroid,
        accuracy,
        group.separationThresholdMeters,
        prevConsecutive
      );

    const now = new Date();

    await prisma.liveLocation.create({
      data: {
        groupId: group.id,
        userId: effectiveUserId,
        latitude,
        longitude,
        accuracy: accuracy ? Number(accuracy) : null,
        speed: speed ? Number(speed) : null,
        heading: heading ? Number(heading) : null,
        isSimulated: Boolean(isSimulated),
        consecutiveDeviations,
        separationStatus,
        distanceFromCentroid: rawDistanceToCentroid,
        distanceFromRoute,
        timestamp: now,
      },
    });

    await prisma.groupMember.update({
      where: { id: member.id },
      data: {
        lastLocationAt: now,
        locationSharingStatus: "ACTIVE",
      },
    });

    if (prevStatus === "NORMAL" && (separationStatus === "WARNING" || separationStatus === "CRITICAL")) {
      await prisma.trekEvent.create({
        data: {
          groupId: group.id,
          userId: effectiveUserId,
          eventType: "PARTICIPANT_SEPARATED",
          metadata: JSON.stringify({
            distance: Math.round(rawDistanceToCentroid),
            effectiveDistance: Math.round(effectiveDistance),
            accuracy,
            separationStatus,
            threshold: group.separationThresholdMeters,
            consecutiveDeviations,
          }),
        },
      });
    } else if ((prevStatus === "WARNING" || prevStatus === "CRITICAL") && separationStatus === "NORMAL") {
      await prisma.trekEvent.create({
        data: {
          groupId: group.id,
          userId: effectiveUserId,
          eventType: "PARTICIPANT_REJOINED",
          metadata: JSON.stringify({
            distance: Math.round(rawDistanceToCentroid),
          }),
        },
      });
    }

    if (distanceFromRoute > 300) {
      const recentDeviationEvent = await prisma.trekEvent.findFirst({
        where: {
          groupId: group.id,
          userId: effectiveUserId,
          eventType: "ROUTE_DEVIATION",
          timestamp: { gte: new Date(now.getTime() - 2 * 60 * 1000) },
        },
      });

      if (!recentDeviationEvent) {
        await prisma.trekEvent.create({
          data: {
            groupId: group.id,
            userId: effectiveUserId,
            eventType: "ROUTE_DEVIATION",
            metadata: JSON.stringify({
              distanceFromRoute: Math.round(distanceFromRoute),
            }),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      telemetry: {
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        separationStatus,
        distanceFromCentroid: Math.round(rawDistanceToCentroid),
        distanceFromRoute: Math.round(distanceFromRoute),
        consecutiveDeviations,
        isSeparated,
        timestamp: now,
      },
      centroid,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process location telemetry" }, { status: 500 });
  }
}
