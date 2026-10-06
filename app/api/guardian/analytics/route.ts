import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const totalGroups = await prisma.trekGroup.count();
    const activeGroups = await prisma.trekGroup.count({ where: { status: "ACTIVE" } });
    const totalMembers = await prisma.groupMember.count();
    const activeSharingMembers = await prisma.groupMember.count({
      where: { locationSharingStatus: "ACTIVE" },
    });

    const totalEvents = await prisma.trekEvent.count();
    const separationEvents = await prisma.trekEvent.count({
      where: { eventType: "PARTICIPANT_SEPARATED" },
    });
    const deviationEvents = await prisma.trekEvent.count({
      where: { eventType: "ROUTE_DEVIATION" },
    });

    const recentEvents = await prisma.trekEvent.findMany({
      include: {
        group: {
          select: {
            name: true,
            groupCode: true,
            trek: { select: { name: true } },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 20,
    });

    const complianceRate =
      totalMembers > 0 ? Math.round((activeSharingMembers / totalMembers) * 100) : 100;

    return NextResponse.json({
      totalGroups,
      activeGroups,
      totalMembers,
      activeSharingMembers,
      complianceRate,
      totalEvents,
      separationEvents,
      deviationEvents,
      recentEvents,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch guardian analytics" }, { status: 500 });
  }
}
