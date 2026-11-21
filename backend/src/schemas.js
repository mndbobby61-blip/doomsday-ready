import { z } from 'zod';
import { badRequest } from './errors.js';

const title = z.string().trim().min(1, 'Title is required').max(200);
const releaseYear = z.number().int().min(1888).max(2100);
const runtime = z.number().int().min(1, 'Runtime must be 1-300 minutes').max(300, 'Runtime must be 1-300 minutes');
const prerequisites = z.array(z.number().int().positive());
const watched = z.boolean();
// Optional poster link. An empty string means "no poster".
const posterUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === '' || /^https?:\/\//i.test(value), 'Poster must be an http(s) link')
  .nullable();

export const movieCreateSchema = z.object({
  title,
  releaseYear,
  runtime,
  prerequisites: prerequisites.optional().default([]),
  watched: watched.optional().default(false),
  posterUrl: posterUrl.optional(),
});

// PATCH: every field optional, but at least one must be present.
export const movieUpdateSchema = z
  .object({
    title: title.optional(),
    releaseYear: releaseYear.optional(),
    runtime: runtime.optional(),
    prerequisites: prerequisites.optional(),
    watched: watched.optional(),
    posterUrl: posterUrl.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'Send at least one field to update',
  });

export const cinemaCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  bundleSizes: z
    .array(z.number().int().min(1, 'Each bundle holds 1-500 seats').max(500, 'Each bundle holds 1-500 seats'))
    .min(1, 'Add at least one bundle size')
    .max(10, 'A cinema has at most 10 bundle sizes')
    .refine((sizes) => new Set(sizes).size === sizes.length, 'Bundle sizes must all be different'),
});

export const groupSizeSchema = z.coerce
  .number()
  .int('Group size must be a whole number')
  .min(1, 'Group size must be between 1 and 10,000')
  .max(10000, 'Group size must be between 1 and 10,000');

/** Validate `data` with `schema` or throw a 400 with per-field details. */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw badRequest(
    'Validation failed',
    result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
  );
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw badRequest('Id must be a positive integer');
  return id;
}