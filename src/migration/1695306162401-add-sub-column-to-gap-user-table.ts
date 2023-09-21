import {MigrationInterface, QueryRunner} from "typeorm";

export class addSubColumnToGapUserTable1695306162401 implements MigrationInterface {
    name = 'addSubColumnToGapUserTable1695306162401'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gap_user" ADD "sub" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gap_user" DROP COLUMN "sub"`);
    }

}
