import { z } from 'zod';

// Supported languages enum
export const supportedLanguagesSchema = z.enum([
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
]);

export type SupportedLanguage = z.infer<typeof supportedLanguagesSchema>;

// Translation status enum
export const translationStatusSchema = z.enum([
  'pending', 'processing', 'completed', 'failed'
]);

export type TranslationStatus = z.infer<typeof translationStatusSchema>;

// Video schema
export const videoSchema = z.object({
  id: z.number(),
  filename: z.string(),
  original_filename: z.string(),
  file_path: z.string(),
  file_size: z.number(),
  duration: z.number().nullable(), // Duration in seconds
  mime_type: z.string(),
  original_language: supportedLanguagesSchema.nullable(),
  uploaded_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Video = z.infer<typeof videoSchema>;

// Translation schema
export const translationSchema = z.object({
  id: z.number(),
  video_id: z.number(),
  target_language: supportedLanguagesSchema,
  status: translationStatusSchema,
  translated_audio_path: z.string().nullable(),
  transcript_original: z.string().nullable(),
  transcript_translated: z.string().nullable(),
  progress_percentage: z.number().int().min(0).max(100),
  error_message: z.string().nullable(),
  started_at: z.coerce.date().nullable(),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Translation = z.infer<typeof translationSchema>;

// Input schema for uploading videos
export const uploadVideoInputSchema = z.object({
  filename: z.string(),
  original_filename: z.string(),
  file_path: z.string(),
  file_size: z.number().positive(),
  duration: z.number().positive().nullable(),
  mime_type: z.string(),
  original_language: supportedLanguagesSchema.nullable()
});

export type UploadVideoInput = z.infer<typeof uploadVideoInputSchema>;

// Input schema for creating translations
export const createTranslationInputSchema = z.object({
  video_id: z.number(),
  target_language: supportedLanguagesSchema
});

export type CreateTranslationInput = z.infer<typeof createTranslationInputSchema>;

// Input schema for updating translation progress
export const updateTranslationProgressInputSchema = z.object({
  translation_id: z.number(),
  status: translationStatusSchema.optional(),
  progress_percentage: z.number().int().min(0).max(100).optional(),
  translated_audio_path: z.string().nullable().optional(),
  transcript_original: z.string().nullable().optional(),
  transcript_translated: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
  started_at: z.coerce.date().nullable().optional(),
  completed_at: z.coerce.date().nullable().optional()
});

export type UpdateTranslationProgressInput = z.infer<typeof updateTranslationProgressInputSchema>;

// Query schema for getting translations by video
export const getTranslationsByVideoInputSchema = z.object({
  video_id: z.number()
});

export type GetTranslationsByVideoInput = z.infer<typeof getTranslationsByVideoInputSchema>;

// Query schema for getting translation by ID
export const getTranslationByIdInputSchema = z.object({
  translation_id: z.number()
});

export type GetTranslationByIdInput = z.infer<typeof getTranslationByIdInputSchema>;

// Query schema for getting video by ID
export const getVideoByIdInputSchema = z.object({
  video_id: z.number()
});

export type GetVideoByIdInput = z.infer<typeof getVideoByIdInputSchema>;

// Response schema for translation with video details
export const translationWithVideoSchema = z.object({
  id: z.number(),
  video_id: z.number(),
  target_language: supportedLanguagesSchema,
  status: translationStatusSchema,
  translated_audio_path: z.string().nullable(),
  transcript_original: z.string().nullable(),
  transcript_translated: z.string().nullable(),
  progress_percentage: z.number().int().min(0).max(100),
  error_message: z.string().nullable(),
  started_at: z.coerce.date().nullable(),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  video: videoSchema
});

export type TranslationWithVideo = z.infer<typeof translationWithVideoSchema>;