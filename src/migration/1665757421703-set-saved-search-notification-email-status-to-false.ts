import {MigrationInterface, QueryRunner} from "typeorm";

export class setSavedSearchNotificationEmailStatusToFalse1665757421703 implements MigrationInterface {
    name = 'setSavedSearchNotificationEmailStatusToFalse1665757421703'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_search_notification" ALTER COLUMN "emailSent" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_search_notification" ALTER COLUMN "emailSent" DROP DEFAULT`);
    }

}
