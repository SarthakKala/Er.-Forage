import { copyAllSkillScoresToHistorySnapshot } from "../models/skillScores";

export async function runWeeklySkillSnapshot(): Promise<{ rowsInserted: number }> {
  const rowsInserted = await copyAllSkillScoresToHistorySnapshot();
  console.info(`[cron] Weekly skill snapshot: inserted ${rowsInserted} history rows`);
  return { rowsInserted };
}
