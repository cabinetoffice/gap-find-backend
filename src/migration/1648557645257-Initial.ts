import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1648557645257 implements MigrationInterface {
    name = 'Initial1648557645257';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "subscription" ("id" SERIAL NOT NULL, "encrypted_email_address" character varying NOT NULL, "hashed_email_address" character varying NOT NULL, "contentful_grant_subscription_id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."scheduled_job_type_enum" AS ENUM('GRANT_UPDATED', 'GRANT_UPCOMING')`,
        );
        await queryRunner.query(
            `CREATE TABLE "scheduled_job" ("id" SERIAL NOT NULL, "type" "public"."scheduled_job_type_enum" NOT NULL, "timer" character varying NOT NULL, CONSTRAINT "PK_893185383f029ca8d57bb781fa8" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "scheduled_job"`);
        await queryRunner.query(`DROP TYPE "public"."scheduled_job_type_enum"`);
        await queryRunner.query(`DROP TABLE "subscription"`);
    }
}
