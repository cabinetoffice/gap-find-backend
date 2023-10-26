import { Test } from '@nestjs/testing';
import { UnsubscribeService } from './unsubscribe.service';
import { Repository } from 'typeorm';
import { NewsletterType, Unsubscribe } from './unsubscribe.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('UnsubscribeService', () => {
    let unsubscribeService: UnsubscribeService;
    let unsubscribeRepository: Repository<Unsubscribe>;

    beforeEach(jest.clearAllMocks);
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UnsubscribeService,
                {
                    provide: getRepositoryToken(Unsubscribe),
                    useValue: {
                        findOne: jest.fn(),
                        delete: jest.fn(),
                        save: jest.fn(),
                    },
                },
            ],
        }).compile();
        unsubscribeService = module.get(UnsubscribeService);
        unsubscribeRepository = module.get<Repository<Unsubscribe>>(
            getRepositoryToken(Unsubscribe),
        );
    });
    const mockUnsubscribe = {
        id: 1,
        user: {
            id: 1,
            email: 'test@test.com',
        },
        subscriptionId: '123',
        newsletterId: 'NEW_GRANTS',
        savedSearchId: 1,
    };

    it('should be defined', () => {
        expect(unsubscribeService).toBeDefined();
        expect(unsubscribeRepository).toBeDefined();
    });

    describe('findOneById', () => {
        it('should return a unsubscribe', async () => {
            unsubscribeRepository.findOne = jest
                .fn()
                .mockResolvedValueOnce(mockUnsubscribe);
            const result = await unsubscribeService.findOneById('1');
            expect(result).toEqual(mockUnsubscribe);
        });
    });

    describe('deleteOneById', () => {
        it('should delete a unsubscribe', async () => {
            unsubscribeRepository.delete = jest
                .fn()
                .mockResolvedValueOnce(mockUnsubscribe);
            const result = await unsubscribeService.deleteOneById('1');
            expect(result).toEqual(mockUnsubscribe);
        });
    });

    describe('findOneBySubscriptionIdTypeAndUser', () => {
        it('should return a unsubscribe', async () => {
            unsubscribeRepository.findOne = jest
                .fn()
                .mockResolvedValueOnce(mockUnsubscribe);
            const result =
                await unsubscribeService.findOneBySubscriptionIdTypeAndUser(
                    '123',
                    NewsletterType.NEW_GRANTS,
                    1,
                    {
                        id: 1,
                        hashedEmailAddress: 'ahash',
                        encryptedEmailAddress: 'aenc',
                        sub: 'asub',
                        subscriptions: [],
                        unsubscribeReferences: [],
                        savedSearches: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        newsletterSubscriptions: [],
                        savedSearchNotifications: [],
                    },
                );
            expect(result).toEqual(mockUnsubscribe);
        });
    });

    describe('create', () => {
        it('should create a unsubscribe', async () => {
            unsubscribeRepository.save = jest
                .fn()
                .mockResolvedValueOnce(mockUnsubscribe);
            const result = await unsubscribeService.create({
                user: {
                    id: 1,
                    hashedEmailAddress: 'ahash',
                    encryptedEmailAddress: 'aenc',
                    sub: 'asub',
                    subscriptions: [],
                    unsubscribeReferences: [],
                    savedSearches: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    newsletterSubscriptions: [],
                    savedSearchNotifications: [],
                },
                subscriptionId: '123',
                newsletterId: NewsletterType.NEW_GRANTS,
                savedSearchId: 1,
            });
            expect(result).toEqual(mockUnsubscribe);
        });

        it('should throw an error if the user is not defined', async () => {
            unsubscribeRepository.findOne = jest
                .fn()
                .mockResolvedValueOnce(mockUnsubscribe);
            await expect(
                unsubscribeService.create({
                    user: undefined,
                    subscriptionId: '123',
                    newsletterId: NewsletterType.NEW_GRANTS,
                    savedSearchId: 1,
                }),
            ).rejects.toThrowError();
        });
    });
});
