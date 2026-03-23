const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

export type LeetCodeSubmission = {
  platform: "leetcode";
  problem_id: string;
  problem_title: string;
  problem_tags: string[];
  difficulty: "easy" | "medium" | "hard";
  submitted_code: string | null;
  result: "accepted" | "wrong" | "tle" | "error";
  error_message: string | null;
  submitted_at: string;
};

const SUBMISSION_LIST_QUERY = `
  query submissionList($offset: Int!, $limit: Int!) {
    submissionList(offset: $offset, limit: $limit) {
      lastKey
      hasNext
      submissions {
        id
        title
        titleSlug
        status
        statusDisplay
        lang
        runtime
        timestamp
      }
    }
  }
`;

const SUBMISSION_DETAILS_QUERY = `
  query submissionDetails($submissionId: Int!) {
    submissionDetails(submissionId: $submissionId) {
      code
      runtime
      memory
      statusDisplay
      lang {
        name
        verboseName
      }
      question {
        title
        titleSlug
        difficulty
        topicTags {
          name
        }
      }
    }
  }
`;

function mapDifficulty(difficulty: string): LeetCodeSubmission["difficulty"] {
  const normalized = difficulty.toLowerCase();
  if (normalized.includes("easy")) return "easy";
  if (normalized.includes("medium")) return "medium";
  return "hard";
}

function mapStatusDisplayToResult(statusDisplay: string): LeetCodeSubmission["result"] {
  const normalized = statusDisplay.toLowerCase();
  if (normalized.includes("accepted")) return "accepted";
  if (normalized.includes("wrong")) return "wrong";
  if (normalized.includes("time limit") || normalized.includes("tle")) return "tle";
  return "error";
}

function toIsoTimestamp(timestamp: number | string): string {
  const n = typeof timestamp === "number" ? timestamp : Number(timestamp);
  if (Number.isFinite(n)) {
    const ms = n < 1e12 ? n * 1000 : n;
    return new Date(ms).toISOString();
  }
  return new Date(timestamp).toISOString();
}

type AdapterOk<T> = { ok: true; data: T };
type AdapterErr = { ok: false; error: { message: string; details?: unknown } };

async function graphqlPostAuthenticated<T>(params: {
  sessionToken: string;
  csrfToken: string;
  body: Record<string, unknown>;
}): Promise<AdapterOk<T> | AdapterErr> {
  try {
    const { sessionToken, csrfToken, body } = params;
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        Cookie: `LEETCODE_SESSION=${sessionToken}; csrftoken=${csrfToken}`,
        "x-csrftoken": csrfToken,
        "x-requested-with": "XMLHttpRequest",
        Referer: "https://leetcode.com",
        Origin: "https://leetcode.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
      },
      body: JSON.stringify(body)
    });

    const json = (await response.json()) as T & { errors?: unknown };
    if (!response.ok) {
      return {
        ok: false,
        error: {
          message: `LeetCode GraphQL request failed (${response.status})`,
          details: json
        }
      };
    }

    const maybeErrors = (json as unknown as { errors?: unknown }).errors;
    if (maybeErrors) {
      return {
        ok: false,
        error: { message: "LeetCode GraphQL returned errors", details: maybeErrors }
      };
    }

    return { ok: true, data: json };
  } catch (e) {
    return {
      ok: false,
      error: {
        message: "LeetCode GraphQL request threw an error",
        details: e
      }
    };
  }
}

type SubmissionListItem = {
  id: number | string;
  title: string;
  titleSlug: string;
  status: number | string;
  statusDisplay: string;
  lang: string;
  runtime: string | null;
  timestamp: number | string;
};

type SubmissionListResponse = {
  data?: {
    submissionList?: {
      lastKey?: number | string | null;
      hasNext?: boolean;
      submissions?: SubmissionListItem[];
    };
  };
};

type SubmissionDetailsResponse = {
  data?: {
    submissionDetails?: {
      code: string | null;
      runtime: string | null;
      memory: string | null;
      statusDisplay: string;
      lang: { name: string; verboseName: string };
      question: {
        title: string;
        titleSlug: string;
        difficulty: string;
        topicTags: Array<{ name: string }>;
      };
    };
  };
};

export async function fetchLeetCodeSubmissionHistory(params: {
  sessionToken: string;
  csrfToken: string;
  pageSize?: number;
  maxSubmissions?: number;
}): Promise<AdapterOk<LeetCodeSubmission[]> | AdapterErr> {
  const { sessionToken, csrfToken, pageSize = 20, maxSubmissions = 500 } = params;

  const out: LeetCodeSubmission[] = [];
  let offset = 0;
  let hasNext = true;

  while (out.length < maxSubmissions && hasNext) {
    const listResult = await graphqlPostAuthenticated<SubmissionListResponse>({
      sessionToken,
      csrfToken,
      body: {
        query: SUBMISSION_LIST_QUERY,
        variables: { offset, limit: pageSize }
      }
    });

    if (!listResult.ok) return listResult;

    const listData = listResult.data as unknown as SubmissionListResponse;
    const submissions = listData?.data?.submissionList?.submissions ?? [];
    hasNext = !!listData?.data?.submissionList?.hasNext;

    if (submissions.length === 0) break;

    for (const s of submissions) {
      if (out.length >= maxSubmissions) break;

      const base: LeetCodeSubmission = {
        platform: "leetcode",
        problem_id: slugOrFallback(s.titleSlug, s.id),
        problem_title: String(s.title ?? ""),
        problem_tags: [],
        difficulty: "easy",
        submitted_code: null,
        result: mapStatusDisplayToResult(String(s.statusDisplay ?? s.status ?? "")),
        error_message: null,
        submitted_at: toIsoTimestamp(s.timestamp)
      };

      out.push(base);

      const submissionIdNum = typeof s.id === "number" ? s.id : Number(s.id);
      if (!Number.isFinite(submissionIdNum)) continue;

      const detailsResult = await graphqlPostAuthenticated<SubmissionDetailsResponse>({
        sessionToken,
        csrfToken,
        body: {
          query: SUBMISSION_DETAILS_QUERY,
          variables: { submissionId: submissionIdNum }
        }
      });

      if (!detailsResult.ok) continue;

      const raw = detailsResult.data as unknown as SubmissionDetailsResponse;
      const details = raw?.data?.submissionDetails;
      const question = details?.question;
      if (!details || !question) continue;

      out[out.length - 1] = {
        ...base,
        problem_id: question.titleSlug ?? base.problem_id,
        problem_title: question.title ?? base.problem_title,
        problem_tags: question.topicTags?.map((t) => t.name) ?? [],
        difficulty: mapDifficulty(question.difficulty),
        submitted_code: details.code,
        result: mapStatusDisplayToResult(details.statusDisplay)
      };
    }

    const lastKey = listData?.data?.submissionList?.lastKey;
    const lastKeyNum = typeof lastKey === "number" ? lastKey : Number(lastKey);
    if (Number.isFinite(lastKeyNum)) {
      offset = lastKeyNum;
    } else {
      offset += pageSize;
    }
  }

  return { ok: true, data: out };
}

function slugOrFallback(titleSlug: unknown, id: unknown): string {
  if (typeof titleSlug === "string" && titleSlug.trim().length > 0) return titleSlug;
  if (typeof id === "string") return id;
  if (typeof id === "number") return String(id);
  return "";
}
