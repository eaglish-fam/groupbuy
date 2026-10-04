import {createHash} from 'node:crypto';

// Critical reader information must not depend on Bangkok's external stylesheet
// finishing its request. Plain, Singapore-scoped rules preserve the approved
// component even if that dependency is absent; other pages are unaffected.
export const singaporePracticalCss=`
.sg-guide .prose .bkk-facts{box-sizing:border-box;min-width:0;background:#faf7f0;color:#494139;border:1px solid #dcd5c9;border-radius:3px;margin:26px 0;padding:8px 20px}
.sg-guide .prose .bkk-facts>div{display:grid;grid-template-columns:90px minmax(0,1fr);gap:12px;padding:13px 0;border-bottom:1px solid #dcd5c9;font-size:14px;line-height:1.8}
.sg-guide .prose .bkk-facts>div:last-child{border-bottom:0}
.sg-guide .prose .bkk-facts dt{min-width:0;font-weight:700;overflow-wrap:break-word}
.sg-guide .prose .bkk-facts dd{min-width:0;margin:0;overflow-wrap:break-word;word-break:normal}
.sg-guide .prose .bkk-experience{box-sizing:border-box;min-width:0;background:#faf7f0;color:#494139;border-left:3px solid #c4af91;padding:20px 24px;margin:24px 0;overflow-wrap:break-word}
.sg-guide .prose .bkk-experience h3{font-size:17px;font-weight:700;line-height:1.8;margin:0 0 10px}
.sg-guide .prose .bkk-experience p{font-size:14px;line-height:1.8;margin:0}
.sg-guide .prose .bkk-experience .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.sg-guide .prose .bkk-experience+.actions{min-width:0}
.sg-guide .prose .bkk-experience+h3{color:#784b39;font-size:21px;font-weight:700;border-left:3px solid #bb7658;padding-left:12px;margin:32px 0 13px;line-height:1.55}
@media(max-width:700px){.sg-guide .prose .bkk-facts>div{grid-template-columns:minmax(0,1fr);gap:3px}}
`.trim();
export const singaporePracticalStyleHash=createHash('sha256').update(singaporePracticalCss).digest('hex');
export const renderSingaporePracticalStyle=()=>`<style data-sg-practical-style="v1" data-style-sha256="${singaporePracticalStyleHash}">${singaporePracticalCss}</style>`;
