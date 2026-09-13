(() => {
  const data = window.STRATEGY_DATA;
  const fa = new Intl.NumberFormat("fa-IR");
  const $ = (id) => document.getElementById(id);
  const scene = $("scene"), stage = $("spatialStage"), connections = $("connections");
  let state = { level: "department", unit: null, goal: null, unitsOpen: false, presenting: false, presentationIndex: 0 };

  const unitPositions = [
    { x: "-27vw", y: "-17vh", z: "20px", sx: "0px", sy: "0px" },
    { x: "25vw", y: "-13vh", z: "-10px", sx: "0px", sy: "0px" },
    { x: "-24vw", y: "21vh", z: "-30px", sx: "0px", sy: "0px" },
    { x: "25vw", y: "20vh", z: "25px", sx: "0px", sy: "0px" }
  ];
  const mobilePositions = [[-118,-155],[110,-145],[-112,150],[108,145]];

  function setRoute(path, replace = false) {
    const next = `#${path}`;
    if (location.hash !== next) history[replace ? "replaceState" : "pushState"]({}, "", next);
  }

  function makeNode({ type, label, sublabel, accent, style, onClick, selected = false }) {
    const button = document.createElement("button");
    button.className = `node ${type}${selected ? " selected" : ""}`;
    button.style.setProperty("--accent", accent);
    Object.entries(style).forEach(([k,v]) => button.style.setProperty(k,v));
    button.setAttribute("aria-label", sublabel ? `${label}، ${sublabel}` : label);
    button.innerHTML = `<span class="node-shape" aria-hidden="true"></span><span class="node-label">${label}${sublabel ? `<small>${sublabel}</small>` : ""}</span>`;
    button.addEventListener("click", onClick);
    return button;
  }

  function drawConnections(mode, unit) {
    connections.innerHTML = "";
    const lines = mode === "units" ? [[500,340,235,180],[500,340,760,200],[500,340,250,530],[500,340,770,515]] :
      unit ? unit.goals.map((_,i) => { const a=(Math.PI*2*i/unit.goals.length)-Math.PI/2; return [500,340,500+Math.cos(a)*255,340+Math.sin(a)*210]; }) : [];
    lines.forEach((l,i) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg","path");
      const mx=(l[0]+l[2])/2, my=(l[1]+l[3])/2-28;
      path.setAttribute("d",`M${l[0]} ${l[1]} Q${mx} ${my} ${l[2]} ${l[3]}`);
      path.setAttribute("class",`connection-line${mode === "goals" ? " active" : ""}`);
      path.style.animationDelay = `${i * -.8}s`;
      connections.appendChild(path);
    });
  }

  function renderScene() {
    stage.innerHTML = "";
    scene.classList.toggle("unit-focused", state.level === "unit");
    stage.className = `spatial-stage ${state.level === "department" && !state.unitsOpen ? "stage-intro" : state.level === "department" ? "stage-units" : "stage-unit"}`;
    stage.appendChild(makeNode({type:"department",label:data.department.title,sublabel:state.unitsOpen ? "مشاهده هدف فراگیر" : "برای گشودن انتخاب کنید",accent:"#28c1b8",style:{},onClick:() => { if(state.unitsOpen && state.level === "department") return departmentGoal(); state.unitsOpen = true; state.level="department"; state.unit=null; state.goal=null; setRoute("/"); render(); }}));
    data.units.forEach((unit,i) => {
      const p=unitPositions[i], m=mobilePositions[i];
      const selected=state.unit?.id === unit.id;
      const node=makeNode({type:"unit",label:unit.title,sublabel:`${fa.format(unit.goals.length)} هدف`,accent:unit.accent,selected,style:{"--x":p.x,"--y":p.y,"--z":p.z,"--start-x":"0px","--start-y":"0px","--focus-x":"0vw","--focus-y":"0vh"},onClick:()=>openUnit(unit)});
      node.style.left="calc(50% - 66px)"; node.style.top="calc(50% - 66px)";
      node.dataset.mx=m[0]; node.dataset.my=m[1]; stage.appendChild(node);
    });
    if (state.level === "unit" && state.unit) {
      const total=state.unit.goals.length;
      state.unit.goals.forEach((goal,i) => {
        const a=(Math.PI*2*i/total)-Math.PI/2;
        const rx=innerWidth<700?125:Math.min(280,innerWidth*.19), ry=innerWidth<700?190:Math.min(235,innerHeight*.27);
        const node=makeNode({type:"goal",label:goal.shortTitle,sublabel:`هدف ${fa.format(i+1)}`,accent:state.unit.accent,style:{"--x":`${Math.cos(a)*rx}px`,"--y":`${Math.sin(a)*ry}px`,"--z":`${i%2?10:-15}px`,"--start-x":"0px","--start-y":"0px"},onClick:()=>openGoal(state.unit,goal)});
        node.style.left="calc(50% - 56px)"; node.style.top="calc(50% - 56px)"; stage.appendChild(node);
      });
    }
    applyMobilePositions();
    drawConnections(state.level === "unit" ? "goals" : state.unitsOpen ? "units" : "none", state.unit);
    $("sceneEyebrow").textContent = state.level === "unit" ? `واحد اجرایی · ${fa.format(state.unit.goals.length)} هدف` : "یک نظام راهبردی یکپارچه";
    $("sceneTitle").textContent = state.level === "unit" ? state.unit.title : data.department.title;
    $("sceneHint").textContent = state.level === "unit" ? "هر گره، یک هدف قابل‌اندازه‌گیری است." : state.unitsOpen ? "یکی از واحدها را برای ورود به مسیر اهداف انتخاب کنید." : "برای دیدن واحدها، هسته مرکزی را انتخاب کنید.";
  }

  function applyMobilePositions(){ if(innerWidth>700)return; document.querySelectorAll(".node.unit").forEach(n=>{n.style.setProperty("--x",`${n.dataset.mx}px`);n.style.setProperty("--y",`${n.dataset.my}px`);}); }
  function openUnit(unit){state.level="unit";state.unit=unit;state.goal=null;state.unitsOpen=true;setRoute(`/unit/${unit.id}`);render();}
  function openGoal(unit,goal){state.level="goal";state.unit=unit;state.goal=goal;state.unitsOpen=true;setRoute(`/unit/${unit.id}/goal/${goal.id}`);render();}
  function departmentGoal(){state.level="goal";state.unit=null;state.goal=data.department.overarchingGoal;state.unitsOpen=true;setRoute("/goal/department-goal");render();}

  function renderDetail(){
    const show=state.level === "goal" && state.goal;
    $("detail").hidden=!show; syncModalState(); if(!show)return;
    const g=state.goal,u=state.unit;
    $("detail").style.setProperty("--accent",u?.accent || "#28c1b8");
    $("detailUnit").textContent=u?.title || data.department.title;
    $("detailIndex").textContent=u ? `هدف ${fa.format(u.goals.indexOf(g)+1)} از ${fa.format(u.goals.length)}` : "هدف فراگیر معاونت";
    $("detailGoal").textContent=g.revisedGoal; $("detailAlignment").textContent=g.strategicAlignment; $("detailResult").textContent=g.keyResult;
    $("indicatorCount").textContent=`${fa.format(g.indicators.length)} معیار`;
    $("indicatorList").innerHTML=g.indicators.map((x,i)=>`<div class="indicator"><b>${fa.format(i+1).padStart(2,"۰")}</b><span>${x}</span></div>`).join("");
    $("proposedWrap").hidden=!g.proposedGoal; $("detailProposed").textContent=g.proposedGoal;
  }

  function closeDetail(){if(state.unit){state.level="unit";state.goal=null;setRoute(`/unit/${state.unit.id}`);}else{state.level="department";state.goal=null;setRoute("/");}render();}
  function renderBreadcrumb(){
    const b=$("breadcrumb"); if(state.presenting){b.hidden=true;return} b.hidden=state.level==="department"&&!state.unitsOpen;
    const parts=[`<button data-route="home">${data.department.title}</button>`];
    if(state.unit)parts.push(`<span>←</span><button data-route="unit">${state.unit.title}</button>`);
    if(state.goal)parts.push(`<span>←</span><b>${state.goal.shortTitle || "هدف فراگیر"}</b>`);
    b.innerHTML=parts.join(""); b.querySelector('[data-route="home"]')?.addEventListener("click",home); b.querySelector('[data-route="unit"]')?.addEventListener("click",()=>openUnit(state.unit));
  }

  function renderOverview(){
    const map=$("overviewMap"); map.innerHTML=data.units.map(u=>`<article class="overview-unit" tabindex="0" role="button" data-unit="${u.id}" style="--accent:${u.accent}"><h3>${u.title}</h3><p class="count">${fa.format(u.goals.length)}</p><ul>${u.goals.map(g=>`<li data-strategy="${encodeURIComponent(g.strategicAlignment)}">${g.shortTitle}</li>`).join("")}</ul></article>`).join("");
    map.querySelectorAll(".overview-unit").forEach(el=>{const go=()=>{$("overview").hidden=true;openUnit(data.units.find(u=>u.id===el.dataset.unit))};el.onclick=go;el.onkeydown=e=>{if(e.key==="Enter"||e.key===" ")go()}});
    const unique=[...new Set(data.units.flatMap(u=>u.goals.map(g=>g.strategicAlignment)))];
    $("strategicLegend").innerHTML=unique.map(s=>`<button class="strategy-chip" data-strategy="${encodeURIComponent(s)}">${s}</button>`).join("");
    $("strategicLegend").querySelectorAll("button").forEach(btn=>btn.onclick=()=>highlightStrategy(btn));
  }
  function highlightStrategy(btn){const key=btn.dataset.strategy,on=!btn.classList.contains("active");document.querySelectorAll(".strategy-chip").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".overview-unit").forEach(x=>x.classList.remove("dim","highlight"));if(!on)return;btn.classList.add("active");document.querySelectorAll(".overview-unit").forEach(unit=>{unit.classList.add(unit.querySelector(`[data-strategy="${key}"]`)?"highlight":"dim")})}
  function syncModalState(){const modalOpen=!$("detail").hidden||!$("overview").hidden;scene.inert=modalOpen;document.querySelector(".topbar").inert=modalOpen;$("breadcrumb").inert=modalOpen;}
  function showOverview(){renderOverview();$("overview").hidden=false;syncModalState();$("overviewClose").focus();}
  function home(){state={...state,level:"department",unit:null,goal:null,unitsOpen:true};$("detail").hidden=true;$("overview").hidden=true;setRoute("/");render();}

  const presentationSteps=[{type:"department"},{type:"goal",unit:null,goal:data.department.overarchingGoal},...data.units.flatMap(u=>[{type:"unit",unit:u},...u.goals.map(g=>({type:"goal",unit:u,goal:g}))]),{type:"overview"}];
  function startPresentation(){state.presenting=true;state.presentationIndex=0;$("presentationControls").hidden=false;goPresentation(0);}
  function goPresentation(index){state.presentationIndex=Math.max(0,Math.min(index,presentationSteps.length-1));const s=presentationSteps[state.presentationIndex];$("overview").hidden=true;$("detail").hidden=true;if(s.type==="department"){state.level="department";state.unit=null;state.goal=null;state.unitsOpen=true;render();}else if(s.type==="unit"){state.level="unit";state.unit=s.unit;state.goal=null;state.unitsOpen=true;render();}else if(s.type==="goal"){state.level="goal";state.unit=s.unit;state.goal=s.goal;render();}else{showOverview()}const label=s.type==="overview"?"نمای نهایی یکپارچه":s.type==="department"?data.department.title:s.type==="unit"?s.unit.title:s.unit?`${s.unit.title} / هدف ${fa.format(s.unit.goals.indexOf(s.goal)+1)} از ${fa.format(s.unit.goals.length)}`:"هدف فراگیر معاونت";$("presentationLabel").textContent=label;$("presentationProgress").style.width=`${((state.presentationIndex+1)/presentationSteps.length)*100}%`;$("prevButton").disabled=state.presentationIndex===0;$("nextButton").disabled=state.presentationIndex===presentationSteps.length-1;}
  function exitPresentation(){state.presenting=false;$("presentationControls").hidden=true;home();}

  function render(){renderScene();renderDetail();renderBreadcrumb();}
  function fromHash(){const p=location.hash.replace(/^#/,"");const match=p.match(/^\/unit\/([^/]+)(?:\/goal\/([^/]+))?/);if(match){const u=data.units.find(x=>x.id===match[1]);if(u){state.unitsOpen=true;state.unit=u;const g=u.goals.find(x=>x.id===match[2]);state.level=g?"goal":"unit";state.goal=g||null;render();return}}if(p.includes("department-goal")){departmentGoal();return}home();}

  $("homeButton").onclick=home; $("overviewButton").onclick=showOverview; $("presentButton").onclick=startPresentation; $("detailClose").onclick=closeDetail; $("overviewClose").onclick=()=>{$("overview").hidden=true;syncModalState();$("overviewButton").focus()}; $("prevButton").onclick=()=>goPresentation(state.presentationIndex-1); $("nextButton").onclick=()=>goPresentation(state.presentationIndex+1); $("exitPresent").onclick=exitPresentation;
  document.addEventListener("keydown",e=>{if(state.presenting&&e.key==="ArrowLeft")goPresentation(state.presentationIndex+1);if(state.presenting&&e.key==="ArrowRight")goPresentation(state.presentationIndex-1);if(e.key==="Escape"){if(state.presenting)exitPresentation();else if(!$("overview").hidden)$("overview").hidden=true;else if(state.level==="goal")closeDetail();else home();}});
  window.addEventListener("resize",applyMobilePositions); window.addEventListener("popstate",fromHash);
  if(location.hash && location.hash !== "#/") fromHash(); else render();
})();
