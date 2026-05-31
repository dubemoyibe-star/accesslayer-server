import { CreatorProfile } from '../../types/profile.types';
import { requestContextStorage } from '../../utils/als.utils';
import { formatIsoTimestamp } from '../../utils/iso-timestamp.utils';
import { logger } from '../../utils/logger.utils';
import { safeRead } from '../../utils/safe-nested-read.utils';

/**
 * Locked output shape for creator list items.
 * Keep this minimal and explicit to avoid leaking internal fields.
 */
export type CreatorListItem = {
   id: string;
   name: string | null;
   avatar: string | null;
   followers: number;
   createdAt: string;
   updatedAt: string;
};

function warnIfUnexpectedNullCreatorField(
   creator: CreatorProfile,
   fieldName: 'displayName'
): void {
   const rawCreator = creator as CreatorProfile & Record<string, unknown>;

   if (rawCreator[fieldName] !== null) {
      return;
   }

   logger.warn({
      msg: 'Unexpected null creator field in database result',
      fieldName,
      creatorId: creator.id,
      requestId: requestContextStorage.getStore()?.requestId ?? null,
   });
}

/**
 * Pure, dumb mapper from a full `CreatorProfile` to a `CreatorListItem`.
 * No filtering, no business logic — deterministic and predictable.
 */
export const mapCreatorListItem = (
   creator: CreatorProfile
): CreatorListItem => {
   warnIfUnexpectedNullCreatorField(creator, 'displayName');

   return {
      id: creator.id,
      name: safeRead(creator, 'displayName', null),
      avatar: safeRead(creator, 'avatarUrl', null),
      followers: 0,
      createdAt: formatIsoTimestamp(creator.createdAt),
      updatedAt: formatIsoTimestamp(creator.updatedAt),
   };
};
