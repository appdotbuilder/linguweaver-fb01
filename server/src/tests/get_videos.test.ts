import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videosTable } from '../db/schema';
import { getVideos } from '../handlers/get_videos';

// Test video data
const testVideo1 = {
  filename: 'test1.mp4',
  original_filename: 'original_test1.mp4',
  file_path: '/uploads/test1.mp4',
  file_size: 1024000,
  duration: 120.5,
  mime_type: 'video/mp4',
  original_language: 'en' as const
};

const testVideo2 = {
  filename: 'test2.mov',
  original_filename: 'original_test2.mov',
  file_path: '/uploads/test2.mov',
  file_size: 2048000,
  duration: null,
  mime_type: 'video/quicktime',
  original_language: null
};

const testVideo3 = {
  filename: 'test3.avi',
  original_filename: 'original_test3.avi',
  file_path: '/uploads/test3.avi',
  file_size: 512000,
  duration: 45.75,
  mime_type: 'video/avi',
  original_language: 'es' as const
};

describe('getVideos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no videos exist', async () => {
    const result = await getVideos();
    expect(result).toEqual([]);
  });

  it('should fetch single video correctly', async () => {
    // Insert test video
    await db.insert(videosTable)
      .values(testVideo1)
      .execute();

    const result = await getVideos();

    expect(result).toHaveLength(1);
    expect(result[0].filename).toEqual('test1.mp4');
    expect(result[0].original_filename).toEqual('original_test1.mp4');
    expect(result[0].file_path).toEqual('/uploads/test1.mp4');
    expect(result[0].file_size).toEqual(1024000);
    expect(result[0].duration).toEqual(120.5);
    expect(typeof result[0].duration).toEqual('number');
    expect(result[0].mime_type).toEqual('video/mp4');
    expect(result[0].original_language).toEqual('en');
    expect(result[0].id).toBeDefined();
    expect(result[0].uploaded_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null duration correctly', async () => {
    // Insert video with null duration
    await db.insert(videosTable)
      .values(testVideo2)
      .execute();

    const result = await getVideos();

    expect(result).toHaveLength(1);
    expect(result[0].duration).toBeNull();
    expect(result[0].original_language).toBeNull();
  });

  it('should fetch multiple videos ordered by uploaded_at desc', async () => {
    // Insert videos with slight delay to ensure different timestamps
    await db.insert(videosTable)
      .values(testVideo1)
      .execute();

    // Wait a moment to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(videosTable)
      .values(testVideo2)
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(videosTable)
      .values(testVideo3)
      .execute();

    const result = await getVideos();

    expect(result).toHaveLength(3);
    
    // Should be ordered by uploaded_at desc (newest first)
    expect(result[0].filename).toEqual('test3.avi');
    expect(result[1].filename).toEqual('test2.mov');
    expect(result[2].filename).toEqual('test1.mp4');

    // Verify timestamps are in descending order
    expect(result[0].uploaded_at >= result[1].uploaded_at).toBe(true);
    expect(result[1].uploaded_at >= result[2].uploaded_at).toBe(true);
  });

  it('should convert numeric duration values correctly', async () => {
    // Insert videos with various duration formats
    await db.insert(videosTable)
      .values([
        testVideo1,
        testVideo3
      ])
      .execute();

    const result = await getVideos();

    expect(result).toHaveLength(2);
    
    // Find videos by filename to avoid order dependency
    const video1 = result.find(v => v.filename === 'test1.mp4');
    const video3 = result.find(v => v.filename === 'test3.avi');

    expect(video1?.duration).toEqual(120.5);
    expect(typeof video1?.duration).toEqual('number');
    expect(video3?.duration).toEqual(45.75);
    expect(typeof video3?.duration).toEqual('number');
  });

  it('should handle mixed duration values (null and numeric)', async () => {
    // Insert videos with mixed duration types
    await db.insert(videosTable)
      .values([
        testVideo2, // null duration
        testVideo1 // numeric duration
      ])
      .execute();

    const result = await getVideos();

    expect(result).toHaveLength(2);
    
    const videoWithNullDuration = result.find(v => v.filename === 'test2.mov');
    const videoWithDuration = result.find(v => v.filename === 'test1.mp4');

    expect(videoWithNullDuration?.duration).toBeNull();
    expect(videoWithDuration?.duration).toEqual(120.5);
    expect(typeof videoWithDuration?.duration).toEqual('number');
  });

  it('should preserve all video properties', async () => {
    await db.insert(videosTable)
      .values(testVideo1)
      .execute();

    const result = await getVideos();
    const video = result[0];

    // Check all required properties are present
    expect(video).toHaveProperty('id');
    expect(video).toHaveProperty('filename');
    expect(video).toHaveProperty('original_filename');
    expect(video).toHaveProperty('file_path');
    expect(video).toHaveProperty('file_size');
    expect(video).toHaveProperty('duration');
    expect(video).toHaveProperty('mime_type');
    expect(video).toHaveProperty('original_language');
    expect(video).toHaveProperty('uploaded_at');
    expect(video).toHaveProperty('updated_at');

    // Verify correct types
    expect(typeof video.id).toEqual('number');
    expect(typeof video.filename).toEqual('string');
    expect(typeof video.original_filename).toEqual('string');
    expect(typeof video.file_path).toEqual('string');
    expect(typeof video.file_size).toEqual('number');
    expect(typeof video.mime_type).toEqual('string');
    expect(video.uploaded_at).toBeInstanceOf(Date);
    expect(video.updated_at).toBeInstanceOf(Date);
  });
});