import { db } from '../db';
import { videosTable } from '../db/schema';
import { type UploadVideoInput, type Video } from '../schema';

export const uploadVideo = async (input: UploadVideoInput): Promise<Video> => {
  try {
    // Insert video record
    const result = await db.insert(videosTable)
      .values({
        filename: input.filename,
        original_filename: input.original_filename,
        file_path: input.file_path,
        file_size: input.file_size,
        duration: input.duration,
        mime_type: input.mime_type,
        original_language: input.original_language
      })
      .returning()
      .execute();

    // Return the created video record
    const video = result[0];
    return video;
  } catch (error) {
    console.error('Video upload failed:', error);
    throw error;
  }
};