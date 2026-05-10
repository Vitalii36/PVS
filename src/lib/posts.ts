import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

let cached: Post[] | null = null;

export async function getPublishedPostsSorted(): Promise<Post[]> {
  if (cached) return cached;

  const all = await getCollection('posts');

  // Slug uniqueness — frontmatter slug determines URL, must be unique.
  const bySlug = new Map<string, string[]>();
  for (const entry of all) {
    const list = bySlug.get(entry.data.slug) ?? [];
    list.push(entry.id);
    bySlug.set(entry.data.slug, list);
  }
  const dupes = [...bySlug.entries()].filter(([, files]) => files.length > 1);
  if (dupes.length > 0) {
    const lines = dupes
      .map(([slug, files]) => `  slug "${slug}" used by: ${files.join(', ')}`)
      .join('\n');
    throw new Error(`Duplicate post slugs detected:\n${lines}`);
  }

  // Filter to published (date <= now), sort newest-first.
  const now = Date.now();
  cached = all
    .filter((p) => p.data.date.getTime() <= now)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return cached;
}

export async function getPrevNext(slug: string): Promise<{
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}> {
  const sorted = await getPublishedPostsSorted();
  const idx = sorted.findIndex((p) => p.data.slug === slug);
  if (idx === -1) return { prev: null, next: null };

  // sorted is newest-first: index 0 is newest, last is oldest.
  // "next" (newer) is at idx - 1, "prev" (older) is at idx + 1.
  const newer = idx > 0 ? sorted[idx - 1] : null;
  const older = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  return {
    prev: older ? { slug: older.data.slug, title: older.data.title } : null,
    next: newer ? { slug: newer.data.slug, title: newer.data.title } : null,
  };
}
