import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { EncryptionModule } from '../../src/encryption/encryption.module';
import { HashModule } from '../../src/hash/hash.module';
import { SubscriptionModule } from '../../src/subscription/subscription.module';
import { Subscription } from '../../src/subscription/subscription.entity';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: async () => {
                return {
                    type: 'postgres',
                    url: process.env.DATABASE_URL,
                    entities: [Subscription],
                    synchronize: false,
                    ssl: process.env.DATABASE_SSL === 'true' ? true : false,
                };
            },
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forFeature([Subscription]),
        SubscriptionModule,
        EncryptionModule,
        HashModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {
    constructor(private connection: Connection) {}
}
