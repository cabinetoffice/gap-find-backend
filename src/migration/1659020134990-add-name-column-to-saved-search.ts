import {MigrationInterface, QueryRunner} from "typeorm";

export class addNameColumnToSavedSearch1659020134990 implements MigrationInterface {
    name = 'addNameColumnToSavedSearch1659020134990'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_search" ADD "name" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_search" DROP COLUMN "name"`);
    }

}
