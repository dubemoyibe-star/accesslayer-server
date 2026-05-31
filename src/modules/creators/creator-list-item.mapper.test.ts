import { mapCreatorListItem } from './creator-list-item.mapper';
import { requestContextStorage } from '../../utils/als.utils';
import { logger } from '../../utils/logger.utils';

jest.mock('../../utils/logger.utils', () => ({
   logger: { warn: jest.fn() },
}));

const warnMock = logger.warn as jest.Mock;

beforeEach(() => {
   warnMock.mockClear();
});

describe('mapCreatorListItem()', () => {
   it('maps the public creator list item shape', () => {
      const input = {
         id: '1',
         displayName: 'John',
         avatarUrl: null,
         createdAt: new Date('2024-01-02T03:04:05.678Z'),
         updatedAt: new Date('2024-01-03T03:04:05.678Z'),
      } as any;

      const result = mapCreatorListItem(input);

      expect(result).toEqual({
         id: '1',
         name: 'John',
         avatar: null,
         followers: 0,
         createdAt: '2024-01-02T03:04:05.678Z',
         updatedAt: '2024-01-03T03:04:05.678Z',
      });
      expect(warnMock).not.toHaveBeenCalled();
   });

   it('warns when a schema-required creator field is unexpectedly null', () => {
      const input = {
         id: 'creator-1',
         displayName: null,
         avatarUrl: null,
         createdAt: new Date('2024-01-02T03:04:05.678Z'),
         updatedAt: new Date('2024-01-03T03:04:05.678Z'),
      } as any;

      const result = requestContextStorage.run(
         { path: '/api/v1/creators', method: 'GET', requestId: 'req-333' },
         () => mapCreatorListItem(input)
      );

      expect(result).toEqual({
         id: 'creator-1',
         name: null,
         avatar: null,
         followers: 0,
         createdAt: '2024-01-02T03:04:05.678Z',
         updatedAt: '2024-01-03T03:04:05.678Z',
      });
      expect(warnMock).toHaveBeenCalledWith({
         msg: 'Unexpected null creator field in database result',
         fieldName: 'displayName',
         creatorId: 'creator-1',
         requestId: 'req-333',
      });
   });
});
