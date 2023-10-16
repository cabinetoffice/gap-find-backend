import {MigrationInterface, QueryRunner} from "typeorm";

export class addSubToUser1697210433484 implements MigrationInterface {
    name = 'addSubToUser1697210433484'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gap_user" ADD "sub" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gap_user" DROP COLUMN "sub"`);
    }

}
