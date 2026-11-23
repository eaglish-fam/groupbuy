import sys,json,re
from bs4 import BeautifulSoup,NavigableString
def best_src(img):
    cands=[]
    for attr in ('data-srcset','srcset'):
        v=img.get(attr)
        if v:
            for part in v.split(','):
                bits=part.strip().split()
                if len(bits)==2 and bits[1].endswith('w'): cands.append((int(bits[1][:-1]),bits[0]))
    if cands: return max(cands)[1]
    for attr in ('data-src','data-lazy-src','src'):
        v=img.get(attr)
        if v and 'penci-holder' not in v: return v
    return None
def orig(u):
    return re.sub(r'-\d+x\d+(\.\w+)$',r'\1',u) if u else u
def inline(el):
    # keep text with bold/links
    out=''
    for c in el.children:
        if isinstance(c,NavigableString): out+=str(c).replace('<','&lt;')
        elif c.name in('strong','b'): out+='<strong>'+inline(c)+'</strong>'
        elif c.name in('em','i'): out+='<em>'+inline(c)+'</em>'
        elif c.name=='a': out+='<a href="%s">%s</a>'%(c.get('href',''),inline(c))
        elif c.name=='br': out+='<br>'
        elif c.name=='mark': out+='<mark>'+inline(c)+'</mark>'
        elif c.name=='img': pass
        else: out+=inline(c)
    return out
def walk(el,blocks):
    for c in el.children:
        if isinstance(c,NavigableString):
            if c.strip(): blocks.append({'t':'p','html':str(c).strip()})
            continue
        n=c.name; cls=' '.join(c.get('class',[]))
        if n in('script','style','noscript'): continue
        if n in('h1','h2','h3','h4','h5'):
            blocks.append({'t':n,'text':c.get_text(' ',strip=True)}); continue
        if 'advgb-button' in cls or 'wp-block-button' in cls or 'wp-block-buttons' in cls:
            a=c.find('a'); blocks.append({'t':'button','text':c.get_text(' ',strip=True),'href':a.get('href') if a else None}); continue
        if n=='figure' and 'wp-block-gallery' not in cls and 'wp-block-embed' not in cls and 'wp-block-table' not in cls:
            img=c.find('img'); cap=c.find('figcaption')
            if img:
                u=best_src(img); blocks.append({'t':'img','src':u,'orig':orig(u),'alt':img.get('alt',''),'cap':cap.get_text(' ',strip=True) if cap else ''})
            continue
        if 'wp-block-gallery' in cls:
            items=[]
            for img in c.find_all('img'):
                fig=img.find_parent('figure'); cap=fig.find('figcaption') if fig and fig is not c else None
                u=best_src(img); items.append({'src':u,'orig':orig(u),'alt':img.get('alt',''),'cap':cap.get_text(' ',strip=True) if cap else ''})
            gcap=c.find('figcaption',class_=re.compile('blocks-gallery-caption'))
            blocks.append({'t':'gallery','items':items,'cap':gcap.get_text(' ',strip=True) if gcap else ''}); continue
        if 'wp-block-embed' in cls or n=='iframe' or c.find('iframe'):
            f=c if n=='iframe' else c.find('iframe')
            src=(f.get('data-src') or f.get('src')) if f else None
            if not src:
                d=c.find(class_=re.compile('wp-block-embed__wrapper')); src=d.get_text(strip=True) if d else None
            blocks.append({'t':'embed','src':src}); continue
        if n in('ul','ol'):
            blocks.append({'t':n,'items':[inline(li).strip() for li in c.find_all('li',recursive=False)]}); continue
        if n=='table' or 'wp-block-table' in cls:
            t=c if n=='table' else c.find('table')
            rows=[[td.get_text(' ',strip=True) for td in tr.find_all(['td','th'])] for tr in t.find_all('tr')]
            blocks.append({'t':'table','rows':rows}); continue
        if n=='blockquote':
            blocks.append({'t':'quote','html':inline(c).strip()}); continue
        if n=='hr' or 'wp-block-separator' in cls: blocks.append({'t':'hr'}); continue
        if n=='p':
            if c.find('img'):
                for img in c.find_all('img'):
                    u=best_src(img); blocks.append({'t':'img','src':u,'orig':orig(u),'alt':img.get('alt',''),'cap':''})
            h=inline(c).strip()
            if re.sub(r'<[^>]+>|&nbsp;|\s','',h): blocks.append({'t':'p','html':h,'align':'center' if 'has-text-align-center' in cls else ''})
            continue
        if n=='img':
            u=best_src(c); blocks.append({'t':'img','src':u,'orig':orig(u),'alt':c.get('alt',''),'cap':''}); continue
        # containers: columns, group, div etc.
        if any(k in cls for k in ('penci-','sharedaddy','jp-relatedposts','post-tags','wp-block-advgb-social','addtoany','yarpp','ez-toc')) and 'wp-block' not in cls:
            continue
        walk(c,blocks)
out={}
for path in sys.argv[1:]:
    b=BeautifulSoup(open(path).read(),'html.parser')
    title=b.select_one('h1.post-title, h1.entry-title, .header-standard h1') 
    c=b.select_one('.inner-post-entry')
    blocks=[];walk(c,blocks)
    date=b.select_one('time')
    out[path.split('/')[-1].replace('.html','')]={'title':title.get_text(strip=True) if title else b.title.get_text(),'date':date.get('datetime') if date else '','blocks':blocks}
json.dump(out,open('kidsread.json','w'),ensure_ascii=False,indent=1)
for k,v in out.items():
    from collections import Counter
    print(k,v['title'][:40],v['date'],Counter(x['t'] for x in v['blocks']))
