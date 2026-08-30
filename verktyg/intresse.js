/* Är besluten intressanta? Ett kort är ett val bara om rätt svar beror på läget.
   Lägena genereras av flera spelstilar, annars mäts bara mitten av banan. */
const G=require("./logik.js"), P=require("./spelare.js");
P.frö(0x51DE);
const stilar=[...Object.values(P.BLINDA).slice(0,3),...Object.values(P.INFORMERADE),
  (S,k)=>P.max(k.v,k.h,v=>(v.eff.med||0)), (S,k)=>P.min(k.v,k.h,v=>(v.eff.med||0)),
  (S,k)=>P.max(k.v,k.h,v=>(v.eff.par||0))];
const stat={};
for(const p of G.PARTIER)for(const stil of stilar)for(let n=0;n<90;n++){
  G.nytt(p);const S=G.S;
  while(S.i<S.lek.length){
    const k=S.lek[S.i], a=P.prov(S,k.v).t, b=P.prov(S,k.h).t;
    const o=stat[k.e]=stat[k.e]||{v:0,n:0,w:0};
    if(a>=b)o.v++; o.n++; o.w+=Math.abs(a-b)/G.totalt(true);
    G.verkställ(stil(S,k)); S.i++;
  }
}
const rader=Object.entries(stat).map(([e,o])=>({e,vänster:o.v/o.n,vikt:o.w/o.n*100}))
  .sort((a,b)=>b.vikt-a.vikt);
const tot=rader.reduce((a,r)=>a+r.vikt,0);
console.log("kort".padEnd(26)+"tyngd   rätt svar = vänster   status");
for(const r of rader){
  const låst=r.vänster>0.93||r.vänster<0.07;
  console.log(r.e.padEnd(26)+(r.vikt.toFixed(2)+"%").padStart(6)+
    (100*r.vänster).toFixed(0).padStart(15)+"%   "+(låst?"alltid samma sida":"beror på läget"));
}
const låsta=rader.filter(r=>r.vänster>0.93||r.vänster<0.07).length;
const topp6=rader.slice(0,6).reduce((a,r)=>a+r.vikt,0)/tot;
console.log("\nKRITERIER");
const rad=(t,ok,v)=>console.log("  "+(ok?"✓":"✗")+" "+t.padEnd(52)+v);
rad("minst hälften av korten är äkta bedömningsfrågor",låsta<=10,(20-låsta)+" av 20");
rad("topp 6 kort under 55 % av beslutstyngden",topp6<0.55,(topp6*100).toFixed(0)+"%");
rad("inget kort under 1,5 % tyngd",rader.every(r=>r.vikt>=1.5),
  "minst: "+rader[rader.length-1].e+" "+rader[rader.length-1].vikt.toFixed(2)+"%");
