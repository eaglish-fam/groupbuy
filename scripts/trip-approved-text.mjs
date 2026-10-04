import {publicUrl} from '../trip/approved-travel-contract.mjs';
export const escapeApprovedText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Editorial exports contain inline Markdown links, not executable HTML.
// Balanced URL parentheses preserve official links; all markup is escaped.
export function approvedInlineTokens(value){
 const input=String(value??''),tokens=[];let cursor=0,search=0;
 while(search<input.length){
  const start=input.indexOf('[',search);if(start<0)break;
  const labelEnd=input.indexOf('](',start+1);if(labelEnd<0)break;
  let end=labelEnd+2,depth=1;
  for(;end<input.length;end++){if(input[end]==='(')depth++;if(input[end]===')'&&!--depth)break;}
  if(depth){search=start+1;continue;}
  const url=input.slice(labelEnd+2,end).replaceAll("'",'%27'),label=input.slice(start+1,labelEnd);
  if(!label||label.includes('[')||!/^(https:\/\/|\/trip\/|#)/.test(url)){search=end+1;continue;}
  publicUrl(url);
  if(start>cursor)tokens.push({text:input.slice(cursor,start)});
  tokens.push({url,label});cursor=end+1;search=cursor;
 }
 if(cursor<input.length)tokens.push({text:input.slice(cursor)});
 return tokens;
}
export const approvedInlineText=value=>approvedInlineTokens(value).map(t=>t.url?`<a href="${escapeApprovedText(t.url)}"${t.url.startsWith('https://')?' target="_blank" rel="noopener noreferrer"':''}>${escapeApprovedText(t.label)}</a>`:escapeApprovedText(t.text)).join('');
export const approvedPlainText=value=>approvedInlineTokens(value).map(t=>t.label??t.text).join('');
export const approvedParagraphs=values=>values.map(v=>`<p>${approvedInlineText(v)}</p>`).join('');
