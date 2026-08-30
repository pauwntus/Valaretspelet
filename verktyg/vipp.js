/* Hur nära är förlusterna? Spelar om varje förlust med ett kort ändrat.
   Slutskärmens facit visar de här korten, så det ska kännas som en miss. */
const G=require("./logik.js"), P=require("./spelare.js");
const N=+process.argv[2]||1000;
function körLek(parti,lek,val){
  G.S={parti,lean:Object.fromEntries(G.SEG.map(s=>[s.id,50])),kassa:parti.kassa,
       maxKassa:parti.kassa,historik:[],i:0,lek:lek.slice(),start:parti.bas,
       slutOrsak:null,nödlån:false};
  const S=G.S,gjorda=[];
  while(S.i<S.lek.length){
    const k=S.lek[S.i];
    const h=val[S.i]!==undefined?val[S.i]:(P.INFORMERADE["Pilläsaren"](S,k)===k.v?0:1);
    gjorda.push(h);G.verkställ(h?k.h:k.v);S.i++;
  }
  const t=G.totalt(true);
  return {t,vann:parti.prova({total:t,start:S.start}),val:gjorda};
}
console.log(`HUR NÄRA ÄR FÖRLUSTERNA? (pilläsare, n=${N} per parti)\n`);
console.log("parti".padEnd(20)+"förlust%   ett kort hade räckt   vippkort per förlust");
for(const p of G.PARTIER){
  P.frö(0xD00D);
  let förluster=0,nära=0,vipp=0;
  for(let n=0;n<N;n++){
    G.nytt(p);const lek=G.S.lek.slice();
    const bas=körLek(p,lek,[]);
    if(bas.vann)continue;
    förluster++;let v=0;
    for(let j=0;j<bas.val.length;j++){
      const alt=bas.val.slice();alt[j]=1-alt[j];
      if(körLek(p,lek,alt).vann)v++;
    }
    if(v){nära++;vipp+=v;}
  }
  console.log(p.namn.padEnd(20)+((förluster/N*100).toFixed(1)+"%").padStart(8)+
    ((nära/(förluster||1)*100).toFixed(0)+"%").padStart(22)+
    (vipp/(nära||1)).toFixed(1).padStart(19)+" av 18");
}
