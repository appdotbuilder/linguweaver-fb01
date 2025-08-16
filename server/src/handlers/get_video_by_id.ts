import { db } from '../db';
import { videosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetVideoByIdInput, type Video } from '../schema';

export async function getVideoById(input: GetVideoByIdInput): Promise<Video | null> {
  try {
    const results = await db.select()
      .from(videosTable)
      .where(eq(videosTable.id, input.video_id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const video = results[0];
    
    // Convert any numeric fields if needed (duration is real type)
    return {
      ...video,
      // duration is already a number from real type, no conversion needed
      duration: video.duration
    };
  } catch (error) {
    console.error('Video retrieval failed:', error);
    throw error;
  }
}