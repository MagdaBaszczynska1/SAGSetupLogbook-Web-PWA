const state={type:"fork",travel:{fork:160,shock:65},compression:{fork:40,shock:18},target:{fork:25,shock:30}};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const current=key=>state[key][state.type];

function render(){
  const fork=state.type==="fork";
  $("#travelLabel").textContent=fork?"Skok widelca":"Skok dampera";
  $("#compressionTitle").textContent=fork?"Ugięcie widelca":"Ugięcie dampera";
  $("#travelValue").textContent=`${current("travel")} mm`;
  $("#compressionValue").textContent=current("compression");
  $$(".segment").forEach(button=>button.classList.toggle("active",button.dataset.suspension===state.type));

  const range=$("#compressionRange");
  const span=fork?10:6;
  range.min=Math.max(0,current("compression")-span);
  range.max=current("compression")+span;
  range.step=fork?1:0.5;
  range.value=current("compression");

  const sag=current("compression")/current("travel")*100;
  const difference=sag-current("target");
  $("#currentSag").textContent=`${sag.toFixed(1).replace(".0","")} %`;

  const status=$("#sagStatus");
  status.className="status-line";
  if(Math.abs(difference)<=1){
    status.innerHTML='<span class="status-icon" aria-hidden="true">✓</span><span>Wartość w zakresie docelowym</span>';
  }else if(difference<0){
    status.classList.add("warning");
    status.innerHTML='<span class="status-icon" aria-hidden="true">↓</span><span>SAG jest poniżej wartości docelowej</span>';
  }else{
    status.classList.add("error");
    status.innerHTML='<span class="status-icon" aria-hidden="true">↑</span><span>SAG jest powyżej wartości docelowej</span>';
  }

  $$(".target-options button").forEach(button=>{
    const target=Number(button.dataset.target);
    button.classList.toggle("active",Number.isFinite(target)&&target===current("target"));
  });
}

function setCompression(next){
  state.compression[state.type]=Math.max(0,Math.min(current("travel"),next));
  render();
}

$$(".segment").forEach(button=>button.addEventListener("click",()=>{
  state.type=button.dataset.suspension;
  render();
}));
$("#decreaseButton").addEventListener("click",()=>setCompression(current("compression")-(state.type==="fork"?1:0.5)));
$("#increaseButton").addEventListener("click",()=>setCompression(current("compression")+(state.type==="fork"?1:0.5)));
$("#compressionRange").addEventListener("input",event=>setCompression(Number(event.target.value)));

$$(".target-options button").forEach(button=>button.addEventListener("click",()=>{
  if(button.dataset.target==="custom"){
    $("#customTargetWrap").classList.remove("hidden");
    $("#customTarget").focus();
    return;
  }
  state.target[state.type]=Number(button.dataset.target);
  $("#customTargetWrap").classList.add("hidden");
  render();
}));
$("#customTarget").addEventListener("input",event=>{
  state.target[state.type]=Math.max(1,Math.min(99,Number(event.target.value)||1));
  render();
});

$("#travelButton").addEventListener("click",()=>{
  $("#travelDialogTitle").textContent=state.type==="fork"?"Skok widelca":"Skok dampera";
  $("#travelInput").value=current("travel");
  $("#travelDialog").showModal();
});
$("#saveTravelButton").addEventListener("click",()=>{
  state.travel[state.type]=Math.max(1,Number($("#travelInput").value)||current("travel"));
  render();
});

$$(".nav-item").forEach(button=>button.addEventListener("click",()=>{
  $$(".view").forEach(view=>view.classList.toggle("active",view.id===button.dataset.view));
  $$(".nav-item").forEach(item=>item.classList.toggle("active",item===button));
  window.scrollTo({top:0,behavior:"smooth"});
}));
$("#settingsButton").addEventListener("click",()=>$("#moreTab").click());

$("#saveMeasurementButton").addEventListener("click",()=>{
  const toast=$("#toast");
  toast.textContent="Pomiar zapisany";
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),1800);
});

$("#compressionHelp").addEventListener("click",()=>alert("Zmierz przesunięcie gumowego pierścienia na zawieszeniu."));
$("#targetHelp").addEventListener("click",()=>alert("Najczęściej stosuje się docelowy SAG 20–30%."));

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
}
render();
