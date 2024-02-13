import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerLockService } from './scheduler-lock.service';
import { ScheduledJob, ScheduledJobType } from './scheduled-job.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    query: jest.fn(),
    manager: {
        findOne: jest.fn(),
        update: jest.fn(),
    },
    rollbackTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    release: jest.fn(),
};

const mockConnection = {
    provide: Connection,
    useValue: {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    },
};

describe('Scheduled lock service', () => {
    let serviceUnderTest: SchedulerLockService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                mockConnection,
                SchedulerLockService,
                {
                    provide: getRepositoryToken(ScheduledJob),
                    useValue: {
                        save: jest.fn(),
                        find: jest.fn(),
                        delete: jest.fn(),
                    },
                },
            ],
        }).compile();

        serviceUnderTest =
            module.get<SchedulerLockService>(SchedulerLockService);
    });

    it.each([['locked'], ['not locked']])(
        `Should release & rollback transaction when isLocked is %s`,
        async (state) => {
            const isLocked = state === 'locked';

            mockQueryRunner.manager.findOne.mockResolvedValue({
                locked: isLocked,
            });
            const res = await serviceUnderTest.checkAndSetTransactionLock(
                ScheduledJobType.GRANT_UPDATED,
            );
            expect(res).toBe(isLocked);
            expect(mockQueryRunner.connect).toHaveBeenCalled();
            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.query).toHaveBeenCalledWith(
                'LOCK TABLE "scheduled_job" IN ACCESS EXCLUSIVE MODE',
            );
            expect(mockQueryRunner.manager.findOne).toHaveBeenCalledWith(
                ScheduledJob,
                { type: ScheduledJobType.GRANT_UPDATED },
                { where: { locked: true } },
            );
            expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();

            if (isLocked) {
                expect(mockQueryRunner.manager.update).not.toHaveBeenCalled();
                expect(
                    mockQueryRunner.commitTransaction,
                ).not.toHaveBeenCalled();
            } else {
                expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
                    ScheduledJob,
                    { type: ScheduledJobType.GRANT_UPDATED },
                    { locked: true },
                );
                expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
                expect(mockQueryRunner.release).toHaveBeenCalled();
            }
        },
    );
});
