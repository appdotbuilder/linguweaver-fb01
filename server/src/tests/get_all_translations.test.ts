import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videosTable, translationsTable } from '../db/schema';
import { getAllTranslations } from '../handlers/get_all_translations';

// Test data for videos
const testVideo1 = {
  filename: 'video1.mp4',
  original_filename: 'Original Video 1.mp4',
  file_path: '/uploads/video1.mp4',
  file_size: 1024000,
  duration: 120.5,
  mime_type: 'video/mp4',
  original_language: 'en' as const
};

const testVideo2 = {
  filename: 'video2.mp4',
  original_filename: 'Original Video 2.mp4',
  file_path: '/uploads/video2.mp4',
  file_size: 2048000,
  duration: 240.0,
  mime_type: 'video/mp4',
  original_language: 'es' as const
};

describe('getAllTranslations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no translations exist', async () => {
    const result = await getAllTranslations();
    expect(result).toEqual([]);
  });

  it('should return all translations with video details', async () => {
    // Create test videos
    const videos = await db.insert(videosTable)
      .values([testVideo1, testVideo2])
      .returning()
      .execute();

    // Create test translations
    const translation1 = {
      video_id: videos[0].id,
      target_language: 'fr' as const,
      status: 'completed' as const,
      translated_audio_path: '/translated/video1_fr.mp3',
      transcript_original: 'Original transcript 1',
      transcript_translated: 'Transcription traduite 1',
      progress_percentage: 100,
      error_message: null,
      started_at: new Date('2024-01-01T10:00:00Z'),
      completed_at: new Date('2024-01-01T10:05:00Z')
    };

    const translation2 = {
      video_id: videos[1].id,
      target_language: 'de' as const,
      status: 'processing' as const,
      translated_audio_path: null,
      transcript_original: 'Original transcript 2',
      transcript_translated: null,
      progress_percentage: 50,
      error_message: null,
      started_at: new Date('2024-01-01T11:00:00Z'),
      completed_at: null
    };

    await db.insert(translationsTable)
      .values([translation1, translation2])
      .execute();

    const result = await getAllTranslations();

    expect(result).toHaveLength(2);

    // Verify the structure includes both translation and video data
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('video_id');
    expect(result[0]).toHaveProperty('target_language');
    expect(result[0]).toHaveProperty('status');
    expect(result[0]).toHaveProperty('video');
    expect(result[0].video).toHaveProperty('id');
    expect(result[0].video).toHaveProperty('filename');
    expect(result[0].video).toHaveProperty('original_filename');

    // Verify all translation fields are present
    const translation = result[0];
    expect(translation.video_id).toBeDefined();
    expect(translation.target_language).toBeDefined();
    expect(translation.status).toBeDefined();
    expect(translation.progress_percentage).toBeTypeOf('number');
    expect(translation.created_at).toBeInstanceOf(Date);
    expect(translation.updated_at).toBeInstanceOf(Date);

    // Verify all video fields are present
    const video = translation.video;
    expect(video.filename).toBeDefined();
    expect(video.original_filename).toBeDefined();
    expect(video.file_path).toBeDefined();
    expect(video.file_size).toBeTypeOf('number');
    expect(video.mime_type).toBeDefined();
    expect(video.uploaded_at).toBeInstanceOf(Date);
    expect(video.updated_at).toBeInstanceOf(Date);
  });

  it('should order translations by created_at descending (newest first)', async () => {
    // Create test video
    const video = await db.insert(videosTable)
      .values(testVideo1)
      .returning()
      .execute();

    // Create multiple translations with different creation times
    // We'll insert them in a specific order to test the sorting
    const translation1 = {
      video_id: video[0].id,
      target_language: 'fr' as const,
      status: 'completed' as const
    };

    const translation2 = {
      video_id: video[0].id,
      target_language: 'de' as const,
      status: 'processing' as const
    };

    const translation3 = {
      video_id: video[0].id,
      target_language: 'it' as const,
      status: 'pending' as const
    };

    // Insert translations one by one with slight delays to ensure different timestamps
    const firstTranslation = await db.insert(translationsTable)
      .values(translation1)
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondTranslation = await db.insert(translationsTable)
      .values(translation2)
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdTranslation = await db.insert(translationsTable)
      .values(translation3)
      .returning()
      .execute();

    const result = await getAllTranslations();

    expect(result).toHaveLength(3);

    // Verify they are ordered by created_at descending (newest first)
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);

    // Verify the most recently created translation is first
    expect(result[0].id).toBe(thirdTranslation[0].id);
    expect(result[0].target_language).toBe('it');
  });

  it('should handle translations with various status values', async () => {
    // Create test video
    const video = await db.insert(videosTable)
      .values(testVideo1)
      .returning()
      .execute();

    // Create translations with all possible status values
    const translations = [
      {
        video_id: video[0].id,
        target_language: 'fr' as const,
        status: 'pending' as const,
        progress_percentage: 0
      },
      {
        video_id: video[0].id,
        target_language: 'de' as const,
        status: 'processing' as const,
        progress_percentage: 50
      },
      {
        video_id: video[0].id,
        target_language: 'it' as const,
        status: 'completed' as const,
        progress_percentage: 100
      },
      {
        video_id: video[0].id,
        target_language: 'pt' as const,
        status: 'failed' as const,
        progress_percentage: 25,
        error_message: 'Translation failed due to audio quality'
      }
    ];

    await db.insert(translationsTable)
      .values(translations)
      .execute();

    const result = await getAllTranslations();

    expect(result).toHaveLength(4);

    // Verify all status types are handled correctly
    const statuses = result.map(t => t.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('processing');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('failed');

    // Verify error message is properly included for failed translation
    const failedTranslation = result.find(t => t.status === 'failed');
    expect(failedTranslation?.error_message).toBe('Translation failed due to audio quality');
  });

  it('should handle translations with nullable fields correctly', async () => {
    // Create test video
    const video = await db.insert(videosTable)
      .values({
        ...testVideo1,
        duration: null, // Test nullable duration
        original_language: null // Test nullable original_language
      })
      .returning()
      .execute();

    // Create translation with nullable fields
    const translation = {
      video_id: video[0].id,
      target_language: 'fr' as const,
      status: 'pending' as const,
      translated_audio_path: null,
      transcript_original: null,
      transcript_translated: null,
      error_message: null,
      started_at: null,
      completed_at: null
    };

    await db.insert(translationsTable)
      .values(translation)
      .execute();

    const result = await getAllTranslations();

    expect(result).toHaveLength(1);

    // Verify nullable fields are handled correctly
    const resultTranslation = result[0];
    expect(resultTranslation.translated_audio_path).toBeNull();
    expect(resultTranslation.transcript_original).toBeNull();
    expect(resultTranslation.transcript_translated).toBeNull();
    expect(resultTranslation.error_message).toBeNull();
    expect(resultTranslation.started_at).toBeNull();
    expect(resultTranslation.completed_at).toBeNull();

    // Verify video nullable fields
    expect(resultTranslation.video.duration).toBeNull();
    expect(resultTranslation.video.original_language).toBeNull();
  });

  it('should handle multiple translations for the same video', async () => {
    // Create test video
    const video = await db.insert(videosTable)
      .values(testVideo1)
      .returning()
      .execute();

    // Create multiple translations for the same video
    const translations = [
      {
        video_id: video[0].id,
        target_language: 'fr' as const,
        status: 'completed' as const
      },
      {
        video_id: video[0].id,
        target_language: 'de' as const,
        status: 'processing' as const
      },
      {
        video_id: video[0].id,
        target_language: 'it' as const,
        status: 'pending' as const
      }
    ];

    await db.insert(translationsTable)
      .values(translations)
      .execute();

    const result = await getAllTranslations();

    expect(result).toHaveLength(3);

    // All translations should have the same video data
    expect(result[0].video.id).toBe(video[0].id);
    expect(result[1].video.id).toBe(video[0].id);
    expect(result[2].video.id).toBe(video[0].id);

    // But different target languages
    const languages = result.map(t => t.target_language);
    expect(languages).toContain('fr');
    expect(languages).toContain('de');
    expect(languages).toContain('it');
  });
});