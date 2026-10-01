import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCALE, MESSAGES } from '../src/i18n.js';

test('default locale exists', () => {
  assert.ok(MESSAGES[LOCALE]);
});

for (const [locale, messages] of Object.entries(MESSAGES)) {
  test(`locale ${locale} matches fr keys and shapes`, () => {
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(MESSAGES.fr).sort());
    for (const [key, value] of Object.entries(MESSAGES.fr)) {
      assert.equal(typeof messages[key], typeof value, key);
      if (Array.isArray(value)) assert.equal(messages[key].length, value.length, key);
    }
  });
}
