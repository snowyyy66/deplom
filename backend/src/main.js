import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './common/http-exception.filter';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpErrorFilter());

  const port = process.env.PORT ?? 8000;
  await app.listen(port, '0.0.0.0');

  const line = '─'.repeat(50);
  console.log(`\n\x1b[33m${line}\x1b[0m`);
  console.log(`\x1b[1m\x1b[33m  🍽️  Look Restaurant — API запущен\x1b[0m`);
  console.log(`\x1b[33m${line}\x1b[0m`);
  console.log(`  \x1b[36mAPI:    \x1b[0mhttp://127.0.0.1:${port}/api`);
  console.log(`  \x1b[36mSwagger:\x1b[0mhttp://127.0.0.1:${port}/docs`);
  console.log(`\x1b[33m${line}\x1b[0m\n`);
}

bootstrap();
