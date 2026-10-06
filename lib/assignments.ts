import { prisma } from "./prisma";

export interface GuideScheduleConflict {
  id: string;
  trekId: string;
  trekName: string;
  startDate: Date;
  endDate: Date;
}

export class GuideConflictError extends Error {
  conflicts: GuideScheduleConflict[];
  guideName: string;

  constructor(guideName: string, conflicts: GuideScheduleConflict[]) {
    const from = new Date(conflicts[0].startDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const to = new Date(conflicts[0].endDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    super(
      `Guide ${guideName} is already assigned to "${conflicts[0].trekName}" (${from} - ${to}). A guide can lead only one trek on any given day, so please pick another guide or adjust the dates.`
    );
    this.name = "GuideConflictError";
    this.guideName = guideName;
    this.conflicts = conflicts;
  }
}

export interface GuideAvailabilityInput {
  guideId: string;
  startDate: Date;
  endDate: Date;
  excludeScheduleIds?: string[];
}

/**
 * Returns every active/future schedule whose date range overlaps [startDate, endDate]
 * and where the guide is the responsible lead (either via the schedule itself or the trek).
 */
export async function findGuideConflicts(
  guideId: string,
  startDate: Date,
  endDate: Date,
  excludeScheduleIds: string[] = []
): Promise<GuideScheduleConflict[]> {
  const conflicts = await prisma.trekSchedule.findMany({
    where: {
      id: { notIn: excludeScheduleIds },
      AND: [
        {
          OR: [{ guideId }, { trek: { guideId } }],
        },
        { startDate: { lte: endDate } },
        { endDate: { gte: startDate } },
        { endDate: { gte: new Date() } },
      ],
    },
    select: {
      id: true,
      trekId: true,
      startDate: true,
      endDate: true,
      trek: { select: { name: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return conflicts.map((c) => ({
    id: c.id,
    trekId: c.trekId,
    trekName: c.trek.name,
    startDate: c.startDate,
    endDate: c.endDate,
  }));
}

/**
 * Validates that a guide is free for the given date range (one trek per day rule).
 * Throws GuideConflictError when a conflicting assignment exists.
 */
export async function assertGuideAvailable(
  guideId: string,
  startDate: Date,
  endDate: Date,
  guideName: string,
  excludeScheduleIds: string[] = []
): Promise<void> {
  const conflicts = await findGuideConflicts(guideId, startDate, endDate, excludeScheduleIds);
  if (conflicts.length > 0) {
    throw new GuideConflictError(guideName, conflicts);
  }
}

/**
 * Validates that assigning a guide to a whole trek does not clash with any of the
 * trek's own (non-completed, future) schedules.
 */
export async function assertGuideFreeForTrek(
  trekId: string,
  guideId: string,
  guideName: string
): Promise<void> {
  const schedules = await prisma.trekSchedule.findMany({
    where: {
      trekId,
      endDate: { gte: new Date() },
      status: { not: "COMPLETED" },
    },
    select: { id: true, startDate: true, endDate: true },
  });

  for (const schedule of schedules) {
    await assertGuideAvailable(guideId, schedule.startDate, schedule.endDate, guideName, [
      schedule.id,
    ]);
  }
}