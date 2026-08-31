/* Spelar den riktiga sidan i en webbläsare med slumpmässiga svep och räknar hur
   ofta valrörelsen spricker. De andra verktygen mäter logiken som klipps ut ur
   index.html; det här mäter sidan som faktiskt levereras — tangentbord, vyer,
   animationer och allt. Kräver playwright.

     node verktyg/slumptest.js [antal genomspelningar]

   Notera: S är en top-level let i sidans skript, inte en egenskap på window.
   Läs den som bar identifierare i evaluate, annars ser varje körning lyckad ut. */
const {chromium}=require("playwright");
(async()=>{
  const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome"});
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  const p=await ctx.newPage();const fel=[];p.on("pageerror",e=>fel.push(String(e)));
  const N=+process.argv[2]||40;
  let avbrott=0,klara=0;const orsaker={},partiStat={};
  for(let n=0;n<N;n++){
    await p.goto("file:///home/user/Valaretspelet/index.html");
    const parti=n%6;
    await p.locator(".parti").nth(parti).click();
    await p.waitForTimeout(120);
    let kort=0;
    while(await p.locator("#kort").count() && kort<25){
      await p.keyboard.press(Math.random()<0.5?"ArrowLeft":"ArrowRight");
      await p.waitForTimeout(330);kort++;
    }
    // S är en top-level let i sidans skript, inte en egenskap på window
    const r=await p.evaluate(()=>({avbrutet:!!S.slutOrsak,rubrik:S.slutRubrik,
      spelade:S.historik.length,namn:S.parti.namn,
      slutskärm:!!document.querySelector(".slutkort")}));
    if(!r.slutskärm){console.log("  VARNING: ingen slutskärm efter",kort,"kort");continue;}
    const ps=partiStat[r.namn]=partiStat[r.namn]||{n:0,ab:0};ps.n++;
    if(r.avbrutet){avbrott++;ps.ab++;orsaker[r.rubrik]=(orsaker[r.rubrik]||0)+1;
      console.log(`  ${String(n+1).padStart(3)}. ${r.namn.padEnd(20)} SPRACK efter ${r.spelade} kort — ${r.rubrik}`);}
    else {klara++;console.log(`  ${String(n+1).padStart(3)}. ${r.namn.padEnd(20)} nådde valdagen`);}
  }
  console.log(`\nRESULTAT: ${avbrott} av ${avbrott+klara} slumpspel sprack = ${(avbrott/(avbrott+klara)*100).toFixed(0)}%`);
  // jämför mot simulatorn, i stället för en siffra som blir gammal
  const G=require("./logik.js"), P=require("./spelare.js");
  let sim=0,simN=0;
  for(const p of G.PARTIER){P.frö(12345);
    for(let i=0;i<2000;i++){simN++;if(P.spela(p,P.BLINDA["Myntkastaren"]).avbrutet)sim++;}}
  console.log(`simulatorn säger ${(sim/simN*100).toFixed(0)} %`);
  for(const [k,v] of Object.entries(orsaker))console.log("   "+k+": "+v);
  console.log("\nper parti:");
  for(const [k,v] of Object.entries(partiStat))
    console.log("   "+k.padEnd(20)+v.ab+"/"+v.n);
  if(fel.length)console.log("KONSOLFEL:",fel.join(";"));
  await b.close();
})();
