import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trekId = searchParams.get("trekId");

    const whereClause = trekId ? { id: trekId } : {};

    const treks = await prisma.trek.findMany({
      where: whereClause,
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        bookings: {
          select: {
            id: true,
            bookingId: true,
            participants: true,
            bookingStatus: true,
            createdAt: true,
          },
        },
        schedules: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            duration: true,
            capacity: true,
            bookedParticipants: true,
            status: true,
          },
        },
      },
    });

    const aiReadyDataset = treks.map((t) => {
      let parsedItinerary = [];
      try {
        parsedItinerary = JSON.parse(t.itineraries);
      } catch {
        parsedItinerary = [];
      }

      let parsedCheckpoints = [];
      try {
        parsedCheckpoints = JSON.parse(t.checkpoints);
      } catch {
        parsedCheckpoints = [];
      }

      return {
        trek_id: t.id,
        name: t.name,
        slug: t.slug,
        location: t.location,
        state: t.state,
        distance_km: t.distance,
        elevation_m: t.elevation,
        difficulty: t.difficulty,
        max_participants: t.maxParticipants,
        base_price_per_day: t.basePricePerDay,
        available_durations: t.availableDurations,
        confirmed_participants: t.bookings
          .filter((b) => b.bookingStatus !== "CANCELLED")
          .reduce((sum, b) => sum + b.participants, 0),
        route_coordinates: {
          start: { lat: t.startLat, lng: t.startLng, name: t.meetingPoint },
          destination: { lat: t.destLat, lng: t.destLng, name: t.destination },
        },
        checkpoints: parsedCheckpoints,
        itineraries: parsedItinerary,
        guide_assigned: t.guide ? { id: t.guide.id, name: t.guide.name } : null,
        schedules: t.schedules,
        booking_history_count: t.bookings.length,
      };
    });

    return NextResponse.json({
      status: "success",
      dataset_version: "2.0",
      treks_count: aiReadyDataset.length,
      data: aiReadyDataset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch AI training/inference data" },
      { status: 500 }
    );
  }
}
