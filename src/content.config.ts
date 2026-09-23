import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const TYPE = z.enum(['study', 'finding', 'instrument', 'note']);

const objects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/objects' }),
  schema: z.object({
    title: z.string(),
    number: z.string(),
    type: TYPE,
    date: z.coerce.date(),
    summary: z.string(),
    question: z.string().optional(),
    status: z.string().optional(),
    origin: z.string().optional(),
    seed: z.number().optional(),
    repo: z.string().url().optional(),
    external: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .optional(),
    limits: z.array(z.string()).optional(),
    related: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
});

const questions = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/questions' }),
  schema: z.object({
    question: z.string(),
    date: z.coerce.date(),
    lead: z.string(),
    order: z.number().default(99),
    objects: z.array(z.string()).optional(),
    repos: z
      .array(z.object({ label: z.string(), url: z.string().url(), note: z.string().optional() }))
      .optional(),
  }),
});

export const collections = { objects, questions };

export const TYPE_PREFIX: Record<string, string> = {
  study: 's',
  finding: 'f',
  instrument: 'i',
  note: 'n',
};

export const PREFIX_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_PREFIX).map(([t, p]) => [p, t]),
);
