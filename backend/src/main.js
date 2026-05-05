import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
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
