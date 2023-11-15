import { MigrationInterface, QueryRunner } from 'typeorm';

export class makeSavedSearchFieldsNullable1659445450675
    implements MigrationInterface
{
    name = 'makeSavedSearchFieldsNullable1659445450675';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "search_term" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "filters" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "from_date" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "to_date" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "status" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "notifications" SET DEFAULT false`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "notifications" DROP DEFAULT`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "status" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "to_date" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "from_date" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "filters" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "saved_search" ALTER COLUMN "search_term" SET NOT NULL`,
        );
    }
}
