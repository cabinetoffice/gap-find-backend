import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from './app.module';
import { EncryptionService } from '../../src/encryption/encryption.service';
import { HashService } from '../../src/hash/hash.service';
import { Connection, Repository } from 'typeorm';
import { Subscription } from '../../src/subscription/subscription.entity';
import * as cla from 'command-line-args';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const encryptionService = app.get(EncryptionService);
    const hashService = app.get(HashService);
    const subscriptionRepository = app.get<any, Repository<Subscription>>(
        getRepositoryToken(Subscription),
    );
    const connection = app.get(Connection);

    const databaseUtils = new DatabaseUtils(
        encryptionService,
        hashService,
        subscriptionRepository,
        connection,
    );

    const mainDefinitions = [{ name: 'command', defaultOption: true }];
    const mainOptions = cla(mainDefinitions, {
        stopAtFirstUnknown: true,
    });
    const argv = mainOptions._unknown || [];

    switch (mainOptions.command) {
        case 'subscriptions':
            const subscriptionOptions = cla(mainDefinitions, { argv });
            switch (subscriptionOptions.command) {
                case 'findall':
                    await databaseUtils.findAllSubscriptions();
                    break;
                case 'encrypt':
                    await databaseUtils.encryptSubscriptions();
                    break;
                case 'decrypt':
                    await databaseUtils.decryptSubscriptions();
                    break;
                default:
                    console.error(
                        `Unknown command: ${subscriptionOptions.command}`,
                    );
                    break;
            }
            break;
        default:
            console.error(`Unknown command: ${mainOptions.command}`);
            break;
    }

    await app.close();
}

class DatabaseUtils {
    constructor(
        private encryptionService: EncryptionService,
        private hashService: HashService,
        private subscriptionRepository: Repository<Subscription>,
        private connection: Connection,
    ) {}

    async findAllSubscriptions() {
        const subscripionsResult = await this.subscriptionRepository.find();
        console.log(subscriptionsResult);
    }

    async decryptSubscriptions() {
        const subscriptionsResult = await this.subscriptionRepository.find();
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const subscription of subscriptionsResult) {
                const cleartext = await this.encryptionService.decrypt(
                    subscription.encryptedEmailAddress,
                );
                subscription.emailAddress = cleartext;
                subscription.encryptedEmailAddress = cleartext;
                subscription.hashedEmailAddress = cleartext;

                await queryRunner.manager.save(subscription);
            }
            await queryRunner.commitTransaction();
        } catch (err) {
            console.error(err);
            await queryRunner.rollbackTransaction();
        } finally {
            console.log('Successfully decrypted database');
            await queryRunner.release();
        }
    }

    async encryptSubscriptions() {
        const subscriptionsResult = await this.subscriptionRepository.find();
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const subscription of subscriptionsResult) {
                subscription.emailAddress = subscription.encryptedEmailAddress;
                subscription.encryptedEmailAddress =
                    await this.encryptionService.encrypt(
                        subscription.emailAddress,
                    );
                subscription.hashedEmailAddress = this.hashService.hash(
                    subscription.emailAddress,
                );

                await queryRunner.manager.save(subscription);
            }
            await queryRunner.commitTransaction();
        } catch (err) {
            console.error(err);
            await queryRunner.rollbackTransaction();
        } finally {
            console.log('Successfully encrypted database');
            await queryRunner.release();
        }
    }
}

bootstrap();
