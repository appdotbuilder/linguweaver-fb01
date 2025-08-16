import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import type { Translation, TranslationWithVideo } from '../../../server/src/schema';

interface TranslationListProps {
  translations: Translation[];
  isLoading: boolean;
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

export function TranslationList({ translations, isLoading, onRefresh }: TranslationListProps) {
  const [selectedTranslation, setSelectedTranslation] = useState<TranslationWithVideo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const getLanguageDisplay = (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', color: 'bg-yellow-500', icon: '⏳' };
      case 'processing':
        return { text: 'Processing', color: 'bg-blue-500', icon: '⚡' };
      case 'completed':
        return { text: 'Completed', color: 'bg-green-500', icon: '✅' };
      case 'failed':
        return { text: 'Failed', color: 'bg-red-500', icon: '❌' };
      default:
        return { text: status, color: 'bg-gray-500', icon: '❓' };
    }
  };

  const handleViewDetails = async (translation: Translation) => {
    setIsLoadingDetails(true);
    try {
      const details = await trpc.getTranslationById.query({ translation_id: translation.id });
      setSelectedTranslation(details);
    } catch (error: any) {
      console.error('Failed to load translation details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDuration = (start: Date | null, end: Date | null) => {
    if (!start || !end) return 'N/A';
    const duration = Math.abs(end.getTime() - start.getTime()) / 1000;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}m ${seconds}s`;
  };

  // Sort translations by creation date (newest first)
  const sortedTranslations = [...translations].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
              <Skeleton className="h-2 w-full mt-2" />
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
          <h2 className="text-2xl font-bold mb-2">Translations</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track the progress of your video translations
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh}>
          🔄 Refresh
        </Button>
      </div>

      {sortedTranslations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-lg font-medium mb-2">No translations yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first translation from the Upload or Videos tab
            </p>
            <Button variant="outline">
              Start Translating
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedTranslations.map((translation: Translation) => {
            const status = getStatusDisplay(translation.status);
            
            return (
              <Card key={translation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-2xl">{status.icon}</span>
                        Translation to {getLanguageDisplay(translation.target_language)}
                        <Badge variant="outline" className={`text-white ${status.color}`}>
                          {status.text}
                        </Badge>
                      </CardTitle>
                      
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-4 text-sm">
                          <span>🆔 ID: {translation.id}</span>
                          <span>📹 Video ID: {translation.video_id}</span>
                          <span>📅 {translation.created_at.toLocaleDateString()}</span>
                        </div>
                        
                        {translation.started_at && (
                          <div className="flex items-center gap-4 text-sm">
                            <span>🚀 Started: {translation.started_at.toLocaleString()}</span>
                            {translation.completed_at && (
                              <span>⏱️ Duration: {formatDuration(translation.started_at, translation.completed_at)}</span>
                            )}
                          </div>
                        )}
                      </CardDescription>

                      {/* Progress bar for processing translations */}
                      {translation.status === 'processing' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{translation.progress_percentage}%</span>
                          </div>
                          <Progress value={translation.progress_percentage} className="h-2" />
                        </div>
                      )}

                      {/* Error message */}
                      {translation.status === 'failed' && translation.error_message && (
                        <Alert variant="destructive">
                          <AlertDescription className="text-sm">
                            {translation.error_message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(translation)}
                          >
                            👁️ Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <span className="text-2xl">{status.icon}</span>
                              Translation Details
                            </DialogTitle>
                            <DialogDescription>
                              Detailed information about this translation
                            </DialogDescription>
                          </DialogHeader>

                          {isLoadingDetails ? (
                            <div className="space-y-4">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                            </div>
                          ) : selectedTranslation && (
                            <ScrollArea className="max-h-96">
                              <div className="space-y-4">
                                {/* Translation Info */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong>Translation ID:</strong> {selectedTranslation.id}
                                  </div>
                                  <div>
                                    <strong>Target Language:</strong> {getLanguageDisplay(selectedTranslation.target_language)}
                                  </div>
                                  <div>
                                    <strong>Status:</strong> 
                                    <Badge variant="outline" className={`ml-2 text-white ${status.color}`}>
                                      {status.text}
                                    </Badge>
                                  </div>
                                  <div>
                                    <strong>Progress:</strong> {selectedTranslation.progress_percentage}%
                                  </div>
                                </div>

                                <Separator />

                                {/* Video Info */}
                                <div>
                                  <h4 className="font-semibold mb-2">Original Video</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <strong>Filename:</strong> {selectedTranslation.video.original_filename}
                                    </div>
                                    <div>
                                      <strong>Size:</strong> {(selectedTranslation.video.file_size / (1024 * 1024)).toFixed(1)} MB
                                    </div>
                                    {selectedTranslation.video.duration && (
                                      <div>
                                        <strong>Duration:</strong> {Math.floor(selectedTranslation.video.duration / 60)}:{Math.floor(selectedTranslation.video.duration % 60).toString().padStart(2, '0')}
                                      </div>
                                    )}
                                    {selectedTranslation.video.original_language && (
                                      <div>
                                        <strong>Original Language:</strong> {getLanguageDisplay(selectedTranslation.video.original_language)}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Transcripts */}
                                {(selectedTranslation.transcript_original || selectedTranslation.transcript_translated) && (
                                  <>
                                    <Separator />
                                    <div className="space-y-3">
                                      <h4 className="font-semibold">Transcripts</h4>
                                      
                                      {selectedTranslation.transcript_original && (
                                        <div>
                                          <strong className="text-sm">Original:</strong>
                                          <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm max-h-32 overflow-y-auto">
                                            {selectedTranslation.transcript_original}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {selectedTranslation.transcript_translated && (
                                        <div>
                                          <strong className="text-sm">Translated:</strong>
                                          <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm max-h-32 overflow-y-auto">
                                            {selectedTranslation.transcript_translated}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}

                                {/* Download Links */}
                                {selectedTranslation.status === 'completed' && selectedTranslation.translated_audio_path && (
                                  <>
                                    <Separator />
                                    <div>
                                      <h4 className="font-semibold mb-2">Downloads</h4>
                                      <Button variant="outline" size="sm" className="w-full">
                                        🎵 Download Translated Audio
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </ScrollArea>
                          )}
                        </DialogContent>
                      </Dialog>

                      {translation.status === 'completed' && translation.translated_audio_path && (
                        <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                          📥 Download
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {/* Auto-refresh notice for processing translations */}
      {sortedTranslations.some(t => t.status === 'processing') && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-blue-600 dark:text-blue-400 text-xl animate-pulse">⚡</div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Processing in Progress</p>
                <p>Your translations are being processed. Click refresh to update the status.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}