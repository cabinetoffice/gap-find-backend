import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { CreateSubscriptionDto } from './subscription.dto';
import { SubscriptionService } from './subscription.service';
import { Response } from 'express';
import { UnsubscribeService } from '../notifications/v2/unsubscribe/unsubscribe.service';
import { DeleteResult } from 'typeorm';

describe('SubscriptionController', () => {
    let controller: SubscriptionController;
    let subscriptionService: SubscriptionService;

    const mockCreate = jest.fn();
    const mockFindAllBySubOrEmailAddress = jest.fn();
    const mockFindByEmailAddressAndGrantId = jest.fn();
    const mockDeleteByEmailAndGrantId = jest.fn();
    const mockDeleteBySubAndGrantId = jest.fn();
    const mockFindBySubAndGrantId = jest.fn();
    const mockUnsubscribeDeleteOneBySubOrEmail = jest.fn();
    const mockUnsubscribeDeleteOneById = jest.fn();

    const subscription: CreateSubscriptionDto = {
        emailAddress: 'test@test.com',
        contentfulGrantSubscriptionId: '12345678',
    };

    const mockDate = new Date('2022-03-25T14:00:00.000Z');
    jest.useFakeTimers().setSystemTime(mockDate);

    const mockUser: any = {
        id: 1,
        emailAddress: 'test@test.com',
        hashedEmailAddress: 'test@test.com',
        encryptedEmailAddress: 'test@test.com',
        updatedAt: mockDate,
        createdAt: mockDate,
    };

    const subscriptionResolvedValue: any = {
        id: 1,
        contentfulGrantSubscriptionId: '12345678',
        updatedAt: mockDate,
        createdAt: mockDate,
        user: mockUser,
    };

    const subscriptionResolvedValueArray: any[] = [
        {
            id: 1,
            contentfulGrantSubscriptionId: '12345678',
            updatedAt: mockDate,
            createdAt: mockDate,
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SubscriptionController],
            providers: [
                {
                    provide: SubscriptionService,
                    useValue: {
                        create: mockCreate,
                        findAllBySubOrEmailAddress:
                            mockFindAllBySubOrEmailAddress,
                        findByEmailAndGrantId: mockFindByEmailAddressAndGrantId,
                        findBySubAndGrantId: mockFindBySubAndGrantId,
                        deleteByEmailAndGrantId: mockDeleteByEmailAndGrantId,
                        deleteBySubAndGrantId: mockDeleteBySubAndGrantId,
                    },
                },
                {
                    provide: UnsubscribeService,
                    useValue: {
                        Connection: jest.fn(),
                        deleteOneBySubOrEmail:
                            mockUnsubscribeDeleteOneBySubOrEmail,
                        deleteOneById: mockUnsubscribeDeleteOneById,
                    },
                },
            ],
        }).compile();

        controller = module.get<SubscriptionController>(SubscriptionController);
        subscriptionService =
            module.get<SubscriptionService>(SubscriptionService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('Create Subscription API endpoint', () => {
        it('should take in a createSubscriptionDto and return the values from the subscription service', async () => {
            jest.spyOn(subscriptionService, 'create').mockResolvedValue(
                subscriptionResolvedValue,
            );

            const create = await controller.create(subscription);

            expect(mockCreate).toHaveBeenCalledWith(subscription);
            expect(mockCreate).toHaveBeenCalledTimes(1);
            expect(create).toStrictEqual(subscriptionResolvedValue);
        });
    });

    describe('findByUserAndGrantId Subscription API endpoint', () => {
        it('should take an email address and grantId then return the values from the findByEmailAddressAndGrantId service class method', async () => {
            jest.spyOn(
                subscriptionService,
                'findBySubAndGrantId',
            ).mockResolvedValue(subscriptionResolvedValue);

            const findByEmailGrantId = await controller.findByUserAndGrantId(
                subscription.emailAddress,
                subscription.contentfulGrantSubscriptionId,
            );

            expect(mockFindBySubAndGrantId).toHaveBeenCalledWith(
                subscription.emailAddress,
                subscription.contentfulGrantSubscriptionId,
            );
            expect(mockFindBySubAndGrantId).toHaveBeenCalledTimes(1);
            expect(findByEmailGrantId).toStrictEqual(subscriptionResolvedValue);
        });
    });

    describe('findAllBySubOrEmailAddress Subscription API endpoint', () => {
        it('should take an email and return the results from the findAllBySubOrEmailAddress service class method', async () => {
            jest.spyOn(
                subscriptionService,
                'findAllBySubOrEmailAddress',
            ).mockResolvedValue(subscriptionResolvedValueArray);

            const findAllBySubOrEmail =
                await controller.findAllBySubOrEmailAddress(
                    subscription.emailAddress,
                );

            expect(mockFindAllBySubOrEmailAddress).toHaveBeenCalledWith(
                subscription.emailAddress,
            );
            expect(mockFindAllBySubOrEmailAddress).toHaveBeenCalledTimes(1);
            expect(findAllBySubOrEmail).toStrictEqual(
                subscriptionResolvedValueArray,
            );
        });
    });

    describe('deleteByEmailAndGrantId Subscription API endpoint', () => {
        const response: Partial<Response> = {
            send: jest.fn(),
            status: jest.fn(),
            end: jest.fn(),
        };

        const successfulResponse: DeleteResult = { affected: 1, raw: null };
        const failedResponse: DeleteResult = { affected: 0, raw: null };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should work for a successful deletion call and return a 204 status code', async () => {
            jest.spyOn(
                subscriptionService,
                'deleteBySubAndGrantId',
            ).mockResolvedValue(failedResponse);
            jest.spyOn(
                subscriptionService,
                'deleteByEmailAndGrantId',
            ).mockResolvedValue(successfulResponse);
            mockUnsubscribeDeleteOneById.mockImplementation(
                async () => successfulResponse,
            );

            await controller.deleteByUserAndGrantId(
                subscription.emailAddress,
                subscription.contentfulGrantSubscriptionId,
                response as Response,
                { unsubscribeReference: 'unsubscribeReferenceId' },
            );

            expect(mockDeleteByEmailAndGrantId).toHaveBeenCalledTimes(1);
            expect(mockDeleteBySubAndGrantId).toHaveBeenCalledTimes(1);
            expect(mockDeleteByEmailAndGrantId).toHaveBeenCalledWith(
                subscription.emailAddress,
                subscription.contentfulGrantSubscriptionId,
            );

            expect(mockUnsubscribeDeleteOneById).toBeCalledTimes(1);
            expect(mockUnsubscribeDeleteOneById).toBeCalledWith(
                'unsubscribeReferenceId',
            );

            expect(response.status).toHaveBeenCalledWith(204);
            expect(response.end).toHaveBeenCalledTimes(1);
        });

        it('should successfully delete when sub is given and return a 204 status code', async () => {
            jest.spyOn(
                subscriptionService,
                'deleteBySubAndGrantId',
            ).mockResolvedValue(successfulResponse);
            mockUnsubscribeDeleteOneBySubOrEmail.mockImplementation(
                async () => successfulResponse,
            );

            await controller.deleteByUserAndGrantId(
                'mockSubValue',
                subscription.contentfulGrantSubscriptionId,
                response as Response,
                {},
            );

            expect(mockDeleteBySubAndGrantId).toHaveBeenCalledTimes(1);
            expect(mockDeleteByEmailAndGrantId).toHaveBeenCalledTimes(0);
            expect(mockDeleteBySubAndGrantId).toHaveBeenCalledWith(
                'mockSubValue',
                subscription.contentfulGrantSubscriptionId,
            );

            expect(mockUnsubscribeDeleteOneBySubOrEmail).toBeCalledTimes(1);
            expect(mockUnsubscribeDeleteOneBySubOrEmail).toBeCalledWith(
                'mockSubValue',
                { subscriptionId: subscription.contentfulGrantSubscriptionId },
            );

            expect(response.status).toHaveBeenCalledWith(204);
            expect(response.end).toHaveBeenCalledTimes(1);
        });

        it('should work with a failed deletion and set the status code to 404', async () => {
            jest.spyOn(
                subscriptionService,
                'deleteBySubAndGrantId',
            ).mockResolvedValue(failedResponse);
            jest.spyOn(
                subscriptionService,
                'deleteByEmailAndGrantId',
            ).mockResolvedValue(failedResponse);
            mockUnsubscribeDeleteOneBySubOrEmail.mockImplementation(
                async () => successfulResponse,
            );

            await controller.deleteByUserAndGrantId(
                subscription.emailAddress,
                subscription.contentfulGrantSubscriptionId,
                response as Response,
                {},
            );

            expect(mockDeleteByEmailAndGrantId).toHaveBeenCalledTimes(1);
            expect(mockDeleteByEmailAndGrantId).toHaveBeenCalledWith(
                subscription.emailAddress,
                subscription.contentfulGrantSubscriptionId,
            );

            expect(mockUnsubscribeDeleteOneBySubOrEmail).toBeCalledTimes(1);
            expect(mockUnsubscribeDeleteOneBySubOrEmail).toBeCalledWith(
                subscription.emailAddress,
                { subscriptionId: subscription.contentfulGrantSubscriptionId },
            );

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.end).toHaveBeenCalledTimes(1);
        });
    });
});
