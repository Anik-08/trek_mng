import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "GUIDE" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Guide access required" }, { status: 403 });
    }

    const whereClause =
    session.role === "ADMIN"
      ? {}
      : {
          OR: [
            { guideId: session.id },
            { schedules: { some: { guideId: session.id } } },
          ],
        };

const treks = await prisma.trek.findMany({
  where: whereClause,
  include: {
    guide: { select: { id: true, name: true, email: true, phone: true } },
    schedules: {
      orderBy: { startDate: "asc" },
      include: {
        bookings: {
          where: { bookingStatus: { in: ["CONFIRMED", "COMPLETED"] } },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    },
  },
  orderBy: { createdAt: "desc" },
});

const result = treks.map((trek) => {
  const allBookings = trek.schedules.flatMap((s) => s.bookings);
  const totalParticipants = allBookings.reduce((sum, b) => sum + b.participants, 0);
  const nextSchedule = trek.schedules[0] ?? null;

  return {
    id: trek.id,
    name: trek.name,
    slug: trek.slug,
    location: trek.location,
    state: trek.state,
    difficulty: trek.difficulty,
    imageUrl: trek.imageUrl,
    guide: trek.guide,
    maxCapacity: trek.maxParticipants,
    startingPoint: trek.meetingPoint,
    startDate: nextSchedule ? nextSchedule.startDate.toISOString() : null,
    endDate: nextSchedule ? nextSchedule.endDate.toISOString() : null,
    durationDays: nextSchedule ? nextSchedule.duration : null,
    capacity: nextSchedule ? nextSchedule.capacity : trek.maxParticipants,
    bookedParticipants: nextSchedule ? nextSchedule.bookedParticipants : totalParticipants,
    scheduleStatus: nextSchedule ? nextSchedule.status : null,
    scheduleCount: trek.schedules.length,
    schedules: trek.schedules.map((s) => ({
      id: s.id,
      startDate: s.startDate,
      endDate: s.endDate,
      duration: s.duration,
      capacity: s.capacity,
      bookedParticipants: s.bookedParticipants,
      status: s.status,
      guideId: s.guideId || null,
      bookings: s.bookings.map((b) => ({
        bookingId: b.bookingId,
        userName: b.user.name,
        userEmail: b.user.email,
        userPhone: b.user.phone,
        participants: b.participants,
        bookingStatus: b.bookingStatus,
      })),
    })),
    participantsList: allBookings.map((b) => ({
      bookingId: b.bookingId,
      userName: b.user.name,
      userEmail: b.user.email,
      userPhone: b.user.phone,
      participants: b.participants,
    })),
    totalParticipants,
  };
});

    return NextResponse.json({ treks: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch guide treks" }, { status: 500 });
  }
}
