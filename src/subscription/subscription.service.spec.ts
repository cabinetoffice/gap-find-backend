import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HashService } from '../hash/hash.service';
import { EncryptionService } from '../encryption/encryption.service';
import { Subscription } from './subscription.entity';
import { SubscriptionService } from './subscription.service';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

describe('SubscriptionServiceervice', () => {
    let serviceUnderTest: SubscriptionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionService,
                {
                    provide: getRepositoryToken(Subscription),
                    useFactory: jest.fn(),
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            switch (key) {
                                default:
                                    return null;
                            }
                        }),
                    },
                },
                {
                    provide: EncryptionService,
                    useValue: {
                        encrypt: jest.fn(() => {
                            return 'encrypted key';
                        }),
                        decrypt: jest.fn(() => {
                            return 'decrypted key';
                        }),
                    },
                },
                {
                    provide: HashService,
                    useValue: {
                        hash: jest.fn(() => {
                            return 'hashed key';
                        }),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findByEmail: jest.fn(),
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();

        serviceUnderTest = module.get<SubscriptionService>(SubscriptionService);
    });

    it('should be defined', () => {
        expect(serviceUnderTest).toBeDefined();
    });
});
