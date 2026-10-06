import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: session.id },
      include: {
        trek: {
          include: {
            guide: { select: { name: true, phone: true, email: true } },
            reviews: { where: { userId: session.id } },
          },
        },
        schedule: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const updated = await Promise.all(
      bookings.map(async (b) => {
        if (b.bookingStatus === "CONFIRMED" && new Date(b.endDate) < now) {
          await prisma.booking.update({
            where: { id: b.id },
            data: { bookingStatus: "COMPLETED" },
          });
          return { ...b, bookingStatus: "COMPLETED" };
        }
        return b;
      })
    );

    return NextResponse.json({ bookings: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
