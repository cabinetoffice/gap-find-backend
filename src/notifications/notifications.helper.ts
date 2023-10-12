import { Subscription } from 'src/subscription/subscription.entity';
import { getUserServiceEmailsBySubs } from 'src/user/user.api';

export const getUserServiceEmailsBySubIfFFEnabled = async (
    batch: Subscription[],
) => {
    if (process.env.FEATURE_FLAG_USER_SERVICE_EMAILS === 'true') {
        const subscriptonswithUserWithSub = batch.filter(
            (subscription: Subscription) => subscription.user.sub,
        );
        return await getUserServiceEmailsBySubs(subscriptonswithUserWithSub);
    }
};

export const bacthJobCalc = (subscriptionCount: number) => {
    const batches = Math.ceil(
        subscriptionCount / parseInt(process.env.SUBSCRIPTIONS_PER_BATCH),
    );
    return batches;
};

export const emailFromUserService = (
    emailMap: any,
    subscription: Subscription,
) => {
    if (subscription.user.sub) {
        const email = emailMap.get(subscription.user.sub);
        if (email) {
            return email;
        }
    }
};

export const getBatchFromSubscriptions = (
    subscriptions: Subscription[],
    batch: number,
    totalBatches: number,
) => {
    const start = batch * parseInt(process.env.SUBSCRIPTIONS_PER_BATCH);
    const end = start + parseInt(process.env.SUBSCRIPTIONS_PER_BATCH);
    if (batch === totalBatches - 1) {
        return subscriptions.slice(start);
    }
    return subscriptions.slice(start, end);
};
