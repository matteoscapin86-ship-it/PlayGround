(() => {
'use strict';
function openModal(type){modal={type,title:type==='settings'?'Impostazioni':'Dettagli'};}
function renderModal(){
 // dim scene beneath modal
 ({battle:drawBattle,hero:drawHero,world:drawWorld,forge:drawForge,shop:drawShop}[s.tab]||drawBattle)();hit=[];footer();ctx.fillStyle='#05090bdd';ctx.fillRect(0,0,W,H);
 const x=350,y=216,w=500,h=328;panel(x,y,w,h,'#1a2526','#9a8051',12);text(modal.title||'Conferma',x+28,y+35,22,'#efe0bd',500,'left','Marcellus');line(x+28,y+60,x+w-28,y+60,'#4c5141');
 if(modal.type==='purchase'){const lines=(modal.body||'').split('\n');lines.forEach((v,i)=>text(v,x+30,y+103+i*25,13,i?'#c1c9be':'#e5d7b4',i?500:700));text('Questa è una transazione dimostrativa: nessun pagamento reale.',x+30,y+168,10,'#899891');button(x+29,y+220,207,54,'CONFERMA ACQUISTO',confirmPurchase,'gold');button(x+252,y+220,219,54,'ANNULLA',()=>{modal=null},'dark')}
 else if(modal.type==='loot'){const g=modal.item;text('Hai trovato un oggetto '+rarity[g.rarity]+'!',x+30,y+101,14,rarityColors[g.rarity],700);iconBadge(x+85,y+165,30,'⚔',rarityColors[g.rarity]);text(g.name,x+132,y+151,16,'#efe4cf',700);text(slots[g.slot]+'  ·  Potere +'+g.power+'  ·  Set '+g.set,x+132,y+177,11,'#aab5ac');button(x+29,y+220,442,54,'MAGNIFICO!',()=>{modal=null},'gold')}
 else if(modal.type==='gear'){const g=s.gear[modal.index];text('Rarità: '+rarity[g.rarity],x+30,y+101,14,rarityColors[g.rarity],700);text('Slot: '+slots[g.slot]+'     Potenza: +'+g.power,x+30,y+129,13,'#c7cfc4');text('Set '+g.set+' · Livello '+g.level,x+30,y+155,12,'#97a49b');button(x+29,y+220,442,54,'CHIUDI',()=>{modal=null},'dark')}
 else if(modal.type==='settings'){text('Salvataggio automatico attivo',x+30,y+101,13,'#d7e0d1',700);text('I tuoi progressi restano salvati su questo dispositivo.',x+30,y+128,11,'#97a49b');text('Prototipo 2D · Valute e acquisti completamente simulati.',x+30,y+157,11,'#97a49b');button(x+29,y+220,207,54,'RIPRENDI VIAGGIO',()=>{modal=null},'green');button(x+252,y+220,219,54,'AZZERA PARTITA',()=>{if(confirm('Vuoi davvero azzerare tutti i progressi?')){localStorage.removeItem('ashen-save');location.reload()}},'red')}
}
function tick(){const now=Date.now(),elapsed=Math.min(60,(now-lastTick)/1000);lastTick=now;anim+=elapsed;
 // idle fighting loop
 if(!modal&&elapsed>0){const dps=(s.atk/5)*elapsed;enemyHp-=dps;if(enemyHp<=0){enemyHp=enemyMax;s.kills++;s.gold+=Math.round((12+s.region*8)*(s.starter?1.2:1));s.xp+=4;s.hp=Math.min(s.maxHp,s.hp+14);if(s.xp>=100){s.xp-=100;s.level++;s.atk+=8;s.maxHp+=70;s.hp=s.maxHp;toast('Livello '+s.level+' raggiunto!')}if(s.kills%10===0&&s.stage<10){s.stage++;toast('Stage '+s.stage+' raggiunto')}if(s.kills%10===0){const loot={name:regions[s.region].set+' · Frammento',rarity:Math.random()<.13?3:Math.random()<.48?2:1,slot:Math.floor(Math.random()*6),power:18+s.region*5,set:regions[s.region].set,level:1};s.inventory.push(loot);if(s.inventory.length>(s.inventoryCapacity||40))s.inventory.shift();}}
 // light enemy retaliation
 s.hp=Math.max(80,s.hp-(2+s.region)*elapsed);
 }
 // explorer expedition returns after five minutes
 if(s.expedition&&now-s.expeditionAt>=300000){s.expedition=0;const g=Math.round(130*(1+s.region*.25)*s.offlineBoost), gem=5+Math.floor(Math.random()*6);s.gold+=g;s.gems+=gem;s.dust+=2;s.inventory.push({name:'Tesoro degli esploratori',rarity:2,slot:Math.floor(Math.random()*6),power:22+s.region*4,set:regions[s.region].set,level:1});toast('Spedizione completata! +'+g+' oro, +'+gem+' gemme');save()}
 if(now%7000<60)save();
}
function handleClick(ev){const rect=canvas.getBoundingClientRect(),x=(ev.clientX-rect.left)*W/rect.width,y=(ev.clientY-rect.top)*H/rect.height;for(let i=hit.length-1;i>=0;i--){const a=hit[i];if(x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h){a.action();return}}}
canvas.addEventListener('pointerdown',handleClick);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal)modal=null;else if(e.key>='1'&&e.key<='5'){s.tab=['hero','battle','world','forge','shop'][Number(e.key)-1];save()}});
window.addEventListener('beforeunload',save);
setInterval(tick,1000);
// Recover a small, capped amount of offline progress at startup.
const last=Number(s.lastSeen||Date.now()),away=Math.max(0,Math.min(86400,(Date.now()-last)/1000));if(away>45){const reward=Math.floor(away/12*(1+s.region*.2)*s.offlineBoost);s.gold+=reward;s.lastOffline=reward;setTimeout(()=>toast('Bentornato! Raccolti '+fmt(reward)+' oro offline.'),700)}
s.lastSeen=Date.now();save();draw();
})();
