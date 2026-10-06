import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/guardian";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Please log in to join a trek group" }, { status: 401 });
    }

    const body = await request.json();
    const { groupCode, groupId } = body;

    const raw = (groupCode || groupId || "").trim();
    if (!raw) {
      return NextResponse.json({ error: "Group code is required" }, { status: 400 });
    }

    const query = raw.toUpperCase();
    const whereCondition = isValidObjectId(raw)
      ? { OR: [{ id: raw }, { groupCode: query }] }
      : { groupCode: query };

    const group = await prisma.trekGroup.findFirst({
      where: whereCondition,
      include: {
        trek: true,
        schedule: true,
        members: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Trek group not found. Check the join code." }, { status: 404 });
    }

    if (group.status !== "ACTIVE") {
      return NextResponse.json({ error: "This trek group is not currently active." }, { status: 400 });
    }

    // Already a member — just redirect them
    const existingMember = group.members.find((m) => m.userId === session.id);
    if (existingMember) {
      return NextResponse.json({
        success: true,
        message: "You are already a member of this group",
        groupId: group.id,
      });
    }

    // Capacity check
    if (group.members.length >= group.maxMembers) {
      return NextResponse.json(
        { error: `Group has reached its maximum capacity of ${group.maxMembers} members.` },
        { status: 400 }
      );
    }

    // Prevent joining multiple groups for the same scheduled trek
    const otherActiveGroupMembership = await prisma.groupMember.findFirst({
      where: {
        userId: session.id,
        group: {
          scheduleId: group.scheduleId,
          status: "ACTIVE",
          id: { not: group.id },
        },
      },
    });

    if (otherActiveGroupMembership) {
      return NextResponse.json(
        { error: "You are already a member of another active group for this scheduled trek." },
        { status: 400 }
      );
    }

    // ── Booking check ────────────────────────────────────────────────────────
    // Policy:
    //  - If the user has their own CONFIRMED booking for this schedule → link it.
    //  - If they don't have one but the group code was shared by the group creator
    //    (who booked for multiple people), they are a co-trekker covered by that
    //    booking. Allow them to join without a separate booking.
    //  - GUIDE role users bypass this check entirely.
    // ─────────────────────────────────────────────────────────────────────────

    let bookingId: string | null = null;

    if (session.role === "USER") {
      const ownBooking = await prisma.booking.findFirst({
        where: {
          userId: session.id,
          scheduleId: group.scheduleId,
          bookingStatus: "CONFIRMED",
        },
      });

      if (ownBooking) {
        // User has their own booking — link it
        bookingId = ownBooking.id;
      } else {
        // No individual booking — check that the group was created from a valid
        // multi-person booking (i.e. group creator booked ≥ 2 participants).
        // If so, this user is a co-trekker covered by the creator's booking.
        const leaderMember = group.members.find((m) => m.role === "LEADER");

        if (leaderMember && leaderMember.bookingId) {
          const leaderBooking = await prisma.booking.findUnique({
            where: { id: leaderMember.bookingId },
          });

          // Leader's booking must cover multiple people and be confirmed
          if (
            leaderBooking &&
            leaderBooking.bookingStatus === "CONFIRMED" &&
            leaderBooking.participants > 1
          ) {
            // Count how many co-trekkers (non-LEADER members without own booking) exist
            const coTrekkerCount = group.members.filter(
              (m) => m.role !== "GUIDE" && !m.bookingId
            ).length;

            // +1 for the person trying to join
            if (coTrekkerCount + 1 >= leaderBooking.participants) {
              return NextResponse.json(
                {
                  error: `The group creator booked ${leaderBooking.participants} spots. All spots are already filled by co-trekkers.`,
                },
                { status: 400 }
              );
            }

            // Allow co-trekker to join with bookingId = null
            bookingId = null;
          } else {
            // Leader has a single-person booking — this join is unauthorized
            return NextResponse.json(
              {
                error:
                  "You need a confirmed booking for this trek to join this group. The group creator booked for themselves only.",
              },
              { status: 403 }
            );
          }
        } else if (!leaderMember) {
          // Group has no leader yet (guide-only group) — require own booking
          return NextResponse.json(
            {
              error:
                "You must have a confirmed booking for this scheduled trek to join this safety group.",
            },
            { status: 403 }
          );
        } else {
          // Leader exists but has no bookingId (e.g. guide-created group) — require own booking
          return NextResponse.json(
            {
              error:
                "You must have a confirmed booking for this trek to join this group.",
            },
            { status: 403 }
          );
        }
      }
    }

    const memberRole = group.guideId === session.id ? "GUIDE" : "PARTICIPANT";

    const member = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: session.id,
        bookingId: bookingId || null,
        role: memberRole,
        locationSharingStatus: "INACTIVE",
      },
    });

    await prisma.trekEvent.create({
      data: {
        groupId: group.id,
        userId: session.id,
        eventType: "MEMBER_JOINED",
        metadata: JSON.stringify({
          userName: session.name,
          userEmail: session.email,
          role: memberRole,
          coveredByLeaderBooking: bookingId === null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined the trek group",
      groupId: group.id,
      member,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to join group" }, { status: 500 });
  }
}
