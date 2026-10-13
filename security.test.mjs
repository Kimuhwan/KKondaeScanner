import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
for (const path of ['api/chat.js']) {
 const source = await readFile(new URL(path, import.meta.url), 'utf8');
 const {default: handler} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
 test(path + ' rejects bad requests before fetch', async () => {
  const original=globalThis.fetch;
  globalThis.fetch=()=>{throw new Error('Unexpected network call')};
  try {
   for (const [method, body, expected] of [['GET',{},405],['POST',null,400],['POST',{text:7},400],['POST',{text:' '},400],['POST',{text:'x'.repeat(4001)},400]]) {
    let status;
    const res={setHeader(){},status(n){status=n;return this},json(x){return x}};
    await handler({method,body},res); assert.equal(status,expected);
   }
  } finally {globalThis.fetch=original}
 });
 test(path + ' handles upstream errors without exposing detail', async () => {
  const original=globalThis.fetch;
  process.env.GEMINI_API_KEY='test-only';process.env.GROQ_API_KEY='test-only';
  globalThis.fetch=async()=>({ok:false,json:async()=>({error:{message:'PRIVATE_UPSTREAM_DETAIL'}})});
  let status,payload;
  const res={setHeader(){},status(n){status=n;return this},json(x){payload=x;return x}};
  try {await handler({method:'POST',body:{text:'hello'}},res); assert.equal(status,500);assert.ok(!JSON.stringify(payload).includes('PRIVATE_UPSTREAM_DETAIL'));}
  finally {globalThis.fetch=original;delete process.env.GEMINI_API_KEY;delete process.env.GROQ_API_KEY}
 });
}
