import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const guides = await prisma.user.findMany({
      where: { role: "GUIDE" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        emergencyContact: true,
        guidedTreks: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ guides });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch guides" },
      { status: 500 }
    );
  }
}
