/** Best-effort LeetCode-style slug from a problem title (e.g. "Two Sum" → "two-sum"). */
export function leetTitleToSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function leetProblemUrl(titleSlug: string): string {
  const s = titleSlug.trim().replace(/^\/+|\/+$/g, "");
  return `https://leetcode.com/problems/${s}/`;
}
