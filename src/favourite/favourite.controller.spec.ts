import { Test, TestingModule } from '@nestjs/testing';
import { FavouriteController } from './favourite.controller';
import { CreateFavouriteDto } from './favourite.dto';
import { FavouriteService } from './favourite.service';

describe('FavouriteController', () => {
    let controller: FavouriteController;

    const mockCreate = jest.fn();
    const mockFindAllByUser = jest.fn();

    const dto: CreateFavouriteDto = {
        sub: 'user-sub',
        emailAddress: 'test@test.com',
        contentfulGrantId: 'grant-123',
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [FavouriteController],
            providers: [
                {
                    provide: FavouriteService,
                    useValue: {
                        create: mockCreate,
                        findAllByUser: mockFindAllByUser,
                    },
                },
            ],
        }).compile();

        controller = module.get<FavouriteController>(FavouriteController);
    });

    it('should add a favourite and not return the user', async () => {
        mockCreate.mockResolvedValue({
            id: 1,
            userId: 7,
            contentfulGrantId: 'grant-123',
            user: { id: 7 },
        });

        const result = await controller.create(dto);

        expect(mockCreate).toHaveBeenCalledWith(dto);
        expect(result).toStrictEqual({
            id: 1,
            userId: 7,
            contentfulGrantId: 'grant-123',
        });
    });

    it('should return the favourites for a user', async () => {
        const favourites = [{ id: 1, userId: 7, contentfulGrantId: 'g-1' }];
        mockFindAllByUser.mockResolvedValue(favourites);

        const result = await controller.findAllByUser('user-sub');

        expect(mockFindAllByUser).toHaveBeenCalledWith('user-sub');
        expect(result).toBe(favourites);
    });
});
