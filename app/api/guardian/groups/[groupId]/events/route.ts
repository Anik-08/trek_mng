import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/guardian";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const raw = (groupId || "").trim();
    const query = raw.toUpperCase();
    const whereCondition = isValidObjectId(raw)
      ? { OR: [{ id: raw }, { groupCode: query }] }
      : { groupCode: query };

    const group = await prisma.trekGroup.findFirst({
      where: whereCondition,
    });

    if (!group) {
      return NextResponse.json({ error: "Trek group not found" }, { status: 404 });
    }

    const events = await prisma.trekEvent.findMany({
      where: { groupId: group.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch group events" }, { status: 500 });
  }
}
