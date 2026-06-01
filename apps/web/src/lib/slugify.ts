/**
 * Converts a string to a URL-safe slug.
 * "My Project!" → "my-project"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns a slug that is unique within a set of existing slugs.
 * If "my-project" exists, returns "my-project-2", then "my-project-3", etc.
 */
export function uniqueSlug(base: string, existing: string[]): string {
  const set = new Set(existing);
  if (!set.has(base)) return base;
  let i = 2;
  while (set.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
