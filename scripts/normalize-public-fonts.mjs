import {readFileSync,writeFileSync,readdirSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const htmlFiles=['index.html',...['blog','trip','flights','design'].flatMap(directory=>{
  const walk=(path)=>readdirSync(new URL(path+'/',root),{withFileTypes:true}).flatMap(entry=>{
    const name=path+'/'+entry.name;
    return entry.isDirectory()?walk(name):entry.isFile()&&entry.name.endsWith('.html')?[name]:[];
  });
  return walk(directory);
})];
const generatorFiles=readdirSync(new URL('scripts/',root)).filter(name=>/^build-trip.*\.mjs$/.test(name)).map(name=>'scripts/'+name);
const cssFiles=['design/design.css','design/mobile-grid.css','blog/blog.css','articles/article.css',
  'trip/trip.css','trip/planner-entry.css','flights/flights.css','site-navigation.css','style.css',
  'blog/lange/lange.css','blog/shoumaji/shoumaji.css'];

function removeRemoteFonts(source){
  return source.replace(/<link\b[^>]*>/gi,tag=>{
    if(/fonts\.googleapis\.com\/css2|(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*preconnect|preconnect[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)/i.test(tag))return '';
    return tag;
  }).replace(/^[ \t]+$/gm,'');
}
function useSystemFonts(source){
  return source.replace(/(['"])Noto Serif TC\1/g,'"Songti TC", "PMingLiU"')
    .replace(/(['"])Noto Sans TC\1/g,'-apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei"')
    .replace(/(['"])LXGW WenKai TC\1/g,'"BiauKai", "KaiTi", "Songti TC"')
    .replace(/"Songti TC", "PMingLiU",\s*(['"])Songti TC\1/g,'"Songti TC", "PMingLiU"')
    .replace(/"BiauKai", "KaiTi", "Songti TC",\s*(['"])BiauKai\1,\s*(['"])KaiTi\2/g,'"BiauKai", "KaiTi", "Songti TC"');
}
let changed=0;
for(const path of [...htmlFiles,...generatorFiles,...cssFiles]){
  const file=new URL(path,root),original=readFileSync(file,'utf8');
  const updated=path.endsWith('.css')?useSystemFonts(original):removeRemoteFonts(original);
  if(updated!==original){writeFileSync(file,updated);changed++;}
}
console.log(`Normalized public system fonts in ${changed} files; Songti TC remains the primary serif`);
