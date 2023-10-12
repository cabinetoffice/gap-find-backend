import axios from 'axios';
import { Subscription } from 'src/subscription/subscription.entity';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

// TODO: Auth and hashing when decided in migration
export const getUserServiceEmailsBySubs = async (userSubs: Subscription[]) => {
    const subs = userSubs.map((subscriptions) => {
        return { sub: subscriptions.user.sub };
    });

    const response = await axios.post(USER_SERVICE_URL + '/users/emails', subs);
    return response.data;
};
