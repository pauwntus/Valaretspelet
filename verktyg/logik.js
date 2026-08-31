/* Läser spellogiken direkt ur index.html istället för att härma den, så att
   simuleringarna alltid mäter det spel som faktiskt levereras. */
const fs=require("fs"),path=require("path"),vm=require("vm");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const skript=html.match(/<script>([\s\S]*)<\/script>/)[1];
const start=skript.indexOf("const DRAG_ANTAL");
const slut=skript.indexOf("/* ============ VYER ============ */");
if(start<0||slut<0) throw new Error("hittar inte logikblocket i index.html");
const kod=skript.slice(start,slut).split("\n").filter(r=>!/getElementById/.test(r)).join("\n");

const sandlåda={Math,JSON,console};
vm.createContext(sandlåda);
vm.runInContext(kod+`
;this.__ut={SEG,PARTIER,DÄCK,SVÅRT,DRAG_ANTAL,SKALA,ÖVRE,UNDRE,SEN_FAKTOR,SPURT,
  GENOMSLAG_MIN,GENOMSLAG_SPANN,NYHETSCYKEL,klamp,faktor,totalt,poäng,sen,kostnad,blanda,
  nytt,verkställ,utfall,genomslag,enighet,spurt,slutlean,berörda,VISA_NAMN,TAK,GOLV,
  hämtaS:()=>S, sättS:v=>{S=v}};`,sandlåda);

const U=sandlåda.__ut;
// Object.assign kopierar värdet ur en getter, inte getterns själv — S måste definieras
module.exports=Object.assign({},U,{
  /* kopia av tillståndet, för att prova ett drag utan att göra det */
  klon:S=>({parti:S.parti,lean:{...S.lean},kassa:S.kassa,maxKassa:S.maxKassa,historik:[],
    i:S.i,lek:S.lek.slice(),start:S.start,slutOrsak:null,slutRubrik:null}),
});
Object.defineProperty(module.exports,"S",{get:U.hämtaS,set:U.sättS,enumerable:true});
