import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videosTable, translationsTable } from '../db/schema';
import { type CreateTranslationInput, type UploadVideoInput } from '../schema';
import { createTranslation } from '../handlers/create_translation';
import { eq, and } from 'drizzle-orm';

// Test video data
const testVideoInput: UploadVideoInput = {
  filename: 'test-video.mp4',
  original_filename: 'original-test-video.mp4',
  file_path: '/uploads/test-video.mp4',
  file_size: 1024000,
  duration: 120.5,
  mime_type: 'video/mp4',
  original_language: 'en'
};

// Test translation input
const testTranslationInput: CreateTranslationInput = {
  video_id: 1, // Will be set dynamically in tests
  target_language: 'es'
};

describe('createTranslation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a translation for an existing video', async () => {
    // First create a video
    const videoResult = await db.insert(videosTable)
      .values(testVideoInput)
      .returning()
      .execute();
    
    const video = videoResult[0];
    const translationInput = {
      ...testTranslationInput,
      video_id: video.id
    };

    // Create translation
    const result = await createTranslation(translationInput);

    // Verify returned translation object
    expect(result.video_id).toEqual(video.id);
    expect(result.target_language).toEqual('es');
    expect(result.status).toEqual('pending');
    expect(result.progress_percentage).toEqual(0);
    expect(result.translated_audio_path).toBeNull();
    expect(result.transcript_original).toBeNull();
    expect(result.transcript_translated).toBeNull();
    expect(result.error_message).toBeNull();
    expect(result.started_at).toBeNull();
    expect(result.completed_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save translation to database correctly', async () => {
    // Create a video first
    const videoResult = await db.insert(videosTable)
      .values(testVideoInput)
      .returning()
      .execute();
    
    const video = videoResult[0];
    const translationInput = {
      ...testTranslationInput,
      video_id: video.id
    };

    // Create translation
    const result = await createTranslation(translationInput);

    // Query database to verify translation was saved
    const translations = await db.select()
      .from(translationsTable)
      .where(eq(translationsTable.id, result.id))
      .execute();

    expect(translations).toHaveLength(1);
    const savedTranslation = translations[0];
    expect(savedTranslation.video_id).toEqual(video.id);
    expect(savedTranslation.target_language).toEqual('es');
    expect(savedTranslation.status).toEqual('pending');
    expect(savedTranslation.progress_percentage).toEqual(0);
    expect(savedTranslation.created_at).toBeInstanceOf(Date);
    expect(savedTranslation.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when video does not exist', async () => {
    const translationInput = {
      video_id: 999, // Non-existent video ID
      target_language: 'es' as const
    };

    await expect(createTranslation(translationInput))
      .rejects.toThrow(/video with id 999 not found/i);
  });

  it('should throw error when translation already exists for the same language', async () => {
    // Create a video first
    const videoResult = await db.insert(videosTable)
      .values(testVideoInput)
      .returning()
      .execute();
    
    const video = videoResult[0];
    const translationInput = {
      ...testTranslationInput,
      video_id: video.id
    };

    // Create first translation
    await createTranslation(translationInput);

    // Try to create another translation for the same language
    await expect(createTranslation(translationInput))
      .rejects.toThrow(/translation to es already exists for video/i);
  });

  it('should allow creating translations for different target languages', async () => {
    // Create a video first
    const videoResult = await db.insert(videosTable)
      .values(testVideoInput)
      .returning()
      .execute();
    
    const video = videoResult[0];

    // Create translation for Spanish
    const spanishTranslation = await createTranslation({
      video_id: video.id,
      target_language: 'es'
    });

    // Create translation for French
    const frenchTranslation = await createTranslation({
      video_id: video.id,
      target_language: 'fr'
    });

    expect(spanishTranslation.target_language).toEqual('es');
    expect(frenchTranslation.target_language).toEqual('fr');
    expect(spanishTranslation.id).not.toEqual(frenchTranslation.id);

    // Verify both translations exist in database
    const allTranslations = await db.select()
      .from(translationsTable)
      .where(eq(translationsTable.video_id, video.id))
      .execute();

    expect(allTranslations).toHaveLength(2);
    expect(allTranslations.map(t => t.target_language)).toContain('es');
    expect(allTranslations.map(t => t.target_language)).toContain('fr');
  });

  it('should handle database constraints correctly', async () => {
    // Create a video first
    const videoResult = await db.insert(videosTable)
      .values(testVideoInput)
      .returning()
      .execute();
    
    const video = videoResult[0];

    // Create a translation manually to test constraint
    await db.insert(translationsTable)
      .values({
        video_id: video.id,
        target_language: 'de',
        status: 'completed',
        progress_percentage: 100
      })
      .execute();

    // Try to create another translation with same video_id and target_language
    const duplicateInput = {
      video_id: video.id,
      target_language: 'de' as const
    };

    await expect(createTranslation(duplicateInput))
      .rejects.toThrow(/translation to de already exists for video/i);
  });

  it('should create translation with all supported languages', async () => {
    // Create a video first
    const videoResult = await db.insert(videosTable)
      .values(testVideoInput)
      .returning()
      .execute();
    
    const video = videoResult[0];

    // Test creating translations for various supported languages
    const supportedLanguages = ['es', 'fr', 'de', 'it', 'pt', 'ru', 'ja'] as const;
    
    for (const language of supportedLanguages) {
      const result = await createTranslation({
        video_id: video.id,
        target_language: language
      });

      expect(result.target_language).toEqual(language);
      expect(result.video_id).toEqual(video.id);
      expect(result.status).toEqual('pending');
    }

    // Verify all translations were created
    const allTranslations = await db.select()
      .from(translationsTable)
      .where(eq(translationsTable.video_id, video.id))
      .execute();

    expect(allTranslations).toHaveLength(supportedLanguages.length);
  });
});