import { Initial1648557645257 } from './migration/1648557645257-Initial';
import { createUserTable1651661608553 } from './migration/1651661608553-create-user-table';
import { createUsersFromSubscriptions1651661636362 } from './migration/1651661636362-create-users-from-subscriptions';
import { removeEmailFromSubscriptions1651662245821 } from './migration/1651662245821-remove-email-from-subscriptions';
import { createNewsletterTableWithUserTableFk1651842965660 } from './migration/1651842965660-create-newsletter-table-with-user-table-fk';
import { newsletterAndSubscriptionUpdateDateColumns1652662540627 } from './migration/1652662540627-newsletterAndSubscriptionUpdateDateColumns';
import { createSavedSearchTable1659002668795 } from './migration/1659002668795-create-saved-search-table';
import { addNameColumnToSavedSearch1659020134990 } from './migration/1659020134990-add-name-column-to-saved-search';
import { makeSavedSearchFieldsNullable1659445450675 } from './migration/1659445450675-make-saved-search-fields-nullable';
import { addSavedSearchNotificationTable1665671427114 } from './migration/1665671427114-add-saved-search-notification-table';
import { updateSchedulerEnum1665749813682 } from './migration/1665749813682-update-scheduler-enum';
import { setSavedSearchNotificationEmailStatusToFalse1665757421703 } from './migration/1665757421703-set-saved-search-notification-email-status-to-false';
import { addCreatedAtToSavedSearch1666103745975 } from './migration/1666103745975-add-createdAt-to-saved-search';
import { addSavedSearchNotificationScheduledJobType1666190904662 } from './migration/1666190904662-add-saved-search-notification-scheduled-job-type';
import { addSubColumnToGapUserTable1695306162401 } from './migration/1695306162401-add-sub-column-to-gap-user-table';
import { updateNewletterTypeAndScheduledJobTypeColumns1652100294076 } from './migration/1652100294076-updateNewletterTypeAndScheduledJobTypeColumns';
import { linkSavedSearchToSavedSearchNotification1696880123239 } from './migration/1696880123239-linkSaved_searchToSaved_search_notification';
import { addUnsubscribeReferenceTable1697725143044 } from './migration/1697725143044-addUnsubscribeReferenceTable';
import { cascadeDeleteUser1700651901473 } from './migration/1700651901473-cascade-delete-user';
import { addScheduledJobLock1707740504090 } from './migration/1707740504090-addScheduledJobLock';

const migrations = [
    Initial1648557645257,
    createUserTable1651661608553,
    createUsersFromSubscriptions1651661636362,
    removeEmailFromSubscriptions1651662245821,
    createNewsletterTableWithUserTableFk1651842965660,
    updateNewletterTypeAndScheduledJobTypeColumns1652100294076,
    newsletterAndSubscriptionUpdateDateColumns1652662540627,
    createSavedSearchTable1659002668795,
    addNameColumnToSavedSearch1659020134990,
    makeSavedSearchFieldsNullable1659445450675,
    addSavedSearchNotificationTable1665671427114,
    updateSchedulerEnum1665749813682,
    setSavedSearchNotificationEmailStatusToFalse1665757421703,
    addCreatedAtToSavedSearch1666103745975,
    addSavedSearchNotificationScheduledJobType1666190904662,
    addSubColumnToGapUserTable1695306162401,
    linkSavedSearchToSavedSearchNotification1696880123239,
    addUnsubscribeReferenceTable1697725143044,
    cascadeDeleteUser1700651901473,
    addScheduledJobLock1707740504090,
];

export { migrations };
