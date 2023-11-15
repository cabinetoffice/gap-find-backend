import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateSchedulerEnum1665749813682 implements MigrationInterface {
    name = 'updateSchedulerEnum1665749813682';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."scheduled_job_type_enum" RENAME TO "scheduled_job_type_enum_old"`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."scheduled_job_type_enum" AS ENUM('GRANT_UPDATED', 'GRANT_UPCOMING', 'NEW_GRANTS', 'SAVED_SEARCH_MATCHES')`,
        );
        await queryRunner.query(
            `ALTER TABLE "scheduled_job" ALTER COLUMN "type" TYPE "public"."scheduled_job_type_enum" USING "type"::"text"::"public"."scheduled_job_type_enum"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."scheduled_job_type_enum_old"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."scheduled_job_type_enum_old" AS ENUM('GRANT_UPDATED', 'GRANT_UPCOMING', 'NEW_GRANTS')`,
        );
        await queryRunner.query(
            `ALTER TABLE "scheduled_job" ALTER COLUMN "type" TYPE "public"."scheduled_job_type_enum_old" USING "type"::"text"::"public"."scheduled_job_type_enum_old"`,
        );
        await queryRunner.query(`DROP TYPE "public"."scheduled_job_type_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."scheduled_job_type_enum_old" RENAME TO "scheduled_job_type_enum"`,
        );
    }
}
