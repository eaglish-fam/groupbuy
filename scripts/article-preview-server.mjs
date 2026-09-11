import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname.split('/').some(p=>p.startsWith('.'))||/^\/(node_modules|reports|docs|config|scripts|tests|src)(\/|$)/.test(pathname)||pathname==='/sw.js')throw Error('Private path');
    let path=resolve(root,'.'+pathname);
    if(path!==root&&!path.startsWith(root+sep))throw Error('Outside root');
    if((await stat(path)).isDirectory())path=resolve(path,'index.html');
    const data=await readFile(path);
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(8778,'127.0.0.1',()=>console.log('Article candidate: http://127.0.0.1:8778/blog/playzu/'));
