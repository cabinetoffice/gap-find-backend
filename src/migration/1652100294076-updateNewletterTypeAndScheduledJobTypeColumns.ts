import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateNewsletterTypeAndScheduledJobTypeColumns1652100294076
    implements MigrationInterface
{
    name = 'updateNewsletterTypeAndScheduledJobTypeColumns1652100294076';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "newsletter" DROP COLUMN "type"`);
        await queryRunner.query(
            `CREATE TYPE "public"."newsletter_type_enum" AS ENUM('NEW_GRANTS')`,
        );
        await queryRunner.query(
            `ALTER TABLE "newsletter" ADD "type" "public"."newsletter_type_enum" NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TYPE "public"."scheduled_job_type_enum" RENAME TO "scheduled_job_type_enum_old"`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."scheduled_job_type_enum" AS ENUM('GRANT_UPDATED', 'GRANT_UPCOMING', 'NEW_GRANTS')`,
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
            `CREATE TYPE "public"."scheduled_job_type_enum_old" AS ENUM('GRANT_UPDATED', 'GRANT_UPCOMING')`,
        );
        await queryRunner.query(
            `ALTER TABLE "scheduled_job" ALTER COLUMN "type" TYPE "public"."scheduled_job_type_enum_old" USING "type"::"text"::"public"."scheduled_job_type_enum_old"`,
        );
        await queryRunner.query(`DROP TYPE "public"."scheduled_job_type_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."scheduled_job_type_enum_old" RENAME TO "scheduled_job_type_enum"`,
        );
        await queryRunner.query(`ALTER TABLE "newsletter" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."newsletter_type_enum"`);
        await queryRunner.query(
            `ALTER TABLE "newsletter" ADD "type" character varying NOT NULL`,
        );
    }
}
