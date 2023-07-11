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

    async afterLoad(user: User) {
        if (user.encryptedEmailAddress) {
            user.decryptEmail = async () => {
                if (!user.emailAddress) {
                    user.emailAddress = await this.encryptionService.decrypt(
                        user.encryptedEmailAddress,
                    );
                }
                return user.emailAddress;
            };
        }
    }

    async beforeUpdate(event: UpdateEvent<User>) {
        await this.encryptEmail(event.entity as User);
    }

    private async encryptEmail(user: User) {
        user.encryptedEmailAddress = await this.encryptionService.encrypt(
            user.emailAddress || (await user.decryptEmail()),
        );
        user.hashedEmailAddress = this.hashService.hash(user.emailAddress);
    }
}
