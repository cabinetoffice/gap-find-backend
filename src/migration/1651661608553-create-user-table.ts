import {MigrationInterface, QueryRunner} from "typeorm";

export class createUserTable1651661608553 implements MigrationInterface {
    name = 'createUserTable1651661608553'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "gap_user" ("id" SERIAL NOT NULL, "hashed_email_address" character varying NOT NULL, "encrypted_email_address" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_34fb0f1b6ed8fd735e80e1e519" ON "gap_user" ("hashed_email_address") `);
        await queryRunner.query(`ALTER TABLE "subscription" ADD "userId" integer`);
        await queryRunner.query(`ALTER TABLE "subscription" ADD CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription" DROP CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0"`);
        await queryRunner.query(`ALTER TABLE "subscription" DROP COLUMN "userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_34fb0f1b6ed8fd735e80e1e519"`);
        await queryRunner.query(`DROP TABLE "gap_user"`);
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "hashed_email_address" SET NOT NULL`,);
        await queryRunner.query(`ALTER TABLE "subscription" ALTER COLUMN "encrypted_email_address" SET NOT NULL`,);
    }

}
