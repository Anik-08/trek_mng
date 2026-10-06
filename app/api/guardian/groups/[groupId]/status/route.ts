import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/guardian";

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
    const { status, targetUserId } = body;

    const validStatuses = ["ACTIVE", "PAUSED", "DENIED", "INACTIVE"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const effectiveUserId =
      (session.role === "ADMIN" || session.role === "GUIDE") && targetUserId
        ? targetUserId
        : session.id;

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

    const member = group.members.find((m) => m.userId === effectiveUserId);
    if (!member) {
      return NextResponse.json({ error: "Member not found in group" }, { status: 404 });
    }

    const updated = await prisma.groupMember.update({
      where: { id: member.id },
      data: {
        locationSharingStatus: status,
      },
    });

    const eventType =
      status === "ACTIVE"
        ? "LOCATION_SHARING_STARTED"
        : status === "DENIED"
        ? "LOCATION_PERMISSION_DENIED"
        : "LOCATION_SHARING_STOPPED";

    await prisma.trekEvent.create({
      data: {
        groupId: group.id,
        userId: effectiveUserId,
        eventType,
        metadata: JSON.stringify({
          previousStatus: member.locationSharingStatus,
          newStatus: status,
        }),
      },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update member status" }, { status: 500 });
  }
}
