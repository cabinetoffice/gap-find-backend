import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../user/user.entity';
import { NewsletterController } from './newsletter.controller';
import { NewsletterType } from './newsletter.entity';
import { NewsletterService } from './newsletter.service';
import { Response } from 'express';

describe('NewsletterController', () => {
    let newsletterController: NewsletterController;
    let newsletterService: NewsletterService;

    const mockFindAll = jest.fn();
    const mockFindOne = jest.fn();
    const mockFindOneByEmailAddressAndType = jest.fn();
    const mockCreate = jest.fn();
    const mockDelete = jest.fn();
    const mockDeleteByEmailAndType = jest.fn();

    beforeEach(jest.clearAllMocks);
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [NewsletterController],
            providers: [
                {
                    provide: NewsletterService,
                    useValue: {
                        findAll: mockFindAll,
                        findOneById: mockFindOne,
                        findOneByEmailAddressAndType:
                            mockFindOneByEmailAddressAndType,
                        create: mockCreate,
                        deleteByNewsletterId: mockDelete,
                        deleteByEmailAddressAndType: mockDeleteByEmailAndType,
                    },
                },
            ],
        }).compile();

        newsletterService = module.get<NewsletterService>(NewsletterService);
        newsletterController =
            module.get<NewsletterController>(NewsletterController);
    });
    const mockDate = new Date('2022-03-25T14:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    const mockUser = new User();
    const mockNewsletter = {
        id: 1,
        type: NewsletterType.NEW_GRANTS,
        user: mockUser,
        createdAt: mockDate,
        updatedAt: mockDate,
    };
    const mockNewsletterArray = [mockNewsletter];
    const mockEmptyArray = [];

    it('should be defined', () => {
        expect(newsletterController).toBeDefined();
        expect(newsletterService).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an Array of newsletters', async () => {
            jest.spyOn(newsletterService, 'findAll').mockImplementationOnce(
                async () => mockNewsletterArray,
            );

            const response = await newsletterController.findAll();
            expect(response).toBe(mockNewsletterArray);
            expect(mockFindAll).toBeCalledTimes(1);
            expect(mockFindAll).toBeCalledWith();
        });

        it('should return an empty array if no newsletters exist', async () => {
            jest.spyOn(newsletterService, 'findAll').mockImplementationOnce(
                async () => mockEmptyArray,
            );

            const response = await newsletterController.findAll();
            expect(response).toBe(mockEmptyArray);
            expect(mockFindAll).toBeCalledTimes(1);
            expect(mockFindAll).toBeCalledWith();
        });
    });

    describe('findOne', () => {
        it('should return a single newsletters', async () => {
            jest.spyOn(newsletterService, 'findOneById').mockImplementation(
                async () => mockNewsletter,
            );

            const response = await newsletterController.findOne(1);
            expect(response).toBe(mockNewsletter);
            expect(mockFindOne).toBeCalledTimes(1);
            expect(mockFindOne).toBeCalledWith(1);
        });
    });

    describe('findOneByEmailAndType', () => {
        it('should return a single newsletters', async () => {
            jest.spyOn(
                newsletterService,
                'findOneByEmailAddressAndType',
            ).mockImplementation(async () => mockNewsletter);

            const response = await newsletterController.findOneByEmailAndType(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );
            expect(response).toBe(mockNewsletter);
            expect(mockFindOneByEmailAddressAndType).toBeCalledTimes(1);
            expect(mockFindOneByEmailAddressAndType).toBeCalledWith(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );
        });
    });

    describe('create', () => {
        it('should take in email and type and return new newsletter', async () => {
            jest.spyOn(newsletterService, 'create').mockImplementation(
                async () => mockNewsletter,
            );

            const response = await newsletterController.create(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );
            expect(response).toBe(mockNewsletter);
            expect(mockCreate).toBeCalledTimes(1);
            expect(mockCreate).toBeCalledWith(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );
        });
    });

    describe('delete', () => {
        const response: Partial<Response> = {
            send: jest.fn(),
            status: jest.fn(),
        };
        const successfulResponse = 1;
        const failedResponse = 0;

        it('should return 204 response if service successfully deletes', async () => {
            jest.spyOn(
                newsletterService,
                'deleteByNewsletterId',
            ).mockImplementation(async () => successfulResponse);

            await newsletterController.delete(1, response as Response);
            expect(mockDelete).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledWith(1);

            expect(response.status).toHaveBeenCalledWith(204);
            expect(response.send).toHaveBeenCalled();
        });

        it('should return 404 response if service successfully deletes', async () => {
            jest.spyOn(
                newsletterService,
                'deleteByNewsletterId',
            ).mockImplementation(async () => failedResponse);

            await newsletterController.delete(12345, response as Response);
            expect(mockDelete).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledWith(12345);
            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.send).toHaveBeenCalled();
        });
    });

    describe('deleteByUserAndType', () => {
        const response: Partial<Response> = {
            send: jest.fn(),
            status: jest.fn(),
        };

        const successfulResponse = 1;
        const failedResponse = 0;

        it('should return 204 response if service successfully deletes', async () => {
            jest.spyOn(
                newsletterService,
                'deleteByEmailAddressAndType',
            ).mockImplementation(async () => successfulResponse);

            await newsletterController.deleteByUserAndType(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
                response as Response,
            );
            expect(mockDeleteByEmailAndType).toBeCalledTimes(1);
            expect(mockDeleteByEmailAndType).toBeCalledWith(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );

            expect(response.status).toHaveBeenCalledWith(204);
            expect(response.send).toHaveBeenCalled();
        });

        it('should return 404 response if service successfully deletes', async () => {
            jest.spyOn(
                newsletterService,
                'deleteByEmailAddressAndType',
            ).mockImplementation(async () => failedResponse);

            await newsletterController.deleteByUserAndType(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
                response as Response,
            );
            expect(mockDeleteByEmailAndType).toBeCalledTimes(1);
            expect(mockDeleteByEmailAndType).toBeCalledWith(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.send).toHaveBeenCalled();
        });
    });
});
