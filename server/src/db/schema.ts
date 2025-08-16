import { serial, text, pgTable, timestamp, integer, pgEnum, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums for PostgreSQL
export const supportedLanguagesEnum = pgEnum('supported_languages', [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
]);

export const translationStatusEnum = pgEnum('translation_status', [
  'pending', 'processing', 'completed', 'failed'
]);

// Videos table
export const videosTable = pgTable('videos', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  original_filename: text('original_filename').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  duration: real('duration'), // Duration in seconds, nullable
  mime_type: text('mime_type').notNull(),
  original_language: supportedLanguagesEnum('original_language'), // Nullable
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Translations table
export const translationsTable = pgTable('translations', {
  id: serial('id').primaryKey(),
  video_id: integer('video_id').references(() => videosTable.id).notNull(),
  target_language: supportedLanguagesEnum('target_language').notNull(),
  status: translationStatusEnum('status').default('pending').notNull(),
  translated_audio_path: text('translated_audio_path'), // Nullable
  transcript_original: text('transcript_original'), // Nullable
  transcript_translated: text('transcript_translated'), // Nullable
  progress_percentage: integer('progress_percentage').default(0).notNull(),
  error_message: text('error_message'), // Nullable
  started_at: timestamp('started_at'), // Nullable
  completed_at: timestamp('completed_at'), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const videosRelations = relations(videosTable, ({ many }) => ({
  translations: many(translationsTable),
}));

export const translationsRelations = relations(translationsTable, ({ one }) => ({
  video: one(videosTable, {
    fields: [translationsTable.video_id],
    references: [videosTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Video = typeof videosTable.$inferSelect; // For SELECT operations
export type NewVideo = typeof videosTable.$inferInsert; // For INSERT operations

export type Translation = typeof translationsTable.$inferSelect; // For SELECT operations
export type NewTranslation = typeof translationsTable.$inferInsert; // For INSERT operations

// Export all tables and relations for proper query building
export const tables = { 
  videos: videosTable, 
  translations: translationsTable 
};