/* Spelararketyperna. Delas av alla mätningar så siffrorna går att jämföra. */
const G=require("./logik.js");

const prov=(S,v)=>{const sp=G.S;G.S=G.klon(S);G.verkställ(v);
  const r={t:G.totalt(true),lean:{...G.S.lean},kassa:G.S.kassa};G.S=sp;return r;};

/* Exakt det spelaren ser innan hen släpper kortet: pris, och mätarna med den
   riktning pressekreteraren tror — inte den sanna. */
const synligt=(S,kort,v,sida)=>{const sp=G.S;G.S=S;
  const kost=G.kostnad(v), ber=G.berörda(kort,v,sida);G.S=sp;
  return {kost,taggar:ber.map(b=>({id:b.seg.id,upp:b.upp,sant:b.sant}))};};
const sidaAv=(k,v)=>v===k.v?"v":"h";

const max=(a,b,p)=>p(a)>=p(b)?a:b, min=(a,b,p)=>p(a)<=p(b)?a:b;

/* Ser inte pilarna alls — mäter om spelet går att vinna utan att läsa något */
const BLINDA={
  "Myntkastaren":  (S,k)=>Math.random()<.5?k.v:k.h,
  "Vänsterhänt":   (S,k)=>k.v,
  "Högerhänt":     (S,k)=>k.h,
  "Snålvargen":    (S,k)=>min(k.v,k.h,v=>synligt(S,k,v,sidaAv(k,v)).kost),
  "Storsatsaren":  (S,k)=>max(k.v,k.h,v=>synligt(S,k,v,sidaAv(k,v)).kost),
};

const INFORMERADE={
  /* Läser pilarna, inget mer. Den realistiska förstagångsspelaren. */
  "Pilläsaren":(S,k)=>max(k.v,k.h,v=>{const y=synligt(S,k,v,sidaAv(k,v));
    return y.taggar.reduce((a,t)=>a+(t.upp?1:-1),0)*10-y.kost/100;}),
  "Skademinimeraren":(S,k)=>min(k.v,k.h,v=>{const y=synligt(S,k,v,sidaAv(k,v));
    return y.taggar.filter(t=>!t.upp).length*10+y.kost/100;}),
  "Väljarjägaren":(S,k)=>max(k.v,k.h,v=>{const y=synligt(S,k,v,sidaAv(k,v)),t=y.taggar.find(x=>x.id==="val");
    return (t?(t.upp?10:-10):0)-y.kost/100;}),
  /* Läser pilarna OCH förstår vad mätarna gör och var hen står —
     men vet fortfarande inte hur stora effekterna är. */
  "Opinionsspelaren":(S,k)=>{
    const marginal=id=>{const sp=G.S,bas=G.totalt(true);
      G.S=G.klon(S);G.S.lean[id]=G.klamp(G.S.lean[id]+1);
      const d=G.totalt(true)-bas;G.S=sp;return d;};
    const m={};for(const s of G.SEG)m[s.id]=marginal(s.id);
    const kvar=S.lek.length-S.i, kassavärde=S.kassa<22?0.055:0.02;
    return max(k.v,k.h,v=>{const y=synligt(S,k,v,sidaAv(k,v));
      let p=y.taggar.reduce((a,t)=>a+(t.upp?1:-1)*m[t.id]*G.SKALA,0);
      p+=Math.max(0,50-S.lean.par)/70*kvar*0.05*
         (y.taggar.some(t=>t.id==="par"&&t.upp)?1:y.taggar.some(t=>t.id==="par")?-1:0);
      return p-y.kost*kassavärde*G.totalt(true)/100;});},
};

/* Känner varje siffra i tabellen. Taket, inte en människa. */
const FACIT={"Optimeraren":(S,k)=>max(k.v,k.h,v=>prov(S,v).t)};

const ALLA={...BLINDA,...INFORMERADE,...FACIT};

function spela(parti,strategi){
  G.nytt(parti);const S=G.S;const val=[];let lån=0;
  while(S.i<S.lek.length){
    const k=S.lek[S.i],v=strategi(S,k);
    val.push({e:k.e,sida:v===k.v?"v":"h"});
    G.verkställ(v);if(S.nödlån)lån++;
    S.i++;
  }
  const t=G.totalt(true);
  return {t,rel:t/parti.bas,vann:parti.prova({total:t,start:S.start}),
    kassa:S.kassa,lån,lean:{...S.lean},val};
}

let _s=1;
const frö=n=>{_s=n>>>0||1};
Math.random=()=>{_s^=_s<<13;_s>>>=0;_s^=_s>>17;_s^=_s<<5;_s>>>=0;return _s/4294967296};

module.exports={BLINDA,INFORMERADE,FACIT,ALLA,spela,prov,synligt,max,min,frö};
