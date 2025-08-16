import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videosTable, translationsTable } from '../db/schema';
import { type UpdateTranslationProgressInput } from '../schema';
import { updateTranslationProgress } from '../handlers/update_translation_progress';
import { eq } from 'drizzle-orm';

describe('updateTranslationProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testVideoId: number;
  let testTranslationId: number;

  beforeEach(async () => {
    // Create test video first
    const videoResult = await db.insert(videosTable)
      .values({
        filename: 'test-video.mp4',
        original_filename: 'original-test.mp4',
        file_path: '/uploads/test-video.mp4',
        file_size: 1024000,
        duration: 120.5,
        mime_type: 'video/mp4',
        original_language: 'en'
      })
      .returning()
      .execute();
    
    testVideoId = videoResult[0].id;

    // Create test translation
    const translationResult = await db.insert(translationsTable)
      .values({
        video_id: testVideoId,
        target_language: 'es',
        status: 'pending',
        progress_percentage: 0
      })
      .returning()
      .execute();
    
    testTranslationId = translationResult[0].id;
  });

  it('should update translation status', async () => {
    const input: UpdateTranslationProgressInput = {
      translation_id: testTranslationId,
      status: 'processing'
    };

    const result = await updateTranslationProgress(input);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('processing');
    expect(result!.id).toEqual(testTranslationId);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update progress percentage', async () => {
    const input: UpdateTranslationProgressInput = {
      translation_id: testTranslationId,
      progress_percentage: 75
    };

    const result = await updateTranslationProgress(input);

    expect(result).not.toBeNull();
    expect(result!.progress_percentage).toEqual(75);
    expect(result!.status).toEqual('pending'); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    const now = new Date();
    const input: UpdateTranslationProgressInput = {
      translation_id: testTranslationId,
      status: 'processing',
      progress_percentage: 50,
      started_at: now,
      transcript_original: 'Hello world',
      transcript_translated: 'Hola mundo'
    };

    const result = await updateTranslationProgress(input);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('processing');
    expect(result!.progress_percentage).toEqual(50);
    expect(result!.started_at).toEqual(now);
    expect(result!.transcript_original).toEqual('Hello world');
    expect(result!.transcript_translated).toEqual('Hola mundo');
  });

  it('should update translation to completed status', async () => {
    const completedAt = new Date();
    const input: UpdateTranslationProgressInput = {
      translation_id: testTranslationId,
      status: 'completed',
      progress_percentage: 100,
      completed_at: completedAt,
      translated_audio_path: '/outputs/translated-audio.mp3',
      transcript_original: 'Original transcript',
      transcript_translated: 'Transcripción traducida'
    };

    const result = await updateTranslationProgress(input);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('completed');
    expect(result!.progress_percentage).toEqual(100);
    expect(result!.completed_at).toEqual(completedAt);
    expect(result!.translated_audio_path).toEqual('/outputs/translated-audio.mp3');
    expect(result!.transcript_original).toEqual('Original transcript');
    expect(result!.transcript_translated).toEqual('Transcripción traducida');
  });

  it('should update translation to failed status with error message', async () => {
    const input: UpdateTranslationProgressInput = {
      translation_id: testTranslationId,
      status: 'failed',
      error_message: 'Translation service unavailable',
      progress_percentage: 25
    };

    const result = await updateTranslationProgress(input);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('failed');
    expect(result!.error_message).toEqual('Translation service unavailable');
    expect(result!.progress_percentage).toEqual(25);
  });

  it('should set nullable fields to null', async () => {
    // First set some values
    await updateTranslationProgress({
      translation_id: testTranslationId,
      transcript_original: 'Some text',
      error_message: 'Some error'
    });

    // Then set them to null
    const input: UpdateTranslationProgressInput = {
      translation_id: testTranslationId,
      transcript_original: null,
      error_message: null
    };

    const result = await updateTranslationProgress(input);

    expect(result).not.toBeNull();
    expect(result!.transcript_original).toBeNull();
    expect(result!.error_message).toBeNull();
  });

  it('should save changes to database', async () => {
    const input: UpdateTranslationProgressInput = {
      translation_id: testTranslationId,
      status: 'processing',
      progress_percentage: 60,
      transcript_original: 'Database test'
    };

    await updateTranslationProgress(input);

    // Verify changes were persisted
    const translations = await db.select()
      .from(translationsTable)
      .where(eq(translationsTable.id, testTranslationId))
      .execute();

    expect(translations).toHaveLength(1);
    expect(translations[0].status).toEqual('processing');
    expect(translations[0].progress_percentage).toEqual(60);
    expect(translations[0].transcript_original).toEqual('Database test');
    expect(translations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent translation', async () => {
    const input: UpdateTranslationProgressInput = {
      translation_id: 99999, // Non-existent ID
      status: 'processing'
    };

    const result = await updateTranslationProgress(input);

    expect(result).toBeNull();
  });

  it('should not update fields that are not provided', async () => {
    // First, set some initial values
    await updateTranslationProgress({
      translation_id: testTranslationId,
      status: 'processing',
      progress_percentage: 30,
      transcript_original: 'Initial text'
    });

    // Then update only one field
    const input: UpdateTranslationProgressInput = {
      translation_id: testTranslationId,
      progress_percentage: 50
    };

    const result = await updateTranslationProgress(input);

    expect(result).not.toBeNull();
    expect(result!.progress_percentage).toEqual(50); // Updated
    expect(result!.status).toEqual('processing'); // Unchanged
    expect(result!.transcript_original).toEqual('Initial text'); // Unchanged
  });

  it('should always update the updated_at timestamp', async () => {
    const before = new Date();
    
    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const input: UpdateTranslationProgressInput = {
      translation_id: testTranslationId,
      progress_percentage: 25
    };

    const result = await updateTranslationProgress(input);

    expect(result).not.toBeNull();
    expect(result!.updated_at.getTime()).toBeGreaterThan(before.getTime());
  });
});