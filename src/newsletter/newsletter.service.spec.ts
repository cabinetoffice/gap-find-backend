import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
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
    const mockUserFindBySub = jest.fn();
    const mockUserCreate = jest.fn();

    beforeEach(jest.resetAllMocks);
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
                        findBySub: mockUserFindBySub,
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
    const mockEmptyArray: [] = [];
    const mockFailedDeleteResponse = {
        raw: null,
        affected: 0,
    } as DeleteResult;
    const mockSuccessfulDeleteResponse = {
        raw: null,
        affected: 1,
    } as DeleteResult;

    it('should be defined', () => {
        expect(newsletterService).toBeDefined();
        expect(newsletterRepository).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an Array of newsletters', async () => {
            jest.spyOn(newsletterRepository, 'find').mockImplementationOnce(
                async () => mockNewsletterArray,
            );

            const response = await newsletterService.findAll();
            expect(response).toBe(mockNewsletterArray);
            expect(mockFind).toBeCalledTimes(1);
            expect(mockFind).toBeCalledWith();
        });

        it('should return an empty Array if no newsletters are found', async () => {
            jest.spyOn(newsletterRepository, 'find').mockImplementationOnce(
                async () => mockEmptyArray,
            );

            const response = await newsletterService.findAll();
            expect(response).toBe(mockEmptyArray);
            expect(mockFind).toBeCalledTimes(1);
            expect(mockFind).toBeCalledWith();
        });
    });

    describe('findOneById', () => {
        it('should return a single newsletter', async () => {
            jest.spyOn(newsletterRepository, 'findOne').mockImplementationOnce(
                async () => mockNewsletter,
            );

            const response = await newsletterService.findOneById(1);
            expect(response).toBe(mockNewsletter);
            expect(mockFindOne).toBeCalledTimes(1);
            expect(mockFindOne).toBeCalledWith({ where: { id: 1 } });
        });
    });

    describe('findOneByEmailAddressAndType', () => {
        it('should return a single newsletter for sub', async () => {
            jest.spyOn(userService, 'findBySub').mockImplementationOnce(
                async () => mockUser,
            );
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                async () => null,
            );
            jest.spyOn(newsletterRepository, 'findOne').mockImplementationOnce(
                async () => mockNewsletter,
            );

            const response =
                await newsletterService.findOneBySubOrEmailAddressAndType(
                    'sub',
                    NewsletterType.NEW_GRANTS,
                );
            expect(response).toBe(mockNewsletter);
            expect(mockUserFindBySub).toBeCalledTimes(1);
            expect(mockUserFindBySub).toBeCalledWith('sub');
            expect(mockUserFindByEmail).toBeCalledTimes(0);
            expect(mockFindOne).toBeCalledTimes(1);
            expect(mockFindOne).toBeCalledWith(
                expect.objectContaining({
                    where: { type: 'NEW_GRANTS', user: mockUser },
                }),
            );
        });

        it('should return a single newsletter for email', async () => {
            jest.spyOn(userService, 'findBySub').mockImplementationOnce(
                async () => null,
            );
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                async () => mockUser,
            );
            jest.spyOn(newsletterRepository, 'findOne').mockImplementationOnce(
                async () => mockNewsletter,
            );

            const response =
                await newsletterService.findOneBySubOrEmailAddressAndType(
                    'test@email.com',
                    NewsletterType.NEW_GRANTS,
                );
            expect(response).toBe(mockNewsletter);
            expect(mockUserFindBySub).toBeCalledTimes(1);
            expect(mockUserFindBySub).toBeCalledWith('test@email.com');
            expect(mockUserFindByEmail).toBeCalledTimes(1);
            expect(mockUserFindByEmail).toBeCalledWith('test@email.com');
            expect(mockFindOne).toBeCalledTimes(1);
            expect(mockFindOne).toBeCalledWith(
                expect.objectContaining({
                    where: { type: 'NEW_GRANTS', user: mockUser },
                }),
            );
        });
    });

    describe('create', () => {
        beforeEach(() => {
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                async () => mockUser,
            );
            jest.spyOn(userService, 'create').mockImplementationOnce(
                async () => mockUser,
            );
            jest.spyOn(newsletterRepository, 'save').mockImplementationOnce(
                async () => mockNewsletter,
            );
        });

        it('should return the existing newsletter if one already exists without saving', async () => {
            jest.spyOn(
                newsletterService,
                'findOneBySubOrEmailAddressAndType',
            ).mockImplementationOnce(async () => mockNewsletter);

            const response = await newsletterService.create(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );
            expect(response).toBe(mockNewsletter);
            expect(mockUserCreate).not.toBeCalled();
        });

        it('should create/find user if no newsletter exists', async () => {
            jest.spyOn(
                newsletterService,
                'findOneBySubOrEmailAddressAndType',
            ).mockImplementationOnce(() => undefined);
            const response = await newsletterService.create(
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
                'findOneBySubOrEmailAddressAndType',
            ).mockImplementationOnce(() => undefined);
            const response = await newsletterService.create(
                'test@email.com',
                NewsletterType.NEW_GRANTS,
            );

            expect(response).toBe(mockNewsletter);
            expect(mockSave).toBeCalledTimes(1);
            expect(mockSave).toBeCalledWith(
                expect.objectContaining({ type: 'NEW_GRANTS', user: mockUser }),
            );
        });
    });

    describe('deleteByNewsletterId', () => {
        it('should return 1 if newsletter is deleted', async () => {
            jest.spyOn(newsletterRepository, 'delete').mockImplementationOnce(
                async () => mockSuccessfulDeleteResponse,
            );
            const response = await newsletterService.deleteByNewsletterId(
                12345,
            );

            expect(response).toStrictEqual(1);
            expect(mockDelete).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledWith({ id: 12345 });
        });

        it('should return 0 if newsletter is deleted', async () => {
            jest.spyOn(newsletterRepository, 'delete').mockImplementationOnce(
                async () => mockFailedDeleteResponse,
            );
            const response = await newsletterService.deleteByNewsletterId(
                12345,
            );

            expect(response).toStrictEqual(0);
            expect(mockDelete).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledWith({ id: 12345 });
        });
    });

    describe('deleteByEmailAddressAndType', () => {
        it('should return 1 if newsletter is deleted', async () => {
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                async () => mockUser,
            );
            jest.spyOn(newsletterRepository, 'delete').mockImplementationOnce(
                async () => mockSuccessfulDeleteResponse,
            );
            const response =
                await newsletterService.deleteByEmailAddressAndType(
                    'test@email.com',
                    NewsletterType.NEW_GRANTS,
                );
            expect(response).toStrictEqual({
                raw: null,
                affected: 1,
            } as DeleteResult);
            expect(mockUserFindByEmail).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledWith(
                expect.objectContaining({
                    type: 'NEW_GRANTS',
                    user: mockUser,
                }),
            );
        });

        it('should return 0 if newsletter is deleted', async () => {
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                async () => mockUser,
            );
            jest.spyOn(newsletterRepository, 'delete').mockImplementationOnce(
                async () => mockFailedDeleteResponse,
            );
            const response =
                await newsletterService.deleteByEmailAddressAndType(
                    'test@email.com',
                    NewsletterType.NEW_GRANTS,
                );
            expect(response).toStrictEqual({
                raw: null,
                affected: 0,
            } as DeleteResult);
            expect(mockUserFindByEmail).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledTimes(1);
            expect(mockDelete).toBeCalledWith(
                expect.objectContaining({ type: 'NEW_GRANTS', user: mockUser }),
            );
        });

        it('should not delete anything if user email is not found', async () => {
            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
                () => null,
            );
            const response =
                await newsletterService.deleteByEmailAddressAndType(
                    'test@email.com',
                    NewsletterType.NEW_GRANTS,
                );
            expect(response).toStrictEqual({
                raw: null,
                affected: 0,
            } as DeleteResult);
            expect(mockUserFindByEmail).toBeCalledTimes(1);
            expect(mockDelete).not.toBeCalled();
        });

        it('should not delete anything if user sub is not found', async () => {
            jest.spyOn(userService, 'findBySub').mockImplementationOnce(
                () => null,
            );
            const response =
                await newsletterService.deleteBySubAndType(
                    'sub',
                    NewsletterType.NEW_GRANTS,
                );
            expect(response).toStrictEqual({
                raw: null,
                affected: 0,
            } as DeleteResult);
            expect(mockUserFindBySub).toBeCalledTimes(1);
            expect(mockDelete).not.toBeCalled();
        });
    });
});
