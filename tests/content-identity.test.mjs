import assert from 'node:assert/strict';
import test from 'node:test';
import {articleIdentity} from '../scripts/content-identity.mjs';
test('known product article gets an explicit product identity',()=>{
 assert.deepEqual(articleIdentity('playzu',{id:'playzu',brands:['Playzu']}),{productNames:['Playzu'],productId:'playzu',mode:'product',intent:'product:playzu'});
});
test('problem and comparison metadata survives a rebuild and allows shared intent',()=>{
 const meta={mode:'comparison',intent:'baby-floor-mat-choice',productNames:['Playzu','ALZiPMAT']};
 assert.deepEqual(articleIdentity('mat-choice',null,meta),{...meta,productId:null});
 assert.equal(articleIdentity('mat-compare',null,meta).intent,'baby-floor-mat-choice');
});
test('new non-product pages need reviewed identity, never silently become product articles',()=>{
 assert.throws(()=>articleIdentity('unknown',null),/needs reviewed/);
 assert.throws(()=>articleIdentity('unknown',null,{mode:'random',intent:'',productNames:[]}),/Invalid reviewed/);
});
