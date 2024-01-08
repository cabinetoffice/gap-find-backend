import { config } from 'dotenv-safe';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const checkEnvConfigPresent = async () => {
    try {
        await config();
    } catch (e) {
        // logging the error manually as nestjs won't do this cleanly
        console.error(e);
        process.exit(1);
    }
};

async function bootstrap() {
    await checkEnvConfigPresent();
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT || 3001);
}

bootstrap();
