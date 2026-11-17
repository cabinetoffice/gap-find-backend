import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { CreateFavouriteDto } from './favourite.dto';
import { Favourite } from './favourite.entity';
import { FavouriteService } from './favourite.service';

describe('FavouriteService', () => {
    let serviceUnderTest: FavouriteService;

    const mockFindBySub = jest.fn();
    const mockFindByEmail = jest.fn();
    const mockCreateUser = jest.fn();
    const mockFindOne = jest.fn();
    const mockFind = jest.fn();
    const mockSave = jest.fn();

    const mockUser: any = { id: 7, sub: 'user-sub' };

    const dto: CreateFavouriteDto = {
        sub: 'user-sub',
        emailAddress: 'test@test.com',
        contentfulGrantId: 'grant-123',
    };

    const savedFavourite: any = {
        id: 1,
        userId: 7,
        contentfulGrantId: 'grant-123',
        createdAt: new Date('2026-11-13T10:00:00.000Z'),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FavouriteService,
                {
                    provide: getRepositoryToken(Favourite),
                    useValue: {
                        findOne: mockFindOne,
                        find: mockFind,
                        save: mockSave,
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findBySub: mockFindBySub,
                        findByEmail: mockFindByEmail,
                        create: mockCreateUser,
                    },
                },
            ],
        }).compile();

        serviceUnderTest = module.get<FavouriteService>(FavouriteService);
    });

    describe('create', () => {
        it.each([
            ['sub', { ...dto, sub: '' }],
            ['emailAddress', { ...dto, emailAddress: undefined }],
            ['contentfulGrantId', { ...dto, contentfulGrantId: '' }],
        ])('should reject a request with no %s', async (_, invalidDto) => {
            await expect(
                serviceUnderTest.create(invalidDto as CreateFavouriteDto),
            ).rejects.toBeInstanceOf(BadRequestException);

            expect(mockSave).not.toHaveBeenCalled();
        });

        it('should save a favourite for a user found by sub', async () => {
            mockFindBySub.mockResolvedValue(mockUser);
            mockFindOne.mockResolvedValue(undefined);
            mockSave.mockResolvedValue(savedFavourite);

            const result = await serviceUnderTest.create(dto);

            expect(mockFindBySub).toHaveBeenCalledWith('user-sub');
            expect(mockFindByEmail).not.toHaveBeenCalled();
            expect(mockCreateUser).not.toHaveBeenCalled();
            expect(mockSave).toHaveBeenCalledWith({
                userId: 7,
                contentfulGrantId: 'grant-123',
            });
            expect(result).toBe(savedFavourite);
        });

        it('should fall back to finding the user by email address', async () => {
            mockFindBySub.mockResolvedValue(null);
            mockFindByEmail.mockResolvedValue(mockUser);
            mockFindOne.mockResolvedValue(undefined);
            mockSave.mockResolvedValue(savedFavourite);

            await serviceUnderTest.create(dto);

            expect(mockFindByEmail).toHaveBeenCalledWith('test@test.com');
            expect(mockCreateUser).not.toHaveBeenCalled();
            expect(mockSave).toHaveBeenCalledWith({
                userId: 7,
                contentfulGrantId: 'grant-123',
            });
        });

        it('should create the user when they do not exist yet', async () => {
            mockFindBySub.mockResolvedValue(null);
            mockFindByEmail.mockResolvedValue(null);
            mockCreateUser.mockResolvedValue(mockUser);
            mockFindOne.mockResolvedValue(undefined);
            mockSave.mockResolvedValue(savedFavourite);

            await serviceUnderTest.create(dto);

            expect(mockCreateUser).toHaveBeenCalledWith(
                'test@test.com',
                'user-sub',
            );
            expect(mockSave).toHaveBeenCalledWith({
                userId: 7,
                contentfulGrantId: 'grant-123',
            });
        });

        it('should return the existing favourite instead of adding it twice', async () => {
            mockFindBySub.mockResolvedValue(mockUser);
            mockFindOne.mockResolvedValue(savedFavourite);

            const result = await serviceUnderTest.create(dto);

            expect(mockFindOne).toHaveBeenCalledWith({
                where: { userId: 7, contentfulGrantId: 'grant-123' },
            });
            expect(mockSave).not.toHaveBeenCalled();
            expect(result).toBe(savedFavourite);
        });

        it('should return the existing favourite when a duplicate is saved at the same time', async () => {
            mockFindBySub.mockResolvedValue(mockUser);
            mockFindOne
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(savedFavourite);
            mockSave.mockRejectedValue({ code: '23505' });

            const result = await serviceUnderTest.create(dto);

            expect(result).toBe(savedFavourite);
        });

        it('should rethrow any other save error', async () => {
            mockFindBySub.mockResolvedValue(mockUser);
            mockFindOne.mockResolvedValue(undefined);
            const error = new Error('database unavailable');
            mockSave.mockRejectedValue(error);

            await expect(serviceUnderTest.create(dto)).rejects.toBe(error);
        });
    });

    describe('findAllByUser', () => {
        it('should return the favourites for a user found by sub, newest first', async () => {
            mockFindBySub.mockResolvedValue(mockUser);
            mockFind.mockResolvedValue([savedFavourite]);

            const result = await serviceUnderTest.findAllByUser('user-sub');

            expect(mockFind).toHaveBeenCalledWith({
                where: { userId: 7 },
                order: { createdAt: 'DESC' },
            });
            expect(result).toStrictEqual([savedFavourite]);
        });

        it('should fall back to finding the user by email address', async () => {
            mockFindBySub.mockResolvedValue(null);
            mockFindByEmail.mockResolvedValue(mockUser);
            mockFind.mockResolvedValue([savedFavourite]);

            const result = await serviceUnderTest.findAllByUser(
                'test@test.com',
            );

            expect(mockFindByEmail).toHaveBeenCalledWith('test@test.com');
            expect(result).toStrictEqual([savedFavourite]);
        });

        it('should return an empty list when the user does not exist', async () => {
            mockFindBySub.mockResolvedValue(null);
            mockFindByEmail.mockResolvedValue(null);

            const result = await serviceUnderTest.findAllByUser('unknown');

            expect(mockFind).not.toHaveBeenCalled();
            expect(result).toStrictEqual([]);
        });
    });
});
