(() => {
'use strict';

const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=1200,H=760,SAVE='ashen-save';
let modal=null,hit=[],toastTimer=null,anim=0,lastTick=Date.now(),enemyHp=420,enemyMax=420;
const tabs=[['hero','EROE'],['battle','BATTAGLIA'],['world','MONDO'],['forge','FORGIA'],['shop','NEGOZIO']];
const regions=[
 {name:'Roccaforte Cenerea',set:'Ceneri',color:'#c6a66b',boss:'Custode della Cenere'},
 {name:'Foresta di Ferro',set:'Ruggine',color:'#76965d',boss:'Radice colossale'},
 {name:'Palude Maledetta',set:'Bruma',color:'#6aa49b',boss:'Strega del Fango'},
 {name:'Deserto delle Ossa',set:'Osso',color:'#d59a54',boss:'Re dello Scheletro'},
 {name:'Cuore dell’Abisso',set:'Abisso',color:'#9c79a7',boss:'Signore dell’Ash'}
];
const slots=['Elmo','Cotta','Arma','Guanti','Stivali','Anello'];
const rarity=['Comune','Non comune','Raro','Epico','Leggendario','Mitico'];
const rarityColors=['#aeb7af','#73bd88','#64a6d8','#aa82dc','#d5a64c','#e96363'];
const defaultState={tab:'battle',region:0,stage:1,level:12,xp:38,gold:1240,gems:85,dust:24,atk:160,maxHp:780,hp:780,kills:0,streak:0,gear:[null,null,null,null,null,null],inventory:[],expedition:0,expeditionAt:0,starter:false,pass:false,offlineBoost:1,gachaPity:0,gachaCount:0,lastSeen:Date.now()};
let s;
try{s=Object.assign({},defaultState,JSON.parse(localStorage.getItem(SAVE)||'{}'));}catch(e){s={...defaultState};}

function save(){s.lastSeen=Date.now();localStorage.setItem(SAVE,JSON.stringify(s));}
function fmt(n){return Math.floor(n).toLocaleString('it-IT');}
function power(){let p=s.atk+s.level*5+s.stage*12;for(const g of s.gear)if(g)p+=g.power*2;return p;}
function text(t,x,y,size=14,color='#d8dfd3',weight=400,align='left',font='DM Sans'){ctx.save();ctx.font=(weight>=700?'700 ':'')+(weight===500?'500 ':'')+size+'px '+font;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillStyle=color;ctx.fillText(t,x,y);ctx.restore();}
function line(x1,y1,x2,y2,color='#4a554f',w=1){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function panel(x,y,w,h,fill='#182224',border='#4d5a55',r=8){ctx.fillStyle=fill;ctx.strokeStyle=border;ctx.lineWidth=1;ctx.beginPath();if(typeof ctx.roundRect==='function'){ctx.roundRect(x,y,w,h,r)}else{ctx.rect(x,y,w,h)}ctx.fill();ctx.stroke();}
function button(x,y,w,h,label,action,style='dark',icon=''){hit.push({x,y,w,h,action});let fill='#263134',border='#59655e';if(style==='gold'){fill='#b7924f';border='#dcc17e'}if(style==='green'){fill='#476356';border='#88a68d'}if(style==='red'){fill='#693f3b';border='#a7665e'}panel(x,y,w,h,fill,border,5);if(icon){text(icon,x+18,y+h/2-10,22,'#f1dcb2',700)}text(label,x+(icon?w/2+8:w/2),y+h/2-9,14,style==='gold'?'#18201c':'#eee7d5',700,'center');}
function progress(x,y,w,h,p,c='#d3b169'){ctx.fillStyle='#101718';ctx.fillRect(x,y,w,h);ctx.fillStyle=c;ctx.fillRect(x,y,w*Math.max(0,Math.min(1,p)),h);ctx.strokeStyle='#687169';ctx.strokeRect(x,y,w,h);}
function iconBadge(x,y,r,icon,c='#d0b675'){ctx.fillStyle='#172022';ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();text(icon,x,y-r*.72,r*.9,c,700,'center');}
function toast(msg){const el=document.getElementById('live-message');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200);}
function openModal(type,extra={}){modal={type,...extra};}

function header(){
 ctx.fillStyle='#11191a';ctx.fillRect(0,0,W,82);ctx.fillStyle='#090d0e';ctx.fillRect(0,82,W,3);
 text('ASHEN  REALMS',32,24,25,'#eee1bd',700,'left','Marcellus');text('SEASON I',32,57,10,'#7e9688',700);
 panel(760,18,170,46,'#151d1e','#6c6046',5);iconBadge(786,41,15,'◈','#d0b675');text(fmt(s.gold),807,29,17,'#e8dfc9',700);text('ORO',807,51,9,'#89998f',700);
 panel(942,18,112,46,'#151d1e','#5a6261',5);iconBadge(966,41,15,'◆','#71bda9');text(fmt(s.gems),987,29,17,'#daf0e9',700);text('GEMME',987,51,9,'#89998f',700);
 button(1068,18,42,46,'⚙',()=>openModal('settings'),'dark');button(1116,18,42,46,'?',()=>openModal('help'),'dark');
}
function footer(){ctx.fillStyle='#0d1314';ctx.fillRect(0,684,W,76);ctx.fillStyle='#3f4a45';ctx.fillRect(0,684,W,2);
 tabs.forEach((t,i)=>{const x=0+i*240,y=686,w=240,h=74,active=s.tab===t[0];if(active){ctx.fillStyle='#1c2928';ctx.fillRect(x,y,w,h);ctx.fillStyle='#d1b16a';ctx.fillRect(x+72,y,96,3)}line(x,y,x,y+74,'#35413d');text(t[1],x+120,y+25,13,active?'#efdca8':'#91a096',700,'center','DM Sans');});hit.push({x:0,y:686,w:1200,h:74,action:()=>{}});
 for(let i=0;i<tabs.length;i++){const x=i*240;hit.push({x,y:686,w:240,h:74,action:()=>{s.tab=tabs[i][0];save();}})}
}

function drawBattle(){
 text('ATTUALMENTE IN COMBATTIMENTO',32,104,12,'#91a096',700);
 text(regions[s.region].name,32,128,28,'#eee1bd',700,'left','Marcellus');text('STAGE '+s.stage+' / 10',32,164,11,'#baa775',700);
 panel(32,194,1136,390,'#11191a','#4d5954',8);
 ctx.fillStyle='#182425';ctx.fillRect(33,195,1134,388);
 ctx.fillStyle='#26382f';for(let i=0;i<18;i++){ctx.beginPath();ctx.arc(80+(i*83)%1060,260+(i*47)%270,4+(i%4),0,7);ctx.fill();}
 const cx=520,cy=385,level=Math.floor(s.stage/10);
 ctx.fillStyle='#18201e';ctx.beginPath();ctx.ellipse(cx,545,145,24,0,0,7);ctx.fill();
 iconBadge(cx,400,78,s.stage>=10?'♛':'☠',regions[s.region].color);text(s.stage>=10?regions[s.region].boss:'Guardiano delle Ceneri',cx,492,20,'#dfe7d9',700,'center','Marcellus');
 text('HP',cx-170,520,10,'#9aa69d',700);progress(cx-140,522,280,12,enemyHp/enemyMax,'#b55f55');text(Math.ceil(enemyHp)+' / '+enemyMax,cx+150,520,10,'#baa9a0',700,'left');
 iconBadge(300,410,48,'⚔','#caaa68');progress(300,470,190,10,s.hp/s.maxHp,'#739b72');text('EROE  LV. '+s.level,300,488,12,'#e6d9bc',700,'center');
 text('Potenza',860,330,11,'#97a39a',700);text(fmt(power()),860,350,31,'#eee1bd',700,'left','Marcellus');
 text('Oro / min',860,400,11,'#97a39a',700);text(fmt(12+s.region*8),860,420,22,'#d7bd7c',700);
 text('Velocità',860,465,11,'#97a39a',700);text('1.0×',860,485,22,'#d7e1d8',700);
 panel(32,606,1136,56,'#182225','#56615a',6);text('Spedizione esplorativa',54,616,13,'#ded7c2',700);
 if(s.expedition){const left=Math.max(0,300-Math.floor((Date.now()-s.expeditionAt)/1000));text('Ritorno tra '+Math.floor(left/60)+'m '+left%60+'s',280,618,12,'#9fb5a5',700);progress(470,621,390,10,1-left/300,'#8c9e75')}else{text('Ricompensa: oro + gemme',280,618,12,'#96a298',700);button(900,614,248,40,'INIZIA  (5 MIN)',()=>{s.expedition=1;s.expeditionAt=Date.now();toast('Spedizione avviata');save()},'green')}
}

function gearPower(){let p=0;for(const g of s.gear)if(g)p+=g.power;return p;}
function drawHero(){
 text('IL TUO ERoe',32,104,12,'#91a096',700);text('Ansel, il Custode',32,128,28,'#eee1bd',700,'left','Marcellus');
 panel(32,194,350,390,'#182022','#4d5954',8);iconBadge(207,300,78,'♞','#c5a96d');text('LIVELLO '+s.level,207,390,12,'#bba979',700,'center');progress(87,418,240,12,s.xp/100,'#79a485');text(s.xp+' / 100 XP',207,438,11,'#aab4aa',700,'center');
 text('Potenza totale',70,485,11,'#98a49b',700);text(fmt(power()),207,505,25,'#eee1bd',700,'center','Marcellus');
 panel(402,194,766,390,'#182022','#4d5954',8);text('ATTREZZATURA',430,217,12,'#9aaa9f',700);
 const pos=[[430,300],[590,300],[750,300],[910,300],[590,420],[750,420]];
 pos.forEach((p,i)=>{const g=s.gear[i];panel(p[0],p[1],130,96,'#11191a',g?rarityColors[g.rarity]: '#4b5752',6);text(slots[i].toUpperCase(),p[0]+65,p[1]+10,9,g?rarityColors[g.rarity]:'#718078',700,'center');if(g){iconBadge(p[0]+65,p[1]+48,25, i===2?'⚔':'◆',rarityColors[g.rarity]);text('+'+g.power,p[0]+65,p[1]+78,11,'#e3dac2',700,'center');button(p[0],p[1],130,96,'',()=>openModal('gear',{index:i}))}else{iconBadge(p[0]+65,p[1]+50,24,'+', '#53605a');}});
 text('Set regionale equipaggiato',430,548,11,'#98a49b',700);text(regions[s.region].set+' · '+gearPower()+' potenza item',430,567,15,'#cbb77e',700);
 panel(32,606,1136,56,'#182225','#56615a',6);text('Statistiche',54,616,13,'#ded7c2',700);text('ATTACCO  '+s.atk+'     ·     HP  '+s.hp+'/'+s.maxHp+'     ·     Uccisioni  '+s.kills,280,618,12,'#aebaae',700);
}

function drawWorld(){
 text('MAPPA DEL MONDO',32,104,12,'#91a096',700);text('Cinque territori nelle terre ceneree',32,128,28,'#eee1bd',700,'left','Marcellus');
 const path=[[150,390],[315,280],[500,390],[700,280],[890,390],[1040,280]], rx=[80,250,430,610,800,970];
 for(let i=0;i<path.length-1;i++){line(path[i][0],path[i][1],path[i+1][0],path[i+1][1],'#6a756d',4)}
 regions.forEach((r,i)=>{const x=rx[i]||rx[5],y=250+i%2*120;const unlocked=i<=s.region;iconBadge(x,y,42,unlocked?(i===4?'♛':'◆'):'🔒',unlocked?r.color:'#59615d');text(r.name,x,y+58,13,unlocked?'#dedbc5':'#69736d',700,'center','Marcellus');text(unlocked?'Territorio '+(i+1)+' · +'+(i*20)+'% oro':'BLOCCATO',x,y+78,9,unlocked?'#91a096':'#69736d',700,'center');button(x-54,y-52,108,104,'',()=>{if(unlocked){s.region=i;s.stage=1;enemyMax=420+i*220;enemyHp=enemyMax;save();toast('Viaggio a '+r.name)}})});
 panel(32,606,1136,56,'#182225','#56615a',6);text('Progressione',54,616,13,'#ded7c2',700);text('Boss regionale: '+regions[s.region].boss+'     Stage attuale: '+s.stage+'/10',280,618,12,'#aebaae',700);button(940,614,204,40,'AFFRONTA BOSS',()=>openModal('boss'),'gold');
}

function drawForge(){
 text('FORGIA',32,104,12,'#91a096',700);text('Armi e legami regionali',32,128,28,'#eee1bd',700,'left','Marcellus');
 panel(32,194,550,390,'#182022','#4d5954',8);text('INVENTARIO',54,217,12,'#9aaa9f',700);text(s.inventory.length+' / 40 oggetti',510,217,11,'#9aaa9f',700,'right');
 s.inventory.slice(-6).forEach((g,i)=>{const y=250+i*50;iconBadge(85,y+20,18,i===2?'⚔':'◆',rarityColors[g.rarity]);text(g.name,112,y+4,13,'#ddd7c3',700);text(slots[g.slot]+' · +' +g.power+' · '+rarity[g.rarity],112,y+24,10,rarityColors[g.rarity],700);button(500,y-4,52,40,'FONDI',()=>fuseInventory(i),'gold');});
 if(!s.inventory.length)text('Nessun bottino. Combatti per trovare nuovi oggetti.',54,260,12,'#7f8d84',700);
 panel(602,194,566,390,'#182022','#4d5954',8);text('FUSIONE EQUIPAGGIAMENTO',628,217,12,'#9aaa9f',700);
 for(let i=0;i<6;i++){const g=s.gear[i],x=628+(i%3)*176,y=250+Math.floor(i/3)*116,paddingX=x+80,paddingY=y+58;panel(x,y,160,98,'#11191a',g?rarityColors[g.rarity]: '#4b5752',6);text(slots[i].toUpperCase(),x+80,y+10,9,g?rarityColors[g.rarity]: '#718078',700,'center');if(g){iconBadge(x+80,paddingY-10,22,i===2?'⚔':'◆',rarityColors[g.rarity]);text('+'+g.power,x+80,y+87,11,'#e3dac2',700,'center');button(x,y,160,98,'',()=>openModal('gear',{index:i}))}}
 panel(32,606,1136,56,'#182225','#56615a',6);text('Polvere di fusione',54,616,13,'#ded7c2',700);iconBadge(184,634,14,'✦','#d0b675');text(fmt(s.dust),205,618,12,'#d5c38f',700);button(840,614,304,40,'SMANTELLA INVENTARIO',()=>{const dust=s.inventory.length*3;s.dust+=dust;s.inventory=[];toast('Recuperati '+dust+' polvere');save()},'dark');
}

function fuseInventory(shortIndex){
 const realIndex=Math.max(0,s.inventory.length-6)+shortIndex;if(realIndex>=s.inventory.length)return;
 const g=s.inventory.splice(realIndex,1)[0];const slot=g.slot;if(!s.gear[slot]||g.power>s.gear[slot].power){s.gear[slot]=g;toast(g.name+' equipaggiato')}else{s.dust+=5;toast('Oggetto smantellato: +5 polvere')}save();
}
function gachaPack(name,gemCost,gold=false){if(gold){if(s.gold<gemCost)return toast('Oro insufficiente');s.gold-=gemCost}else{if(s.gems<gemCost)return toast('Gemme insufficienti');s.gems-=gemCost}const roll=Math.random();s.gachaCount++;let r=roll<.035||s.gachaPity>=9?5:roll<.08?4:roll<.22?3:roll<.5?2:1;if(r>=4)s.gachaPity=0;else s.gachaPity++;const g={name:regions[s.region].set+' · '+['Scudo','Galea','Lama','Artiglio','Vento','Sigillo'][Math.floor(Math.random()*6)],rarity:r,slot:Math.floor(Math.random()*6),power:12+s.region*8+r*10+s.level, set:regions[s.region].set,level:s.level};s.inventory.push(g);openModal('loot',{item:g});save();}
function confirmPurchase(){const p=modal.purchase;if(p==='starter'){if(!s.starter){s.starter=true;s.gems+=300;s.gold+=3000;s.inventory.push({name:'Lama del Pioniere',rarity:4,slot:2,power:95,set:'Ceneri',level:s.level});toast('Starter acquisito in demo')}}else if(p==='pass'){if(!s.pass){s.pass=true;s.gems+=500;s.offlineBoost=1.5;toast('Pass Ashen attivato in demo')}}else if(p==='gem1'){s.gems+=500;toast('+500 gemme demo')}else if(p==='gem2'){s.gems+=1300;toast('+1300 gemme demo')}modal=null;save();}

function drawShop(){
 text('NEGOZIO',32,104,12,'#91a096',700);text('Mercato delle terre ceneree',32,128,28,'#eee1bd',700,'left','Marcellus');
 panel(32,194,350,390,'#182022','#4d5954',8);text('IAP SIMULATI',54,217,12,'#9aaa9f',700);text('Starter Ashen',54,258,16,'#e3d4b1',700);text('Pacchetto con 300 gemme, oro e lama.',54,285,11,'#99a69e',700);button(54,316,302,48,s.starter?'ACQUISTATO':'€ 4,99 · ACQUISTA',()=>openModal('purchase',{title:'Starter Ashen',body:s.starter?'Pacchetto già acquisito.':'Starter Ashen\n300 gemme · 3000 oro · Lama Epica',purchase:'starter'}),s.starter?'dark':'gold');
 text('Pass delle Ceneri',54,390,16,'#e3d4b1',700);text('+50% guadagni offline per 30 giorni.',54,417,11,'#99a69e',700);button(54,448,302,48,s.pass?'PASS ATTIVO':'€ 9,99 · ACQUISTA',()=>openModal('purchase',{title:'Pass delle Ceneri',body:s.pass?'Pass già acquisito.':'Pass delle Ceneri\n500 gemme · Bonus idle permanente',purchase:'pass'}),s.pass?'dark':'gold');
 panel(402,194,766,390,'#182022','#4d5954',8);text('GACHA DELLE SFERE',424,217,12,'#9aaa9f',700);text('Pity Epico garantito ogni 10 estrazioni',424,244,11,'#91a096',700);text('Pity: '+s.gachaPity+'/10',1080,217,11,'#c8b57d',700,'right');
 [0,1,2].forEach(i=>{const x=424+i*230;panel(x,275,210,218,'#11191a','#59645f',7);iconBadge(x+105,344,38,['◆','◈','✦'][i],'#d4b66f');text(['SFERA COMUNE','SFERA RARA','SFERA MITICA'][i],x+105,394,12,'#dfd5b9',700,'center');text(['10 estrazioni','100 gemme','500 gemme'][i],x+105,420,11,'#98a49b',700,'center');button(x+16,448,178,36,['500 ORO','100 GEMME','500 GEMME'][i],()=>i===0?gachaPack('Comune',500,true):gachaPack(['Rara','Mitica'][i-1],i===1?100:500),'gold')});
 panel(32,606,1136,56,'#182225','#56615a',6);text('Pacchetti gemme simulati',54,616,13,'#ded7c2',700);button(360,614,190,40,'€ 0,99 · 500',()=>openModal('purchase',{title:'Mucchio di Gemme',body:'Mucchio di Gemme\n500 gemme',purchase:'gem1'}),'dark');button(570,614,210,40,'€ 2,99 · 1300',()=>openModal('purchase',{title:'Scrigno di Gemme',body:'Scrigno di Gemme\n1300 gemme',purchase:'gem2'}),'dark');text('NESSUN PAGAMENTO REALE',995,627,10,'#7f9187',700,'right');
}

function confirmModalPurchase(){if(modal.purchase)confirmPurchase();}
function renderModal(){
 ({battle:drawBattle,hero:drawHero,world:drawWorld,forge:drawForge,shop:drawShop}[s.tab]||drawBattle)();hit=[];footer();ctx.fillStyle='#05090bdd';ctx.fillRect(0,0,W,H);
 const x=350,y=216,w=500,h=328;panel(x,y,w,h,'#1a2526','#9a8051',12);text(modal.title||'Conferma',x+28,y+35,22,'#efe0bd',700,'left','Marcellus');line(x+28,y+60,x+w-28,y+60,'#4c5141');
 if(modal.type==='purchase'){text(modal.body||'',x+30,y+101,14,'#dfd6bc',700);text('Questa è una transazione dimostrativa: nessun pagamento reale.',x+30,y+168,10,'#899891');button(x+29,y+220,207,54,'CONFERMA ACQUISTO',confirmModalPurchase,'gold');button(x+252,y+220,219,54,'ANNULLA',()=>modal=null,'dark')}
 else if(modal.type==='loot'){const g=modal.item;text('Hai trovato un oggetto '+rarity[g.rarity]+'!',x+30,y+101,14,rarityColors[g.rarity],700);iconBadge(x+85,y+165,30,iTag(g.slot),'');text(g.name,x+132,y+151,16,'#efe4cf',700);text(slots[g.slot]+' · Potere +'+g.power+' · Set '+g.set,x+132,y+177,11,'#aab5ac');button(x+29,y+220,442,54,'MAGNIFICO!',()=>modal=null,'gold')}
 else if(modal.type==='gear'){const g=s.gear[modal.index];if(g){text('Rarità: '+rarity[g.rarity],x+30,y+101,14,rarityColors[g.rarity],700);text('Slot: '+slots[g.slot]+'     Potenza: +'+g.power,x+30,y+129,13,'#c7cfc4');text('Set '+g.set+' · Livello '+g.level,x+30,y+155,12,'#97a49b')}else text('Slot vuoto',x+30,y+101,14,'#97a49b',700);button(x+29,y+220,442,54,'CHIUDI',()=>modal=null,'dark')}
 else if(modal.type==='settings'){text('Salvataggio automatico attivo',x+30,y+101,13,'#d7e0d1',700);text('I progressi restano salvati su questo dispositivo.',x+30,y+128,11,'#97a49b');text('Prototipo 2D · Valute e acquisti simulati.',x+30,y+157,11,'#97a49b');button(x+29,y+220,207,54,'RIPRENDI',()=>modal=null,'green');button(x+252,y+220,219,54,'AZZERA PARTITA',()=>{if(confirm('Vuoi davvero azzerare tutti i progressi?')){localStorage.removeItem(SAVE);location.reload()}},'red')}
 else if(modal.type==='boss'){const isBoss=s.stage>=10;text('Boss: '+regions[s.region].boss,x+30,y+101,16,regions[s.region].color,700);text(isBoss?'Il boss regionale attende la sfida.':'Raggiungi lo Stage 10 per sbloccare il boss.',x+30,y+129,12,'#c7cfc4');button(x+29,y+220,442,54,isBoss?'SCONFIGGI BOSS':'TORNA IN COMBATTIMENTO',()=>{if(isBoss){s.stage=1;if(s.region<4)s.region++;else s.region=4;s.gold+=1500;s.gems+=25;toast('Boss sconfitto! Ricompense ottenute')}modal=null;save()},isBoss?'gold':'dark')}
 else if(modal.type==='help'){text('Controlli',x+30,y+101,14,'#dfd6bc',700);text('Tocca le icone o usa i tasti 1–5 per cambiare schermata.',x+30,y+129,12,'#c7cfc4');text('Il combattimento è automatico e il gioco genera oro idle.',x+30,y+155,12,'#97a49b');button(x+29,y+220,442,54,'CHIUDI',()=>modal=null,'dark')}
}
function iTag(slot){return ['♛','♜','⚔','✋','♞','◆'][slot]||'◆';}

function draw(){hit=[];ctx.clearRect(0,0,W,H);header();({battle:drawBattle,hero:drawHero,world:drawWorld,forge:drawForge,shop:drawShop}[s.tab]||drawBattle)();footer();if(modal)renderModal();}
function handleClick(ev){const r=canvas.getBoundingClientRect(),x=(ev.clientX-r.left)*W/r.width,y=(ev.clientY-r.top)*H/r.height;for(let i=hit.length-1;i>=0;i--)if(x>=hit[i].x&&x<=hit[i].x+hit[i].w&&y>=hit[i].y&&y<=hit[i].y+hit[i].h){hit[i].action();draw();return}}
canvas.addEventListener('pointerdown',handleClick);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal)modal=null;else if(e.key>='1'&&e.key<='5'){s.tab=tabs[Number(e.key)-1][0];save()}draw()});
window.addEventListener('beforeunload',save);

function tick(){const now=Date.now(),elapsed=Math.min(5,(now-lastTick)/1000);lastTick=now;anim+=elapsed;if(!modal){enemyHp-=power()*.018*elapsed;if(enemyHp<=0){enemyMax=420+s.region*220+s.stage*8;enemyHp=enemyMax;s.kills++;const gold=(12+s.region*8)*(1+s.offlineBoost*.08);s.gold+=Math.round(gold);s.xp+=8;if(s.xp>=100){s.xp-=100;s.level++;s.atk+=8;s.maxHp+=70;s.hp=s.maxHp;toast('Livello '+s.level+' raggiunto!')}if(s.kills%10===0&&s.stage<10){s.stage++;enemyMax=420+s.region*220+s.stage*8;enemyHp=enemyMax;toast('Stage '+s.stage+' raggiunto')}if(s.kills%12===0){const r=Math.random()<.08?4:Math.random()<.25?3:Math.random()<.5?2:1,g={name:regions[s.region].set+' · Reliquia',rarity:r,slot:Math.floor(Math.random()*6),power:18+s.region*5+r*8,set:regions[s.region].set,level:s.level};s.inventory.push(g);if(s.inventory.length>40)s.inventory.shift();if(r>=3)openModal('loot',{item:g})}}s.hp-=Math.max(.5,(1.5+s.region)*elapsed);if(s.hp<80)s.hp=80;if(s.expedition&&now-s.expeditionAt>=300000){s.expedition=0;const gold=Math.round(130*(1+s.region*.25)*s.offlineBoost),gems=5+Math.floor(Math.random()*6);s.gold+=gold;s.gems+=gems;s.dust+=2;toast('Spedizione completata! +'+gold+' oro, +'+gems+' gemme');save()}}if(Math.floor(now/7000)!==Math.floor(lastTick/7000))save();draw();}
setInterval(tick,250);

const last=Number(s.lastSeen||Date.now()),away=Math.max(0,Math.min(86400,(Date.now()-last)/1000));if(away>45){const reward=Math.floor(away/12*(1+s.region*.2)*s.offlineBoost);s.gold+=reward;s.lastOffline=reward;setTimeout(()=>toast('Bentornato! Raccolti '+fmt(reward)+' oro offline.'),700)}s.lastSeen=Date.now();save();enemyMax=420+s.region*220+s.stage*8;enemyHp=enemyMax;draw();
})();
