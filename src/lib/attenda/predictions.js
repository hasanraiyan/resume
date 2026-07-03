// @/lib/attenda/predictions.js
// Prediction and safe bunk utilities.

/**
 * Given current attendance stats and total classes, compute the new percentage
 * if the student misses the next N classes.
 */
export function predictAfterMissing(stats, skipCount) {
  const newTotal = stats.totalClasses + skipCount;
  if (newTotal === 0) return 0;
  const newPercentage = (stats.present / newTotal) * 100;
  return Math.round(newPercentage * 100) / 100;
}

/**
 * Given current attendance stats and total classes, compute the new percentage
 * if the student attends the next N classes.
 */
export function predictAfterAttending(stats, attendCount) {
  const newTotal = stats.totalClasses + attendCount;
  const newPresent = stats.present + attendCount;
  if (newTotal === 0) return 0;
  const newPercentage = (newPresent / newTotal) * 100;
  return Math.round(newPercentage * 100) / 100;
}

/**
 * Calculate how many consecutive classes a student can safely miss
 * while staying above the required attendance threshold.
 * Returns the max number of safe bunks.
 */
export function calculateSafeBunks(stats, requiredPercentage) {
  if (stats.totalClasses === 0) return 0;

  let bunks = 0;
  let currentPercentage = (stats.present / stats.totalClasses) * 100;

  // Simulate skipping classes one by one
  while (currentPercentage >= requiredPercentage) {
    bunks++;
    const newTotal = stats.totalClasses + bunks;
    currentPercentage = (stats.present / newTotal) * 100;
  }

  return Math.max(0, bunks - 1);
}

/**
 * Calculate the number of consecutive classes the student needs to attend
 * to reach the required percentage.
 */
export function calculateNeededAttendance(stats, requiredPercentage) {
  if (stats.totalClasses === 0) return 1; // need at least 1

  let needed = 0;
  let currentPercentage = (stats.present / stats.totalClasses) * 100;

  if (currentPercentage >= requiredPercentage) return 0; // already above target

  while (currentPercentage < requiredPercentage) {
    needed++;
    const newTotal = stats.totalClasses + needed;
    const newPresent = stats.present + needed;
    currentPercentage = (newPresent / newTotal) * 100;
  }

  return needed;
}

/**
 * Generate a full prediction report for college attendance.
 */
export function generateCollegePredictions(collegeStats, semester) {
  const { presentDays, absentDays, totalWorkingDays, percentage, remainingDays } = collegeStats;
  const required = semester.requiredAttendance ?? 75;

  if (percentage === null || totalWorkingDays === 0) {
    return {
      currentPercentage: null,
      ifSkipTomorrow: null,
      ifAttendWeek: null,
      safeBunks: 0,
      neededToReach: 0,
      message: 'Not enough data yet. Start logging your attendance!',
    };
  }

  // Safe bunks for college (in days)
  const safeBunks = calculateSafeBunks(
    { present: presentDays, totalClasses: totalWorkingDays },
    required
  );

  // Needed attendance to reach target
  const neededDays = calculateNeededAttendance(
    { present: presentDays, totalClasses: totalWorkingDays },
    required
  );

  // If skip tomorrow (1 day)
  const ifSkipTomorrow = predictAfterMissing(
    { present: presentDays, totalClasses: totalWorkingDays },
    1
  );

  // If attend next 5 days
  const ifAttendWeek = predictAfterAttending(
    { present: presentDays, totalClasses: totalWorkingDays },
    5
  );

  const isAtRisk = percentage < required;

  return {
    currentPercentage: percentage,
    ifSkipTomorrow,
    ifAttendWeek,
    safeBunks,
    neededToReach: neededDays,
    isAtRisk,
    remainingDays,
    message: isAtRisk
      ? `You need to attend ${neededDays} more day${neededDays > 1 ? 's' : ''} to reach ${required}%`
      : `You can safely miss ${safeBunks} day${safeBunks !== 1 ? 's' : ''}`,
  };
}

/**
 * Generate a prediction report for a specific subject.
 */
export function generateSubjectPredictions(subjectStats, subject) {
  const { present, totalClasses, percentage } = subjectStats;
  const required = subject.requiredAttendance ?? 75;

  if (percentage === null || totalClasses === 0) {
    return {
      currentPercentage: null,
      ifSkipNext: null,
      ifAttendNext: null,
      safeBunks: 0,
      neededToReach: 0,
      message: 'No attendance data yet.',
    };
  }

  const safeBunks = calculateSafeBunks({ present, totalClasses }, required);
  const neededLectures = calculateNeededAttendance({ present, totalClasses }, required);
  const ifSkipNext = predictAfterMissing({ present, totalClasses }, 1);
  const ifAttendNext = predictAfterAttending({ present, totalClasses }, 5);

  const isAtRisk = percentage < required;

  return {
    currentPercentage: percentage,
    ifSkipNext,
    ifAttendNext,
    safeBunks,
    neededToReach: neededLectures,
    isAtRisk,
    message: isAtRisk
      ? `Need ${neededLectures} more lecture${neededLectures > 1 ? 's' : ''} to reach ${required}%`
      : `${safeBunks} safe bunk${safeBunks !== 1 ? 's' : ''} available`,
  };
}
