import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { validateVehicleRecord } from './config/vehicleRecord.js';
import { validateVehicleHtml } from './config/vehicleHtml.js';

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
			titleEn: z.string().min(1),
			description: z.string().min(1),
			descriptionEn: z.string().min(1),
			sourceUrl: z.string().url(),
			order: z.number().int(),
			dateModified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
			year: z.string().regex(/^\d{4}$/).optional(),
			cardImage: z.string().regex(/^\.\/[A-Za-z0-9._-]+$/),
			cardImageAlt: z.string().min(1),
			cardImageAltEn: z.string().min(1),
			leadImage: z.string().regex(/^\.\/[A-Za-z0-9._-]+$/),
			leadImageAlt: z.string().min(1),
			leadImageAltEn: z.string().min(1),
			blocks: z.array(
				z.discriminatedUnion('type', [
					z.object({
						type: z.literal('copy'),
						html: z.string().min(1),
						htmlEn: z.string().min(1),
					}),
					z.object({
						type: z.literal('contact'),
						html: z.string().min(1),
						htmlEn: z.string().min(1),
					}),
					z.object({
						type: z.literal('gallery'),
						images: z
							.array(
								z.object({
									src: z.string().regex(/^\.\/[A-Za-z0-9._-]+$/),
									alt: z.string().min(1),
									altEn: z.string().min(1),
									caption: z.string().optional(),
									captionEn: z.string().optional(),
								}),
							)
							.min(1),
					}),
				]),
			),
		}).superRefine((record, context) => {
			try { validateVehicleRecord(record, validateVehicleHtml); }
			catch (error) { context.addIssue({ code: 'custom', message: error instanceof Error ? error.message : String(error) }); }
		}),
});

export const collections = { vehicles };
