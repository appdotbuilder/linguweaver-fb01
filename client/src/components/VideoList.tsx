import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Video, Translation, SupportedLanguage } from '../../../server/src/schema';

interface VideoListProps {
  videos: Video[];
  isLoading: boolean;
  onTranslationCreated: (translation: Translation) => void;
  onRefresh: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
] as const;

export function VideoList({ videos, isLoading, onTranslationCreated, onRefresh }: VideoListProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage | ''>('');
  const [videoTranslations, setVideoTranslations] = useState<Translation[]>([]);
  const [isCreatingTranslation, setIsCreatingTranslation] = useState(false);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLanguageDisplay = (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoSelect = async (video: Video) => {
    setSelectedVideo(video);
    setTargetLanguage('');
    setError(null);
    setIsLoadingTranslations(true);

    try {
      const translations = await trpc.getTranslationsByVideo.query({ video_id: video.id });
      setVideoTranslations(translations);
    } catch (error: any) {
      console.error('Failed to load translations:', error);
      setVideoTranslations([]);
    } finally {
      setIsLoadingTranslations(false);
    }
  };

  const handleCreateTranslation = async () => {
    if (!selectedVideo || !targetLanguage) return;

    setIsCreatingTranslation(true);
    setError(null);

    try {
      const translation = await trpc.createTranslation.mutate({
        video_id: selectedVideo.id,
        target_language: targetLanguage
      });

      onTranslationCreated(translation);
      setVideoTranslations((prev: Translation[]) => [translation, ...prev]);
      setTargetLanguage('');

    } catch (error: any) {
      setError(error.message || 'Failed to create translation');
    } finally {
      setIsCreatingTranslation(false);
    }
  };

  const getUsedLanguages = () => {
    return videoTranslations.map(t => t.target_language);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">My Videos</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your uploaded videos and create translations
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh}>
          🔄 Refresh
        </Button>
      </div>

      {videos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-lg font-medium mb-2">No videos yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upload your first video to get started with translations
            </p>
            <Button variant="outline">
              Go to Upload
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {videos.map((video: Video) => (
            <Card key={video.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      🎬 {video.original_filename}
                      {video.original_language && (
                        <Badge variant="outline" className="text-xs">
                          {getLanguageDisplay(video.original_language)}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span>📁 {formatFileSize(video.file_size)}</span>
                      <span>⏱️ {formatDuration(video.duration)}</span>
                      <span>📅 {video.uploaded_at.toLocaleDateString()}</span>
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVideoSelect(video)}
                      >
                        🌍 Translate
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Translation</DialogTitle>
                        <DialogDescription>
                          Create a new translation for "{video.original_filename}"
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        {/* Existing translations */}
                        {isLoadingTranslations ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        ) : videoTranslations.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Existing Translations:</label>
                            <div className="flex flex-wrap gap-2">
                              {videoTranslations.map((translation: Translation) => (
                                <Badge 
                                  key={translation.id} 
                                  variant={translation.status === 'completed' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {getLanguageDisplay(translation.target_language)}
                                  {translation.status === 'processing' && (
                                    <div className="ml-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                  )}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* New translation selection */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Select Target Language:</label>
                          <Select value={targetLanguage} onValueChange={(value: SupportedLanguage) => setTargetLanguage(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a language" />
                            </SelectTrigger>
                            <SelectContent>
                              {SUPPORTED_LANGUAGES
                                .filter(lang => !getUsedLanguages().includes(lang.code as SupportedLanguage))
                                .map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                  {getLanguageDisplay(lang.code)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <DialogFooter>
                        <Button
                          onClick={handleCreateTranslation}
                          disabled={!targetLanguage || isCreatingTranslation}
                          className="w-full"
                        >
                          {isCreatingTranslation ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating Translation...
                            </span>
                          ) : (
                            `🚀 Start Translation${targetLanguage ? ` to ${getLanguageDisplay(targetLanguage)}` : ''}`
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}