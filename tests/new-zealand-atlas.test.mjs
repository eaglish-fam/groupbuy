import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {atlasViews,projectAtlasPoint,newZealandAtlas} from '../scripts/trip-new-zealand-atlas.mjs';

const root = resolve(import.meta.dirname,'..');
test('NZ atlas focuses both islands without moving point identities or losing article anchors',()=>{
  assert.equal(atlasViews.all.pins.length,8);
  assert.equal(atlasViews.north.pins.length,5);
  assert.equal(atlasViews.south.pins.length,6);
  for (const [name,view] of Object.entries(atlasViews)) {
    for (const pin of view.pins) {
      const point = projectAtlasPoint(name,pin.point);
      assert.ok(point.every(value=>value>0 && value<100),`${name}/${pin.id} remains in the focus frame`);
      const [path,anchor] = pin.href.split('#');
      const html = readFileSync(resolve(root,'.'+path,'index.html'),'utf8');
      if (anchor) assert.ok(html.includes(`id="${anchor}"`),`${pin.id} has a real destination anchor`);
    }
  }
  for (const pin of atlasViews.south.pins) {
    assert.deepEqual(pin.point,atlasViews.all.pins.find(other=>other.id===pin.id).point);
  }
  assert.equal(atlasViews.north.routes[0].points.length,4,'Wellington is a separate transport continuation');
  assert.equal(atlasViews.south.routes.length,2,'inland and coastal choices remain separate');
});


test('NZ route segments stay on the illustrated land between their destination pins',async()=>{
  const {data,info} = await sharp(resolve(root,'trip/assets/new-zealand-atlas.webp')).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const pixel = (x,y) => {
    const offset = (Math.round(y)*info.width+Math.round(x))*info.channels;
    return [data[offset],data[offset+1],data[offset+2]];
  };
  // This atlas has warm ochre land/brown coastlines, blue water and pale cream paper.
  // A four-source-pixel neighbourhood tolerates the drawn coastline and narrow rivers;
  // it cannot hide a route crossing the pale sea. No screenshot or DOM mock is used.
  function hasLand(x,y) {
    for (let dy=-4;dy<=4;dy++) for (let dx=-4;dx<=4;dx++) {
      if (dx*dx+dy*dy>16 || x+dx<0 || x+dx>=info.width || y+dy<0 || y+dy>=info.height) continue;
      const [r,g,b] = pixel(x+dx,y+dy);
      if (r-b>30 && g-b>12) return true;
    }
    return false;
  }
  function longestWaterRun(points) {
    let run=0,longest=0;
    for (let index=1;index<points.length;index++) {
      const a=[points[index-1][0]*info.width/100,points[index-1][1]*info.height/100];
      const b=[points[index][0]*info.width/100,points[index][1]*info.height/100];
      const distance=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const steps=Math.ceil(distance/2);
      for (let step=1;step<=steps;step++) {
        const x=a[0]+(b[0]-a[0])*step/steps;
        const y=a[1]+(b[1]-a[1])*step/steps;
        run=hasLand(x,y)?0:run+distance/steps;
        longest=Math.max(longest,run);
      }
    }
    return longest;
  }
  const formerOffshoreCoast=[[51,67],[49,73],[45,79],[40,83]];
  assert.ok(longestWaterRun(formerOffshoreCoast)>100,'mask must reject the former visibly offshore blue route');
  assert.ok(longestWaterRun([[55,60],[51,67],[45,69],[40,71],[32,77]])>4,'mask must also catch the shorter water crossings on the former main route');
  for (const island of ['north','south']) for (const route of atlasViews[island].routes) {
    assert.ok(longestWaterRun(route.points)<=4,`${island}/${route.kind} crosses water for more than four source pixels`);
    for (const endpoint of [route.points[0],route.points.at(-1)]) {
      assert.ok(atlasViews[island].pins.some(pin=>pin.point.every((value,index)=>value===endpoint[index])),`${island}/${route.kind} endpoint must remain attached to a destination pin`);
    }
  }
});

test('NZ focus images request enough source pixels for their actual CSS magnification',()=>{
  const html = newZealandAtlas();
  const sizes = [...html.matchAll(/sizes="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(sizes,[
    '(max-width:600px) 92vw, 580px',
    '(max-width:600px) 161vw, 1015px',
    '(max-width:600px) 170.2vw, 1073px'
  ]);
});

test('NZ atlas mouse, tap, keyboard and existing filters keep one selected island and matching cards',async()=>{
  function node(dataset={},tagName='BUTTON') {
    const handlers = new Map();
    return {dataset,tagName,hidden:false,attributes:{},textContent:'',
      setAttribute(key,value){this.attributes[key]=value;},
      removeAttribute(key){delete this.attributes[key];},
      addEventListener(name,callback){handlers.set(name,callback);},
      fire(name,event={}){handlers.get(name)?.(event);},
      focus(){this.fire('focus');}};
  }
  const buttons=['all','north','south'].map(island=>node({atlasSelect:island}));
  const shapes=['north','south'].map(island=>node({atlasSelect:island},'path'));
  const filters=['all','north','south'].map(island=>node({islandFilter:island}));
  const cards=['north','north',...Array(6).fill('south')].map(island=>node({islandCard:island},'A'));
  const views=['all','north','south'].map(island=>node({atlasView:island},'DIV'));
  const descriptions=['all','north','south'].map(island=>node({atlasDescription:island},'P'));
  const canvas=node({},'DIV'),status=node({},'P'),controls=node({},'DIV'),islands=node({},'svg');
  controls.hidden=true;
  // SVG has a hidden attribute; setting an arbitrary .hidden property does not remove it.
  islands.attributes.hidden='';
  const atlas={
    querySelectorAll(selector){return ({'[data-atlas-select]':[...buttons,...shapes],'[data-atlas-view]':views,'[data-atlas-description]':descriptions})[selector]??[];},
    querySelector(selector){
      const fixed={'.nz-atlas':canvas,'[data-atlas-status]':status,'.nz-atlas-controls':controls,'.nz-atlas-islands':islands};
      return fixed[selector] ?? buttons.find(button=>selector===`button[data-atlas-select="${button.dataset.atlasSelect}"]`);
    }
  };
  const previousDocument=globalThis.document;
  globalThis.document={
    querySelector(selector){return selector==='[data-nz-atlas]'?atlas:null;},
    querySelectorAll(selector){return ({'[data-island-filter]':filters,'[data-island-card]':cards})[selector]??[];}
  };
  try {
    await import('../trip/new-zealand-planner.js?atlas-interaction-test');
    function selected(island,count) {
      assert.equal(canvas.dataset.atlasActive,island);
      assert.equal(cards.filter(card=>!card.hidden).length,count);
      assert.deepEqual(views.filter(view=>!view.hidden).map(view=>view.dataset.atlasView),[island]);
      assert.equal(buttons.find(button=>button.attributes['aria-pressed']==='true').dataset.atlasSelect,island);
      assert.equal(filters.find(button=>button.attributes['aria-pressed']==='true').dataset.islandFilter,island);
    }
    selected('all',8);
    assert.equal(controls.hidden,false);
    assert.equal(Object.hasOwn(islands.attributes,'hidden'),false,'SVG island hit targets must have their hidden attribute removed');
    buttons[1].fire('pointerenter',{pointerType:'mouse'});
    selected('north',2);
    buttons[2].fire('pointerenter',{pointerType:'touch'});
    selected('north',2);
    buttons[2].fire('click');
    selected('south',6);
    filters[0].fire('click');
    selected('all',8);
    buttons[0].fire('keydown',{key:'ArrowRight',preventDefault(){}});
    selected('north',2);
    assert.equal(buttons[1].attributes.tabindex,'0');
    assert.equal(buttons[2].attributes.tabindex,'-1');
    buttons[0].fire('click');
    let prevented=false;
    shapes[1].fire('keydown',{key:'Enter',preventDefault(){prevented=true;}});
    assert.equal(prevented,true);
    selected('south',6);
    buttons[0].fire('click');
    shapes[0].fire('click');
    selected('north',2);
  } finally {
    if (previousDocument===undefined) delete globalThis.document;
    else globalThis.document=previousDocument;
  }
});
