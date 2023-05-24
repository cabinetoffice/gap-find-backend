import { MigrationInterface, QueryRunner } from 'typeorm';

export class addCreatedAtToSavedSearch1666103745975
    implements MigrationInterface
{
    name = 'addCreatedAtToSavedSearch1666103745975';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "saved_search" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "saved_search" DROP COLUMN "createdAt"`,
        );
    }
}
