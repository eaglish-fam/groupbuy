import {readFile,readdir,stat,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';

const assets=resolve(import.meta.dirname,'../trip/assets');
const widths=[640,960,1440];
const budgets=new Map([[640,120_000],[960,220_000],[1440,400_000]]);
const files=(await readdir(assets)).filter(name=>/^[a-z0-9-]+\.webp$/.test(name)&&!/-\d+\.webp$/.test(name));
let created=0;

for(const file of files){
 const source=resolve(assets,file);
 const {width}=await sharp(source).metadata();
 if(width<=1440&&(await stat(source)).size>budgets.get(1440))throw new Error(`${file} is too large for a desktop image; crop or compress it before publishing.`);
 const base=file.slice(0,-5);
 for(const targetWidth of widths){
  if(targetWidth>=width)continue; // Existing 1440 px originals remain the desktop variant.
  const dest=resolve(assets,`${base}-${targetWidth}.webp`);
  let encoded;
  for(const quality of [78,72,66,60]){
   encoded=await sharp(source).rotate().resize({width:targetWidth,withoutEnlargement:true}).webp({quality,effort:5}).toBuffer();
   if(encoded.length<=budgets.get(targetWidth))break;
  }
  if(encoded.length>budgets.get(targetWidth))throw new Error(`${file} ${targetWidth}px is ${encoded.length} bytes; budget ${budgets.get(targetWidth)}. Review the crop or source image.`);
  const existing=await readFile(dest).catch(()=>null);
  if(!existing?.equals(encoded)){
   await writeFile(dest,encoded);
   created++;
  }
 }
}
console.log(`Trip images: ${files.length} originals checked, ${created} responsive variants updated.`);
