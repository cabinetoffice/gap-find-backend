import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { Newsletter, NewsletterType } from './newsletter.entity';
import { NewsletterService } from './newsletter.service';

describe('NewsletterService', () => {
    let newsletterService: NewsletterService;
    let newsletterRepository: Repository<Newsletter>;
    let userService: UserService;

    const mockFind = jest.fn();
    const mockFindOne = jest.fn();
    const mockSave = jest.fn();
    const mockDelete = jest.fn();
    const mockUserFindByEmail = jest.fn();
    const mockUserCreate = jest.fn();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NewsletterService,
                {
                    provide: getRepositoryToken(Newsletter),
                    useValue: {
                        find: mockFind,
                        findOne: mockFindOne,
                        save: mockSave,
                        delete: mockDelete,
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findByEmail: mockUserFindByEmail,
                        create: mockUserCreate,
                    },
                },
            ],
        }).compile();

        newsletterService = module.get<NewsletterService>(NewsletterService);
        newsletterRepository = module.get<Repository<Newsletter>>(
            getRepositoryToken(Newsletter),
        );
        userService = module.get<UserService>(UserService);
    });

    const mockDate = new Date('2022-03-25T14:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(
        () => mockDate as unknown as string,
    );

    const mockUser: any = new User();
    mockUser.emailAddress = 'test@email.com';

    const mockNewsletter: any = {
        id: 1,
        type: NewsletterType.NEW_GRANTS,
        user: mockUser,
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    const mockNewsletterArray: any = [mockNewsletter];

    const mockEmptyArray: any = [];

    const mockFailedDeleteResponse: any = {
        raw: null,
        affected: 0,
    };

    let mockSuccessfulDeleteResponse: any = {
        raw: null,
        affected: 1,
    };

    it('should be defined', () => {
        expect(newsletterService).toBeDefined();
        expect(newsletterRepository).toBeDefined();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('findAll', () => {
        it('should return an Array of newsletters', async () => {
            jest.spyOn(newsletterRepository, 'find').mockImplementationOnce(
                () => mockNewsletterArray,
            );

            let response = await newsletterService.findAll();
            expect(response).toBe(mockNewsletterArray);
            expect(mockFind).toBeCalledTimes(1);
            expect(mockFind).toBeCalledWith();
        });

        it('should return an empty Array if no newsletters are found', async () => {
            jest.spyOn(newsletterRepository, 'find').mockImplementationOnce(
                () => mockEmptyArray,
            );

            let response = await newsletterService.findAll();
            expect(response).toBe(mockEmptyArray);
            expect(mockFind).toBeCalledTimes(1);
            expect(mockFind).toBeCalledWith();
        });
    });

    describe('findOneById', () => {
        it('should return a single newsletter', async () => {
            jest.spyOn(newsletterRepository, 'findOne').mockImplementationOnce(
                () => mockNewsletter,
            );

            let response = await newsletterService.findOneById(1);
            expect(response).toBe(mockNewsletter);
            expect(mockFindOne).toBeCalledTimes(1);
            expect(mockFindOne).toBeCalledWith({ id: 1 });
        });
    });

    describe('findOneByEmailAddressAndType', () => {
        it('should return a single newsletter', async () => {
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                () => mockUser,
            );
            jest.spyOn(newsletterRepository, 'findOne').mockImplementationOnce(
                () => mockNewsletter,
            );

            let response = await newsletterService.findOneByEmailAddressAndType(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );
            expect(response).toBe(mockNewsletter);
            expect(mockUserFindByEmail).toBeCalledTimes(1);
            expect(mockUserFindByEmail).toBeCalledWith('test@email.com');
            expect(mockFindOne).toBeCalledTimes(1);
            expect(mockFindOne).toBeCalledWith(
                expect.objectContaining({ user: mockUser }),
            );
            expect(mockFindOne).toBeCalledWith(
                expect.objectContaining({ type: 'NEW_GRANTS' }),
            );
        });
    });

    describe('create', () => {
        beforeEach(() => {
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                () => mockUser,
            );
            jest.spyOn(userService, 'create').mockImplementationOnce(
                () => mockUser,
            );
            jest.spyOn(newsletterRepository, 'save').mockImplementationOnce(
                () => mockNewsletter,
            );
        });

        it('should return the existing newsletter if one already exists without saving', async () => {
            jest.spyOn(
                newsletterService,
                'findOneByEmailAddressAndType',
            ).mockImplementationOnce(() => mockNewsletter);

            let response = await newsletterService.create(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );
            expect(response).toBe(mockNewsletter);
            expect(mockUserCreate).not.toBeCalled();
        });

        it('should create/find user if no newsletter exists', async () => {
            jest.spyOn(
                newsletterService,
                'findOneByEmailAddressAndType',
            ).mockImplementationOnce(() => undefined);
            let response = await newsletterService.create(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );

            expect(response).toBe(mockNewsletter);
            expect(mockUserCreate).toBeCalledTimes(1);
            expect(mockUserCreate).toBeCalledWith('test@email.com');
        });

        it('should save a new newsletter if none exists', async () => {
            jest.spyOn(
                newsletterService,
                'findOneByEmailAddressAndType',
            ).mockImplementationOnce(() => undefined);
            let response = await newsletterService.create(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );

            expect(response).toBe(mockNewsletter);
            expect(mockSave).toBeCalledTimes(1);
            expect(mockSave).toBeCalledWith(
                expect.objectContaining({ user: mockUser }),
            );
            expect(mockSave).toBeCalledWith(
                expect.objectContaining({ type: 'NEW_GRANTS' }),
            );
        });
    });

    describe('deleteByNewsletterId', () => {
        it('should return 1 if newsletter is deleted', async () => {
            jest.spyOn(newsletterRepository, 'delete').mockImplementationOnce(
                () => mockSuccessfulDeleteResponse,
            );
            let response = await newsletterService.deleteByNewsletterId(12345);

            expect(response).toBe(1);
            expect(mockDelete).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledWith({ id: 12345 });
        });

        it('should return 0 if newsletter is deleted', async () => {
            jest.spyOn(newsletterRepository, 'delete').mockImplementationOnce(
                () => mockFailedDeleteResponse,
            );
            let response = await newsletterService.deleteByNewsletterId(12345);

            expect(response).toBe(0);
            expect(mockDelete).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledWith({ id: 12345 });
        });
    });

    describe('deleteByNewsletterId', () => {
        it('should return 1 if newsletter is deleted', async () => {
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                () => mockUser,
            );
            jest.spyOn(newsletterRepository, 'delete').mockImplementationOnce(
                () => mockSuccessfulDeleteResponse,
            );
            let response = await newsletterService.deleteByEmailAddressAndType(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );
            expect(response).toBe(1);
            expect(mockUserFindByEmail).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledWith(
                expect.objectContaining({ user: mockUser }),
            );
            expect(mockDelete).toBeCalledWith(
                expect.objectContaining({ type: 'NEW_GRANTS' }),
            );
        });

        it('should return 0 if newsletter is deleted', async () => {
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                () => mockUser,
            );
            jest.spyOn(newsletterRepository, 'delete').mockImplementationOnce(
                () => mockFailedDeleteResponse,
            );
            let response = await newsletterService.deleteByEmailAddressAndType(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );
            expect(response).toBe(0);
            expect(mockUserFindByEmail).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledWith(
                expect.objectContaining({ user: mockUser }),
            );
            expect(mockDelete).toBeCalledWith(
                expect.objectContaining({ type: 'NEW_GRANTS' }),
            );
        });

        it('should not delete anything if user is not found', async () => {
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                () => null,
            );
            let response = await newsletterService.deleteByEmailAddressAndType(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );
            expect(response).toBe(0);
            expect(mockUserFindByEmail).toBeCalledTimes(1);
            expect(mockDelete).not.toBeCalled();
        });
    });
});
