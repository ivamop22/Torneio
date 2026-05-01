import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function getAllowedOrigins() {
  return [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_ORIGINS?.split(',') ?? []),
  ]
    .map((origin) => origin?.trim())
    .filter(Boolean) as string[];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => {
      const allowed = getAllowedOrigins();
      const isAllowed =
        !origin ||
        allowed.includes(origin) ||
        /^https:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin);

      cb(isAllowed ? null : new Error(`Origin ${origin} is not allowed by CORS`), isAllowed);
    },
    credentials: true,
  });

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: any, res: any) =>
    res.json({ status: 'ok', service: 'beach-tennis-api', ts: Date.now() }),
  );

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`Beach Tennis API -> http://0.0.0.0:${port}`);
}

bootstrap();
