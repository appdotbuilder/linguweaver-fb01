import { db } from '../db';
import { videosTable, translationsTable } from '../db/schema';
import { type CreateTranslationInput, type Translation } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createTranslation = async (input: CreateTranslationInput): Promise<Translation> => {
  try {
    // 1. Verify that the video exists
    const video = await db.select()
      .from(videosTable)
      .where(eq(videosTable.id, input.video_id))
      .execute();

    if (video.length === 0) {
      throw new Error(`Video with ID ${input.video_id} not found`);
    }

    // 2. Check if a translation for this language already exists for this video
    const existingTranslation = await db.select()
      .from(translationsTable)
      .where(and(
        eq(translationsTable.video_id, input.video_id),
        eq(translationsTable.target_language, input.target_language)
      ))
      .execute();

    if (existingTranslation.length > 0) {
      throw new Error(`Translation to ${input.target_language} already exists for video ${input.video_id}`);
    }

    // 3. Insert a new translation record with 'pending' status
    const result = await db.insert(translationsTable)
      .values({
        video_id: input.video_id,
        target_language: input.target_language,
        status: 'pending',
        progress_percentage: 0,
        translated_audio_path: null,
        transcript_original: null,
        transcript_translated: null,
        error_message: null,
        started_at: null,
        completed_at: null
      })
      .returning()
      .execute();

    // 4. Return the created translation record
    return result[0];
  } catch (error) {
    console.error('Translation creation failed:', error);
    throw error;
  }
};