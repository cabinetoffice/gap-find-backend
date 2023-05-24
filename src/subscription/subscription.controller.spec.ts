import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { CreateSubscriptionDto } from './subscription.dto';
import { SubscriptionService } from './subscription.service';
import { Response } from 'express';

describe('SubscriptionController', () => {
    let controller: SubscriptionController;
    let subscriptionService: SubscriptionService;

    const mockCreate = jest.fn();
    const mockFindAllByEmailAddress = jest.fn();
    const mockFindByEmailAddressAndGrantId = jest.fn();
    const mockDeleteByEmailAndGrantId = jest.fn();

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
                        findAllByEmailAddress: mockFindAllByEmailAddress,
                        findByEmailAndGrantId: mockFindByEmailAddressAndGrantId,
                        deleteByEmailAndGrantId: mockDeleteByEmailAndGrantId,
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

    describe('findAllByEmailAndGrantId Subscription API endpoint', () => {
        it('should take an email address and grantId then return the values from the findByEmailAddressAndGrantId service class method', async () => {
            jest.spyOn(
                subscriptionService,
                'findByEmailAndGrantId',
            ).mockResolvedValue(subscriptionResolvedValue);

            const findByEmailGrantId =
                await controller.findByEmailAddressAndGrantId(
                    subscription.emailAddress,
                    subscription.contentfulGrantSubscriptionId,
                );

            expect(mockFindByEmailAddressAndGrantId).toHaveBeenCalledWith(
                subscription.emailAddress,
                subscription.contentfulGrantSubscriptionId,
            );
            expect(mockFindByEmailAddressAndGrantId).toHaveBeenCalledTimes(1);
            expect(findByEmailGrantId).toStrictEqual(subscriptionResolvedValue);
        });
    });

    describe('findAllByEmail Subscription API endpoint', () => {
        it('should take an email and return the results from the findAllByEmailAddress service class method', async () => {
            jest.spyOn(
                subscriptionService,
                'findAllByEmailAddress',
            ).mockResolvedValue(subscriptionResolvedValueArray);

            const findAllByEmail = await controller.findAllByEmailAddress(
                subscription.emailAddress,
            );

            expect(mockFindAllByEmailAddress).toHaveBeenCalledWith(
                subscription.emailAddress,
            );
            expect(mockFindAllByEmailAddress).toHaveBeenCalledTimes(1);
            expect(findAllByEmail).toStrictEqual(
                subscriptionResolvedValueArray,
            );
        });
    });

    describe('deleteByEmailAndGrantId Subscription API endpoint', () => {
        const response: Partial<Response> = {
            send: jest.fn(),
            status: jest.fn(),
        };
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should work for a successful deletion call and return a 204 status code', async () => {
            jest.spyOn(
                subscriptionService,
                'deleteByEmailAndGrantId',
            ).mockResolvedValue({
                raw: null,
                affected: 1,
            });
            await controller.deleteByEmailAndGrantId(
                subscription.emailAddress,
                subscription.contentfulGrantSubscriptionId,
                response as Response,
            );

            expect(mockDeleteByEmailAndGrantId).toHaveBeenCalledTimes(1);
            expect(mockDeleteByEmailAndGrantId).toHaveBeenCalledWith(
                subscription.emailAddress,
                subscription.contentfulGrantSubscriptionId,
            );
            expect(response.status).toHaveBeenCalledWith(204);
        });

        it('should work with a failed deletion and set the status code to 404', async () => {
            jest.spyOn(
                subscriptionService,
                'deleteByEmailAndGrantId',
            ).mockResolvedValue({
                raw: null,
                affected: 0,
            });

            await controller.deleteByEmailAndGrantId(
                subscription.emailAddress,
                subscription.contentfulGrantSubscriptionId,
                response as Response,
            );

            expect(mockDeleteByEmailAndGrantId).toHaveBeenCalledTimes(1);
            expect(mockDeleteByEmailAndGrantId).toHaveBeenCalledWith(
                subscription.emailAddress,
                subscription.contentfulGrantSubscriptionId,
            );
            expect(response.status).toHaveBeenCalledWith(404);
        });
    });
});
