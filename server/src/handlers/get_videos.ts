import { db } from '../db';
import { videosTable } from '../db/schema';
import { type Video } from '../schema';
import { desc } from 'drizzle-orm';

export async function getVideos(): Promise<Video[]> {
  try {
    // Query all videos ordered by uploaded_at (newest first)
    const results = await db.select()
      .from(videosTable)
      .orderBy(desc(videosTable.uploaded_at))
      .execute();

    // Return results - duration is already a number from real column type
    return results;
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    throw error;
  }
}