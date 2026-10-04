import assert from 'node:assert/strict';
import {login,ok} from './client.mjs';
const a=await login(),b=await login(true);let checks=0;
assert.notEqual(ok(await a.auth.getUser()).user.id,ok(await b.auth.getUser()).user.id,'TEST accounts must be different');
function check(value,label){assert.ok(value,label);checks++;console.log(`PASS ${label}`);}
const p=ok(await a.rpc('save_product',{p_id:null,p_data:{sku:'LIVE-'+crypto.randomUUID().slice(0,8),name:'Fictional test pens',category:'Testing',price_centavos:1250,opening_quantity:10,low_stock_threshold:3,image_path:null}}));
async function state(){return {p:ok(await a.from('products').select('*').eq('id',p.id).single()),m:ok(await a.from('stock_movements').select('*').eq('product_id',p.id))};}
const move=(quantity,type='IN',id=crypto.randomUUID())=>a.rpc('adjust_stock',{p_product_id:p.id,p_quantity:quantity,p_type:type,p_note:'Live integration test',p_request_id:id});
check((await state()).m.length===1,'opening movement');
const key=crypto.randomUUID();ok(await move(5,'IN',key));ok(await move(5,'IN',key));check((await state()).p.quantity===15&&(await state()).m.length===2,'idempotent replay');
check(!!(await move(6,'IN',key)).error,'idempotency payload conflict');ok(await move(3,'OUT'));check((await state()).p.quantity===12,'10 + 5 - 3 persists as 12');
const before=await state();check(!!(await move(13,'OUT')).error,'overdraw rejected');check(!!(await move(1.5)).error,'fraction rejected');check(!!(await move(-1)).error,'negative rejected');const after=await state();check(after.p.quantity===before.p.quantity&&after.m.length===before.m.length,'failed transactions leave balance and history unchanged');
const concurrent=await Promise.all([move(8,'OUT'),move(8,'OUT')]);check(concurrent.filter(r=>!r.error).length===1&&(await state()).p.quantity===4,'competing withdrawals serialized');
check(ok(await b.from('products').select('*').eq('id',p.id)).length===0,'other owner cannot read product');check(ok(await b.from('stock_movements').select('*').eq('product_id',p.id)).length===0,'other owner cannot read history');
check(!!(await b.rpc('adjust_stock',{p_product_id:p.id,p_quantity:1,p_type:'IN',p_note:'Forbidden',p_request_id:crypto.randomUUID()})).error,'other owner cannot adjust');
check(!!(await a.from('products').update({quantity:999}).eq('id',p.id)).error,'direct balance update forbidden');check(!!(await a.from('stock_movements').insert({product_id:p.id})).error,'fabricated movement forbidden');
ok(await a.rpc('manage_product',{p_id:p.id,p_action:'archive'}));check(!!(await move(1)).error,'archived adjustment denied');check(!!(await a.rpc('manage_product',{p_id:p.id,p_action:'delete'})).error,'history prevents deletion');
const user=ok(await a.auth.getUser()).user;const path=`${user.id}/${crypto.randomUUID()}.png`;const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aI1sAAAAASUVORK5CYII=','base64');ok(await a.storage.from('product-photos').upload(path,png,{contentType:'image/png'}));check(!!ok(await a.storage.from('product-photos').createSignedUrl(path,60)).signedUrl,'real private upload and signed URL');check(!!(await b.storage.from('product-photos').download(path)).error,'other owner cannot read image');
console.log(`Completed ${checks} live assertions. Retained archived test product ${p.id} and unreferenced photo ${path}; obtain approval before cleanup.`);
