import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Please log in to submit a review" }, { status: 401 });
    }

    const body = await request.json();
    const { trekId, rating, comment } = body;

    const ratingNum = Number(rating);
    if (!trekId || !ratingNum || ratingNum < 1 || ratingNum > 5 || !comment?.trim()) {
      return NextResponse.json(
        { error: "Valid rating (1 to 5) and review comment are required" },
        { status: 400 }
      );
    }

    const completedBooking = await prisma.booking.findFirst({
      where: {
        userId: session.id,
        trekId: trekId,
        bookingStatus: "COMPLETED",
      },
    });

    if (!completedBooking) {
      return NextResponse.json(
        { error: "Only trekkers who have completed this trek can submit a review." },
        { status: 403 }
      );
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.id,
        trekId: trekId,
      },
    });

    if (existingReview) {
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: ratingNum,
          comment: comment.trim(),
        },
      });
      return NextResponse.json({ success: true, review: updatedReview });
    }

    const review = await prisma.review.create({
      data: {
        userId: session.id,
        trekId: trekId,
        rating: ratingNum,
        comment: comment.trim(),
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
