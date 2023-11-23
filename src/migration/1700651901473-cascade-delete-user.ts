import {MigrationInterface, QueryRunner} from "typeorm";

export class cascadeDeleteUser1700651901473 implements MigrationInterface {
    name = 'cascadeDeleteUser1700651901473'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_search" DROP CONSTRAINT "FK_397e5fcfff614ace7edf6831d5b"`);
        await queryRunner.query(`ALTER TABLE "subscription" DROP CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0"`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" DROP CONSTRAINT "FK_a9dd34a7c89d31227a4b4e2eb85"`);
        await queryRunner.query(`ALTER TABLE "unsubscribe" DROP CONSTRAINT "FK_f051628403f51d0b0e11c1aabf4"`);
        await queryRunner.query(`ALTER TABLE "newsletter" DROP CONSTRAINT "FK_20f63020913bbfdc1835e080549"`);
        await queryRunner.query(`ALTER TABLE "saved_search" ADD CONSTRAINT "FK_397e5fcfff614ace7edf6831d5b" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription" ADD CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" ADD CONSTRAINT "FK_a9dd34a7c89d31227a4b4e2eb85" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unsubscribe" ADD CONSTRAINT "FK_f051628403f51d0b0e11c1aabf4" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "newsletter" ADD CONSTRAINT "FK_20f63020913bbfdc1835e080549" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "newsletter" DROP CONSTRAINT "FK_20f63020913bbfdc1835e080549"`);
        await queryRunner.query(`ALTER TABLE "unsubscribe" DROP CONSTRAINT "FK_f051628403f51d0b0e11c1aabf4"`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" DROP CONSTRAINT "FK_a9dd34a7c89d31227a4b4e2eb85"`);
        await queryRunner.query(`ALTER TABLE "subscription" DROP CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0"`);
        await queryRunner.query(`ALTER TABLE "saved_search" DROP CONSTRAINT "FK_397e5fcfff614ace7edf6831d5b"`);
        await queryRunner.query(`ALTER TABLE "newsletter" ADD CONSTRAINT "FK_20f63020913bbfdc1835e080549" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unsubscribe" ADD CONSTRAINT "FK_f051628403f51d0b0e11c1aabf4" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_search_notification" ADD CONSTRAINT "FK_a9dd34a7c89d31227a4b4e2eb85" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription" ADD CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_search" ADD CONSTRAINT "FK_397e5fcfff614ace7edf6831d5b" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
