import { async } from 'rxjs';
import { UnsubscribeController } from './unsubscribe.controller';
import { UnsubscribeService } from './unsubscribe.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('UnsubscribeController', () => {
    let unsubscribeController: UnsubscribeController;
    let unsubscribeService: UnsubscribeService;

    const mockFindOne = jest.fn();
    const mockDelete = jest.fn();

    beforeEach(jest.clearAllMocks);
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UnsubscribeController],
            providers: [
                {
                    provide: UnsubscribeService,
                    useValue: {
                        findOneById: mockFindOne,
                        deleteOneById: mockDelete,
                    },
                },
            ],
        }).compile();

        unsubscribeService = module.get<UnsubscribeService>(UnsubscribeService);
        unsubscribeController = module.get<UnsubscribeController>(
            UnsubscribeController,
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
        expect(unsubscribeController).toBeDefined();
        expect(unsubscribeService).toBeDefined();
    });

    describe('findOne', () => {
        it('should return an unsubscribe object', async () => {
            mockFindOne.mockResolvedValueOnce(mockUnsubscribe);
            expect(await unsubscribeController.findOne('1')).toBe(
                mockUnsubscribe,
            );
        });
    });

    describe('delete', () => {
        it('should return an unsubscribe object', async () => {
            mockDelete.mockResolvedValueOnce(mockUnsubscribe);
            expect(await unsubscribeController.delete('1')).toBe(
                mockUnsubscribe,
            );
        });
    });
});
