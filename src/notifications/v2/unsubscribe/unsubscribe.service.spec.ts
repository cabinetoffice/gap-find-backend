import { Test } from '@nestjs/testing';
import { UnsubscribeService } from './unsubscribe.service';
import { DeleteResult, Repository } from 'typeorm';
import { NewsletterType, Unsubscribe } from './unsubscribe.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../../../user/user.service';
import { User } from '../../../user/user.entity';

describe('UnsubscribeService', () => {
    let unsubscribeService: UnsubscribeService;
    let unsubscribeRepository: Repository<Unsubscribe>;
    let userService: UserService;
    const mockRepositoryDelete = jest.fn();
    const mockUserFindByEmail = jest.fn();
    const mockUserFindBySub = jest.fn();
    const mockUserCreate = jest.fn();

    beforeEach(jest.clearAllMocks);
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UnsubscribeService,
                {
                    provide: getRepositoryToken(Unsubscribe),
                    useValue: {
                        findOne: jest.fn(),
                        delete: mockRepositoryDelete,
                        save: jest.fn(),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findByEmail: mockUserFindByEmail,
                        findBySub: mockUserFindBySub,
                        create: mockUserCreate,
                    },
                },
            ],
        }).compile();
        unsubscribeService = module.get(UnsubscribeService);
        unsubscribeRepository = module.get<Repository<Unsubscribe>>(
            getRepositoryToken(Unsubscribe),
        );
        userService = module.get(UserService);
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

    describe('deleteOneBySubOrEmail', () => {
        const mockUser = {
            id: 1,
            emailAddress: 'test@test.com',
            hashedEmailAddress: 'hashed-email',
            encryptedEmailAddress: 'encrypted-email',
            updatedAt: new Date('2022-03-25T14:00:00.000Z'),
            createdAt: new Date('2022-06-25T14:00:00.000Z'),
            sub: 'my-sub',
            subscriptions: [],
            newsletterSubscriptions: [],
            savedSearches: [],
        } as User;

        const mockFailedDeleteResponse = {
            raw: null,
            affected: 0,
        } as DeleteResult;
        const mockSuccessfulDeleteResponse = {
            raw: null,
            affected: 1,
        } as DeleteResult;

        it('deletes newsletter by sub', async () => {
            jest.spyOn(userService, 'findBySub').mockImplementationOnce(
                async () => mockUser,
            );
            jest.spyOn(unsubscribeRepository, 'delete').mockImplementationOnce(
                async () => mockSuccessfulDeleteResponse,
            );
            const sub = mockUser.sub;
            const payload = {
                newsletterId: NewsletterType.NEW_GRANTS,
            };

            const response = await unsubscribeService.deleteOneBySubOrEmail(
                sub,
                payload,
            );

            expect(mockUserFindBySub).toHaveBeenCalledTimes(1);
            expect(mockUserFindBySub).toHaveBeenCalledWith(sub);

            expect(mockRepositoryDelete).toHaveBeenCalledTimes(1);
            expect(mockRepositoryDelete).toHaveBeenCalledWith({
                user: mockUser,
                ...payload,
            });

            expect(response).toStrictEqual(mockSuccessfulDeleteResponse);
        });

        it('deletes newsletter by email', async () => {
            jest.spyOn(userService, 'findBySub').mockImplementationOnce(
                async () => null,
            );
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                async () => mockUser,
            );
            jest.spyOn(unsubscribeRepository, 'delete').mockImplementationOnce(
                async () => mockSuccessfulDeleteResponse,
            );
            const email = mockUser.emailAddress;
            const payload = {
                newsletterId: NewsletterType.NEW_GRANTS,
            };

            const response = await unsubscribeService.deleteOneBySubOrEmail(
                email,
                payload,
            );

            expect(mockUserFindBySub).toHaveBeenCalledTimes(1);
            expect(mockUserFindBySub).toHaveBeenCalledWith(email);

            expect(mockUserFindByEmail).toHaveBeenCalledTimes(1);
            expect(mockUserFindByEmail).toHaveBeenCalledWith(email);

            expect(mockRepositoryDelete).toHaveBeenCalledTimes(1);
            expect(mockRepositoryDelete).toHaveBeenCalledWith({
                user: mockUser,
                ...payload,
            });

            expect(response).toStrictEqual(mockSuccessfulDeleteResponse);
        });

        it('returns unsuccessful response if no newsletter for sub', async () => {
            jest.spyOn(userService, 'findBySub').mockImplementationOnce(
                async () => mockUser,
            );
            jest.spyOn(unsubscribeRepository, 'delete').mockImplementationOnce(
                async () => mockFailedDeleteResponse,
            );
            const sub = mockUser.sub;
            const payload = {
                newsletterId: NewsletterType.NEW_GRANTS,
            };

            const response = await unsubscribeService.deleteOneBySubOrEmail(
                sub,
                payload,
            );

            expect(mockUserFindBySub).toHaveBeenCalledTimes(1);
            expect(mockUserFindBySub).toHaveBeenCalledWith(sub);

            expect(mockRepositoryDelete).toHaveBeenCalledTimes(1);
            expect(mockRepositoryDelete).toHaveBeenCalledWith({
                user: mockUser,
                ...payload,
            });

            expect(response).toStrictEqual(mockFailedDeleteResponse);
        });

        it('deletes grant subscription by sub', async () => {
            jest.spyOn(userService, 'findBySub').mockImplementationOnce(
                async () => mockUser,
            );
            jest.spyOn(unsubscribeRepository, 'delete').mockImplementationOnce(
                async () => mockSuccessfulDeleteResponse,
            );
            const sub = mockUser.sub;
            const payload = {
                subscriptionId: '1234',
            };

            const response = await unsubscribeService.deleteOneBySubOrEmail(
                sub,
                payload,
            );

            expect(mockUserFindBySub).toHaveBeenCalledTimes(1);
            expect(mockUserFindBySub).toHaveBeenCalledWith(sub);

            expect(mockRepositoryDelete).toHaveBeenCalledTimes(1);
            expect(mockRepositoryDelete).toHaveBeenCalledWith({
                user: mockUser,
                ...payload,
            });

            expect(response).toStrictEqual(mockSuccessfulDeleteResponse);
        });

        it('deletes saved search by sub', async () => {
            jest.spyOn(userService, 'findBySub').mockImplementationOnce(
                async () => mockUser,
            );
            jest.spyOn(unsubscribeRepository, 'delete').mockImplementationOnce(
                async () => mockSuccessfulDeleteResponse,
            );
            const sub = mockUser.sub;
            const payload = {
                savedSearchId: 1234,
            };

            const response = await unsubscribeService.deleteOneBySubOrEmail(
                sub,
                payload,
            );

            expect(mockUserFindBySub).toHaveBeenCalledTimes(1);
            expect(mockUserFindBySub).toHaveBeenCalledWith(sub);

            expect(mockRepositoryDelete).toHaveBeenCalledTimes(1);
            expect(mockRepositoryDelete).toHaveBeenCalledWith({
                user: mockUser,
                ...payload,
            });

            expect(response).toStrictEqual(mockSuccessfulDeleteResponse);
        });

        it('does not delete anything if user does not exist', async () => {
            jest.spyOn(userService, 'findBySub').mockImplementationOnce(
                async () => null,
            );
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                async () => null,
            );
            const id = 'not-a-real-id';
            const payload = {};

            await unsubscribeService.deleteOneBySubOrEmail(id, payload);

            expect(mockUserFindBySub).toHaveBeenCalledTimes(1);
            expect(mockUserFindBySub).toHaveBeenCalledWith(id);

            expect(mockUserFindByEmail).toHaveBeenCalledTimes(1);
            expect(mockUserFindByEmail).toHaveBeenCalledWith(id);

            expect(mockRepositoryDelete).not.toHaveBeenCalled();
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
