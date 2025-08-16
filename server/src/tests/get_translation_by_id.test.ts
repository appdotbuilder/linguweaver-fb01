import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videosTable, translationsTable } from '../db/schema';
import { type GetTranslationByIdInput } from '../schema';
import { getTranslationById } from '../handlers/get_translation_by_id';

// Test input
const testInput: GetTranslationByIdInput = {
  translation_id: 1
};

describe('getTranslationById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return translation with video details when found', async () => {
    // Create a video first
    const videoResult = await db.insert(videosTable)
      .values({
        filename: 'test-video.mp4',
        original_filename: 'original-video.mp4',
        file_path: '/uploads/test-video.mp4',
        file_size: 1000000,
        duration: 120.5,
        mime_type: 'video/mp4',
        original_language: 'en'
      })
      .returning()
      .execute();

    const video = videoResult[0];

    // Create a translation
    const translationResult = await db.insert(translationsTable)
      .values({
        video_id: video.id,
        target_language: 'es',
        status: 'processing',
        translated_audio_path: '/audio/translated.mp3',
        transcript_original: 'Hello world',
        transcript_translated: 'Hola mundo',
        progress_percentage: 75,
        error_message: null,
        started_at: new Date(),
        completed_at: null
      })
      .returning()
      .execute();

    const translation = translationResult[0];

    // Test the handler
    const result = await getTranslationById({ translation_id: translation.id });

    // Verify translation fields
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(translation.id);
    expect(result!.video_id).toEqual(video.id);
    expect(result!.target_language).toEqual('es');
    expect(result!.status).toEqual('processing');
    expect(result!.translated_audio_path).toEqual('/audio/translated.mp3');
    expect(result!.transcript_original).toEqual('Hello world');
    expect(result!.transcript_translated).toEqual('Hola mundo');
    expect(result!.progress_percentage).toEqual(75);
    expect(result!.error_message).toBeNull();
    expect(result!.started_at).toBeInstanceOf(Date);
    expect(result!.completed_at).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify video fields
    expect(result!.video).toBeDefined();
    expect(result!.video.id).toEqual(video.id);
    expect(result!.video.filename).toEqual('test-video.mp4');
    expect(result!.video.original_filename).toEqual('original-video.mp4');
    expect(result!.video.file_path).toEqual('/uploads/test-video.mp4');
    expect(result!.video.file_size).toEqual(1000000);
    expect(result!.video.duration).toEqual(120.5);
    expect(result!.video.mime_type).toEqual('video/mp4');
    expect(result!.video.original_language).toEqual('en');
    expect(result!.video.uploaded_at).toBeInstanceOf(Date);
    expect(result!.video.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when translation not found', async () => {
    const result = await getTranslationById({ translation_id: 999 });

    expect(result).toBeNull();
  });

  it('should handle translation with minimal data', async () => {
    // Create a video first
    const videoResult = await db.insert(videosTable)
      .values({
        filename: 'minimal-video.mp4',
        original_filename: 'minimal-video.mp4',
        file_path: '/uploads/minimal-video.mp4',
        file_size: 500000,
        duration: null, // nullable field
        mime_type: 'video/mp4',
        original_language: null // nullable field
      })
      .returning()
      .execute();

    const video = videoResult[0];

    // Create a translation with minimal data (relying on defaults)
    const translationResult = await db.insert(translationsTable)
      .values({
        video_id: video.id,
        target_language: 'fr'
        // All other fields will use defaults or be null
      })
      .returning()
      .execute();

    const translation = translationResult[0];

    // Test the handler
    const result = await getTranslationById({ translation_id: translation.id });

    // Verify translation defaults were applied
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(translation.id);
    expect(result!.target_language).toEqual('fr');
    expect(result!.status).toEqual('pending'); // default value
    expect(result!.progress_percentage).toEqual(0); // default value
    expect(result!.translated_audio_path).toBeNull();
    expect(result!.transcript_original).toBeNull();
    expect(result!.transcript_translated).toBeNull();
    expect(result!.error_message).toBeNull();
    expect(result!.started_at).toBeNull();
    expect(result!.completed_at).toBeNull();

    // Verify video nullable fields
    expect(result!.video.duration).toBeNull();
    expect(result!.video.original_language).toBeNull();
  });

  it('should handle completed translation with all fields populated', async () => {
    // Create a video
    const videoResult = await db.insert(videosTable)
      .values({
        filename: 'complete-video.mp4',
        original_filename: 'complete-video.mp4',
        file_path: '/uploads/complete-video.mp4',
        file_size: 2000000,
        duration: 240.75,
        mime_type: 'video/mp4',
        original_language: 'en'
      })
      .returning()
      .execute();

    const video = videoResult[0];

    const startedAt = new Date();
    const completedAt = new Date(Date.now() + 60000); // 1 minute later

    // Create a completed translation
    const translationResult = await db.insert(translationsTable)
      .values({
        video_id: video.id,
        target_language: 'de',
        status: 'completed',
        translated_audio_path: '/audio/complete-translated.mp3',
        transcript_original: 'This is a complete test',
        transcript_translated: 'Das ist ein vollständiger Test',
        progress_percentage: 100,
        error_message: null,
        started_at: startedAt,
        completed_at: completedAt
      })
      .returning()
      .execute();

    const translation = translationResult[0];

    // Test the handler
    const result = await getTranslationById({ translation_id: translation.id });

    // Verify all fields are populated correctly
    expect(result).not.toBeNull();
    expect(result!.status).toEqual('completed');
    expect(result!.progress_percentage).toEqual(100);
    expect(result!.translated_audio_path).toEqual('/audio/complete-translated.mp3');
    expect(result!.transcript_original).toEqual('This is a complete test');
    expect(result!.transcript_translated).toEqual('Das ist ein vollständiger Test');
    expect(result!.started_at).toBeInstanceOf(Date);
    expect(result!.completed_at).toBeInstanceOf(Date);
    expect(result!.error_message).toBeNull();
  });

  it('should handle failed translation with error message', async () => {
    // Create a video
    const videoResult = await db.insert(videosTable)
      .values({
        filename: 'failed-video.mp4',
        original_filename: 'failed-video.mp4',
        file_path: '/uploads/failed-video.mp4',
        file_size: 800000,
        duration: 60.0,
        mime_type: 'video/mp4',
        original_language: 'en'
      })
      .returning()
      .execute();

    const video = videoResult[0];

    // Create a failed translation
    const translationResult = await db.insert(translationsTable)
      .values({
        video_id: video.id,
        target_language: 'ja',
        status: 'failed',
        translated_audio_path: null,
        transcript_original: 'Failed test content',
        transcript_translated: null,
        progress_percentage: 45,
        error_message: 'Audio processing failed due to unsupported format',
        started_at: new Date(),
        completed_at: null
      })
      .returning()
      .execute();

    const translation = translationResult[0];

    // Test the handler
    const result = await getTranslationById({ translation_id: translation.id });

    // Verify failed translation fields
    expect(result).not.toBeNull();
    expect(result!.status).toEqual('failed');
    expect(result!.progress_percentage).toEqual(45);
    expect(result!.error_message).toEqual('Audio processing failed due to unsupported format');
    expect(result!.translated_audio_path).toBeNull();
    expect(result!.transcript_translated).toBeNull();
    expect(result!.transcript_original).toEqual('Failed test content');
    expect(result!.completed_at).toBeNull();
  });
});