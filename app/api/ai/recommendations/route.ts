import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRecommendations, RecommendationCriteria, RawTrekInput } from "@/lib/ai";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const difficulty = (searchParams.get("difficulty") || "ANY").toUpperCase() as any;
    const durationParam = searchParams.get("durationDays");
    const durationDays = durationParam && durationParam !== "ANY" ? Number(durationParam) : "ANY";
    const budgetParam = searchParams.get("maxBudget");
    const maxBudget = budgetParam && budgetParam !== "ANY" ? Number(budgetParam) : "ANY";
    const location = searchParams.get("location") || "ANY";
    const season = (searchParams.get("season") || "ANY").toUpperCase() as any;
    const distanceParam = searchParams.get("maxDistanceKm");
    const maxDistanceKm = distanceParam && distanceParam !== "ANY" ? Number(distanceParam) : "ANY";

    const criteria: RecommendationCriteria = {
      difficulty,
      durationDays,
      maxBudget,
      location,
      season,
      maxDistanceKm,
    };

    // Load actual treks from Prisma database
    const dbTreks = await prisma.trek.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    const rawTreks: RawTrekInput[] = dbTreks.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      location: t.location,
      state: t.state,
      description: t.description,
      difficulty: t.difficulty,
      distance: t.distance,
      availableDurations: t.availableDurations,
      basePricePerDay: t.basePricePerDay,
      imageUrl: t.imageUrl,
      elevation: t.elevation,
      requirements: t.requirements,
    }));

    const recommendations = generateRecommendations(rawTreks, criteria, 6);

    return NextResponse.json({
      success: true,
      criteria,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error("AI Recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI recommendations" },
      { status: 500 }
    );
  }
}
