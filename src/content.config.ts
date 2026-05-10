import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  // Force entry id = file path (not the `slug` frontmatter), so two posts
  // sharing a slug remain as two distinct entries — the slug-uniqueness
  // check in src/lib/posts.ts can then fail the build with both file paths.
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(120),
      date: z.coerce.date(),
      slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
        message:
          'slug must be lowercase, hyphen-separated, no leading/trailing hyphen',
      }),
      tags: z
        .array(z.string().regex(/^[a-z0-9-]+$/).max(32))
        .default([]),
      summary: z.string().min(20).max(280),
      cover: image().optional(),
    }),
});

const bio = defineCollection({
  loader: glob({ pattern: 'bio.md', base: './src/content/bio' }),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      role: z.string().min(1),
      location: z.string().optional(),
      photo: image(),
      excerpt: z
        .string()
        .refine((s) => s.trim().split(/\s+/).length <= 60, {
          message: 'excerpt must be 60 words or fewer',
        }),
      contacts: z
        .array(
          z.object({
            label: z.string().min(1),
            href: z.string().regex(/^(https?:\/\/|mailto:)/),
          }),
        )
        .min(1),
    }),
});

export const collections = { posts, bio };
