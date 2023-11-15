import { MigrationInterface, QueryRunner } from 'typeorm';

export class linkSavedSearchToSavedSearchNotification1696880123239
    implements MigrationInterface
{
    name = 'linkSavedSearchToSavedSearchNotification1696880123239';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" DROP COLUMN "savedSearchName"`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" DROP COLUMN "emailAddress"`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" ADD "userId" integer`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" ADD "savedSearchId" integer`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" ADD CONSTRAINT "UQ_b0b6344d97495e7e0353e9e21ec" UNIQUE ("savedSearchId")`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" ADD CONSTRAINT "FK_a9dd34a7c89d31227a4b4e2eb85" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" ADD CONSTRAINT "FK_b0b6344d97495e7e0353e9e21ec" FOREIGN KEY ("savedSearchId") REFERENCES "saved_search"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" DROP CONSTRAINT "FK_b0b6344d97495e7e0353e9e21ec"`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" DROP CONSTRAINT "FK_a9dd34a7c89d31227a4b4e2eb85"`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" DROP CONSTRAINT "UQ_b0b6344d97495e7e0353e9e21ec"`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" DROP COLUMN "savedSearchId"`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" DROP COLUMN "userId"`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" ADD "emailAddress" character varying NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search_notification" ADD "savedSearchName" character varying NOT NULL`,
        );
    }
}
