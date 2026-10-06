import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidObjectId } from "@/lib/guardian";

/**
 * GET /api/guardian/groups/lookup?code=TRK-KDM-4821
 *
 * Public (no auth required) preview endpoint.
 * Returns just enough info so the user can confirm they are joining the
 * right trek before committing.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = (searchParams.get("code") || "").trim();

    if (!raw) {
      return NextResponse.json({ error: "code query param is required" }, { status: 400 });
    }

    const query = raw.toUpperCase();
    const whereCondition = isValidObjectId(raw)
      ? { OR: [{ id: raw }, { groupCode: query }] }
      : { groupCode: query };

    const group = await prisma.trekGroup.findFirst({
      where: whereCondition,
      include: {
        trek: { select: { name: true, location: true, difficulty: true } },
        schedule: { select: { startDate: true, endDate: true, duration: true } },
        members: {
          select: {
            role: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found. Double-check the join code." }, { status: 404 });
    }

    // Find the guide member for display
    const guideMember = group.members.find((m) => m.role === "GUIDE");
    const leaderMember = group.members.find((m) => m.role === "LEADER");

    return NextResponse.json({
      groupId: group.id,
      groupCode: group.groupCode,
      groupName: group.name,
      status: group.status,
      currentMembers: group.members.length,
      maxMembers: group.maxMembers,
      trek: {
        name: group.trek?.name ?? "Unknown Trek",
        location: group.trek?.location ?? "",
        difficulty: group.trek?.difficulty ?? "",
      },
      schedule: group.schedule
        ? {
            startDate: group.schedule.startDate,
            endDate: group.schedule.endDate,
            duration: group.schedule.duration,
          }
        : null,
      guideName: guideMember?.user?.name ?? null,
      leaderName: leaderMember?.user?.name ?? null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to look up group" }, { status: 500 });
  }
}
