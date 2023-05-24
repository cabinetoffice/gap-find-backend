import {MigrationInterface, QueryRunner} from "typeorm";

export class createSavedSearchTable1659002668795 implements MigrationInterface {
    name = 'createSavedSearchTable1659002668795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_34fb0f1b6ed8fd735e80e1e519"`);
        await queryRunner.query(`CREATE TYPE "public"."saved_search_status_enum" AS ENUM('DRAFT', 'CONFIRMED')`);
        await queryRunner.query(`CREATE TABLE "saved_search" ("id" SERIAL NOT NULL, "search_term" character varying NOT NULL, "filters" json NOT NULL, "from_date" TIMESTAMP NOT NULL, "to_date" TIMESTAMP NOT NULL, "status" "public"."saved_search_status_enum" NOT NULL, "notifications" boolean NOT NULL, "userId" integer, CONSTRAINT "PK_563b338d8b4878fa46697c8f3f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_36bba91f8998ff853db5218a10" ON "gap_user" ("hashed_email_address") `);
        await queryRunner.query(`ALTER TABLE "saved_search" ADD CONSTRAINT "FK_397e5fcfff614ace7edf6831d5b" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_search" DROP CONSTRAINT "FK_397e5fcfff614ace7edf6831d5b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_36bba91f8998ff853db5218a10"`);
        await queryRunner.query(`DROP TABLE "saved_search"`);
        await queryRunner.query(`DROP TYPE "public"."saved_search_status_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_34fb0f1b6ed8fd735e80e1e519" ON "gap_user" ("hashed_email_address") `);
    }

}
