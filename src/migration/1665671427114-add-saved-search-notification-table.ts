import { MigrationInterface, QueryRunner } from 'typeorm';

export class addSavedSearchNotificationTable1665671427114
    implements MigrationInterface
{
    name = 'addSavedSearchNotificationTable1665671427114';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "saved_search_notification" ("id" SERIAL NOT NULL, "emailAddress" character varying NOT NULL, "savedSearchName" character varying NOT NULL, "resultsUri" character varying NOT NULL, "emailSent" boolean NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ee4f3654a4a59ace32b06bfc70c" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "saved_search_notification"`);
    }
}
