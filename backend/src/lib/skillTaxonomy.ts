export const SKILL_TAXONOMY = [
  "Arrays",
  "Hash Maps",
  "Dynamic Programming",
  "Graphs",
  "Trees",
  "Recursion",
  "Sorting & Searching",
  "Sliding Window",
  "Two Pointers",
  "Bit Manipulation",
  "Linked Lists",
  "Stacks & Queues"
] as const;

export type SkillConcept = (typeof SKILL_TAXONOMY)[number];

export function isSkillConcept(value: string): value is SkillConcept {
  return SKILL_TAXONOMY.includes(value as SkillConcept);
}
