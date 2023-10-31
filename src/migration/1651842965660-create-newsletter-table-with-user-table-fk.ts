import { MigrationInterface, QueryRunner } from 'typeorm';

export class createNewsletterTableWithUserTableFk1651842965660
    implements MigrationInterface
{
    name = 'createNewsletterTableWithUserTableFk1651842965660';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "newsletter" ("id" SERIAL NOT NULL, "type" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_036bb790d1d19efeacfd2f3740c" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "newsletter" ADD CONSTRAINT "FK_20f63020913bbfdc1835e080549" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "newsletter" DROP CONSTRAINT "FK_20f63020913bbfdc1835e080549"`,
        );
        await queryRunner.query(`DROP TABLE "newsletter"`);
    }
}
