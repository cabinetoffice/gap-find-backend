import { MigrationInterface, QueryRunner } from 'typeorm';

export class addFavouriteTable1794557432829 implements MigrationInterface {
    name = 'addFavouriteTable1794557432829';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "favourite" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "contentful_grant_id" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_44c3c1259797c600b3ec24d7690" UNIQUE ("userId", "contentful_grant_id"), CONSTRAINT "PK_56f1996fc2983d1895e4a8f3af3" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "favourite" ADD CONSTRAINT "FK_55262b1e0fdf72d3443562a9c3d" FOREIGN KEY ("userId") REFERENCES "gap_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "favourite" DROP CONSTRAINT "FK_55262b1e0fdf72d3443562a9c3d"`,
        );
        await queryRunner.query(`DROP TABLE "favourite"`);
    }
}
