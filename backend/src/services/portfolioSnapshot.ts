import {
  buildSkillScoresForTaxonomy,
  computeWeeksActive,
  groupSkillHistoryByConcept,
  type ConceptHistoryGroup
} from "../lib/portfolioHelpers";
import { countCompletedAssignmentsForUser } from "../models/assignments";
import { listGrowthReportsByUser } from "../models/growthReports";
import {
  listSkillScoreHistoryForUser,
  listSkillScoresByUser
} from "../models/skillScores";
import {
  countDistinctAcceptedProblemsForUser,
  countSubmissionsForUser,
  getEarliestSubmissionDateForUser
} from "../models/submissions";
import { getUserById } from "../models/users";

export type GrowthSnapshotData = {
  user: { id: string; name: string; email: string };
  generatedAt: string;
  skillScores: ReturnType<typeof buildSkillScoresForTaxonomy>;
  skillHistory: ConceptHistoryGroup[];
  stats: {
    totalSubmissions: number;
    problemsSolved: number;
    completedAssignments: number;
    weeksActive: number;
  };
};

export async function buildGrowthSnapshotData(userId: string): Promise<GrowthSnapshotData> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const [
    skillRows,
    historyRows,
    totalSubmissions,
    problemsSolved,
    completedAssignments,
    firstSub
  ] = await Promise.all([
    listSkillScoresByUser(userId),
    listSkillScoreHistoryForUser(userId),
    countSubmissionsForUser(userId),
    countDistinctAcceptedProblemsForUser(userId),
    countCompletedAssignmentsForUser(userId),
    getEarliestSubmissionDateForUser(userId)
  ]);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    generatedAt: new Date().toISOString(),
    skillScores: buildSkillScoresForTaxonomy(skillRows),
    skillHistory: groupSkillHistoryByConcept(historyRows),
    stats: {
      totalSubmissions,
      problemsSolved,
      completedAssignments,
      weeksActive: computeWeeksActive(firstSub)
    }
  };
}

export async function buildFullPortfolioResponse(userId: string): Promise<
  GrowthSnapshotData & { reports: Awaited<ReturnType<typeof listGrowthReportsByUser>> }
> {
  const [snapshot, reports] = await Promise.all([
    buildGrowthSnapshotData(userId),
    listGrowthReportsByUser(userId)
  ]);
  return { ...snapshot, reports };
}
