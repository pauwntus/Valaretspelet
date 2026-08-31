/* Vem vinner? Kör alla arketyper mot alla partier.
   node verktyg/playtest.js [antal körningar per ruta] */
const G=require("./logik.js"), P=require("./spelare.js");
const N=+process.argv[2]||2500;
const rader=[];
for(const [namn,strat] of Object.entries(P.ALLA))
  for(const p of G.PARTIER){
    P.frö(0xC0FFEE);
    const r=[];for(let n=0;n<N;n++)r.push(P.spela(p,strat));
    rader.push({spelare:namn,parti:p.namn,
      vinst:r.filter(x=>x.vann).length/N, lån:r.filter(x=>x.lån>0).length/N,
      rel:r.reduce((a,x)=>a+x.rel,0)/N, kassa:r.reduce((a,x)=>a+x.kassa,0)/N});
  }
const pr=x=>(x*100).toFixed(1).padStart(6);
const spelare=[...new Set(rader.map(r=>r.spelare))], partier=G.PARTIER.map(p=>p.namn);
console.log(`VINSTFREKVENS (%)  n=${N}/ruta\n`);
console.log("spelartyp".padEnd(19)+partier.map(p=>p.slice(0,8).padStart(9)).join("")+"    SNITT   nödlån");
for(const s of spelare){
  const rs=partier.map(p=>rader.find(r=>r.parti===p&&r.spelare===s));
  console.log(s.padEnd(19)+rs.map(r=>pr(r.vinst).padStart(9)).join("")+
    pr(rs.reduce((a,r)=>a+r.vinst,0)/rs.length).padStart(9)+
    pr(rs.reduce((a,r)=>a+r.lån,0)/rs.length).padStart(9));
}
const snitt=s=>{const rs=rader.filter(r=>r.spelare===s);return rs.reduce((a,r)=>a+r.vinst,0)/rs.length;};
const blind=Math.max(...Object.keys(P.BLINDA).map(snitt));
const rank=spelare.map(s=>({s,v:snitt(s)})).sort((a,b)=>b.v-a.v);
console.log("\nKRITERIER");
const rad=(t,ok,v)=>console.log("  "+(ok?"✓":"✗")+" "+t.padEnd(52)+v);
rad("ingen blind strategi i topp 3",
    !rank.slice(0,3).some(r=>r.s in P.BLINDA), rank.slice(0,3).map(r=>r.s).join(", "));
rad("bästa blinda strategi under 20 %", blind<0.20, (blind*100).toFixed(1)+"%");
const värst=partier.map(p=>{
  const b=Math.max(...Object.keys(P.BLINDA).map(s=>rader.find(r=>r.parti===p&&r.spelare===s).vinst));
  const l=rader.find(r=>r.parti===p&&r.spelare==="Noggranna läsaren").vinst;
  return {p,b,l};}).sort((a,b)=>(b.b-b.l)-(a.b-a.l))[0];
rad("ingen blind strategi slår den noggranna läsaren på något parti",
    värst.b<=värst.l, `${värst.p}: blind ${(värst.b*100).toFixed(0)} % mot läsare ${(värst.l*100).toFixed(0)} %`);
rad("den noggranna läsaren mellan 40 och 60 %",
    snitt("Noggranna läsaren")>=0.40&&snitt("Noggranna läsaren")<=0.60,(snitt("Noggranna läsaren")*100).toFixed(1)+"%");
rad("LÄSNINGEN är färdigheten: 20+ enheter mot slarvläsaren",
    snitt("Noggranna läsaren")-snitt("Slarvläsaren")>=0.20,
    ((snitt("Noggranna läsaren")-snitt("Slarvläsaren"))*100).toFixed(1)+" enheter");
rad("mätarkunskap ger ett tillskott, inte hela spelet: 8–30 enheter",
    snitt("Politiska läsaren")-snitt("Noggranna läsaren")>=0.08&&snitt("Politiska läsaren")-snitt("Noggranna läsaren")<=0.30,
    ((snitt("Politiska läsaren")-snitt("Noggranna läsaren"))*100).toFixed(1)+" enheter");
