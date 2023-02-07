import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
    imports: [
        ElasticsearchModule.registerAsync({
            useFactory: async (configService: ConfigService) => ({
                node: configService.get('ELASTIC_URL'),
                auth: {
                    username: configService.get('ELASTIC_USERNAME'),
                    password: configService.get('ELASTIC_PASSWORD'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    exports: [ElasticsearchModule],
})
export class SearchModule {}
