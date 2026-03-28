import { leetProblemUrl } from "../lib/leetcodeSlug";
import { SKILL_TAXONOMY, type SkillConcept } from "../lib/skillTaxonomy";
import { countPendingAssignments, insertAssignments } from "../models/assignments";
import { listSkillScoresByUser } from "../models/skillScores";

const LEETCODE_PROBLEMS_ALL = "https://leetcode.com/api/problems/all/";
const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const CONCEPT_TO_LEETCODE_TOPIC_SLUGS: Record<SkillConcept, string[]> = {
  Arrays: ["array"],
  "Hash Maps": ["hash-table"],
  "Dynamic Programming": ["dynamic-programming"],
  Graphs: ["graph"],
  Trees: ["tree"],
  Recursion: ["recursion"],
  "Sorting & Searching": ["sorting", "binary-search"],
  "Sliding Window": ["sliding-window"],
  "Two Pointers": ["two-pointers"],
  "Bit Manipulation": ["bit-manipulation"],
  "Linked Lists": ["linked-list"],
  "Stacks & Queues": ["stack", "queue"]
};

type RestDifficulty = "easy" | "medium" | "hard";

type RestProblemMeta = {
  slug: string;
  title: string;
  difficulty: RestDifficulty;
  paid_only: boolean;
};

const REST_CACHE_TTL_MS = 60 * 60 * 1000;
let restProblemsCache: { loadedAt: number; problems: RestProblemMeta[] } | null = null;

const TOPIC_SLUGS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const topicTitleSlugsCache = new Map<string, { loadedAt: number; slugs: Set<string> }>();

function difficultyFromRestLevel(level: number): RestDifficulty {
  if (level === 1) return "easy";
  if (level === 2) return "medium";
  return "hard";
}

function difficultyTierFromGapScore(score: number): RestDifficulty {
  if (score < 40) return "easy";
  if (score <= 70) return "medium";
  return "hard";
}

function difficultySearchOrder(target: RestDifficulty): RestDifficulty[] {
  if (target === "easy") return ["easy", "medium", "hard"];
  if (target === "medium") return ["medium", "easy", "hard"];
  return ["hard", "medium", "easy"];
}

async function loadRestProblemMeta(): Promise<RestProblemMeta[]> {
  const now = Date.now();
  if (restProblemsCache && now - restProblemsCache.loadedAt < REST_CACHE_TTL_MS) {
    return restProblemsCache.problems;
  }

  const response = await fetch(LEETCODE_PROBLEMS_ALL, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`LeetCode problems/all failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    stat_status_pairs?: Array<{
      stat: {
        question__title: string;
        question__title_slug: string;
      };
      difficulty: { level: number };
      paid_only: boolean;
    }>;
  };

  const pairs = json.stat_status_pairs ?? [];
  const problems: RestProblemMeta[] = pairs.map((pair) => ({
    slug: String(pair.stat?.question__title_slug ?? ""),
    title: String(pair.stat?.question__title ?? ""),
    difficulty: difficultyFromRestLevel(Number(pair.difficulty?.level) || 3),
    paid_only: Boolean(pair.paid_only)
  })).filter((p) => p.slug.length > 0 && p.title.length > 0);

  restProblemsCache = { loadedAt: now, problems };
  return problems;
}

async function fetchTopicTitleSlugSet(topicSlug: string): Promise<Set<string>> {
  const now = Date.now();
  const hit = topicTitleSlugsCache.get(topicSlug);
  if (hit && now - hit.loadedAt < TOPIC_SLUGS_CACHE_TTL_MS) {
    return hit.slugs;
  }

  const query = `
    query getTopicTagSlugs($slug: String!) {
      topicTag(slug: $slug) {
        questions {
          titleSlug
        }
      }
    }
  `;

  const response = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ query, variables: { slug: topicSlug } })
  });

  if (!response.ok) {
    throw new Error(`LeetCode GraphQL topicTag failed (${response.status}) for ${topicSlug}`);
  }

  const json = (await response.json()) as {
    data?: { topicTag?: { questions?: Array<{ titleSlug?: string }> } };
    errors?: unknown;
  };

  if (json.errors) {
    throw new Error(`LeetCode GraphQL errors for topic ${topicSlug}: ${JSON.stringify(json.errors)}`);
  }

  const questions = json.data?.topicTag?.questions ?? [];
  const slugs = new Set<string>();
  for (const q of questions) {
    if (typeof q.titleSlug === "string" && q.titleSlug.length > 0) {
      slugs.add(q.titleSlug);
    }
  }

  topicTitleSlugsCache.set(topicSlug, { loadedAt: now, slugs });
  return slugs;
}

async function unionTopicSlugs(topicSlugs: string[]): Promise<Set<string>> {
  const sets = await Promise.all(topicSlugs.map((s) => fetchTopicTitleSlugSet(s)));
  const out = new Set<string>();
  for (const s of sets) {
    for (const slug of s) {
      out.add(slug);
    }
  }
  return out;
}

export async function findBiggestSkillGap(userId: string): Promise<{ concept: SkillConcept; score: number }> {
  const rows = await listSkillScoresByUser(userId);
  const scores = new Map(rows.map((r) => [r.concept, r.score]));

  let concept: SkillConcept = SKILL_TAXONOMY[0];
  let lowest = Infinity;

  for (const c of SKILL_TAXONOMY) {
    const s = scores.get(c) ?? 50;
    if (s < lowest) {
      lowest = s;
      concept = c;
    }
  }

  return { concept, score: lowest };
}

export async function pickLeetCodeProblemsForConcept(params: {
  concept: SkillConcept;
  difficulty: RestDifficulty;
  count: number;
}): Promise<Array<{ slug: string; title: string }>> {
  const topicSlugs = CONCEPT_TO_LEETCODE_TOPIC_SLUGS[params.concept];
  const [inTopic, restBySlug] = await Promise.all([
    unionTopicSlugs(topicSlugs),
    loadRestProblemMeta()
  ]);

  const slugToMeta = new Map(restBySlug.map((p) => [p.slug, p]));
  const order = difficultySearchOrder(params.difficulty);
  const picked: Array<{ slug: string; title: string }> = [];
  const used = new Set<string>();

  outer: for (const tier of order) {
    const candidates: RestProblemMeta[] = [];
    for (const slug of inTopic) {
      const meta = slugToMeta.get(slug);
      if (!meta || meta.paid_only) continue;
      if (meta.difficulty !== tier) continue;
      candidates.push(meta);
    }

    candidates.sort((a, b) => a.slug.localeCompare(b.slug));

    for (const c of candidates) {
      if (used.has(c.slug)) continue;
      used.add(c.slug);
      picked.push({ slug: c.slug, title: c.title });
      if (picked.length >= params.count) break outer;
    }
  }

  return picked;
}

export async function maybeGenerateWeeklyAssignments(userId: string): Promise<{ created: number }> {
  const pending = await countPendingAssignments(userId);
  if (pending > 0) {
    return { created: 0 };
  }

  const { concept, score } = await findBiggestSkillGap(userId);
  const tier = difficultyTierFromGapScore(score);

  const picks = await pickLeetCodeProblemsForConcept({
    concept,
    difficulty: tier,
    count: 3
  });

  if (picks.length === 0) {
    return { created: 0 };
  }

  await insertAssignments({
    userId,
    rows: picks.map((p) => ({
      problem_id: p.slug,
      problem_title: p.title,
      platform_url: leetProblemUrl(p.slug),
      concept_target: concept
    }))
  });

  return { created: picks.length };
}
