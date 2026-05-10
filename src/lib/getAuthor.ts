import { getCollection } from 'astro:content';

export async function getAuthor() {
  const entries = await getCollection('bio');
  if (entries.length !== 1) {
    throw new Error(
      `Expected exactly 1 entry in the 'bio' collection (src/content/bio/), found ${entries.length}. ` +
        `The site supports a single Author per the constitution and spec assumptions.`,
    );
  }
  return entries[0];
}
