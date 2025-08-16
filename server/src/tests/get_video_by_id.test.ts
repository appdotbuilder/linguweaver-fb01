import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videosTable } from '../db/schema';
import { type GetVideoByIdInput, type UploadVideoInput } from '../schema';
import { getVideoById } from '../handlers/get_video_by_id';

// Test input for creating a video
const testVideoInput: UploadVideoInput = {
  filename: 'test-video.mp4',
  original_filename: 'original-test-video.mp4',
  file_path: '/uploads/test-video.mp4',
  file_size: 5000000,
  duration: 180.5,
  mime_type: 'video/mp4',
  original_language: 'en'
};

describe('getVideoById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return video when it exists', async () => {
    // Create a test video first
    const insertResult = await db.insert(videosTable)
      .values({
        filename: testVideoInput.filename,
        original_filename: testVideoInput.original_filename,
        file_path: testVideoInput.file_path,
        file_size: testVideoInput.file_size,
        duration: testVideoInput.duration,
        mime_type: testVideoInput.mime_type,
        original_language: testVideoInput.original_language
      })
      .returning()
      .execute();

    const createdVideo = insertResult[0];
    
    const input: GetVideoByIdInput = {
      video_id: createdVideo.id
    };

    const result = await getVideoById(input);

    // Verify the video is returned with correct properties
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdVideo.id);
    expect(result!.filename).toEqual('test-video.mp4');
    expect(result!.original_filename).toEqual('original-test-video.mp4');
    expect(result!.file_path).toEqual('/uploads/test-video.mp4');
    expect(result!.file_size).toEqual(5000000);
    expect(result!.duration).toEqual(180.5);
    expect(result!.mime_type).toEqual('video/mp4');
    expect(result!.original_language).toEqual('en');
    expect(result!.uploaded_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when video does not exist', async () => {
    const input: GetVideoByIdInput = {
      video_id: 99999 // Non-existent ID
    };

    const result = await getVideoById(input);

    expect(result).toBeNull();
  });

  it('should handle video with null duration', async () => {
    // Create a video with null duration
    const insertResult = await db.insert(videosTable)
      .values({
        filename: 'no-duration.mp4',
        original_filename: 'original-no-duration.mp4',
        file_path: '/uploads/no-duration.mp4',
        file_size: 1000000,
        duration: null, // null duration
        mime_type: 'video/mp4',
        original_language: 'es'
      })
      .returning()
      .execute();

    const createdVideo = insertResult[0];
    
    const input: GetVideoByIdInput = {
      video_id: createdVideo.id
    };

    const result = await getVideoById(input);

    expect(result).not.toBeNull();
    expect(result!.duration).toBeNull();
    expect(result!.original_language).toEqual('es');
  });

  it('should handle video with null original_language', async () => {
    // Create a video with null original_language
    const insertResult = await db.insert(videosTable)
      .values({
        filename: 'unknown-lang.mp4',
        original_filename: 'original-unknown-lang.mp4',
        file_path: '/uploads/unknown-lang.mp4',
        file_size: 2000000,
        duration: 60.0,
        mime_type: 'video/mp4',
        original_language: null // null language
      })
      .returning()
      .execute();

    const createdVideo = insertResult[0];
    
    const input: GetVideoByIdInput = {
      video_id: createdVideo.id
    };

    const result = await getVideoById(input);

    expect(result).not.toBeNull();
    expect(result!.original_language).toBeNull();
    expect(result!.duration).toEqual(60.0);
  });

  it('should verify correct return type structure', async () => {
    // Create a test video
    const insertResult = await db.insert(videosTable)
      .values({
        filename: 'type-test.mp4',
        original_filename: 'original-type-test.mp4',
        file_path: '/uploads/type-test.mp4',
        file_size: 1500000,
        duration: 90.25,
        mime_type: 'video/mp4',
        original_language: 'fr'
      })
      .returning()
      .execute();

    const createdVideo = insertResult[0];
    
    const input: GetVideoByIdInput = {
      video_id: createdVideo.id
    };

    const result = await getVideoById(input);

    // Verify all required properties exist and have correct types
    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.filename).toBe('string');
    expect(typeof result!.original_filename).toBe('string');
    expect(typeof result!.file_path).toBe('string');
    expect(typeof result!.file_size).toBe('number');
    expect(typeof result!.duration).toBe('number');
    expect(typeof result!.mime_type).toBe('string');
    expect(typeof result!.original_language).toBe('string');
    expect(result!.uploaded_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});