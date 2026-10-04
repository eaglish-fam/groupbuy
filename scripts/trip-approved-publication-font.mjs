import {readFileSync} from 'node:fs';
// Add only missing glyphs to the existing family; no font stack or page layout
// override. This style is emitted only by the approved publication adapter.
export function approvedPublicationFont(){
 const glyphs=readFileSync(new URL('../assets/fonts/approved-travel-heading-glyphs-v1.txt',import.meta.url),'utf8').trim();
 if(new Set(glyphs).size!==37||[...glyphs].length!==37)throw Error('Reviewed heading supplement changed');
 const range=[...glyphs].map(c=>'U+'+c.codePointAt(0).toString(16).toUpperCase()).join(',');
 return `<style data-approved-publication-font>@font-face{font-family:"Eaglish Heading Serif";src:url("/assets/fonts/noto-serif-tc-approved-travel-v1.woff2") format("woff2");font-style:normal;font-weight:500;font-display:swap;unicode-range:${range}}</style>`;
}
