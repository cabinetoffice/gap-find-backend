import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorFilter } from './filters/error.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalFilters(new ErrorFilter());
    await app.listen(process.env.PORT || 3001);
}
bootstrap();
