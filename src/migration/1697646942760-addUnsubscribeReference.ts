import {MigrationInterface, QueryRunner} from "typeorm";

export class addUnsubscribeReference1697646942760 implements MigrationInterface {
    name = 'addUnsubscribeReference1697646942760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "unsubscribe" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "subscriptionId" character varying, "newsletterId" character varying, "savedSearchId" integer, "userId" integer, CONSTRAINT "PK_994fd32a0285bbf2fd462a8601d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "gap_user" ADD "sub" character varying`);
        await queryRunner.query(`ALTER TABLE "unsubscribe" ADD CONSTRAINT "FK_f051628403f51d0b0e11c1aabf4" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "unsubscribe" DROP CONSTRAINT "FK_f051628403f51d0b0e11c1aabf4"`);
        await queryRunner.query(`ALTER TABLE "gap_user" DROP COLUMN "sub"`);
        await queryRunner.query(`DROP TABLE "unsubscribe"`);
    }

}
