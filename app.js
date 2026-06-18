const STORAGE_KEY = "sagSetupLogbookWeb.v1";
let state = loadState();

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = {
  form: $("#calculatorForm"), bikeSelect: $("#bikeSelect"), travel: $("#travel"),
  compression: $("#compression"), targetSag: $("#targetSag"), pressure: $("#pressure"),
  resultCard: $("#resultCard"), liveSag: $("#liveSag"), currentSag: $("#currentSag"),
  targetCompression: $("#targetCompression"), differencePoints: $("#differencePoints"),
  differenceMm: $("#differenceMm"), interpretationTitle: $("#interpretationTitle"),
  interpretationText: $("#interpretationText"), bikeForm: $("#bikeForm"),
  bikeList: $("#bikeList"), historyList: $("#historyList"), dataStatus: $("#dataStatus")
};

function loadState() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (value && Array.isArray(value.bikes) && Array.isArray(value.measurements)) return value;
  } catch {}
  return { bikes: [], measurements: [] };
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function id(){ return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
function num(v){ const s=String(v??"").trim().replace(",","."); if(!s)return null; const n=Number(s); return Number.isFinite(n)?n:NaN; }
function fmt(v,d=1){ return new Intl.NumberFormat("pl-PL",{maximumFractionDigits:d}).format(v); }
function suspension(){ return document.querySelector('input[name="suspensionType"]:checked').value; }

function validate(){
  const values={travel:num(el.travel.value),compression:num(el.compression.value),targetSag:num(el.targetSag.value),pressure:num(el.pressure.value)};
  const errors={};
  if(values.travel===null||Number.isNaN(values.travel)||values.travel<=0) errors.travel="Skok musi być liczbą większą od 0.";
  if(values.compression===null||Number.isNaN(values.compression)||values.compression<0) errors.compression="Ugięcie musi być liczbą równą lub większą od 0.";
  else if(Number.isFinite(values.travel)&&values.compression>values.travel) errors.compression="Ugięcie nie może być większe od skoku.";
  if(values.targetSag===null||Number.isNaN(values.targetSag)||values.targetSag<=0||values.targetSag>=100) errors.targetSag="Docelowy SAG musi mieścić się między 0% a 100%.";
  if(values.pressure!==null&&(Number.isNaN(values.pressure)||values.pressure<=0)) errors.pressure="Ciśnienie musi być większe od 0.";
  $("#travelError").textContent=errors.travel??"";
  $("#compressionError").textContent=errors.compression??"";
  $("#targetSagError").textContent=errors.targetSag??"";
  $("#pressureError").textContent=errors.pressure??"";
  return {valid:Object.keys(errors).length===0,values};
}
function calculate(v){
  const currentSag=v.compression/v.travel*100;
  const targetCompression=v.travel*v.targetSag/100;
  const differencePercentagePoints=currentSag-v.targetSag;
  const differenceMillimeters=v.compression-targetCompression;
  let interpretation;
  if(Math.abs(differencePercentagePoints)<=1) interpretation={title:"SAG bliski celu",text:"Różnica mieści się w tolerancji 1 punktu procentowego."};
  else if(differencePercentagePoints<0) interpretation={title:"SAG jest za mały",text:"Zawieszenie ugina się mniej niż zakłada wartość docelowa."};
  else interpretation={title:"SAG jest za duży",text:"Zawieszenie ugina się bardziej niż zakłada wartość docelowa."};
  return {currentSag,targetCompression,differencePercentagePoints,differenceMillimeters,interpretation};
}
function updateResult(){
  if(el.compression.value.trim()===""){ el.resultCard.hidden=true; el.liveSag.textContent="—%"; validate(); return; }
  const v=validate(); if(!v.valid){ el.resultCard.hidden=true; el.liveSag.textContent="—%"; return; }
  const r=calculate(v.values);
  el.resultCard.hidden=false;
  el.liveSag.textContent=`${fmt(r.currentSag)}%`;
  el.currentSag.textContent=`${fmt(r.currentSag)}%`;
  el.targetCompression.textContent=`${fmt(r.targetCompression)} mm`;
  el.differencePoints.textContent=`${r.differencePercentagePoints>0?"+":""}${fmt(r.differencePercentagePoints)} p.p.`;
  el.differenceMm.textContent=`${r.differenceMillimeters>0?"+":""}${fmt(r.differenceMillimeters)} mm`;
  el.interpretationTitle.textContent=r.interpretation.title;
  el.interpretationText.textContent=r.interpretation.text;
}
function fillBikeSelect(){
  const current=el.bikeSelect.value;
  el.bikeSelect.innerHTML='<option value="">Bez profilu</option>';
  state.bikes.forEach(b=>{
    const o=document.createElement("option"); o.value=b.id; o.textContent=b.model?`${b.name} — ${b.model}`:b.name; el.bikeSelect.append(o);
  });
  if(state.bikes.some(b=>b.id===current)) el.bikeSelect.value=current;
}
function applyBike(){
  const b=state.bikes.find(x=>x.id===el.bikeSelect.value); if(!b)return;
  const t=suspension();
  const travel=t==="fork"?b.forkTravel:b.shockTravel;
  const target=t==="fork"?b.forkTargetSag:b.shockTargetSag;
  if(travel)el.travel.value=travel; if(target)el.targetSag.value=target; updateResult();
}
function resetCalculator(){
  const t=suspension(); el.bikeSelect.value=""; el.travel.value=t==="fork"?160:55;
  el.compression.value=""; el.targetSag.value=t==="fork"?25:30; el.pressure.value=""; updateResult();
}
function saveMeasurement(e){
  e.preventDefault(); const v=validate(); if(!v.valid)return;
  const r=calculate(v.values); const b=state.bikes.find(x=>x.id===el.bikeSelect.value);
  state.measurements.unshift({id:id(),date:new Date().toISOString(),bikeId:b?.id??null,bikeName:b?(b.model?`${b.name} — ${b.model}`:b.name):null,suspensionType:suspension(),...v.values,...r});
  saveState(); renderHistory(); alert("Pomiar został zapisany.");
}
function addBike(e){
  e.preventDefault(); const name=$("#bikeName").value.trim(); if(!name){$("#bikeName").focus();return;}
  state.bikes.push({id:id(),name,model:$("#bikeModel").value.trim(),forkTravel:num($("#forkTravel").value),shockTravel:num($("#shockTravel").value),forkTargetSag:num($("#forkTargetSag").value),shockTargetSag:num($("#shockTargetSag").value),createdAt:new Date().toISOString()});
  saveState(); el.bikeForm.reset(); fillBikeSelect(); renderBikes();
}
function renderBikes(){
  el.bikeList.innerHTML="";
  if(!state.bikes.length){el.bikeList.append($("#emptyTemplate").content.cloneNode(true));return;}
  state.bikes.forEach(b=>{
    const a=document.createElement("article"); a.className="card";
    a.innerHTML=`<div class="section-head"><div><h3></h3><p class="meta">Dodano ${new Intl.DateTimeFormat("pl-PL").format(new Date(b.createdAt))}</p></div><span class="chip">Profil</span></div>
    <p>Widelec: ${b.forkTravel?fmt(b.forkTravel)+" mm":"—"} · Damper: ${b.shockTravel?fmt(b.shockTravel)+" mm":"—"}</p>
    <div class="card-actions"><button class="danger" type="button">Usuń</button></div>`;
    a.querySelector("h3").textContent=b.model?`${b.name} — ${b.model}`:b.name;
    a.querySelector("button").onclick=()=>{if(confirm("Usunąć profil roweru?")){state.bikes=state.bikes.filter(x=>x.id!==b.id);saveState();fillBikeSelect();renderBikes();}};
    el.bikeList.append(a);
  });
}
function renderHistory(){
  el.historyList.innerHTML="";
  if(!state.measurements.length){el.historyList.append($("#emptyTemplate").content.cloneNode(true));return;}
  state.measurements.forEach(m=>{
    const a=document.createElement("article"); a.className="card";
    const type=m.suspensionType==="fork"?"Widelec":"Damper";
    a.innerHTML=`<div class="section-head"><div><h3>${type}: ${fmt(m.currentSag)}% SAG</h3><p class="meta">${new Intl.DateTimeFormat("pl-PL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(m.date))}</p></div><span class="chip">${m.interpretation.title}</span></div>
    <p>${m.bikeName??"Bez profilu roweru"}</p>
    <p>Skok/ugięcie: ${fmt(m.travel)} / ${fmt(m.compression)} mm · Cel: ${fmt(m.targetSag)}%</p>
    <div class="card-actions"><button class="danger" type="button">Usuń wpis</button></div>`;
    a.querySelector("button").onclick=()=>{if(confirm("Usunąć pomiar?")){state.measurements=state.measurements.filter(x=>x.id!==m.id);saveState();renderHistory();}};
    el.historyList.append(a);
  });
}
function exportData(){
  const blob=new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),...state},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a"); a.href=url;a.download=`sag-logbook-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
}
async function importData(file){
  try{const d=JSON.parse(await file.text());if(!Array.isArray(d.bikes)||!Array.isArray(d.measurements))throw 0;state={bikes:d.bikes,measurements:d.measurements};saveState();fillBikeSelect();renderBikes();renderHistory();el.dataStatus.textContent="Dane zaimportowano.";}
  catch{el.dataStatus.textContent="Nie udało się zaimportować pliku.";}
}
function switchView(name){
  $$(".tab").forEach(t=>{const a=t.dataset.view===name;t.classList.toggle("active",a);t.setAttribute("aria-selected",String(a));});
  $$(".view").forEach(v=>v.classList.remove("active")); $(`#${name}View`).classList.add("active"); window.scrollTo({top:0,behavior:"smooth"});
}

$$(".tab").forEach(t=>t.onclick=()=>switchView(t.dataset.view));
[el.travel,el.compression,el.targetSag,el.pressure].forEach(i=>i.addEventListener("input",updateResult));
$$('input[name="suspensionType"]').forEach(i=>i.onchange=()=>{const t=suspension();if(!el.bikeSelect.value){el.travel.value=t==="fork"?160:55;el.targetSag.value=t==="fork"?25:30;}else applyBike();el.compression.value="";updateResult();});
$$("[data-target]").forEach(b=>b.onclick=()=>{el.targetSag.value=b.dataset.target;updateResult();});
el.bikeSelect.onchange=applyBike; el.form.onsubmit=saveMeasurement; $("#resetButton").onclick=resetCalculator; el.bikeForm.onsubmit=addBike;
$("#clearHistoryButton").onclick=()=>{if(state.measurements.length&&confirm("Usunąć całą historię?")){state.measurements=[];saveState();renderHistory();}};
$("#exportButton").onclick=exportData; $("#importInput").onchange=e=>{const f=e.target.files[0];if(f)importData(f);e.target.value="";};
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
fillBikeSelect(); renderBikes(); renderHistory(); updateResult();
