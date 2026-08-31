/* Spelararketyperna. Delas av alla mätningar så siffrorna går att jämföra. */
const G=require("./logik.js");

/* Ett drag som spräcker valrörelsen är inte värt sina mätarutslag — det
   förlorar spelet. Provet måste säga det, annars mäter allt fel. */
const prov=(S,v)=>{const sp=G.S;G.S=G.klon(S);G.verkställ(v);
  const avbrutet=!!G.S.slutOrsak;
  const r={t:avbrutet?G.totalt(true)*0.5:G.totalt(true),
    rå:G.totalt(true),avbrutet,lean:{...G.S.lean},kassa:G.S.kassa};
  G.S=sp;return r;};

/* Exakt det som står på skärmen: priset och vilka mätare som står på spel.
   Ingen riktning — den ska läsas ur kortets text. */
const synligt=(S,kort,v,sida)=>{const sp=G.S;G.S=S;
  const kost=G.kostnad(v), ber=G.berörda(kort,v,sida);G.S=sp;
  return {kost,taggar:ber.map(b=>({id:b.seg.id}))};};
const sidaAv=(k,v)=>v===k.v?"v":"h";

/* En spelare som läser kortet och drar en slutsats om varje mätare.
   träffsäkerhet 1.0 = förstår texten perfekt, 0.5 = ren gissning.
   Läsningen ligger fast inom en valrörelse: samma kort läses likadant
   hur länge man än håller i det. */
function läsning(S,kort,v,sida,träffsäkerhet){
  const sp=G.S;G.S=S;const ber=G.berörda(kort,v,sida);G.S=sp;
  return ber.map(b=>{
    const t=(S.frö||"")+"|"+kort.e+"|"+sida+"|"+b.seg.id;
    let h=2166136261;
    for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}
    const rätt=(h>>>0)/4294967296 < träffsäkerhet;
    return {id:b.seg.id,upp:rätt?b.upp:!b.upp};
  });
}

const max=(a,b,p)=>p(a)>=p(b)?a:b, min=(a,b,p)=>p(a)<=p(b)?a:b;

/* Ser inte pilarna alls — mäter om spelet går att vinna utan att läsa något */
const BLINDA={
  "Myntkastaren":  (S,k)=>Math.random()<.5?k.v:k.h,
  "Vänsterhänt":   (S,k)=>k.v,
  "Högerhänt":     (S,k)=>k.h,
  "Snålvargen":    (S,k)=>min(k.v,k.h,v=>synligt(S,k,v,sidaAv(k,v)).kost),
  "Storsatsaren":  (S,k)=>max(k.v,k.h,v=>synligt(S,k,v,sidaAv(k,v)).kost),
};

/* Läsarna. En människa som läser ett kort ser vad det HANDLAR om — rubriken
   syns i texten — och är osäkrare på bieffekterna. Modellen speglar det:
   hög träffsäkerhet på kortets tyngsta utslag, lägre på de små, och tyngden
   läggs där texten lägger den. */
function läser(S,kort,v,sida,träffHuvud,träffBi){
  const sp=G.S;G.S=S;const ber=G.berörda(kort,v,sida);G.S=sp;
  let huvud=null,störst=0;
  for(const b of ber){const a=Math.abs(v.eff[b.seg.id]||0);if(a>störst){störst=a;huvud=b.seg.id;}}
  return ber.map(b=>{
    const t=(S.frö||"")+"|"+kort.e+"|"+sida+"|"+b.seg.id;
    let h=2166136261;
    for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}
    const rätt=(h>>>0)/4294967296 < (b.seg.id===huvud?träffHuvud:träffBi);
    return {id:b.seg.id,upp:rätt?b.upp:!b.upp,huvud:b.seg.id===huvud};
  });
}
const läsare=(tH,tB,väg)=>(S,k)=>max(k.v,k.h,v=>{
  const y=synligt(S,k,v,sidaAv(k,v));
  return väg(S,läser(S,k,v,sidaAv(k,v),tH,tB),y);
});
/* Följer det kortet handlar om, väger bieffekterna lättare. Ser också när en
   mätare närmar sig kanten och drar sig undan — det gör vem som helst som
   tittar på skärmen, och kräver ingen kunskap om vad mätarna är värda. */
const kant=(S,id,upp)=>{
  const l=S.lean[id], nära=upp?l-(G.TAK-22):(G.GOLV+22)-l;
  return nära>0?-nära*4:0;
};
/* Vad ett pris känns som: dyrt i förhållande till vad som finns kvar per kort.
   Kräver ingen kunskap om spelet, bara att man tittar på kassaräknaren. */
const pris=(S,kost)=>{
  const kvar=Math.max(1,S.lek.length-S.i), budget=S.kassa/kvar;
  return kost<=budget?-kost*0.4:-(budget*0.4+(kost-budget)*9);
};
const rubrik=(S,l,y)=>l.reduce((a,t)=>
  a+(t.upp?1:-1)*(t.huvud?2.5:1)*10+kant(S,t.id,t.upp),0)+pris(S,y.kost);
/* Väger dessutom varje mätare efter vad den är värd i det läge man står i.
   Kant och pris vägs på samma skala som rubrikmodellen, annars går de två
   spelarna inte att jämföra. */
const vägd=(S,l,y)=>{
  const marginal=id=>{const sp=G.S,bas=G.totalt(true);
    G.S=G.klon(S);G.S.lean[id]=G.klamp(G.S.lean[id]+1);
    const d=G.totalt(true)-bas;G.S=sp;return d;};
  const m={};for(const s of G.SEG)m[s.id]=marginal(s.id);
  const störst=Math.max(...Object.values(m).map(Math.abs))||1;
  return l.reduce((a,t)=>
    a+(t.upp?1:-1)*(m[t.id]/störst)*(t.huvud?2.5:1)*10+kant(S,t.id,t.upp),0)+pris(S,y.kost);
};

const INFORMERADE={
  "Slarvläsaren":      läsare(0.75,0.55,rubrik),  // ögnar kortet
  "Noggranna läsaren": läsare(0.92,0.72,rubrik),  // läser ordentligt, följer rubriken
  "Politiska läsaren": läsare(0.92,0.72,vägd),    // läser ordentligt och vet vad mätarna är värda
  "Fulländade läsaren":läsare(1.00,1.00,vägd),    // läser rätt varje gång
};
/* Läser lika bra som den noggranna, men tittar aldrig upp på mätarna eller
   kassan. Finns för att pröva om spelets två haverier alls går att gå in i. */
const blint=(S,l,y)=>l.reduce((a,t)=>a+(t.upp?1:-1)*(t.huvud?2.5:1),0)*10;
INFORMERADE["Envisa läsaren"]=läsare(0.92,0.72,blint);

/* Känner varje siffra i tabellen. Taket, inte en människa. */
const FACIT={"Optimeraren":(S,k)=>max(k.v,k.h,v=>prov(S,v).t)};

const ALLA={...BLINDA,...INFORMERADE,...FACIT};

function spela(parti,strategi){
  G.nytt(parti);const S=G.S;const val=[];
  while(!S.slutOrsak&&S.i<S.lek.length){
    const k=S.lek[S.i],v=strategi(S,k);
    val.push({e:k.e,sida:v===k.v?"v":"h"});
    G.verkställ(v);
    if(S.slutOrsak)break;
    S.i++;
  }
  const avbrutet=!!S.slutOrsak, t=G.totalt(true);
  return {t,rel:t/parti.bas,avbrutet,rubrik:S.slutRubrik,drag:val.length,
    vann:!avbrutet&&parti.prova({total:t,start:S.start}),
    kassa:S.kassa,lean:{...S.lean},val};
}

let _s=1;
const frö=n=>{_s=n>>>0||1};
Math.random=()=>{_s^=_s<<13;_s>>>=0;_s^=_s>>17;_s^=_s<<5;_s>>>=0;return _s/4294967296};

module.exports={BLINDA,INFORMERADE,FACIT,ALLA,spela,prov,synligt,max,min,frö};
