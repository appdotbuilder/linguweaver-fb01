import { db } from '../db';
import { translationsTable } from '../db/schema';
import { type GetTranslationsByVideoInput, type Translation } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getTranslationsByVideo(input: GetTranslationsByVideoInput): Promise<Translation[]> {
  try {
    // Query translations table for all records matching the video_id
    // Order by created_at descending (newest first)
    const results = await db.select()
      .from(translationsTable)
      .where(eq(translationsTable.video_id, input.video_id))
      .orderBy(desc(translationsTable.created_at))
      .execute();

    // Convert numeric fields from string to number
    return results.map(translation => ({
      ...translation,
      progress_percentage: translation.progress_percentage // Integer field - no conversion needed
    }));
  } catch (error) {
    console.error('Failed to fetch translations by video:', error);
    throw error;
  }
}