import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS para Vercel + dev local
  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => {
      const allowed = [
        'http://localhost:3000',
        process.env.FRONTEND_URL,
      ].filter(Boolean);
      // Vercel preview URLs
      if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
        cb(null, true);
      } else {
        cb(null, true); // Abrir para MVP/demo — restringir em produção
      }
    },
    credentials: true,
  });

  // Health check
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: any, res: any) =>
    res.json({ status: 'ok', service: 'beach-tennis-api', ts: Date.now() }),
  );

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`🎾 Beach Tennis API → http://0.0.0.0:${port}`);
}

bootstrap();
