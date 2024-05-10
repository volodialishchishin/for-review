import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from '../app.module';
import cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';
import { HttpExceptionFilter } from './http-exeption.filter';

export const createApp = (app: INestApplication): INestApplication => {
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.enableCors();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const errorsForResponse: any = [];

        errors.forEach((e: any) => {
          const constraintsKey = Object.keys(e.constraints);
          constraintsKey.forEach((ckey) => {
            errorsForResponse.push({
              message: e.constraints[ckey],
              field: e.property,
            });
          });
        });
        throw new BadRequestException(errorsForResponse);
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api');
  return app;
};
