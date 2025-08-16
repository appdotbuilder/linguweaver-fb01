import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Video, Translation, SupportedLanguage } from '../../../server/src/schema';

interface VideoUploadProps {
  onVideoUploaded: (video: Video) => void;
  onTranslationCreated: (translation: Translation) => void;
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

export function VideoUpload({ onVideoUploaded, onTranslationCreated }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalLanguage, setOriginalLanguage] = useState<SupportedLanguage | ''>('');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev: number) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 200);
    return interval;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const progressInterval = simulateUploadProgress();

    try {
      // In a real app, you would upload the file to your server/cloud storage
      // For this demo, we'll simulate the upload and create a video record
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const uploadData = {
        filename: `${Date.now()}-${selectedFile.name}`,
        original_filename: selectedFile.name,
        file_path: `/uploads/${Date.now()}-${selectedFile.name}`, // Stub path
        file_size: selectedFile.size,
        duration: null, // Would be extracted from the video
        mime_type: selectedFile.type,
        original_language: originalLanguage || null
      };

      const uploadedVideo = await trpc.uploadVideo.mutate(uploadData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      onVideoUploaded(uploadedVideo);
      setSuccess('Video uploaded successfully! 🎉');

      // If target language is selected, create translation immediately
      if (targetLanguage) {
        const translation = await trpc.createTranslation.mutate({
          video_id: uploadedVideo.id,
          target_language: targetLanguage
        });
        
        onTranslationCreated(translation);
        setSuccess('Video uploaded and translation started! 🎉');
      }

      // Reset form
      setSelectedFile(null);
      setOriginalLanguage('');
      setTargetLanguage('');
      
      // Reset file input
      const fileInput = document.getElementById('video-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error: any) {
      clearInterval(progressInterval);
      setError(error.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getLanguageDisplay = (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Your Video</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload a video file and optionally start translation to your target language immediately.
        </p>
      </div>

      {/* File Upload Area */}
      <Card className="border-2 border-dashed transition-colors duration-200 hover:border-blue-400 dark:hover:border-blue-500">
        <CardContent className="p-6">
          <div
            className={`relative rounded-lg border-2 border-dashed transition-all duration-200 p-8 text-center ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              id="video-file-input"
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
              
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="font-medium text-green-600 dark:text-green-400">
                    ✅ {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • {selectedFile.type}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    Drop your video here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports MP4, MOV, AVI, WebM • Max 100MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="original-language">Original Language (Optional)</Label>
          <Select value={originalLanguage} onValueChange={(value: SupportedLanguage) => setOriginalLanguage(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select original language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {getLanguageDisplay(lang.code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-language">Target Language (Optional)</Label>
          <Select value={targetLanguage} onValueChange={(value: SupportedLanguage) => setTargetLanguage(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select target language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {getLanguageDisplay(lang.code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Upload Button */}
      <Button 
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium h-12"
      >
        {isUploading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Uploading...
          </span>
        ) : targetLanguage ? (
          `Upload & Start Translation to ${getLanguageDisplay(targetLanguage)}`
        ) : (
          '📤 Upload Video'
        )}
      </Button>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 dark:text-blue-400 text-xl">💡</div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Pro Tip:</p>
              <p>Select both original and target languages to automatically start translation after upload. You can always add more translations later!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}