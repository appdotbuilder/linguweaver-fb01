import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videosTable, translationsTable } from '../db/schema';
import { type GetTranslationsByVideoInput } from '../schema';
import { getTranslationsByVideo } from '../handlers/get_translations_by_video';

describe('getTranslationsByVideo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when video has no translations', async () => {
    // Create a video
    const videoResult = await db.insert(videosTable)
      .values({
        filename: 'test.mp4',
        original_filename: 'original.mp4',
        file_path: '/path/to/test.mp4',
        file_size: 1024000,
        duration: 120.5,
        mime_type: 'video/mp4',
        original_language: 'en'
      })
      .returning()
      .execute();

    const input: GetTranslationsByVideoInput = {
      video_id: videoResult[0].id
    };

    const result = await getTranslationsByVideo(input);

    expect(result).toEqual([]);
  });

  it('should return translations for a specific video', async () => {
    // Create a video
    const videoResult = await db.insert(videosTable)
      .values({
        filename: 'test.mp4',
        original_filename: 'original.mp4',
        file_path: '/path/to/test.mp4',
        file_size: 1024000,
        duration: 120.5,
        mime_type: 'video/mp4',
        original_language: 'en'
      })
      .returning()
      .execute();

    const videoId = videoResult[0].id;

    // Create translations
    const translationResults = await db.insert(translationsTable)
      .values([
        {
          video_id: videoId,
          target_language: 'es',
          status: 'completed',
          progress_percentage: 100,
          transcript_original: 'Hello world',
          transcript_translated: 'Hola mundo'
        },
        {
          video_id: videoId,
          target_language: 'fr',
          status: 'pending',
          progress_percentage: 0
        }
      ])
      .returning()
      .execute();

    const input: GetTranslationsByVideoInput = {
      video_id: videoId
    };

    const result = await getTranslationsByVideo(input);

    expect(result).toHaveLength(2);
    
    // Verify all translations belong to the correct video
    result.forEach(translation => {
      expect(translation.video_id).toEqual(videoId);
      expect(translation.id).toBeDefined();
      expect(translation.created_at).toBeInstanceOf(Date);
      expect(translation.updated_at).toBeInstanceOf(Date);
    });

    // Check specific translation details
    const spanishTranslation = result.find(t => t.target_language === 'es');
    expect(spanishTranslation).toBeDefined();
    expect(spanishTranslation!.status).toEqual('completed');
    expect(spanishTranslation!.progress_percentage).toEqual(100);
    expect(spanishTranslation!.transcript_original).toEqual('Hello world');
    expect(spanishTranslation!.transcript_translated).toEqual('Hola mundo');

    const frenchTranslation = result.find(t => t.target_language === 'fr');
    expect(frenchTranslation).toBeDefined();
    expect(frenchTranslation!.status).toEqual('pending');
    expect(frenchTranslation!.progress_percentage).toEqual(0);
  });

  it('should return translations ordered by created_at descending (newest first)', async () => {
    // Create a video
    const videoResult = await db.insert(videosTable)
      .values({
        filename: 'test.mp4',
        original_filename: 'original.mp4',
        file_path: '/path/to/test.mp4',
        file_size: 1024000,
        duration: 120.5,
        mime_type: 'video/mp4',
        original_language: 'en'
      })
      .returning()
      .execute();

    const videoId = videoResult[0].id;

    // Create multiple translations with a small delay to ensure different timestamps
    const firstTranslation = await db.insert(translationsTable)
      .values({
        video_id: videoId,
        target_language: 'es',
        status: 'pending'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondTranslation = await db.insert(translationsTable)
      .values({
        video_id: videoId,
        target_language: 'fr',
        status: 'processing'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdTranslation = await db.insert(translationsTable)
      .values({
        video_id: videoId,
        target_language: 'de',
        status: 'completed'
      })
      .returning()
      .execute();

    const input: GetTranslationsByVideoInput = {
      video_id: videoId
    };

    const result = await getTranslationsByVideo(input);

    expect(result).toHaveLength(3);

    // Verify order - newest first (created_at descending)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }

    // The German translation should be first (newest)
    expect(result[0].target_language).toEqual('de');
    // The Spanish translation should be last (oldest)
    expect(result[result.length - 1].target_language).toEqual('es');
  });

  it('should only return translations for the specified video', async () => {
    // Create two videos
    const video1Result = await db.insert(videosTable)
      .values({
        filename: 'video1.mp4',
        original_filename: 'original1.mp4',
        file_path: '/path/to/video1.mp4',
        file_size: 1024000,
        duration: 120.5,
        mime_type: 'video/mp4',
        original_language: 'en'
      })
      .returning()
      .execute();

    const video2Result = await db.insert(videosTable)
      .values({
        filename: 'video2.mp4',
        original_filename: 'original2.mp4',
        file_path: '/path/to/video2.mp4',
        file_size: 2048000,
        duration: 180.0,
        mime_type: 'video/mp4',
        original_language: 'es'
      })
      .returning()
      .execute();

    const video1Id = video1Result[0].id;
    const video2Id = video2Result[0].id;

    // Create translations for both videos
    await db.insert(translationsTable)
      .values([
        {
          video_id: video1Id,
          target_language: 'es',
          status: 'completed'
        },
        {
          video_id: video1Id,
          target_language: 'fr',
          status: 'pending'
        },
        {
          video_id: video2Id,
          target_language: 'en',
          status: 'processing'
        }
      ])
      .execute();

    const input: GetTranslationsByVideoInput = {
      video_id: video1Id
    };

    const result = await getTranslationsByVideo(input);

    expect(result).toHaveLength(2);
    
    // Verify all returned translations belong to video1
    result.forEach(translation => {
      expect(translation.video_id).toEqual(video1Id);
    });

    // Check that we have the expected languages for video1
    const languages = result.map(t => t.target_language).sort();
    expect(languages).toEqual(['es', 'fr']);
  });

  it('should return empty array for non-existent video', async () => {
    const input: GetTranslationsByVideoInput = {
      video_id: 999999 // Non-existent video ID
    };

    const result = await getTranslationsByVideo(input);

    expect(result).toEqual([]);
  });

  it('should handle translations with all nullable fields', async () => {
    // Create a video
    const videoResult = await db.insert(videosTable)
      .values({
        filename: 'test.mp4',
        original_filename: 'original.mp4',
        file_path: '/path/to/test.mp4',
        file_size: 1024000,
        mime_type: 'video/mp4'
        // All nullable fields left undefined
      })
      .returning()
      .execute();

    const videoId = videoResult[0].id;

    // Create a translation with minimal required fields
    await db.insert(translationsTable)
      .values({
        video_id: videoId,
        target_language: 'ja'
        // All optional/nullable fields will use defaults or remain null
      })
      .execute();

    const input: GetTranslationsByVideoInput = {
      video_id: videoId
    };

    const result = await getTranslationsByVideo(input);

    expect(result).toHaveLength(1);
    
    const translation = result[0];
    expect(translation.video_id).toEqual(videoId);
    expect(translation.target_language).toEqual('ja');
    expect(translation.status).toEqual('pending'); // Default value
    expect(translation.progress_percentage).toEqual(0); // Default value
    expect(translation.translated_audio_path).toBeNull();
    expect(translation.transcript_original).toBeNull();
    expect(translation.transcript_translated).toBeNull();
    expect(translation.error_message).toBeNull();
    expect(translation.started_at).toBeNull();
    expect(translation.completed_at).toBeNull();
    expect(translation.created_at).toBeInstanceOf(Date);
    expect(translation.updated_at).toBeInstanceOf(Date);
  });
});