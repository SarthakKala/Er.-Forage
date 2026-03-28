import { db } from "../src/lib/db";
import { buildGrowthSnapshotData } from "../src/services/portfolioSnapshot";

type Concept =
  | "Arrays"
  | "Hash Maps"
  | "Dynamic Programming"
  | "Graphs"
  | "Trees"
  | "Recursion"
  | "Sorting & Searching"
  | "Sliding Window"
  | "Two Pointers"
  | "Bit Manipulation"
  | "Linked Lists"
  | "Stacks & Queues";

const DEMO_EMAIL = "demo@erforge.io";
const DEMO_NAME = "Alex Chen";
const DEMO_AVATAR =
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=facearea&w=128&h=128&q=80";

const SKILL_TAXONOMY: Concept[] = [
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
];

const problemsByConcept: Record<
  Concept,
  Array<{ title: string; slug: string; difficulty: "easy" | "medium" | "hard"; tags: string[] }>
> = {
  Arrays: [
    { title: "Two Sum", slug: "two-sum", difficulty: "easy", tags: ["Array", "Hash Table"] },
    { title: "Maximum Subarray", slug: "maximum-subarray", difficulty: "medium", tags: ["Array", "Divide and Conquer"] },
    { title: "Product of Array Except Self", slug: "product-of-array-except-self", difficulty: "medium", tags: ["Array", "Prefix Sum"] }
  ],
  "Hash Maps": [
    { title: "Group Anagrams", slug: "group-anagrams", difficulty: "medium", tags: ["Hash Table", "String"] },
    { title: "Top K Frequent Elements", slug: "top-k-frequent-elements", difficulty: "medium", tags: ["Hash Table", "Heap"] },
    { title: "Valid Anagram", slug: "valid-anagram", difficulty: "easy", tags: ["Hash Table", "String"] }
  ],
  "Dynamic Programming": [
    { title: "Climbing Stairs", slug: "climbing-stairs", difficulty: "easy", tags: ["Dynamic Programming"] },
    { title: "House Robber", slug: "house-robber", difficulty: "medium", tags: ["Dynamic Programming"] },
    { title: "Coin Change", slug: "coin-change", difficulty: "medium", tags: ["Dynamic Programming"] }
  ],
  Graphs: [
    { title: "Number of Islands", slug: "number-of-islands", difficulty: "medium", tags: ["Graph", "DFS"] },
    { title: "Course Schedule", slug: "course-schedule", difficulty: "medium", tags: ["Graph", "Topological Sort"] },
    { title: "Clone Graph", slug: "clone-graph", difficulty: "medium", tags: ["Graph", "Hash Table"] }
  ],
  Trees: [
    { title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal", difficulty: "medium", tags: ["Tree", "BFS"] },
    { title: "Validate Binary Search Tree", slug: "validate-binary-search-tree", difficulty: "medium", tags: ["Tree", "DFS"] },
    { title: "Invert Binary Tree", slug: "invert-binary-tree", difficulty: "easy", tags: ["Tree"] }
  ],
  Recursion: [
    { title: "Generate Parentheses", slug: "generate-parentheses", difficulty: "medium", tags: ["Recursion", "Backtracking"] },
    { title: "Pow(x, n)", slug: "powx-n", difficulty: "medium", tags: ["Recursion", "Math"] },
    { title: "Letter Combinations of a Phone Number", slug: "letter-combinations-of-a-phone-number", difficulty: "medium", tags: ["Recursion", "Backtracking"] }
  ],
  "Sorting & Searching": [
    { title: "Binary Search", slug: "binary-search", difficulty: "easy", tags: ["Binary Search"] },
    { title: "Merge Intervals", slug: "merge-intervals", difficulty: "medium", tags: ["Sorting"] },
    { title: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array", difficulty: "medium", tags: ["Binary Search"] }
  ],
  "Sliding Window": [
    { title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters", difficulty: "medium", tags: ["Sliding Window", "Hash Table"] },
    { title: "Minimum Size Subarray Sum", slug: "minimum-size-subarray-sum", difficulty: "medium", tags: ["Sliding Window"] },
    { title: "Permutation in String", slug: "permutation-in-string", difficulty: "medium", tags: ["Sliding Window"] }
  ],
  "Two Pointers": [
    { title: "Valid Palindrome", slug: "valid-palindrome", difficulty: "easy", tags: ["Two Pointers"] },
    { title: "3Sum", slug: "3sum", difficulty: "medium", tags: ["Two Pointers", "Sorting"] },
    { title: "Container With Most Water", slug: "container-with-most-water", difficulty: "medium", tags: ["Two Pointers"] }
  ],
  "Bit Manipulation": [
    { title: "Single Number", slug: "single-number", difficulty: "easy", tags: ["Bit Manipulation"] },
    { title: "Counting Bits", slug: "counting-bits", difficulty: "easy", tags: ["Bit Manipulation", "Dynamic Programming"] },
    { title: "Reverse Bits", slug: "reverse-bits", difficulty: "easy", tags: ["Bit Manipulation"] }
  ],
  "Linked Lists": [
    { title: "Reverse Linked List", slug: "reverse-linked-list", difficulty: "easy", tags: ["Linked List"] },
    { title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists", difficulty: "easy", tags: ["Linked List"] },
    { title: "Linked List Cycle", slug: "linked-list-cycle", difficulty: "easy", tags: ["Linked List", "Two Pointers"] }
  ],
  "Stacks & Queues": [
    { title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "easy", tags: ["Stack"] },
    { title: "Min Stack", slug: "min-stack", difficulty: "medium", tags: ["Stack"] },
    { title: "Implement Queue using Stacks", slug: "implement-queue-using-stacks", difficulty: "easy", tags: ["Queue", "Stack"] }
  ]
};

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function main() {
  console.log("Seeding demo account…");
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Remove existing demo user data (works even if FKs don't cascade in an older DB).
    const existing = await client.query<{ id: string }>(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [
      DEMO_EMAIL
    ]);
    const existingId = existing.rows[0]?.id;
    if (existingId) {
      await client.query(`DELETE FROM growth_reports WHERE user_id = $1`, [existingId]);
      await client.query(`DELETE FROM assignments WHERE user_id = $1`, [existingId]);
      await client.query(`DELETE FROM skill_score_history WHERE user_id = $1`, [existingId]);
      await client.query(`DELETE FROM skill_scores WHERE user_id = $1`, [existingId]);
      await client.query(`DELETE FROM submissions WHERE user_id = $1`, [existingId]);
      await client.query(`DELETE FROM platform_connections WHERE user_id = $1`, [existingId]);
      await client.query(`DELETE FROM users WHERE id = $1`, [existingId]);
    }

    const userRes = await client.query<{ id: string }>(
      `INSERT INTO users (email, name, avatar_url) VALUES ($1, $2, $3) RETURNING id`,
      [DEMO_EMAIL, DEMO_NAME, DEMO_AVATAR]
    );
    const userId = userRes.rows[0]?.id;
    if (!userId) throw new Error("Failed to create demo user");

    // Build 60 submissions across last 8 weeks (56 days).
    const submissions: Array<{
      platform: "leetcode";
      problem_id: string;
      problem_title: string;
      problem_tags: string[];
      difficulty: "easy" | "medium" | "hard";
      submitted_code: string;
      result: "accepted" | "wrong" | "tle" | "error";
      error_message: string | null;
      ai_analysis: string;
      concept_tags: string[];
      is_manual_paste: boolean;
      submitted_at: string;
    }> = [];

    const weakness: Concept[] = ["Hash Maps", "Dynamic Programming"];
    for (let i = 0; i < 60; i++) {
      const ageDays = Math.floor((i / 60) * 56) + Math.floor(Math.random() * 3);
      const concept =
        Math.random() < 0.33 ? pick(weakness) : pick(SKILL_TAXONOMY.filter((c) => !weakness.includes(c)));
      const p = pick(problemsByConcept[concept]);

      const weaknessFailRate = concept === "Hash Maps" || concept === "Dynamic Programming" ? 0.62 : 0.28;
      const roll = Math.random();
      const result =
        roll < weaknessFailRate ? (Math.random() < 0.2 ? "tle" : "wrong") : "accepted";

      const submitted_at = isoDaysAgo(ageDays);
      const ai = {
        concept_tags: [concept],
        skill_gap:
          result === "accepted"
            ? "Good execution — keep reinforcing the pattern under time pressure."
            : concept === "Hash Maps"
              ? "You missed the key: normalize the representation and use a frequency map."
              : concept === "Dynamic Programming"
                ? "You didn’t define the state/transition clearly before coding."
                : "You skipped an invariant check before iterating.",
        root_cause:
          result === "accepted"
            ? "Strong mental model and clean trade-offs."
            : "You jumped into implementation before locking the correct approach.",
        post_solve_analysis:
          result === "accepted"
            ? "You identified the core pattern quickly and kept the implementation minimal. Keep focusing on invariants and edge cases."
            : "Pause first: name the pattern, write the invariant/state, and only then code. This prevents wasted iterations and hidden edge cases.",
        score_impact: result === "accepted" ? 2 : -4
      };

      submissions.push({
        platform: "leetcode",
        problem_id: p.slug,
        problem_title: p.title,
        problem_tags: p.tags,
        difficulty: p.difficulty,
        submitted_code: `// demo submission (${concept})\nfunction solve() {\n  // ...\n}\n`,
        result,
        error_message: result === "accepted" ? null : result === "tle" ? "Time limit exceeded" : "Wrong answer",
        ai_analysis: JSON.stringify(ai),
        concept_tags: [concept],
        is_manual_paste: false,
        submitted_at
      });
    }

    for (const s of submissions) {
      await client.query(
        `
        INSERT INTO submissions (
          user_id, platform, problem_id, problem_title, problem_tags, difficulty,
          submitted_code, result, error_message, ai_analysis, concept_tags, is_manual_paste, submitted_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (user_id, platform, problem_id, submitted_at) DO NOTHING
        `,
        [
          userId,
          s.platform,
          s.problem_id,
          s.problem_title,
          s.problem_tags,
          s.difficulty,
          s.submitted_code,
          s.result,
          s.error_message,
          s.ai_analysis,
          s.concept_tags,
          s.is_manual_paste,
          s.submitted_at
        ]
      );
    }

    // Skill scores (current).
    const currentScores: Record<Concept, number> = {
      Arrays: 78,
      "Hash Maps": 52,
      "Dynamic Programming": 41,
      Graphs: 74,
      Trees: 63,
      Recursion: 58,
      "Sorting & Searching": 62,
      "Sliding Window": 67,
      "Two Pointers": 70,
      "Bit Manipulation": 55,
      "Linked Lists": 59,
      "Stacks & Queues": 72
    };

    for (const concept of SKILL_TAXONOMY) {
      await client.query(
        `
        INSERT INTO skill_scores (user_id, concept, score, last_updated)
        VALUES ($1,$2,$3,NOW())
        ON CONFLICT (user_id, concept) DO UPDATE SET score = EXCLUDED.score, last_updated = NOW()
        `,
        [userId, concept, currentScores[concept]]
      );
    }

    // 8 weekly snapshots.
    // Hash Maps: 28 → 52, DP: 22 → 41. Others drift slightly.
    for (let week = 7; week >= 0; week--) {
      const daysAgo = week * 7;
      const recordedAt = isoDaysAgo(daysAgo);

      const hm = Math.round(28 + ((52 - 28) * (7 - week)) / 7);
      const dp = Math.round(22 + ((41 - 22) * (7 - week)) / 7);

      for (const concept of SKILL_TAXONOMY) {
        const base = currentScores[concept];
        let score = base;
        if (concept === "Hash Maps") score = hm;
        else if (concept === "Dynamic Programming") score = dp;
        else score = clamp(base - Math.round((week / 7) * 6) + (concept === "Arrays" ? 2 : 0), 0, 100);

        await client.query(
          `
          INSERT INTO skill_score_history (user_id, concept, score, recorded_at)
          VALUES ($1,$2,$3,$4)
          `,
          [userId, concept, score, recordedAt]
        );
      }
    }

    // Assignments: 3 completed + 2 pending.
    const assignmentRows = [
      { ...problemsByConcept["Hash Maps"][0], concept: "Hash Maps" as const, status: "completed", daysAgo: 18 },
      { ...problemsByConcept["Dynamic Programming"][1], concept: "Dynamic Programming" as const, status: "completed", daysAgo: 12 },
      { ...problemsByConcept["Sliding Window"][0], concept: "Sliding Window" as const, status: "completed", daysAgo: 9 },
      { ...problemsByConcept["Hash Maps"][1], concept: "Hash Maps" as const, status: "pending", daysAgo: 4 },
      { ...problemsByConcept["Dynamic Programming"][2], concept: "Dynamic Programming" as const, status: "pending", daysAgo: 2 }
    ];

    for (const a of assignmentRows) {
      const assignedAt = isoDaysAgo(a.daysAgo);
      const completedAt = a.status === "completed" ? isoDaysAgo(a.daysAgo - 1) : null;
      await client.query(
        `
        INSERT INTO assignments (
          user_id, problem_id, problem_title, platform_url, concept_target, status, assigned_at, completed_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [
          userId,
          a.slug,
          a.title,
          `https://leetcode.com/problems/${a.slug}/`,
          a.concept,
          a.status,
          assignedAt,
          completedAt
        ]
      );
    }

    await client.query("COMMIT");

    // Growth reports: one 4 weeks ago + one today (after commit so snapshot queries can see data).
    const snapshot = await buildGrowthSnapshotData(userId);
    const report4w = { ...snapshot, generatedAt: isoDaysAgo(28) };
    const reportNow = { ...snapshot, generatedAt: new Date().toISOString() };

    const older = await db.query<{ token: string }>(
      `
      INSERT INTO growth_reports (user_id, snapshot_data, period, created_at)
      VALUES ($1, $2::jsonb, 'weekly', $3)
      RETURNING token
      `,
      [userId, JSON.stringify({ ...report4w, report_name: "Mid-cycle growth report" }), isoDaysAgo(28)]
    );
    const newer = await db.query<{ token: string }>(
      `
      INSERT INTO growth_reports (user_id, snapshot_data, period, created_at)
      VALUES ($1, $2::jsonb, 'weekly', NOW())
      RETURNING token
      `,
      [userId, JSON.stringify({ ...reportNow, report_name: "Current growth report" })]
    );

    const token = newer.rows[0]?.token ?? older.rows[0]?.token;
    console.log("✅ Demo account seeded.");
    if (token) {
      console.log(`Public report URL: http://localhost:3000/report/${token}`);
    }
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", e);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.end();
  }
}

main();

