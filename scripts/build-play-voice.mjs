// GB-028: 角色卡體驗的 AI 語音（VoAI）。手動執行，不在 CI 跑：會用掉 VoAI 儲值點數（Hiram 2026-11-04 同意使用）。
//   node scripts/build-play-voice.mjs [--only shihan,kexin] [--dry-run]
// 金鑰由執行環境的 proxy 注入（只到 connect.voai.ai），程式只送佔位值，repo 裡沒有金鑰。
// 規則（照 Claire 的 VoAI 流程）：送前送後查 /Key/Usage，降幅要等於每段 x-used-quota 的加總；任何非 200 立刻停，不自動重送。
// 只送預設角色的故事文字；使用者自己輸入的名字（孩子、寵物）永遠不送 VoAI。
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';

const root=new URL('../',import.meta.url);
const require=createRequire(import.meta.url);
require('../play/characters.js');
const P=globalThis.PlayCharacters;
const API='https://connect.voai.ai';
const NARRATOR={speaker:'詠芯',style:'旁白'};
export const VOICES={kexin:{speaker:'竹均',style:'開心'},shihan:{speaker:'樂晰',style:'聊天'},jiahao:{speaker:'子墨',style:'開心'},yating:{speaker:'璦廷',style:'聊天'},peishan:{speaker:'欣妤',style:'預設'},shufen:{speaker:'悅青',style:'預設'},chenghan:{speaker:'諭書',style:'開心'},yizhen:{speaker:'凡萱',style:'預設'}};

const num=['零','一','二','三','四','五','六','七','八','九','十','十一','十二'];
const minutes=m=>m===0?'':m===30?'半':m<10?`零${num[m]}分`:`${m>=20?num[Math.floor(m/10)]:''}十${m%10?num[m%10]:''}分`.replace(/^十/,'十');
export function spokenTime(t){
  const m=String(t).match(/^(\d{1,2}):(\d{2})$/);
  if(!m)return t;
  const h=Number(m[1]),mm=Number(m[2]);
  const part=h<5?'凌晨':h<11?'早上':h<13?'中午':h<18?'下午':'晚上';
  const h12=h%12===0?12:h%12;
  return `${part}${num[h12]}點${minutes(mm)}`;
}
const pron=c=>c.gender==='m'?'他':'她';
export function lines(c){
  const out=[{key:`${c.id}/intro`,voice:NARRATOR,text:`${c.name}，${c.age}歲，${c.role.replace(/・/g,"，")}。${c.story}${pron(c)}的目標是：${c.goal}。`}];
  c.day.forEach((s,i)=>{
    out.push({key:`${c.id}/s${i}`,voice:NARRATOR,text:`${spokenTime(s.time)}，${s.title}。${s.text}`});
    out.push({key:`${c.id}/r${i}`,voice:VOICES[c.id],text:s.reaction.replace(/[「」]/g,'')});
  });
  return out;
}
export const textHash=t=>createHash('sha256').update(t).digest('hex').slice(0,16);

function usage(){
  const out=execFileSync('curl',['-sS','--fail-with-body',`${API}/Key/Usage`,'-H','x-api-key: proxy'],{encoding:'utf8'});
  return JSON.parse(out).data.current;
}
function synth(line,file){
  const tmp=file+'.raw.mp3',hdr=file+'.headers';
  const body=JSON.stringify({version:'Neo',text:line.text,speaker:line.voice.speaker,style:line.voice.style,speed:1,pitch_shift:0});
  const code=execFileSync('curl',['-sS','-o',tmp,'-D',hdr,'-w','%{http_code}',`${API}/TTS/Speech`,'-H','x-api-key: proxy','-H','x-output-format: mp3','-H','Content-Type: application/json','--data-binary',body],{encoding:'utf8'}).trim();
  const headers=readFileSync(hdr,'utf8');rmSync(hdr);
  if(code!=='200'){const msg=existsSync(tmp)?readFileSync(tmp,'utf8').slice(0,200):'';rmSync(tmp,{force:true});throw Error(`VoAI ${code} on ${line.key}: ${msg}（停止，不自動重送）`);}
  const quota=Number((headers.match(/x-used-quota:\s*(\d+)/i)||[])[1]);
  // 單聲道 48kbps，網站載入比較輕；原始檔不進 repo。
  execFileSync('ffmpeg',['-y','-loglevel','error','-i',tmp,'-ac','1','-b:a','48k',file]);
  rmSync(tmp);
  return quota;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const args=process.argv.slice(2);
  const only=args.includes('--only')?(args[args.indexOf('--only')+1]||'').split(',').filter(Boolean):[];
  const dry=args.includes('--dry-run');
  const manifestFile=new URL('play/voice-manifest.json',root);
  const manifest=existsSync(manifestFile)?JSON.parse(readFileSync(manifestFile,'utf8')):{schema:'eaglish.play-voice/v1',note:'由 scripts/build-play-voice.mjs 產生（VoAI，AI 語音）。只有文字雜湊相符的段落才會播放。',narrator:NARRATOR,voices:VOICES,items:{},ledger:[]};
  const todo=P.characters.filter(c=>!only.length||only.includes(c.id)).flatMap(lines)
    .filter(l=>manifest.items[l.key]?.hash!==textHash(l.text));
  const chars=todo.reduce((n,l)=>n+[...l.text].length,0);
  console.log(`要產生 ${todo.length} 段、約 ${chars} 字（點）`);
  if(dry||!todo.length)process.exit(0);
  const before=usage();
  let used=0;const done=[];
  try{
    for(const l of todo){
      const rel=`assets/play/voice/${l.key}.mp3`;
      mkdirSync(new URL(rel.replace(/[^/]+$/,''),root),{recursive:true});
      const q=synth(l,new URL(rel,root).pathname);
      used+=q;done.push(l.key);
      manifest.items[l.key]={file:'/'+rel,hash:textHash(l.text),text:l.text,speaker:l.voice.speaker,style:l.voice.style,quota:q};
      process.stdout.write('.');
    }
  }finally{
    const after=usage();
    const entry={at:new Date().toISOString(),segments:done.length,quotaHeaders:used,usageBefore:before,usageAfter:after,usageDrop:before-after,match:before-after===used};
    manifest.ledger.push(entry);
    writeFileSync(manifestFile,JSON.stringify(manifest,null,1)+'\n');
    console.log('\n',entry);
    if(!entry.match){console.error('點數降幅和 x-used-quota 加總不符，停下來查。');process.exitCode=1;}
  }
}
