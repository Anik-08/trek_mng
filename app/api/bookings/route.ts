import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateTrekPrice } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Please log in to book a trek" }, { status: 401 });
    }

    const body = await request.json();
    const { trekId, scheduleId, participants, duration, participantDetails } = body;

    const count = Number(participants);
    if (!trekId || !scheduleId || !count || count <= 0) {
      return NextResponse.json(
        { error: "Trek, schedule, and participant count are required" },
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

    const availableSlots = schedule.capacity - schedule.bookedParticipants;
    if (availableSlots < count) {
      return NextResponse.json(
        { error: `Only ${availableSlots} slot(s) available for this schedule` },
        { status: 400 }
      );
    }

    const bookingDuration = duration || schedule.duration;
    const pricing = calculateTrekPrice(trek.basePricePerDay, bookingDuration, count);
    const bookingId = `TRK-${Math.floor(10000 + Math.random() * 90000)}`;

    const booking = await prisma.booking.create({
      data: {
        bookingId,
        userId: session.id,
        trekId: trek.id,
        scheduleId: schedule.id,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        duration: bookingDuration,
        participants: count,
        participantDetails:
          typeof participantDetails === "string"
            ? participantDetails
            : JSON.stringify(participantDetails || []),
        totalAmount: pricing.totalAmount,
        paymentStatus: "PAID",
        bookingStatus: "CONFIRMED",
      },
    });

    await prisma.trekSchedule.update({
      where: { id: schedule.id },
      data: { bookedParticipants: { increment: count } },
    });

    await prisma.notification.create({
      data: {
        userId: session.id,
        title: "Booking Confirmed!",
        message: `Your booking ${bookingId} for ${trek.name} (${count} participant(s)) is confirmed. Total: ₹${pricing.totalAmount.toLocaleString("en-IN")}.`,
        type: "BOOKING",
      },
    });

    if (trek.guideId) {
      await prisma.notification.create({
        data: {
          userId: trek.guideId,
          title: "New Participant Registered",
          message: `${session.name} booked ${count} spot(s) for ${trek.name}.`,
          type: "SYSTEM",
        },
      });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process booking" }, { status: 500 });
  }
}
