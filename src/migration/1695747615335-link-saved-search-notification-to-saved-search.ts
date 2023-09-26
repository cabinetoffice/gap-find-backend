import {MigrationInterface, QueryRunner} from "typeorm";

export class linkSavedSearchNotificationToSavedSearch1695747615335 implements MigrationInterface {
    name = 'linkSavedSearchNotificationToSavedSearch1695747615335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_search_notification" RENAME COLUMN "savedSearchName" TO "savedSearchId"`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" DROP COLUMN "savedSearchId"`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" ADD "savedSearchId" integer`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" ADD CONSTRAINT "UQ_b0b6344d97495e7e0353e9e21ec" UNIQUE ("savedSearchId")`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" ADD CONSTRAINT "FK_b0b6344d97495e7e0353e9e21ec" FOREIGN KEY ("savedSearchId") REFERENCES "saved_search"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_search_notification" DROP CONSTRAINT "FK_b0b6344d97495e7e0353e9e21ec"`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" DROP CONSTRAINT "UQ_b0b6344d97495e7e0353e9e21ec"`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" DROP COLUMN "savedSearchId"`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" ADD "savedSearchId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" RENAME COLUMN "savedSearchId" TO "savedSearchName"`);
    }

}
