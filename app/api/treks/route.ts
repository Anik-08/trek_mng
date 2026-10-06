import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const state = searchParams.get("state") || "";

    const whereClause: Prisma.TrekFindManyArgs["where"] = { status: "ACTIVE" };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
      ];
    }

    if (difficulty && ["EASY", "MODERATE", "DIFFICULT"].includes(difficulty)) {
      whereClause.difficulty = difficulty;
    }

    if (maxPrice && !isNaN(maxPrice)) {
      whereClause.basePricePerDay = { lte: maxPrice };
    }

    if (state) {
      whereClause.state = { contains: state, mode: "insensitive" };
    }

    const treks = await prisma.trek.findMany({
      where: whereClause,
      include: {
        guide: {
          select: { id: true, name: true, email: true, phone: true },
        },
        reviews: { select: { rating: true } },
        schedules: {
          where: {
            status: "OPEN",
            startDate: { gte: new Date() },
          },
          orderBy: { startDate: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const treksWithStats = treks.map((trek) => {
      const totalReviews = trek.reviews.length;
      const avgRating =
        totalReviews > 0
          ? Number(
              (
                trek.reviews.reduce((acc, curr) => acc + curr.rating, 0) /
                totalReviews
              ).toFixed(1)
            )
          : 0;

      const nextSchedule = trek.schedules[0] ?? null;

      return {
        id: trek.id,
        name: trek.name,
        slug: trek.slug,
        location: trek.location,
        state: trek.state,
        imageUrl: trek.imageUrl,
        difficulty: trek.difficulty,
        basePricePerDay: trek.basePricePerDay,
        availableDurations: trek.availableDurations,
        distance: trek.distance,
        elevation: trek.elevation,
        maxParticipants: trek.maxParticipants,
        status: trek.status,
        guide: trek.guide,
        avgRating,
        totalReviews,
        nextSchedule,
      };
    });

    return NextResponse.json({ treks: treksWithStats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch treks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, location, state, description, distance, difficulty,
      basePricePerDay, availableDurations, maxParticipants,
      meetingPoint, destination, elevation, requirements,
      imageUrl, guideId, startLat, startLng, destLat, destLng,
    } = body;

    const slug =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-") +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    if (guideId) {
      const guide = await prisma.user.findUnique({ where: { id: guideId } });
      if (!guide || guide.role !== "GUIDE") {
        return NextResponse.json(
          { error: "Please select a valid certified guide to assign." },
          { status: 400 }
        );
      }
    }

    const trek = await prisma.trek.create({
      data: {
        name,
        slug,
        location,
        state: state || "India",
        description,
        distance: Number(distance),
        difficulty: difficulty || "MODERATE",
        basePricePerDay: Number(basePricePerDay),
        availableDurations: availableDurations || [1],
        maxParticipants: Number(maxParticipants),
        meetingPoint: meetingPoint || "",
        destination: destination || "",
        elevation: Number(elevation) || 0,
        checkpoints: "[]",
        itineraries: "{}",
        requirements:
          typeof requirements === "string"
            ? requirements
            : JSON.stringify(requirements || []),
        imageUrl:
          imageUrl ||
          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
        images: imageUrl ? [imageUrl] : [],
        status: "ACTIVE",
        guideId: guideId || null,
        startLat: startLat ? Number(startLat) : null,
        startLng: startLng ? Number(startLng) : null,
        destLat: destLat ? Number(destLat) : null,
        destLng: destLng ? Number(destLng) : null,
      },
    });

    if (guideId) {
      await prisma.notification.create({
        data: {
          userId: guideId,
          title: "New Trek Assignment",
          message: `You have been assigned as the lead guide for ${trek.name}.`,
          type: "SYSTEM",
        },
      });
    }

    return NextResponse.json({ success: true, trek });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create trek" }, { status: 500 });
  }
}
