import { db } from '../db';
import { translationsTable, videosTable } from '../db/schema';
import { type TranslationWithVideo } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getAllTranslations(): Promise<TranslationWithVideo[]> {
  try {
    // Query translations with joined video data, ordered by created_at (newest first)
    const results = await db.select()
      .from(translationsTable)
      .innerJoin(videosTable, eq(translationsTable.video_id, videosTable.id))
      .orderBy(desc(translationsTable.created_at))
      .execute();

    // Transform the joined results into the expected format
    return results.map(result => ({
      id: result.translations.id,
      video_id: result.translations.video_id,
      target_language: result.translations.target_language,
      status: result.translations.status,
      translated_audio_path: result.translations.translated_audio_path,
      transcript_original: result.translations.transcript_original,
      transcript_translated: result.translations.transcript_translated,
      progress_percentage: result.translations.progress_percentage,
      error_message: result.translations.error_message,
      started_at: result.translations.started_at,
      completed_at: result.translations.completed_at,
      created_at: result.translations.created_at,
      updated_at: result.translations.updated_at,
      video: {
        id: result.videos.id,
        filename: result.videos.filename,
        original_filename: result.videos.original_filename,
        file_path: result.videos.file_path,
        file_size: result.videos.file_size,
        duration: result.videos.duration,
        mime_type: result.videos.mime_type,
        original_language: result.videos.original_language,
        uploaded_at: result.videos.uploaded_at,
        updated_at: result.videos.updated_at
      }
    }));
  } catch (error) {
    console.error('Failed to get all translations:', error);
    throw error;
  }
}