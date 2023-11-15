import { ELASTIC_INDEX_FIELDS } from 'src/grant/grant.constants';
import { NewsletterType } from 'src/newsletter/newsletter.entity';
import { User } from 'src/user/user.entity';

type FilterArray = (
    | {
          bool: {
              must: {
                  bool: {
                      should:
                          | {
                                match_phrase: {
                                    [x: string]: string | object;
                                };
                            }
                          | {
                                range: {
                                    [x: string]: string | object;
                                };
                            };
                  };
              }[];
          };
      }
    | {
          multi_match: {
              query: string;
              operator: string;
              fuzziness: string;
              fields: ELASTIC_INDEX_FIELDS[];
          };
      }
)[];

const NOTIFICATION_TYPES = {
    GRANT_SUBSCRIPTION: 'GRANT_SUBSCRIPTION',
    SAVED_SEARCH: 'SAVED_SEARCH',
    NEWSLETTER: 'NEWSLETTER',
} as const;

type V2BuildNotificationProps = {
    subscriptionId?: string;
    newsletterId?: NewsletterType;
    savedSearchId?: number;
    user: User;
};

export { V2BuildNotificationProps, FilterArray, NOTIFICATION_TYPES };
