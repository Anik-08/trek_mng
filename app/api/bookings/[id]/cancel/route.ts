import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isObjectId = /^[a-f\d]{24}$/i.test(id);

    const booking = await prisma.booking.findFirst({
      where: isObjectId ? { OR: [{ id: id }, { bookingId: id }] } : { bookingId: id },
      include: { trek: true, schedule: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.bookingStatus === "CANCELLED") {
      return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
    }

    if (booking.bookingStatus === "COMPLETED") {
      return NextResponse.json({ error: "Completed treks cannot be cancelled" }, { status: 400 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { bookingStatus: "CANCELLED", paymentStatus: "REFUNDED" },
    });

    await prisma.trekSchedule.update({
      where: { id: booking.scheduleId },
      data: { bookedParticipants: { decrement: booking.participants } },
    });

    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: "Booking Cancelled & Refund Initiated",
        message: `Your booking ${booking.bookingId} for ${booking.trek.name} has been cancelled. Refund of ₹${booking.totalAmount} processed.`,
        type: "CANCELLATION",
      },
    });

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
