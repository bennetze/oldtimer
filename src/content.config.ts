import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const vehicles = defineCollection({
	loader: glob({
		pattern: '*/*/vehicle.json',
		base: './src/pages/projekte',
		generateId: ({ entry }) => entry.replace(/\/vehicle\.json$/, ''),
	}),
	schema: ({ image }) =>
		z.object({
			slug: z.string().min(1),
			category: z.enum(['aktuelle-projekte', 'vergangene-projekte', 'fahrzeugangebote']),
			title: z.string().min(1),
			description: z.string().min(1),
			sourceUrl: z.string().url(),
			order: z.number().int().positive(),
			dateModified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
			year: z.string().regex(/^\d{4}$/).optional(),
			cardImage: z.string().regex(/^\.\/[A-Za-z0-9._-]+$/),
			cardImageAlt: z.string().min(1),
			leadImage: z.string().regex(/^\.\/[A-Za-z0-9._-]+$/),
			leadImageAlt: z.string().min(1),
			blocks: z.array(
				z.discriminatedUnion('type', [
					z.object({
						type: z.literal('copy'),
						html: z.string().min(1),
					}),
					z.object({
						type: z.literal('contact'),
						html: z.string().min(1),
					}),
					z.object({
						type: z.literal('gallery'),
						images: z
							.array(
								z.object({
									src: z.string().regex(/^\.\/[A-Za-z0-9._-]+$/),
									alt: z.string().min(1),
									caption: z.string().optional(),
								}),
							)
							.min(1),
					}),
				]),
			),
		}),
});

export const collections = { vehicles };
