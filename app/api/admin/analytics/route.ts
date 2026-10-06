import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const totalUsers = await prisma.user.count();
    const totalTreks = await prisma.trek.count();
    const totalGuides = await prisma.user.count({ where: { role: "GUIDE" } });
    const totalSchedules = await prisma.trekSchedule.count();

    const upcomingSchedules = await prisma.trekSchedule.count({
      where: { startDate: { gte: new Date() }, status: "OPEN" },
    });

    const bookings = await prisma.booking.findMany({
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

    const [users, treks] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      }),
      prisma.trek.findMany({
        where: { id: { in: trekIds } },
        select: { id: true, name: true, location: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const trekById = new Map(treks.map((t) => [t.id, t]));

    const enrichedBookings = bookings
      .filter((b) => userMap.has(b.userId) && trekById.has(b.trekId))
      .map((b) => ({
        ...b,
        user: userMap.get(b.userId),
        trek: trekById.get(b.trekId),
      }));

    const totalBookings = enrichedBookings.length;
    const activeBookings = enrichedBookings.filter(
      (b) => b.bookingStatus === "CONFIRMED" || b.bookingStatus === "COMPLETED"
    );

    const totalParticipants = activeBookings.reduce((acc, b) => acc + b.participants, 0);
    const totalRevenue = activeBookings.reduce((acc, b) => acc + b.totalAmount, 0);

    const trekStats: { [key: string]: { name: string; location: string; count: number; revenue: number } } = {};
    enrichedBookings.forEach((b) => {
      if (b.bookingStatus !== "CANCELLED") {
        if (!trekStats[b.trekId]) {
          trekStats[b.trekId] = { name: b.trek!.name, location: b.trek!.location, count: 0, revenue: 0 };
        }
        trekStats[b.trekId].count += b.participants;
        trekStats[b.trekId].revenue += b.totalAmount;
      }
    });

    const mostBookedTreks = Object.values(trekStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalUsers,
      totalTreks,
      totalGuides,
      totalSchedules,
      upcomingSchedules,
      totalBookings,
      totalParticipants,
      totalRevenue,
      mostBookedTreks,
      recentBookings: enrichedBookings.slice(0, 8),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
