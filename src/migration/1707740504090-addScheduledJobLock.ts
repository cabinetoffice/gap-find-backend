import {MigrationInterface, QueryRunner} from "typeorm";

export class addScheduledJobLock1707740504090 implements MigrationInterface {
    name = 'addScheduledJobLock1707740504090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "scheduled_job" ADD "locked" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "scheduled_job" DROP COLUMN "locked"`);
    }

}
