// ===== DOM =====
const home = document.getElementById("home");
const status = document.getElementById("status");
const edit = document.getElementById("edit");
const achievementList = document.getElementById("achievementList");
const pomodoro = document.getElementById("pomodoro");
const pomodoroHistoryScreen = document.getElementById("pomodoroHistoryScreen");

// ホーム関連
const viewName = document.getElementById("viewName");
const viewSchool = document.getElementById("viewSchool");
const ach1 = document.getElementById("ach1");
const ach2 = document.getElementById("ach2");
const ach3 = document.getElementById("ach3");
const statusButtons = document.getElementById("statusButtons");

// ステータス関連
const statusTitle = document.getElementById("statusTitle");
const radarChart = document.getElementById("radarChart");
const itemSelect = document.getElementById("itemSelect");
const hourSelect = document.getElementById("hourSelect");
const minuteSelect = document.getElementById("minuteSelect");
const newItemName = document.getElementById("newItemName");
const itemList = document.getElementById("itemList");

// 編集画面関連
const inputName = document.getElementById("inputName");
const inputSchool = document.getElementById("inputSchool");
const newStatusName = document.getElementById("newStatusName");
const statusManage = document.getElementById("statusManage");

// 実績関連
const newAchText = document.getElementById("newAchText");
const newAchRank = document.getElementById("newAchRank");
const achievementCards = document.getElementById("achievementCards");

// ポモドーロ関連
const pomodoroTimerText = document.getElementById("pomodoroTimerText");
const pomodoroSubject = document.getElementById("pomodoroSubject");
const pomodoroItem = document.getElementById("pomodoroItem");
const pomodoroWork = document.getElementById("pomodoroWork");
const pomodoroBreak = document.getElementById("pomodoroBreak");
const pomodoroRepeat = document.getElementById("pomodoroRepeat");
const pomodoroChart = document.getElementById("pomodoroChart");
const pomodoroHistoryList = document.getElementById("pomodoroHistoryList");

// ===== データ =====
let profile = {};
let statusData = {};
let chart = null;
let currentKey = "";
let timerState = JSON.parse(localStorage.getItem("timerState") || "null");
let pomodoroSessions = JSON.parse(localStorage.getItem("pomodoroSessions") || "[]");
let lastPomodoroAdd = null;

// タイマー関連
let timerId = null;
let remaining = 0;
let currentMode = "work";
let currentRepeat = 0;
const circle = document.querySelector(".timerCircle .fg");

// ===== 初期化 =====
for(let i=0;i<=24;i++) hourSelect.innerHTML += `<option>${i}</option>`;
for(let i=0;i<=59;i++) minuteSelect.innerHTML += `<option>${i}</option>`;

// ===== 永続化 =====
function saveStorage() {
  localStorage.setItem("profile", JSON.stringify(profile));
  localStorage.setItem("statusData", JSON.stringify(statusData));
}
function loadStorage() {
  const p = localStorage.getItem("profile");
  const s = localStorage.getItem("statusData");
  profile = p ? JSON.parse(p) : { name:"Re", school:"〇〇学校", achievements:[], displayAchievements:[] };
  statusData = s ? JSON.parse(s) : {};
  if(!Array.isArray(profile.achievements)) profile.achievements=[];
  if(!Array.isArray(profile.displayAchievements)) profile.displayAchievements=[];
}

// ===== 共通関数 =====
function getDateKey(date) { return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`; }
function todayKey() { return getDateKey(new Date()); }
function saveCurrentKey(key){ localStorage.setItem("currentStatusKey", key); }
function loadCurrentKey(){ return localStorage.getItem("currentStatusKey")||""; }
function saveTimerState(){ localStorage.setItem("timerState", JSON.stringify(timerState)); }
function savePomodoro(){ localStorage.setItem("pomodoroSessions", JSON.stringify(pomodoroSessions)); }

// ===== ランク =====
const rankTable = [
  { m: 2160*60, r: 7 }, { m: 720*60, r: 6 }, { m:504*60, r:5 },
  { m:168*60, r:4 }, { m:72*60, r:3 }, { m:24*60, r:2 }, { m:0, r:1 }
];
const rankLabel = ["","F","E","D","C","B","A","S"];
const minutesToRank = m=>rankTable.find(t=>m>=t.m).r;
const minutesToHM = m=>m<=0?"未学習":`${Math.floor(m/60)}時間${m%60}分`;

// ===== ホーム =====
function renderHome(){
  viewName.textContent=`名前：${profile.name}`;
  viewSchool.textContent=`所属：${profile.school}`;
  [ach1,ach2,ach3].forEach((el,i)=>{
    const id = profile.displayAchievements[i];
    const a = profile.achievements.find(x=>x.id===id);
    el.innerHTML = a?.text?`<div>実績${i+1}　ランク:${rankLabel[a.rank]||""}</div><div class="achievement-text ${a.rank}">${a.text}</div>`:`${i+1}.`;
  });
  statusButtons.innerHTML="";
  Object.keys(statusData).forEach(k=>{
    const total = getStatusTotalMinutes(k);
    const card = document.createElement("div");
    card.className="status-card";
    card.innerHTML = `<div class="status-title">${statusData[k].title}</div><div class="status-time">総時間：${minutesToHM(total)}</div>`;
    card.onclick = ()=>openStatus(k);
    statusButtons.appendChild(card);
  });
}
function getStatusTotalMinutes(key){ return statusData[key]?.items?.reduce((sum,i)=>sum+i.minutes,0)||0; }

// ===== ステータス画面 =====
function openStatus(key){
  currentKey=key; saveCurrentKey(key);
  const st=statusData[key];
  if(!st?.items) return backHome();
  hideAll(); status.classList.remove("hidden");
  statusTitle.textContent=st.title; updateItemSelect(); renderItemList(); drawChart();
  const savedItem = localStorage.getItem("status_item");
  const savedHour = localStorage.getItem("status_hour");
  const savedMin  = localStorage.getItem("status_min");
  itemSelect.value = savedItem && st.items[savedItem]?savedItem:0;
  if(savedHour!==null) hourSelect.value=savedHour;
  if(savedMin!==null) minuteSelect.value=savedMin;
}
function updateItemSelect(){
  itemSelect.innerHTML="";
  statusData[currentKey].items.forEach((i,idx)=>itemSelect.innerHTML+=`<option value="${idx}">${i.name}</option>`);
}
function renderItemList(){
  itemList.innerHTML="";
  statusData[currentKey].items.forEach((i,idx)=>{
    const row=document.createElement("div"); row.className="card"; row.style.padding="8px";
    row.innerHTML=`<div style="display:flex;align-items:center;gap:6px;"><span style="flex:1;font-weight:600;">${i.name}</span><button class="small" onclick="resetItemTime(${idx})">リセット</button><button class="small" style="background:#dc2626" onclick="deleteItem(${idx})">削除</button></div><div style="font-size:13px;color:#555;margin-top:4px;">総時間：${minutesToHM(i.minutes)}</div>`;
    itemList.appendChild(row);
  });
}
function addItem(){
  if(!newItemName.value) return;
  const id=Date.now();
  statusData[currentKey].items.push({id,name:newItemName.value,minutes:0});
  newItemName.value="";
  saveStorage(); updateItemSelect(); renderItemList(); drawChart();
}
function resetItemTime(idx){ if(!confirm("この項目の勉強時間をリセットしますか？")) return; statusData[currentKey].items[idx].minutes=0; saveStorage(); renderItemList(); drawChart(); }
function deleteItem(idx){ if(!confirm("削除しますか？")) return; statusData[currentKey].items.splice(idx,1); saveStorage(); updateItemSelect(); renderItemList(); drawChart(); }
function addStudy(){
  const selectedId=Number(itemSelect.value);
  const item=statusData[currentKey].items[selectedId]; if(!item) return;
  const h=Number(hourSelect.value); const min=Number(minuteSelect.value); const m=h*60+min; if(m<=0) return;
  if(!confirm(`${item.name}に${h}時間${min}分を追加しますか？`)) return;
  item.minutes+=m; saveStorage(); renderItemList(); drawChart();
}
itemSelect.addEventListener("change", saveStatusFormState);
hourSelect.addEventListener("change", saveStatusFormState);
minuteSelect.addEventListener("change", saveStatusFormState);
function saveStatusFormState(){ localStorage.setItem("status_item",itemSelect.value); localStorage.setItem("status_hour",hourSelect.value); localStorage.setItem("status_min",minuteSelect.value); }

// ===== チャート =====
function drawChart(){
  const items=statusData[currentKey]?.items||[]; if(chart) chart.destroy(); if(!items.length) return;
  chart=new Chart(radarChart,{type:"radar",data:{labels:items.map(i=>i.name),datasets:[{data:items.map(i=>minutesToRank(i.minutes))}]},options:{plugins:{legend:{display:false}},scales:{r:{min:1,max:7,ticks:{callback:v=>rankLabel[v]}}}}});
}

// ===== 編集画面 =====
function openEdit(){ hideAll(); edit.classList.remove("hidden"); inputName.value=localStorage.getItem("editName")||profile.name; inputSchool.value=localStorage.getItem("editSchool")||profile.school; renderStatusManage(); }
function saveData(){ profile.name=inputName.value.trim()||profile.name; profile.school=inputSchool.value.trim()||profile.school; saveStorage(); localStorage.removeItem("editName"); localStorage.removeItem("editSchool"); backHome(); }
inputName.addEventListener("input",()=>localStorage.setItem("editName",inputName.value));
inputSchool.addEventListener("input",()=>localStorage.setItem("editSchool",inputSchool.value));
function renderStatusManage(){ statusManage.innerHTML=""; Object.keys(statusData).forEach(k=>{ const row=document.createElement("div"); row.style.display="flex"; row.innerHTML=`<span style="flex:1">${statusData[k].title}</span><button class="small danger" onclick="deleteStatus('${k}')">削除</button>`; statusManage.appendChild(row); }); }
function addStatus(){ if(!newStatusName.value) return; const key="s"+Date.now(); statusData[key]={title:newStatusName.value,items:[]}; newStatusName.value=""; saveStorage(); renderStatusManage(); renderHome(); }
function deleteStatus(key){ if(!confirm("削除しますか？")) return; delete statusData[key]; saveStorage(); backHome(); }

// ===== 実績 =====
function addAchievement(){ const text=newAchText.value.trim(); const rank=newAchRank.value; if(!text) return; const id=Date.now(); profile.achievements.push({id,text,rank}); if(profile.displayAchievements.length<3) profile.displayAchievements.push(id); newAchText.value=""; saveStorage(); renderAchievementList(); renderHome(); }
function openAchievementList(){ hideAll(); achievementList.classList.remove("hidden"); renderAchievementList(); }
function renderAchievementList(){ achievementCards.innerHTML=""; profile.achievements.forEach(a=>{ if(!a.text) return; const card=document.createElement("div"); card.className="achievement-card"; card.draggable=true; card.dataset.id=a.id; card.innerHTML=`<div class="achievement-rank ${a.rank}">${rankLabel[a.rank]}</div><div class="achievement-content"><div class="achievement-text ${a.rank}">${a.text}</div><button class="small" style="background:${profile.displayAchievements.includes(a.id)?'#2563eb':'#555'}" onclick="toggleDisplayAchievement(${a.id})">${profile.displayAchievements.includes(a.id)?'表示中':'ホーム表示'}</button><button class="small" style="background:#dc2626" onclick="deleteAchievement(${a.id})">削除</button></div>`; achievementCards.appendChild(card); }); }
function deleteAchievement(id){ if(!confirm("削除しますか？")) return; profile.achievements=profile.achievements.filter(a=>a.id!==id); profile.displayAchievements=profile.displayAchievements.filter(x=>x!==id); saveStorage(); renderAchievementList(); renderHome(); }
function toggleDisplayAchievement(id){ const idx=profile.displayAchievements.indexOf(id); if(idx>=0) profile.displayAchievements.splice(idx,1); else{ if(profile.displayAchievements.length>=3){ alert("表示は3つまで"); return; } profile.displayAchievements.push(id); } saveStorage(); renderAchievementList(); renderHome(); }

// ===== ポモドーロ =====
function fillPomodoroSubjectSelect(){
  pomodoroSubject.innerHTML="";
  const keys=Object.keys(statusData);
  if(!keys.length){ pomodoroSubject.innerHTML=`<option value="">（ステータスがありません）</option>`; return; }
  keys.forEach(k=>{ const opt=document.createElement("option"); opt.value=k; opt.textContent=statusData[k].title; pomodoroSubject.appendChild(opt); });
}
function fillPomodoroItemSelect(statusId){
  pomodoroItem.innerHTML="";
  const st=statusData[statusId];
  if(!st?.items?.length){ pomodoroItem.innerHTML=`<option value="">（項目がありません）</option>`; return; }
  st.items.forEach(it=>{ const opt=document.createElement("option"); opt.value=it.id; opt.textContent=it.name; pomodoroItem.appendChild(opt); });
}
function addPomodoroMinutes(min){
  const subject=pomodoroSubject.value; const itemId=Number(pomodoroItem.value);
  const session={id:Date.now(),date:todayKey(),minutes:min,subject,item:itemId};
  pomodoroSessions.push(session); savePomodoro(); lastPomodoroAdd=session; showUndoToast(min);
  adjustItemMinutes(subject,itemId,min); renderPomodoroStats(); renderPomodoroHistoryScreen();
}
function undoPomodoro(){ if(!lastPomodoroAdd) return; const idx=pomodoroSessions.findIndex(s=>s.id===lastPomodoroAdd.id); if(idx!==-1) pomodoroSessions.splice(idx,1); savePomodoro(); lastPomodoroAdd=null; document.getElementById("undoToast").style.display="none"; renderPomodoroStats(); renderPomodoroHistoryScreen(); }
function startPomodoro(){
  const subject=pomodoroSubject.value; const item=Number(pomodoroItem.value);
  const work=Number(pomodoroWork.value); const brk=Number(pomodoroBreak.value); const repeat=Number(pomodoroRepeat.value);
  if(!subject||!item){ alert("科目と項目を選択してください"); return; }
  currentRepeat=repeat; currentMode="work"; remaining=work*60;
  timerState={mode:currentMode,remaining,sessionTotal:work*60,work,brk,repeat,startedAt:Date.now()}; saveTimerState();
  document.getElementById("pomodoroStartBtn").style.display="none"; document.getElementById("pomodoroCancelBtn").style.display="inline-block";
  runPomodoroTimer(work,brk);
}
function runPomodoroTimer(work,brk){
  clearInterval(timerId);
  timerId=setInterval(()=>{
    remaining--; timerState.remaining=remaining; saveTimerState(); updateTimerUI(remaining,timerState.sessionTotal);
    if(remaining<=0){
      clearInterval(timerId);
      if(currentMode==="work"){
        addPomodoroMinutes(work);
        if(currentRepeat>1){ currentMode="break"; remaining=brk*60; currentRepeat--; timerState={mode:currentMode,remaining,sessionTotal:brk*60,work,brk,repeat:currentRepeat,startedAt:Date.now()}; saveTimerState(); runPomodoroTimer(work,brk);}
        else endPomodoroCycle();
      }else{ currentMode="work"; remaining=work*60; timerState={mode:currentMode,remaining,sessionTotal:work*60,work,brk,repeat:currentRepeat,startedAt:Date.now()}; saveTimerState(); runPomodoroTimer(work,brk);}
    }
  },1000);
}
function endPomodoroCycle(){ alert("ポモドーロサイクル終了"); document.getElementById("pomodoroStartBtn").style.display="inline-block"; document.getElementById("pomodoroCancelBtn").style.display="none"; timerState=null; saveTimerState(); renderPomodoroStats(); }
function renderPomodoroStats(){
  const todayTotal=pomodoroSessions.filter(s=>s.date===todayKey()).reduce((a,b)=>a+b.minutes,0);
  document.getElementById("todayPomodoro").textContent=`今日の合計：${Math.floor(todayTotal/60)}時間${todayTotal%60}分`;
  drawPomodoroChart(); renderPomodoroHistoryScreen();
}
function renderPomodoroHistoryScreen(){
  pomodoroHistoryList.innerHTML="";
  if(!pomodoroSessions.length){ pomodoroHistoryList.innerHTML=`<p style="color:#666;">履歴がありません</p>`; return; }
  [...pomodoroSessions].sort((a,b)=>b.id-a.id).forEach(s=>{
    const row=document.createElement("div"); row.className="achievement-card";
    row.innerHTML=`<div style="flex:1;">${s.date}　${Math.floor(s.minutes/60)}時間${s.minutes%60}分<div style="font-size:0.85em;color:#666;">項目：${s.subject||"未指定"}</div></div><button class="small danger" onclick="deletePomodoro(${s.id})">削除</button>`;
    pomodoroHistoryList.appendChild(row);
  });
}
function deletePomodoro(id){ if(!confirm("削除しますか？")) return; pomodoroSessions=pomodoroSessions.filter(s=>s.id!==id); savePomodoro(); renderPomodoroStats(); }
function drawPomodoroChart(){
  const summary={}; pomodoroSessions.forEach(s=>{ summary[s.subject]=(summary[s.subject]||0)+s.minutes; });
  if(pomodoroChart?.chart) pomodoroChart.chart.destroy();
  const ctx=pomodoroChart.getContext("2d"); pomodoroChart.chart=new Chart(ctx,{type:"bar",data:{labels:Object.keys(summary),datasets:[{label:"分",data:Object.values(summary),backgroundColor:"#2196f3"}]},options:{indexAxis:'y'}});
}
function updateTimerUI(remain,total){ const t=Math.floor(remain/60); const s=String(remain%60).padStart(2,"0"); pomodoroTimerText.textContent=`${t}:${s}`; if(circle) circle.style.strokeDashoffset = 282.6*(1 - remain/total); if(circle) circle.style.stroke=currentMode==="work"?"#2196f3":"#4caf50"; }
function cancelPomodoro(){ clearInterval(timerId); pomodoroTimerText.textContent="00:00"; timerState=null; saveTimerState(); document.getElementById("pomodoroStartBtn").style.display="inline-block"; document.getElementById("pomodoroCancelBtn").style.display="none"; }
function adjustItemMinutes(statusId,itemId,delta){ const st=statusData[statusId]; if(!st?.items) return; const it=st.items.find(i=>i.id===itemId); if(!it) return; it.minutes=(it.minutes||0)+delta; if(it.minutes<0) it.minutes=0; saveStorage(); renderHome(); }
function showUndoToast(min){ const toast=document.getElementById("undoToast"); toast.textContent=`${min}分追加しました [元に戻す]`; toast.style.display="block"; setTimeout(()=>{toast.style.display="none";},4000); }

// ===== 画面操作 =====
function hideAll(){ home.classList.add("hidden"); status.classList.add("hidden"); edit.classList.add("hidden"); achievementList.classList.add("hidden"); pomodoro.classList.add("hidden"); pomodoroHistoryScreen?.classList.add("hidden"); }
function backHome(){ hideAll(); home.classList.remove("hidden"); renderHome(); fillPomodoroSubjectSelect(); }

// ===== 初期ロード =====
loadStorage();
window.addEventListener("load",()=>{
  const scr=localStorage.getItem("currentScreen")||"home";
  hideAll(); const el=document.getElementById(scr); if(el) el.classList.remove("hidden");
  renderHome(); fillPomodoroSubjectSelect(); if(timerState){ const elapsed=Math.floor((Date.now()-timerState.startedAt)/1000); remaining=Math.max(0,timerState.remaining-elapsed); currentMode=timerState.mode; currentRepeat=timerState.repeat||1; runPomodoroTimer(timerState.work,timerState.brk);}
});
