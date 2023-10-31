import { Subscription } from '../subscription/subscription.entity';
import { User } from '../user/user.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class createUsersFromSubscriptions1651661636362
    implements MigrationInterface
{
    name = 'createUsersFromSubscriptions1651661636362';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const subscriptions = await queryRunner.query(
            'SELECT * FROM subscription',
        );
        for (const subscription of subscriptions) {
            let user = await queryRunner.manager.findOne(User, {
                where: {
                    hashedEmailAddress: subscription.hashed_email_address,
                },
            });

            if (!user) {
                user = await queryRunner.manager.save(User, {
                    hashedEmailAddress: subscription.hashed_email_address,
                    encryptedEmailAddress: subscription.encrypted_email_address,
                });
            }

            await queryRunner.manager.update(
                Subscription,
                { id: subscription.id },
                { user: user },
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const users = await queryRunner.query(
            'SELECT * FROM "public".gap_user',
        );
        for (const user of users) {
            await queryRunner.query(
                `UPDATE public.subscription SET encrypted_email_address ='${user.encrypted_email_address}', hashed_email_address = '${user.hashed_email_address}' WHERE subscription."userId" = ${user.id}`,
            );
        }
    }
}
