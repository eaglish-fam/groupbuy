import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const ROOT=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=(p)=>readFileSync(resolve(ROOT,p),'utf8');
const write=(p,s)=>writeFileSync(resolve(ROOT,p),s);
const cardPattern=/<article\b[^>]*data-article="playzu"[\s\S]*?<\/article>/;
const productPattern=/^.*playzu:\{.*article:'\/blog\/playzu\/'.*$/m;
const legacyPath='config/article-variants/playzu/all-series.json';
const origin='https://www.eaglish.store';
const escape=(s)=>s.replaceAll('&','&amp;').replaceAll('"','&quot;');

export function renderVintage(legacy, version, fragment) {
  let html=legacy.html.replace(/(<main id="article"><article>)[\s\S]*?(<\/article>)/,`$1${fragment}$2`);
  html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${version.title}</title>`);
  for (const [key,value] of Object.entries({description:version.description,'og:title':version.title,'og:description':version.description,'og:image':origin+version.cover,'og:image:alt':version.coverAlt,'twitter:title':version.title,'twitter:description':version.description,'twitter:image':origin+version.cover,'twitter:image:alt':version.coverAlt})) {
    const matcher=new RegExp(`<meta\\b[^>]*(?:name|property)="${key}"[^>]*>`);
    html=html.replace(matcher,(tag)=>tag.replace(/content="[^"]*"/,`content="${escape(value)}"`));
  }
  html=html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/,(_,open,raw,close)=>{
    const data=JSON.parse(raw),article=data['@graph'].find(x=>x['@type']==='Article');
    Object.assign(article,{headline:version.h1,description:version.description,image:[origin+version.cover],dateModified:version.dateModified,keywords:['Playzu 地墊','Playzu 復古系列','復古地墊花色','地墊尺寸與清潔']});
    return open+JSON.stringify(data)+close;
  });
  html=html.replace('/blog/playzu/playzu.css?v=1','/blog/playzu/playzu.css?v=20261006-vintage');
  // Keep immutable editorial snapshots intact, but render current shared UI assets.
  const navigationVersion=createHash('sha256').update(read('site-navigation.css')).digest('hex').slice(0,12);
  html=html.replace(/(href="\/site-navigation\.css\?v=)[^"]+(")/g,`$1${navigationVersion}$2`);
  return html;
}

if(process.argv[1]===fileURLToPath(import.meta.url)) {
  if(process.argv.includes('--capture-legacy')) {
    if(existsSync(resolve(ROOT,legacyPath))) throw Error('Legacy snapshot already exists; refusing to replace it');
    mkdirSync(resolve(ROOT,'config/article-variants/playzu'),{recursive:true});
    const html=read('blog/playzu/index.html'),card=read('blog/index.html').match(cardPattern)?.[0],product=read('product-content.js').match(productPattern)?.[0];
    if(!card||!product) throw Error('Playzu registration not found');
    write(legacyPath,JSON.stringify({html,card,product,baseCommit:'e2bac4e',coverReview:JSON.parse(read('config/blog-cover-identities.json')).articles['/blog/playzu/']||null},null,2)+'\n');
    console.log('Captured original multi-series Playzu article and its exact registrations.');
  } else {
    const config=JSON.parse(read('config/playzu-article-versions.json'));
    const versionName=process.argv.includes('--version')?process.argv[process.argv.indexOf('--version')+1]:config.activeVersion;
    const version=config.versions[versionName];
    if(!version) throw Error('Unknown Playzu article version');
    const legacy=JSON.parse(read(legacyPath));
    const html=versionName==='all-series'?legacy.html:renderVintage(legacy,version,read(version.source));
    const outputIndex=process.argv.indexOf('--output');
    if(outputIndex!==-1) {
      writeFileSync(resolve(process.argv[outputIndex+1]),html);
      console.log(`Rendered ${versionName} to explicit preview output; site files untouched.`);
    } else {
      write('blog/playzu/index.html',html);
      let card=legacy.card,product=legacy.product;
      if(versionName==='vintage') {
        card=card.replaceAll('/assets/playzu/cover','/assets/playzu/vintage-cover').replace(/alt="[^"]*"/,`alt="${version.coverAlt}"`).replace(/(<h3><a[^>]*>)[\s\S]*?(<\/a><\/h3>)/,`$1${version.cardTitle}$2`).replace(/<p>[^<]*<\/p>/,`<p>${version.excerpt}</p>`);
        product=product.replace(/title:'[^']*'/,`title:'${version.cardTitle}'`).replace(/excerpt:'[^']*'/,`excerpt:'${version.excerpt}'`).replace(/image:'[^']*'/,`image:'${version.cover}'`);
      }
      write('blog/index.html',read('blog/index.html').replace(cardPattern,card));
      write('product-content.js',read('product-content.js').replace(productPattern,product));
      if(versionName==='all-series'||version.coverReview) {
        const registry=JSON.parse(read('config/blog-cover-identities.json'));
        const coverReview=versionName==='all-series'?legacy.coverReview:version.coverReview;
        if(coverReview) registry.articles['/blog/playzu/']=coverReview;
        else delete registry.articles['/blog/playzu/'];
        write('config/blog-cover-identities.json',JSON.stringify(registry,null,2)+'\n');
      }
      console.log(`Playzu article, one index card and one shared editorial registration: ${versionName}.`);
    }
  }
}
