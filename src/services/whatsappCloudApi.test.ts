import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyMetaSignature } from './whatsappCloudApi.ts';

test('accepts a valid Meta signature over the raw request body', () => {
  const body = Buffer.from('{"object":"whatsapp_business_account"}');
  const secret = 'test-secret';
  const signature = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(verifyMetaSignature(body, signature, secret), true);
});

test('rejects missing, malformed, and incorrect signatures', () => {
  const body = Buffer.from('{"test":true}');
  assert.equal(verifyMetaSignature(body, undefined, 'secret'), false);
  assert.equal(verifyMetaSignature(body, 'sha256=invalid', 'secret'), false);
  assert.equal(verifyMetaSignature(body, 'sha256=' + 'a'.repeat(64), ''), false);
});

test('rejects a signature calculated for a different body', () => {
  const body = Buffer.from('{"test":true}');
  const signature = 'sha256=' + createHmac('sha256', 'secret').update('different').digest('hex');
  assert.equal(verifyMetaSignature(body, signature, 'secret'), false);
});
