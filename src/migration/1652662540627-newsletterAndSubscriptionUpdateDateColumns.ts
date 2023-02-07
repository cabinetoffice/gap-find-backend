import { Subscription } from "../subscription/subscription.entity";
import {MigrationInterface, QueryRunner} from "typeorm";
import { DateTime} from "luxon";
import { Newsletter } from "../newsletter/newsletter.entity";

export class newsletterAndSubscriptionUpdateDateColumns1652662540627 implements MigrationInterface {
    name = 'newsletterAndSubscriptionUpdateDateColumns1652662540627'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const subscriptions = await queryRunner.query(
            'SELECT * FROM subscription',
        );

        const newsletters = await queryRunner.query(
            'SELECT * FROM newsletter',
        );

        await queryRunner.query(`ALTER TABLE "subscription" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "subscription" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "subscription" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "subscription" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "newsletter" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "newsletter" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "newsletter" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "newsletter" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);

        const timezone = 'utc'
        await this.updateColumnDate(queryRunner, Subscription, subscriptions, timezone);
        await this.updateColumnDate(queryRunner, Newsletter, newsletters, timezone);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const subscriptions = await queryRunner.query(
            'SELECT * FROM subscription',
        );

        const newsletters = await queryRunner.query(
            'SELECT * FROM newsletter',
        );

        await queryRunner.query(`ALTER TABLE "newsletter" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "newsletter" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "newsletter" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "newsletter" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "subscription" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "subscription" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "subscription" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "subscription" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);

        const timezone = 'Europe/London'
        await this.updateColumnDate(queryRunner, Subscription, subscriptions, timezone);
        await this.updateColumnDate(queryRunner, Newsletter, newsletters, timezone);
    }

    private async updateColumnDate(queryRunner: QueryRunner, type: any, rows: any, timezone: string) {
        for (const row of rows) {
            const updatedCreatedAt = DateTime.fromJSDate(row.createdAt).setZone(timezone, { keepLocalTime: true }).toJSDate();
            const updatedUpdatedAt = DateTime.fromJSDate(row.createdAt).setZone(timezone, { keepLocalTime: true }).toJSDate();

            await queryRunner.manager.update(
                type,
                { id: row.id },
                {
                    createdAt: updatedCreatedAt,
                    updatedAt: updatedUpdatedAt
                }
            );
        }
    }
}
