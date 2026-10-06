import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  haversineDistance,
  calculateGroupCentroid,
  distanceToRouteSegment,
  evaluateSeparation,
  isValidObjectId,
} from "@/lib/guardian";

const DEMO_NAMES = [
  "Aarav Mehta (Demo)",
  "Sneha Patel (Demo)",
  "Karan Verma (Demo)",
  "Pooja Nair (Demo)",
  "Vikram Joshi (Demo)",
  "Ananya Rao (Demo)",
  "Rohan Gupta (Demo)",
  "Meera Iyer (Demo)",
  "Aditya Kulkarni (Demo)",
  "Riya Sen (Demo)",
  "Arjun Deshmukh (Demo)",
  "Tanvi Hegde (Demo)",
  "Siddharth Bhatt (Demo)",
  "Neha Sharma (Demo)",
  "Kavya Reddy (Demo - Straying)",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "GUIDE" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Guide or Admin access required" }, { status: 403 });
    }

    const { groupId } = await params;
    const body = await request.json();
    const action = body.action || "STEP";
    const stepCount = Number(body.stepCount || 1);
    const drift = Boolean(body.drift);

    const raw = (groupId || "").trim();
    const query = raw.toUpperCase();
    const whereCondition = isValidObjectId(raw)
      ? { OR: [{ id: raw }, { groupCode: query }] }
      : { groupCode: query };

    const group = await prisma.trekGroup.findFirst({
      where: whereCondition,
      include: {
        trek: true,
        members: { include: { user: true } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Trek group not found" }, { status: 404 });
    }

    const sLat = group.trek.startLat || 13.2215;
    const sLng = group.trek.startLng || 75.2536;
    const dLat = group.trek.destLat || 13.1292;
    const dLng = group.trek.destLng || 75.2758;

    let demoUsers = await prisma.user.findMany({
      where: { email: { startsWith: "demo_" } },
    });

    if (demoUsers.length < 15) {
      for (let i = demoUsers.length; i < 15; i++) {
        const u = await prisma.user.create({
          data: {
            name: DEMO_NAMES[i] || `Simulated Trekker ${i + 1}`,
            email: `demo_trekker_${i + 1}@trek.com`,
            password: "demouser123",
            role: "USER",
            phone: `+91 99001122${(i + 10).toString()}`,
          },
        });
        demoUsers.push(u);
      }
    }

    for (const dUser of demoUsers) {
      const isMember = group.members.some((m) => m.userId === dUser.id);
      if (!isMember) {
        await prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId: dUser.id,
            role: "PARTICIPANT",
            locationSharingStatus: "ACTIVE",
          },
        });
      }
    }

    const progressFraction = Math.min(0.85, (stepCount * 0.05) % 0.9);
    const baseLat = sLat + (dLat - sLat) * progressFraction;
    const baseLng = sLng + (dLng - sLng) * progressFraction;

    const simulatedPositions: Array<{
      userId: string;
      name: string;
      latitude: number;
      longitude: number;
      accuracy: number;
      isStray: boolean;
    }> = [];

    demoUsers.forEach((u, idx) => {
      const isStray = idx === 14 && drift;
      let latOffset = (Math.sin(idx * 1.5) * 0.0003);
      let lngOffset = (Math.cos(idx * 1.2) * 0.0003);

      if (isStray) {
        latOffset = 0.0022 + (stepCount * 0.0004);
        lngOffset = -0.0018 - (stepCount * 0.0003);
      }

      simulatedPositions.push({
        userId: u.id,
        name: u.name,
        latitude: baseLat + latOffset,
        longitude: baseLng + lngOffset,
        accuracy: isStray ? 12 : 5,
        isStray,
      });
    });

    const centroid = calculateGroupCentroid(
      simulatedPositions.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))
    );

    const now = new Date();
    const updatedTelemetry: any[] = [];

    for (const sim of simulatedPositions) {
      const rawDistance = centroid
        ? haversineDistance(sim.latitude, sim.longitude, centroid.latitude, centroid.longitude)
        : 0;

      const distRoute = distanceToRouteSegment(
        sim.latitude,
        sim.longitude,
        sLat,
        sLng,
        dLat,
        dLng
      );

      const lastLoc = await prisma.liveLocation.findFirst({
        where: { groupId: group.id, userId: sim.userId },
        orderBy: { timestamp: "desc" },
      });

      const prevConsecutive = lastLoc ? lastLoc.consecutiveDeviations : 0;
      const prevStatus = lastLoc ? lastLoc.separationStatus : "NORMAL";

      const { separationStatus, consecutiveDeviations } = evaluateSeparation(
        rawDistance,
        sim.accuracy,
        group.separationThresholdMeters,
        sim.isStray ? prevConsecutive + 1 : 0
      );

      await prisma.liveLocation.create({
        data: {
          groupId: group.id,
          userId: sim.userId,
          latitude: sim.latitude,
          longitude: sim.longitude,
          accuracy: sim.accuracy,
          speed: 1.4,
          heading: 180,
          isSimulated: true,
          consecutiveDeviations,
          separationStatus,
          distanceFromCentroid: rawDistance,
          distanceFromRoute: distRoute,
          timestamp: now,
        },
      });

      if (prevStatus === "NORMAL" && (separationStatus === "WARNING" || separationStatus === "CRITICAL")) {
        await prisma.trekEvent.create({
          data: {
            groupId: group.id,
            userId: sim.userId,
            eventType: "PARTICIPANT_SEPARATED",
            metadata: JSON.stringify({
              participantName: sim.name,
              distance: Math.round(rawDistance),
              separationStatus,
              isSimulated: true,
            }),
          },
        });
      }

      updatedTelemetry.push({
        userId: sim.userId,
        name: sim.name,
        latitude: sim.latitude,
        longitude: sim.longitude,
        distanceFromCentroid: Math.round(rawDistance),
        distanceFromRoute: Math.round(distRoute),
        separationStatus,
        isSimulated: true,
      });
    }

    return NextResponse.json({
      success: true,
      action,
      stepCount,
      progressFraction: Math.round(progressFraction * 100),
      simulatedMembersCount: simulatedPositions.length,
      centroid,
      telemetry: updatedTelemetry,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to execute demo simulation" }, { status: 500 });
  }
}
