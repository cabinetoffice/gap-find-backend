import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeEmailFromSubscriptions1651662245821
    implements MigrationInterface
{
    name = 'removeEmailFromSubscriptions1651662245821';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "subscription" DROP COLUMN "encrypted_email_address"`,
        );
        await queryRunner.query(
            `ALTER TABLE "subscription" DROP COLUMN "hashed_email_address"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "subscription" ADD "hashed_email_address" character varying`,
        );
        await queryRunner.query(
            `ALTER TABLE "subscription" ADD "encrypted_email_address" character varying`,
        );
    }
}
