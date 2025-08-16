import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { VideoUpload } from '@/components/VideoUpload';
import { VideoList } from '@/components/VideoList';
import { TranslationList } from '@/components/TranslationList';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Video, Translation } from '../../server/src/schema';

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [videosResult, translationsResult] = await Promise.all([
        trpc.getVideos.query(),
        trpc.getAllTranslations.query()
      ]);
      setVideos(videosResult);
      setTranslations(translationsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVideoUploaded = (video: Video) => {
    setVideos((prev: Video[]) => [video, ...prev]);
    setActiveTab('videos');
  };

  const handleTranslationCreated = (translation: Translation) => {
    setTranslations((prev: Translation[]) => [translation, ...prev]);
    setActiveTab('translations');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              🌐
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LinguaWeaver
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your videos into any language with AI-powered dubbing and translation. 
            Upload, translate, and share your content globally.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-blue-600">
                {videos.length}
              </CardTitle>
              <CardDescription>Videos Uploaded</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-purple-600">
                {translations.length}
              </CardTitle>
              <CardDescription>Translations Created</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-green-600">
                {translations.filter(t => t.status === 'completed').length}
              </CardTitle>
              <CardDescription>Completed Translations</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100/50 dark:bg-gray-700/50 m-4 mb-0">
                <TabsTrigger 
                  value="upload" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm"
                >
                  🎬 Upload Video
                </TabsTrigger>
                <TabsTrigger 
                  value="videos" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm"
                >
                  📹 My Videos
                  {videos.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {videos.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="translations" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm"
                >
                  🌍 Translations
                  {translations.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {translations.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="upload" className="mt-0">
                  <VideoUpload 
                    onVideoUploaded={handleVideoUploaded}
                    onTranslationCreated={handleTranslationCreated}
                  />
                </TabsContent>

                <TabsContent value="videos" className="mt-0">
                  <VideoList 
                    videos={videos}
                    isLoading={isLoading}
                    onTranslationCreated={handleTranslationCreated}
                    onRefresh={loadData}
                  />
                </TabsContent>

                <TabsContent value="translations" className="mt-0">
                  <TranslationList 
                    translations={translations}
                    isLoading={isLoading}
                    onRefresh={loadData}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by AI • Support for 12+ languages • Secure & Private</p>
        </div>
      </div>
    </div>
  );
}

export default App;