import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  uploadVideoInputSchema,
  createTranslationInputSchema,
  getTranslationsByVideoInputSchema,
  getTranslationByIdInputSchema,
  getVideoByIdInputSchema,
  updateTranslationProgressInputSchema
} from './schema';

// Import handlers
import { uploadVideo } from './handlers/upload_video';
import { getVideos } from './handlers/get_videos';
import { getVideoById } from './handlers/get_video_by_id';
import { createTranslation } from './handlers/create_translation';
import { getTranslationsByVideo } from './handlers/get_translations_by_video';
import { getTranslationById } from './handlers/get_translation_by_id';
import { updateTranslationProgress } from './handlers/update_translation_progress';
import { getAllTranslations } from './handlers/get_all_translations';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Video operations
  uploadVideo: publicProcedure
    .input(uploadVideoInputSchema)
    .mutation(({ input }) => uploadVideo(input)),
    
  getVideos: publicProcedure
    .query(() => getVideos()),
    
  getVideoById: publicProcedure
    .input(getVideoByIdInputSchema)
    .query(({ input }) => getVideoById(input)),
  
  // Translation operations
  createTranslation: publicProcedure
    .input(createTranslationInputSchema)
    .mutation(({ input }) => createTranslation(input)),
    
  getTranslationsByVideo: publicProcedure
    .input(getTranslationsByVideoInputSchema)
    .query(({ input }) => getTranslationsByVideo(input)),
    
  getTranslationById: publicProcedure
    .input(getTranslationByIdInputSchema)
    .query(({ input }) => getTranslationById(input)),
    
  getAllTranslations: publicProcedure
    .query(() => getAllTranslations()),
    
  updateTranslationProgress: publicProcedure
    .input(updateTranslationProgressInputSchema)
    .mutation(({ input }) => updateTranslationProgress(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`LinguaWeaver TRPC server listening at port: ${port}`);
}

start();