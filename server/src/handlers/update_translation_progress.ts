import { db } from '../db';
import { translationsTable } from '../db/schema';
import { type UpdateTranslationProgressInput, type Translation } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTranslationProgress = async (input: UpdateTranslationProgressInput): Promise<Translation | null> => {
  try {
    // Build update object with only the fields that are provided
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.progress_percentage !== undefined) {
      updateData.progress_percentage = input.progress_percentage;
    }

    if (input.translated_audio_path !== undefined) {
      updateData.translated_audio_path = input.translated_audio_path;
    }

    if (input.transcript_original !== undefined) {
      updateData.transcript_original = input.transcript_original;
    }

    if (input.transcript_translated !== undefined) {
      updateData.transcript_translated = input.transcript_translated;
    }

    if (input.error_message !== undefined) {
      updateData.error_message = input.error_message;
    }

    if (input.started_at !== undefined) {
      updateData.started_at = input.started_at;
    }

    if (input.completed_at !== undefined) {
      updateData.completed_at = input.completed_at;
    }

    // Update the translation record
    const result = await db.update(translationsTable)
      .set(updateData)
      .where(eq(translationsTable.id, input.translation_id))
      .returning()
      .execute();

    // Return null if no record was found and updated
    if (result.length === 0) {
      return null;
    }

    // Return the updated translation
    return result[0];
  } catch (error) {
    console.error('Translation progress update failed:', error);
    throw error;
  }
};