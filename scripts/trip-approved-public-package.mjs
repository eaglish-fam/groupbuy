import {readFileSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
export const publicPackageHash=b=>createHash('sha256').update(b).digest('hex');
const confined=(root,path)=>{const base=realpathSync(root),file=realpathSync(resolve(base,path));if(!file.startsWith(base+sep))throw Error('Public package symlink/path escape');return file;};
export async function readApprovedTravelPackage(root,{dataPath,expectedSha256,...coverage}){
 if(!/^trip\/data\/[a-z0-9-]+\.json$/.test(dataPath)||!/^[a-f0-9]{64}$/.test(expectedSha256))throw Error('Frozen repository public package required');
 const bytes=readFileSync(confined(root,dataPath));if(publicPackageHash(bytes)!==expectedSha256)throw Error('Public article bytes changed');
 const view=validateApprovedTravelPackage(JSON.parse(bytes),coverage),urls=new Set();let checked=0;
 for(const asset of view.assets.values())for(const variant of [...asset.variants,...(asset.cardPhoto?.variants||[])]){
  if(urls.has(variant.url))throw Error('Multiple assets claim the same variant URL');urls.add(variant.url);
  const b=readFileSync(confined(root,variant.url.slice(1)));
  if(b.length!==variant.bytes||publicPackageHash(b)!==variant.sha256)throw Error('Public WebP byte closure mismatch');
  const meta=await sharp(b).metadata();if(meta.format!=='webp'||meta.width!==variant.width||meta.height!==variant.height)throw Error('Public WebP dimensions/format mismatch');checked++;
 }
 for(const diagram of view.diagrams.values()){
  const b=readFileSync(confined(root,diagram.url.slice(1))),svg=b.toString('utf8');
  if(b.length!==diagram.bytes||publicPackageHash(b)!==diagram.sha256)throw Error('Public diagram byte closure mismatch');
  // External SVG is a self-contained illustration, never a photo or executable embed.
  if(!svg.startsWith('<svg ')||!svg.includes(`width="${diagram.width}" height="${diagram.height}"`)||/<(?:script|foreignObject|image|use|style)\b|\bon[a-z]+\s*=|\b(?:href|xlink:href)\s*=|<!DOCTYPE|<!ENTITY|url\(\s*[^#]|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i.test(svg))throw Error('Unsafe or malformed public diagram SVG');
 }
 return {...view,articleSha256:expectedSha256,verifiedVariants:checked,verifiedDiagrams:view.diagrams.size};
}
