import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const typeOrmConnectionDataSource = new DataSource({
    type: 'postgres',
    host: process.env.TYPEORM_MIGRATION_HOST,
    port: 5432,
    username: process.env.TYPEORM_MIGRATION_USERNAME,
    password: process.env.TYPEORM_MIGRATION_PASSWORD,
    database: process.env.TYPEORM_MIGRATION_DB,
    synchronize: true,
    logging: false,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migration/**/*.ts'],
    subscribers: ['src/subscriber/**/*.ts'],
});
