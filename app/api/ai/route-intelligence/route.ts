import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRouteIntelligence } from "@/lib/ai";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trekId = searchParams.get("trekId");

    if (trekId) {
      const trek = await prisma.trek.findUnique({
        where: { id: trekId },
      });

      if (!trek) {
        return NextResponse.json({ error: "Trek not found" }, { status: 404 });
      }

      let parsedCheckpoints: string[] = [];
      try {
        parsedCheckpoints = JSON.parse(trek.checkpoints);
      } catch {
        parsedCheckpoints = [];
      }

      const intelligence = generateRouteIntelligence(
        trek.name,
        trek.distance,
        trek.elevation,
        trek.difficulty,
        parsedCheckpoints
      );

      return NextResponse.json({ success: true, intelligence });
    }

    // Otherwise return intelligence for all active treks
    const treks = await prisma.trek.findMany({
      where: { status: "ACTIVE" },
    });

    const allProfiles = treks.map((t) => {
      let parsedCheckpoints: string[] = [];
      try {
        parsedCheckpoints = JSON.parse(t.checkpoints);
      } catch {
        parsedCheckpoints = [];
      }

      return generateRouteIntelligence(
        t.name,
        t.distance,
        t.elevation,
        t.difficulty,
        parsedCheckpoints
      );
    });

    return NextResponse.json({ success: true, profiles: allProfiles });
  } catch (error) {
    console.error("Route intelligence API error:", error);
    return NextResponse.json(
      { error: "Failed to generate route intelligence" },
      { status: 500 }
    );
  }
}
