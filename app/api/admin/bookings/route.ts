import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const whereClause: Prisma.BookingFindManyArgs["where"] = {};

    if (status && ["CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
      whereClause.bookingStatus = status;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      select: {
        id: true,
        bookingId: true,
        trekId: true,
        userId: true,
        scheduleId: true,
        participants: true,
        totalAmount: true,
        bookingStatus: true,
        paymentStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const userIds = Array.from(new Set(bookings.map((b) => b.userId)));
    const trekIds = Array.from(new Set(bookings.map((b) => b.trekId)));
    const scheduleIds = Array.from(new Set(bookings.map((b) => b.scheduleId)));

    const [users, treks, schedules] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, phone: true },
      }),
      prisma.trek.findMany({
        where: { id: { in: trekIds } },
        select: { id: true, name: true, location: true },
      }),
      prisma.trekSchedule.findMany({
        where: { id: { in: scheduleIds } },
        select: { id: true, startDate: true, endDate: true, duration: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const trekMap = new Map(treks.map((t) => [t.id, t]));
    const scheduleMap = new Map(schedules.map((s) => [s.id, s]));

    const resolved = bookings
      .filter((b) => userMap.has(b.userId) && trekMap.has(b.trekId))
      .map((b) => ({
        ...b,
        user: userMap.get(b.userId),
        trek: trekMap.get(b.trekId),
        schedule: scheduleMap.get(b.scheduleId) || null,
      }));

    const filtered = search
      ? resolved.filter(
          (b) =>
            b.bookingId.toLowerCase().includes(search) ||
            (b.user!.name || "").toLowerCase().includes(search) ||
            (b.user!.email || "").toLowerCase().includes(search) ||
            (b.trek!.name || "").toLowerCase().includes(search)
        )
      : resolved;

    return NextResponse.json({ bookings: filtered });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, bookingStatus, paymentStatus } = body;

    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { trek: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (bookingStatus === "CANCELLED" && existing.bookingStatus !== "CANCELLED") {
      const updated = await prisma.booking.update({
        where: { id },
        data: { bookingStatus: "CANCELLED", paymentStatus: "REFUNDED" },
      });

      await prisma.trekSchedule.update({
        where: { id: existing.scheduleId },
        data: { bookedParticipants: { decrement: existing.participants } },
      });

      await prisma.notification.create({
        data: {
          userId: existing.userId,
          title: "Booking Cancelled by Admin",
          message: `Your booking ${existing.bookingId} for ${existing.trek.name} was cancelled by admin. Refund processed.`,
          type: "CANCELLATION",
        },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        bookingStatus: bookingStatus || undefined,
        paymentStatus: paymentStatus || undefined,
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
