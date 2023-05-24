import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import {
    Connection,
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    UpdateEvent,
} from 'typeorm';
import { EncryptionService } from '../encryption/encryption.service';
import { HashService } from '../hash/hash.service';
import { User } from './user.entity';

@EventSubscriber()
@Injectable()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    constructor(
        @InjectConnection() readonly connection: Connection,
        private encryptionService: EncryptionService,
        private hashService: HashService,
    ) {
        connection.subscribers.push(this);
    }

    listenTo() {
        return User;
    }

    async beforeInsert(event: InsertEvent<User>) {
        await this.encryptEmail(event.entity);
    }

    async afterLoad(entity: User) {
        if (entity.encryptedEmailAddress) {
            await this.decryptEmail(entity);
        }
    }

    async beforeUpdate(event: UpdateEvent<User>) {
        await this.encryptEmail(event.entity as User);
    }

    private async encryptEmail(user: User) {
        user.encryptedEmailAddress = await this.encryptionService.encrypt(
            user.emailAddress,
        );
        user.hashedEmailAddress = this.hashService.hash(user.emailAddress);
    }

    private async decryptEmail(user: User) {
        user.emailAddress = await this.encryptionService.decrypt(
            user.encryptedEmailAddress,
        );
    }
}
