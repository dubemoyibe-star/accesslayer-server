import { strict as assert } from 'assert';
import { mapCreatorListItem } from './creator-list-item.mapper';
import { createSeededCreatorFixture } from '../../utils/test/seeded-creator-fixtures.utils';

function run() {
   const input = createSeededCreatorFixture(1);

   const result = mapCreatorListItem(input);

   assert.deepEqual(result, {
      id: 'creator-1',
      name: 'Creator 1',
      avatar: 'https://example.com/avatar-1.png',
      followers: 0,
   });

   console.log('creator-list-item.mapper test passed');
}

run();
