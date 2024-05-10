import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createApp } from './utils/createApp';

const PORT = process.env.PORT || 5000;

export async function bootstrap() {
  const rawApp = await NestFactory.create(AppModule);
  const app = createApp(rawApp);
  await app.listen(PORT);
}
bootstrap();
