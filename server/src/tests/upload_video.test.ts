import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videosTable } from '../db/schema';
import { type UploadVideoInput } from '../schema';
import { uploadVideo } from '../handlers/upload_video';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: UploadVideoInput = {
  filename: 'test-video.mp4',
  original_filename: 'Original Test Video.mp4',
  file_path: '/uploads/videos/test-video.mp4',
  file_size: 52428800, // 50MB in bytes
  duration: 120.5, // 2 minutes 30.5 seconds
  mime_type: 'video/mp4',
  original_language: 'en'
};

describe('uploadVideo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should upload a video with complete metadata', async () => {
    const result = await uploadVideo(testInput);

    // Basic field validation
    expect(result.filename).toEqual('test-video.mp4');
    expect(result.original_filename).toEqual('Original Test Video.mp4');
    expect(result.file_path).toEqual('/uploads/videos/test-video.mp4');
    expect(result.file_size).toEqual(52428800);
    expect(result.duration).toEqual(120.5);
    expect(result.mime_type).toEqual('video/mp4');
    expect(result.original_language).toEqual('en');
    expect(result.id).toBeDefined();
    expect(result.uploaded_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should upload a video with null duration', async () => {
    const inputWithNullDuration: UploadVideoInput = {
      ...testInput,
      duration: null
    };

    const result = await uploadVideo(inputWithNullDuration);

    expect(result.duration).toBeNull();
    expect(result.filename).toEqual('test-video.mp4');
    expect(result.id).toBeDefined();
    expect(result.uploaded_at).toBeInstanceOf(Date);
  });

  it('should upload a video with null original_language', async () => {
    const inputWithNullLanguage: UploadVideoInput = {
      ...testInput,
      original_language: null
    };

    const result = await uploadVideo(inputWithNullLanguage);

    expect(result.original_language).toBeNull();
    expect(result.filename).toEqual('test-video.mp4');
    expect(result.id).toBeDefined();
    expect(result.uploaded_at).toBeInstanceOf(Date);
  });

  it('should save video to database', async () => {
    const result = await uploadVideo(testInput);

    // Query database to verify the record was saved
    const videos = await db.select()
      .from(videosTable)
      .where(eq(videosTable.id, result.id))
      .execute();

    expect(videos).toHaveLength(1);
    const savedVideo = videos[0];
    
    expect(savedVideo.filename).toEqual('test-video.mp4');
    expect(savedVideo.original_filename).toEqual('Original Test Video.mp4');
    expect(savedVideo.file_path).toEqual('/uploads/videos/test-video.mp4');
    expect(savedVideo.file_size).toEqual(52428800);
    expect(savedVideo.duration).toEqual(120.5);
    expect(savedVideo.mime_type).toEqual('video/mp4');
    expect(savedVideo.original_language).toEqual('en');
    expect(savedVideo.uploaded_at).toBeInstanceOf(Date);
    expect(savedVideo.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different video formats', async () => {
    const aviInput: UploadVideoInput = {
      filename: 'test-video.avi',
      original_filename: 'Test Video.avi',
      file_path: '/uploads/videos/test-video.avi',
      file_size: 104857600, // 100MB
      duration: 300.0, // 5 minutes
      mime_type: 'video/x-msvideo',
      original_language: 'es'
    };

    const result = await uploadVideo(aviInput);

    expect(result.filename).toEqual('test-video.avi');
    expect(result.mime_type).toEqual('video/x-msvideo');
    expect(result.original_language).toEqual('es');
    expect(result.file_size).toEqual(104857600);
    expect(result.duration).toEqual(300.0);
  });

  it('should handle different supported languages', async () => {
    const languages: Array<'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'ko' | 'zh' | 'ar' | 'hi'> = 
      ['fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'];
    
    for (const lang of languages) {
      const input: UploadVideoInput = {
        ...testInput,
        filename: `video-${lang}.mp4`,
        original_language: lang
      };

      const result = await uploadVideo(input);
      
      expect(result.original_language).toEqual(lang);
      expect(result.filename).toEqual(`video-${lang}.mp4`);
    }
  });

  it('should auto-generate timestamps', async () => {
    const beforeUpload = new Date();
    const result = await uploadVideo(testInput);
    const afterUpload = new Date();

    expect(result.uploaded_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.uploaded_at.getTime()).toBeGreaterThanOrEqual(beforeUpload.getTime());
    expect(result.uploaded_at.getTime()).toBeLessThanOrEqual(afterUpload.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpload.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterUpload.getTime());
  });

  it('should handle large file sizes', async () => {
    const largeFileInput: UploadVideoInput = {
      ...testInput,
      file_size: 2147483647, // Max 32-bit integer
      filename: 'large-video.mp4'
    };

    const result = await uploadVideo(largeFileInput);

    expect(result.file_size).toEqual(2147483647);
    expect(result.filename).toEqual('large-video.mp4');
  });

  it('should handle very short durations', async () => {
    const shortVideoInput: UploadVideoInput = {
      ...testInput,
      duration: 0.1, // 100ms
      filename: 'short-video.mp4'
    };

    const result = await uploadVideo(shortVideoInput);

    expect(result.duration).toEqual(0.1);
    expect(result.filename).toEqual('short-video.mp4');
  });
});