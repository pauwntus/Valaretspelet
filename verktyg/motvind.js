/* Svårighetsratten. Partiernas mål står fast — de är fiktionen. Det som ställs in
   är motvinden, tills en pilläsare klarar målet så ofta som nivån säger.
   Kör efter varje ändring i leken; skriv in de föreslagna talen i PARTIER. */
const G=require("./logik.js"), P=require("./spelare.js");
/* Nivåerna gäller den noggranna läsaren: läser kortet ordentligt och drar
   rätt slutsats ungefär fem gånger av sex, men väger inte mätarna mot
   varandra. Det är den spelaren spelet ska kännas rättvist för. */
const NIVÅ={"Det gamla partiet":.56,"Vågmästaren":.50,"Enfrågepartiet":.46,
            "Regeringspartiet":.42,"Utmanaren":.38,"Nykomlingen":.34};
const N=+process.argv[2]||1200;
const vinst=(p,skala)=>{
  const grund=p._grund||(p._grund={...p.press});
  p.press={};for(const id in grund)p.press[id]=grund[id]*skala;
  P.frö(0xC0FFEE);let w=0;
  for(let n=0;n<N;n++) if(P.spela(p,P.INFORMERADE["Noggranna läsaren"]).vann)w++;
  return w/N;
};
console.log("parti".padEnd(20)+"mål      nivå   utfall   föreslagen motvind");
for(const p of G.PARTIER){
  let lo=0.15,hi=6;
  for(let i=0;i<12;i++){const m=(lo+hi)/2; vinst(p,m)>NIVÅ[p.namn]?lo=m:hi=m;}
  const skala=(lo+hi)/2, v=vinst(p,skala);
  const ny=Object.fromEntries(Object.entries(p._grund).map(([k,x])=>[k,Math.round(x*skala*100)/100]));
  console.log(p.namn.padEnd(20)+p.mal.slice(0,7).padEnd(9)+
    (NIVÅ[p.namn]*100).toFixed(0).padStart(4)+"%"+(v*100).toFixed(0).padStart(8)+"%   "+
    "press:"+JSON.stringify(ny).replace(/"/g,""));
}
