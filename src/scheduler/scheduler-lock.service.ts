import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { ScheduledJob, ScheduledJobType } from './scheduled-job.entity';

@Injectable()
export class SchedulerLockService {
    constructor(
        @InjectRepository(ScheduledJob)
        private scheduledJobRepository: Repository<ScheduledJob>,
        private connection: Connection,
    ) {}

    async unlock(type: ScheduledJobType) {
        await this.scheduledJobRepository.update({ type }, { locked: false });
    }

    async checkAndSetTransactionLock(type: ScheduledJobType) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction('SERIALIZABLE');
        await queryRunner.query(
            'LOCK TABLE "scheduled_job" IN ACCESS EXCLUSIVE MODE',
        );
        const { locked } = await queryRunner.manager.findOne(
            ScheduledJob,
            { type },
            { where: { locked: true } },
        );

        if (locked) {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            return locked;
        }
        await queryRunner.manager.update(
            ScheduledJob,
            { type },
            { locked: true },
        );
        await queryRunner.commitTransaction();
        await queryRunner.release();
        return locked;
    }
}
