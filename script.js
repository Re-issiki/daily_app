// ===== 初期データ =====
const weekdays = ["月曜日","火曜日","水曜日","木曜日","金曜日","土曜日","日曜日"];
let playerData = JSON.parse(localStorage.getItem("playerData")) || {name:"名無し", categories:{}};
let quests = JSON.parse(localStorage.getItem("quests")) || {};
let homeGenerated = JSON.parse(localStorage.getItem("homeGenerated")) || {};
let categoryOrder =
  JSON.parse(localStorage.getItem("categoryOrder")) || {};
let emergencyQuests = JSON.parse(localStorage.getItem("emergencyQuests")) || [];
let achievements = JSON.parse(localStorage.getItem("achievements")) || []; // {id, name, rank}
let selectedAchievements = JSON.parse(localStorage.getItem("selectedAchievements")) || []; // array of achievement ids
let radarChart = null;

// 各曜日の初期化
weekdays.forEach(day=>{
  if(!quests[day]) quests[day]={};
  if(!homeGenerated[day]) homeGenerated[day]={};
  if(!categoryOrder[day]) categoryOrder[day]=[];
});

const rankOrder = ["F","E","D","C","B","A","S","SS","SSS"];
const baseExpPerRank = 250;
const rarityExp = {
  bronze: 10,
  silver: 30,
  gold: 50,
  diamond: 100
};
const questGenerateRate = {
  bronze: 6,
  silver: 3,
  gold: 1,
  diamond: 0.3
};

// ===== ユーティリティ =====
function genId(){ return Date.now().toString(36) + Math.floor(Math.random()*1000).toString(36); }
function rankToNumber(rank){ return rankOrder.indexOf(rank)+1; }
function moveCategory(day, index, direction){
  const order = categoryOrder[day];
  const newIndex = index + direction;
  if(newIndex < 0 || newIndex >= order.length) return;

  [order[index], order[newIndex]] =
    [order[newIndex], order[index]];

  saveData();
  renderManage();
  renderHome();
}

// ===== データ保存 =====
function saveData(){
  localStorage.setItem("quests", JSON.stringify(quests));
  localStorage.setItem("homeGenerated", JSON.stringify(homeGenerated));
  localStorage.setItem("playerData", JSON.stringify(playerData));
  localStorage.setItem("emergencyQuests", JSON.stringify(emergencyQuests));
  localStorage.setItem("achievements", JSON.stringify(achievements));
  localStorage.setItem("selectedAchievements", JSON.stringify(selectedAchievements));
  localStorage.setItem("categoryOrder", JSON.stringify(categoryOrder));
}

// ===== ホーム曜日切替 =====
let currentHomeWeekday =
  localStorage.getItem("currentHomeWeekday") || "月曜日";
function changeHomeWeekday(){ 
  currentHomeWeekday = document.getElementById("homeWeekdaySelect").value;
  localStorage.setItem("currentHomeWeekday", currentHomeWeekday); 
  renderHome(); 
}

// ===== 管理曜日切替 =====
let currentManageWeekday = "月曜日";
function changeManageWeekday(){ currentManageWeekday = document.getElementById("manageWeekdaySelect").value; renderManage(); }

// ===== カテゴリ追加 =====
function addCategory(){
  const input = document.getElementById("newCategoryInput");
  const name = input.value.trim();
  if(!name) return;

  if(!quests[currentManageWeekday][name]) quests[currentManageWeekday][name]=[];
  if(!categoryOrder[currentManageWeekday].includes(name)){
    categoryOrder[currentManageWeekday].push(name);
  }
  if(!homeGenerated[currentManageWeekday][name]) homeGenerated[currentManageWeekday][name]=[];

  if(!playerData.categories[name]) playerData.categories[name]={exp:0, rank:"F"};

  input.value="";
  saveData();
  renderManage();
  renderHome();
}

// ===== カテゴリ削除 =====
function deleteCategory(name){
  delete quests[currentManageWeekday][name];
  categoryOrder[currentManageWeekday] =
  categoryOrder[currentManageWeekday].filter(c=>c!==name);
  delete homeGenerated[currentManageWeekday][name];

  const stillExists = weekdays.some(day => quests[day][name] && Object.keys(quests[day]).includes(name));
  if(!stillExists){ delete playerData.categories[name]; }

  // もし該当実績の名前に依存するような処理があればここに
  saveData();
  renderManage();
  renderHome();
}

// ===== クエスト追加 =====
function addQuestToCategory(category){
  const text = prompt("クエスト名を入力");
  if(!text) return;

  // レア度選択用の簡易UI
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.top = "0";
  wrapper.style.left = "0";
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.style.background = "rgba(0,0,0,0.6)";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.zIndex = "9999";

  const box = document.createElement("div");
  box.style.background = "rgba(0,60,140,0.95)";
  box.style.padding = "20px";
  box.style.borderRadius = "12px";
  box.style.width = "80%";
  box.style.maxWidth = "300px";
  box.style.textAlign = "center";

  const label = document.createElement("div");
  label.textContent = "レア度を選択";
  label.style.marginBottom = "10px";

  const select = document.createElement("select");
  ["bronze","silver","gold","diamond"].forEach(r=>{
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    select.appendChild(opt);
  });

  select.style.width = "100%";
  select.style.padding = "10px";
  select.style.marginBottom = "12px";

  const okBtn = document.createElement("button");
  okBtn.textContent = "追加";

  okBtn.onclick = ()=>{
    quests[currentManageWeekday][category].push({
      text: text.trim(),
      rarity: select.value
    });
    document.body.removeChild(wrapper);
    saveData();
    renderManage();
  };

  box.append(label, select, okBtn);
  wrapper.appendChild(box);
  document.body.appendChild(wrapper);
}

//カテゴリコピー機能
function copyCategoryToAnotherDay(fromDay, category){
  const targetDay = prompt(
    "コピー先の曜日を入力してください\n" + weekdays.join(" / "),
    "火曜日"
  );
  if(!targetDay || !weekdays.includes(targetDay)) return;

  // コピー元が存在しない場合は中止
  if(!quests[fromDay] || !quests[fromDay][category]) return;

  // すでに同名カテゴリがある場合は確認
  if(quests[targetDay][category]){
    if(!confirm("コピー先に同じカテゴリがあります。上書きしますか？")) return;
  }

  // 深いコピー（参照切り）
  quests[targetDay][category] =
    quests[fromDay][category].map(q => ({ ...q, checked:false }));

  if(!categoryOrder[targetDay].includes(category)){
    categoryOrder[targetDay].push(category);
  }

  // homeGenerated も初期化
  homeGenerated[targetDay][category] = [];

  // ステータス用カテゴリがなければ作る
  if(!playerData.categories[category]){
    playerData.categories[category] = { exp:0, rank:"F" };
  }

  saveData();
  alert(`${category} を ${targetDay} にコピーしました`);
}


// ===== クエスト削除 =====
function deleteQuest(category, index){
  quests[currentManageWeekday][category].splice(index,1);
  saveData();
  renderManage();
}

// ===== クエスト要素生成 =====
function createQuestElement(obj, category, index){
  const li=document.createElement("li");
  li.classList.add(obj.rarity);

  const checkbox=document.createElement("input");
  checkbox.type="checkbox";
  checkbox.classList.add("quest-check");
  checkbox.checked=!!obj.checked;

  const span=document.createElement("span");
  span.textContent=obj.text;

  const clearLabel=document.createElement("span");
  clearLabel.textContent="CLEAR";
  clearLabel.classList.add("clear-text");

  if(obj.checked){ span.style.textDecoration="line-through"; clearLabel.style.display="inline"; }
  else{ clearLabel.style.display="none"; }

  checkbox.addEventListener("change",()=>{
    if(!checkbox.checked) return;
    if(!confirm("このクエストをクリアしますか？")){ checkbox.checked=false; return; }

    obj.checked=true;
    span.style.textDecoration="line-through";
    clearLabel.style.display="inline";

    if(!playerData.categories[category]) playerData.categories[category]={exp:0, rank:"F"};
    let catData = playerData.categories[category];
    catData.exp += rarityExp[obj.rarity] || 0;

    let currentRank = catData.rank;
    let currentExp = catData.exp;
    let expPerRank = baseExpPerRank;

    for(let i=0;i<rankOrder.indexOf(currentRank);i++) expPerRank*=2;
    while(currentExp>=expPerRank && rankOrder.indexOf(currentRank)<rankOrder.length-1){
      currentExp-=expPerRank;
      currentRank=rankOrder[rankOrder.indexOf(currentRank)+1];
      expPerRank*=2;
    }
    catData.rank=currentRank;
    catData.exp=currentExp;

    updateStatusScreen();
    saveData();
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(clearLabel);
  return li;
}

//抽選確率
function pickQuestByRarity(list){
  const weighted = [];

  list.forEach(q=>{
    const weight = questGenerateRate[q.rarity] || 0;
    for(let i=0;i<weight*10;i++){ // 精度調整（×10）
      weighted.push(q);
    }
  });

  if(weighted.length === 0) return null;
  return weighted[Math.floor(Math.random()*weighted.length)];
}

// ===== ランダム生成 =====
function randomQuests(category){
  const ul=document.getElementById("home_"+category);
  if(!ul) return;
  ul.innerHTML="";
  const loading=document.createElement("li");
  loading.textContent="生成中";
  ul.appendChild(loading);

  let dots=0;
  const interval=setInterval(()=>{ dots=(dots+1)%4; loading.textContent="生成中"+".".repeat(dots); },300);

  setTimeout(()=>{
    clearInterval(interval);
    ul.innerHTML="";

    const list = quests[currentHomeWeekday][category] || [];
    const selectedCount=Math.min(3,list.length);
    const generated = [];
    const pool = [...list];

    while(generated.length < selectedCount && pool.length > 0){
      const q = pickQuestByRarity(pool);
      if(!q) break;
      generated.push({ ...q, checked:false });
      // 同じクエストを連続で出さない
      const idx = pool.indexOf(q);
      if(idx !== -1) pool.splice(idx,1);
    }
    homeGenerated[currentHomeWeekday][category] = generated;
    (homeGenerated[currentHomeWeekday][category]||[]).forEach((obj,i)=>{ ul.appendChild(createQuestElement(obj, category,i)); });

    saveData();
  },1500);
}

// ===== 管理画面描画 =====
function renderManage(){
  const container=document.getElementById("manageCategories");
  container.innerHTML="";
  const categories = categoryOrder[currentManageWeekday] || [];

  categories.forEach((category, index)=>{
    const card=document.createElement("div");
    card.classList.add("manage-card");

    const h2=document.createElement("h2");
    h2.textContent=category;
    const upBtn = document.createElement("button");
    upBtn.textContent = "↑";
    upBtn.onclick = ()=>moveCategory(currentManageWeekday, index, -1);
    const downBtn = document.createElement("button");
    downBtn.textContent = "↓";
    downBtn.onclick = ()=>moveCategory(currentManageWeekday, index, 1);

    const delBtn=document.createElement("button");
    delBtn.textContent="カテゴリ削除";
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "他の曜日にコピー";
    copyBtn.onclick = ()=>copyCategoryToAnotherDay(currentManageWeekday, category);
    delBtn.classList.add("delete-btn");
    delBtn.onclick=()=>deleteCategory(category);

    const ul=document.createElement("ul");
    (quests[currentManageWeekday][category]||[]).forEach((q,i)=>{
      const li=document.createElement("li");
      li.textContent=q.text;
      li.classList.add(q.rarity);

      const btn=document.createElement("button");
      btn.textContent="削除";
      btn.classList.add("delete-btn");
      btn.onclick=()=>{ quests[currentManageWeekday][category].splice(i,1); saveData(); renderManage(); }

      li.appendChild(btn);
      ul.appendChild(li);
    });

    const addBtn=document.createElement("button");
    addBtn.textContent="クエスト追加";
    addBtn.onclick=()=>addQuestToCategory(category);

    card.appendChild(h2);
    card.appendChild(upBtn);
    card.appendChild(downBtn);
    card.appendChild(delBtn);
    card.appendChild(copyBtn);
    card.appendChild(ul);
    card.appendChild(addBtn);
    container.appendChild(card);
  });
}

// ===== ホーム画面描画 =====
function renderHome(){
  const container=document.getElementById("homeCategories");
  container.innerHTML="";
  const categories = categoryOrder[currentHomeWeekday] || [];

  categories.forEach(category=>{
    const card=document.createElement("div");
    card.classList.add("category-card");

    const h2=document.createElement("h2");
    h2.textContent=category;

    const ul=document.createElement("ul");
    ul.id="home_"+category;

    (homeGenerated[currentHomeWeekday][category]||[]).forEach((obj,i)=>{
      ul.appendChild(createQuestElement(obj, category,i));
    });

    const genBtn=document.createElement("button");
    genBtn.textContent="生成";
    genBtn.onclick=()=>randomQuests(category);

    const resetBtn=document.createElement("button");
    resetBtn.textContent="リセット";
    resetBtn.classList.add("reset");
    resetBtn.onclick=()=>{
      ul.innerHTML="";
      if(homeGenerated[currentHomeWeekday]) homeGenerated[currentHomeWeekday][category]=[];
      saveData();
    };

    card.appendChild(h2);
    card.appendChild(ul);
    card.appendChild(genBtn);
    card.appendChild(resetBtn);
    container.appendChild(card);
  });
}

// ===== ステータス画面 =====
function showStatus(){ 
  document.getElementById("homeScreen").style.display="none"; 
  document.getElementById("statusScreen").style.display="block"; 
  document.getElementById("playerNameInput").value=playerData.name; 
  updateStatusScreen(); 
  renderStatusAchievements();
}
function saveStatus(){ 
  const input=document.getElementById("playerNameInput"); 
  playerData.name=input.value.trim()||"名無し"; 
  saveData(); 
  alert("保存しました"); 
}
function backHomeFromStatus(){ 
  document.getElementById("statusScreen").style.display="none"; 
  document.getElementById("homeScreen").style.display="block"; 
}

function ensureStatusAchievementContainer(){
  // プレイヤー名 input の直後に実績表示用コンテナを作る（存在しなければ）
  const statusScreen = document.getElementById("statusScreen");
  if(!statusScreen) return;
  let existing = document.getElementById("statusAchievements");
  if(existing) return;
  const nameLabel = document.querySelector("#statusScreen label");
  const container = document.createElement("div");
  container.id = "statusAchievements";
  container.style.display = "flex";
  container.style.justifyContent = "space-between";
  container.style.margin = "10px 0 0 0";
  container.style.gap = "8px";

  // 3 スロット
  for(let i=0;i<3;i++){
    const slot = document.createElement("div");
    slot.id = `achSlot${i}`;
    slot.className = "achievement-slot";
    slot.style.flex = "1";
    slot.style.minHeight = "48px";
    slot.style.border = "1px solid rgba(180,220,255,0.3)";
    slot.style.background = "rgba(0,0,0,0.25)";
    slot.style.padding = "6px";
    slot.style.borderRadius = "8px";
    slot.style.fontSize = "12px";
    slot.style.display = "flex";
    slot.style.flexDirection = "column";
    slot.style.justifyContent = "center";
    slot.style.alignItems = "center";
    slot.textContent = ""; // 初期は空
    container.appendChild(slot);
  }

  // nameLabel の直後に入れる
  if(nameLabel && nameLabel.parentNode){
    nameLabel.parentNode.insertBefore(container, nameLabel.nextSibling);
  } else {
    // fallback: append to statusScreen
    statusScreen.insertBefore(container, statusScreen.firstChild.nextSibling);
  }
}

function renderStatusAchievements(){
  ensureStatusAchievementContainer();
  // 塗り替え
  for(let i=0;i<3;i++){
    const slot = document.getElementById(`achSlot${i}`);
    if(!slot) continue;
    slot.innerHTML = "";
    const aid = selectedAchievements[i];
    if(!aid) continue;
    const ach = achievements.find(a=>a.id===aid);
    if(!ach) continue;

    const title = document.createElement("div");
    title.textContent = ach.name;
    title.style.fontWeight = "700";
    title.style.textAlign = "center";

    const rank = document.createElement("div");
    rank.textContent = ach.rank;
    rank.style.marginTop = "6px";
    rank.style.fontSize = "11px";
    rank.style.padding = "2px 6px";
    rank.style.borderRadius = "6px";

    // 簡単な色付け
    if(ach.rank==="銅"){ rank.style.background = "#b87333"; rank.style.color="#fff"; }
    else if(ach.rank==="銀"){ rank.style.background = "#c0c0c0"; rank.style.color="#000"; }
    else if(ach.rank==="金"){ rank.style.background = "#ffd700"; rank.style.color="#000"; }
    else if(ach.rank==="赤"){ rank.style.background = "#d32f2f"; rank.style.color="#fff"; }

    slot.appendChild(title);
    slot.appendChild(rank);
  }
}

// ===== レーダーチャート・ステータス更新 =====
function updateStatusScreen(){
  // ステータスから存在しないカテゴリを削除（カテゴリがどの曜日にも無ければ）
  for (const cat in playerData.categories) {
    const exists = weekdays.some(day => quests[day] && quests[day][cat] && Object.keys(quests[day]).includes(cat));
    if (!exists) delete playerData.categories[cat];
  }

  const container=document.getElementById("categoryStatus");
  container.innerHTML="";
  for(const cat in playerData.categories){
    const div=document.createElement("div");
    div.classList.add("category-rank");
    const label=document.createElement("span");
    const data=playerData.categories[cat];
    const needExp=getExpForRank(data.rank);
    label.textContent=`${cat}: ランク${data.rank} / EXP ${data.exp}/${needExp}`;
    div.appendChild(label);
    container.appendChild(div);
  }

  // 実績スロットを描画
  renderStatusAchievements();

  // レーダーチャート（カテゴリ名は playerData.categories の中で、存在するカテゴリのみ）
  const ctx = document.getElementById("statusRadar").getContext("2d");
  if(radarChart) radarChart.destroy();
  const labels = Object.keys(playerData.categories).filter(cat => weekdays.some(day => quests[day] && quests[day][cat]));
  const values = labels.map(cat => rankToNumber(playerData.categories[cat].rank));

  radarChart=new Chart(ctx,{
    type:"radar",
    data:{
      labels:labels,
      datasets:[{
        label:"ステータス",
        data:values,
        borderWidth:2,
        backgroundColor:"rgba(33,150,243,0.4)",
        borderColor:"rgb(33,150,243)",
        pointBackgroundColor:"rgb(33,150,243)"
      }]
    },
    options:{
      scales:{
        r:{
          beginAtZero:true,
          suggestedMin:0,
          suggestedMax:9,
          grid:{color:"rgba(255,255,255,0.2)"},
          angleLines:{color:"rgba(255,255,255,0.2)"},
          ticks:{stepSize:1, display:false},
          pointLabels:{color:"#fff", font:{size:14}}
        }
      },
      plugins:{legend:{labels:{color:"#fff"}}}
    }
  });
}

function getExpForRank(rank){
  let exp=baseExpPerRank;
  for(let i=0;i<rankOrder.indexOf(rank);i++) exp*=2;
  return exp;
}

function resetAllStatus(){ 
  if(!confirm("本当に全てのカテゴリのステータスをリセットしますか？")) return; 
  for(const cat in playerData.categories) playerData.categories[cat]={exp:0, rank:"F"}; 
  updateStatusScreen(); 
  saveData(); 
}

// ===== 画面切替 =====
function showManage(){ document.getElementById("homeScreen").style.display="none"; document.getElementById("manageScreen").style.display="block"; renderManage(); }
function backHome(){ document.getElementById("manageScreen").style.display="none"; document.getElementById("homeScreen").style.display="block"; renderHome(); }

// ===== 緊急クエスト管理 =====
function addEmergencyQuest(){
  const text = document.getElementById("newEmergencyInput").value.trim();
  const deadline = document.getElementById("newEmergencyDeadline").value;
  if(!text || !deadline){ alert("名前と期限を入力してください"); return; }

  emergencyQuests.push({text, deadline});
  document.getElementById("newEmergencyInput").value = "";
  document.getElementById("newEmergencyDeadline").value = "";
  saveData();
  renderEmergency();
}

function showEmergency(){
  document.getElementById("homeScreen").style.display="none";
  document.getElementById("emergencyScreen").style.display="block";
  renderEmergency();
}

function backHomeFromEmergency(){
  document.getElementById("emergencyScreen").style.display="none";
  document.getElementById("homeScreen").style.display="block";
}

function renderEmergency(){
  const container = document.getElementById("emergencyList");
  container.innerHTML = "";
  if(emergencyQuests.length===0){
    const p = document.createElement("p");
    p.textContent = "現在、緊急クエストはありません";
    p.style.textAlign = "center";
    container.appendChild(p);
    return;
  }

  emergencyQuests.forEach((q,i)=>{
    const card = document.createElement("div");
    card.classList.add("manage-card");
    card.style.marginBottom = "8px";
    card.style.display = "flex";
    card.style.justifyContent = "space-between";
    card.style.alignItems = "center";

    const left = document.createElement("div");
    left.style.display="flex";
    left.style.flexDirection="column";
    const spanName = document.createElement("div");
    spanName.textContent = q.text;
    spanName.style.fontWeight = "700";
    const spanDeadline = document.createElement("div");
    spanDeadline.textContent = `期限: ${q.deadline}`;
    spanDeadline.style.fontSize = "12px";
    left.appendChild(spanName);
    left.appendChild(spanDeadline);

    const right = document.createElement("div");
    right.style.display="flex";
    right.style.flexDirection="column";
    right.style.gap = "6px";

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "クリア";
    clearBtn.onclick = ()=>{
      if(!confirm("この緊急クエストをクリアしますか？")) return;
      emergencyQuests.splice(i,1);
      saveData();
      renderEmergency();
    };

    right.appendChild(clearBtn);
    card.appendChild(left);
    card.appendChild(right);
    container.appendChild(card);
  });
}

// ===== 実績管理 =====
function showAchievements(){
  document.getElementById("homeScreen").style.display="none";
  document.getElementById("achievementScreen").style.display="block";
  renderAchievementList();
  renderAchievementSelect();
}

function backHomeFromAchievements(){
  document.getElementById("achievementScreen").style.display="none";
  document.getElementById("homeScreen").style.display="block";
}

function addAchievement(){
  const name = document.getElementById("newAchievementName").value.trim();
  const rank = document.getElementById("newAchievementRank").value;
  if(!name){ alert("実績名を入力してください"); return; }
  const id = genId();
  achievements.push({id, name, rank});
  document.getElementById("newAchievementName").value = "";
  document.getElementById("newAchievementRank").value = "銅";
  saveData();
  renderAchievementList();
  renderAchievementSelect();
}

function deleteAchievement(id){
  // 削除
  const idx = achievements.findIndex(a=>a.id===id);
  if(idx===-1) return;
  achievements.splice(idx,1);
  // 選択済みにあれば外す
  selectedAchievements = selectedAchievements.filter(sid=>sid!==id);
  saveData();
  renderAchievementList();
  renderAchievementSelect();
}

function renderAchievementList(){
  const container = document.getElementById("achievementList");
  container.innerHTML = "";
  if(achievements.length===0){
    const p = document.createElement("p");
    p.textContent = "実績はまだありません";
    p.style.textAlign = "center";
    container.appendChild(p);
    return;
  }

  achievements.forEach(a=>{
    const card = document.createElement("div");
    card.classList.add("manage-card");
    card.style.display = "flex";
    card.style.justifyContent = "space-between";
    card.style.alignItems = "center";
    card.style.marginBottom = "8px";

    const left = document.createElement("div");
    left.style.display="flex";
    left.style.flexDirection="column";
    const name = document.createElement("div");
    name.textContent = a.name;
    name.style.fontWeight = "700";
    const rank = document.createElement("div");
    rank.textContent = a.rank;
    rank.style.fontSize = "12px";
    left.appendChild(name);
    left.appendChild(rank);

    const right = document.createElement("div");
    right.style.display="flex";
    right.style.gap="8px";
    const delBtn = document.createElement("button");
    delBtn.textContent = "削除";
    delBtn.onclick = ()=>{ if(!confirm("この実績を削除しますか？")) return; deleteAchievement(a.id); };
    right.appendChild(delBtn);

    card.appendChild(left);
    card.appendChild(right);
    container.appendChild(card);
  });
}

function renderAchievementSelect(){
  const container = document.getElementById("achievementSelect");
  container.innerHTML = "";

  // リスト（チェックボックスで選択） - すべての実績
  achievements.forEach(a=>{
    const row = document.createElement("div");
    row.style.display="flex";
    row.style.alignItems="center";
    row.style.justifyContent="space-between";
    row.style.marginBottom="6px";

    const left = document.createElement("div");
    left.style.display="flex";
    left.style.alignItems="center";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = selectedAchievements.includes(a.id);
    chk.onchange = (e)=>{
      if(e.target.checked){
        if(selectedAchievements.length>=3){
          alert("ステータスに表示できる実績は3つまでです。");
          e.target.checked = false;
          return;
        }
        selectedAchievements.push(a.id);
      } else {
        selectedAchievements = selectedAchievements.filter(id=>id!==a.id);
      }
    };
    const label = document.createElement("span");
    label.textContent = `${a.name} (${a.rank})`;
    label.style.marginLeft = "8px";
    left.appendChild(chk);
    left.appendChild(label);

    row.appendChild(left);

    container.appendChild(row);
  });
}

function saveSelectedAchievements(){
  // もし選ばれている id が 3 個までなら保存
  if(selectedAchievements.length>3){
    alert("実績は3つまで選択できます。");
    return;
  }
  // selectedAchievements に空スロットがあれば短くする
  selectedAchievements = selectedAchievements.slice(0,3);
  saveData();
  alert("実績を保存しました");
  backHomeFromAchievements();
  renderStatusAchievements();
}

// バックアップ保存（JSONダウンロード）
function downloadBackup() {
    const data = {};

    // localStorage全体を取り出す
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "backup_data.json"; // 保存されるファイル名
    a.click();

    URL.revokeObjectURL(url);
    alert("バックアップをダウンロードしました！");
}


// バックアップ復元（JSON読み込み）
function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            // localStorage をいったん全消去するかは任意
            // 安全のため、ここでは上書きのみ（消さない）
            for (const key in data) {
                localStorage.setItem(key, data[key]);
            }

            alert("バックアップを復元しました！再読み込みします。");
            location.reload();

        } catch (err) {
            alert("バックアップの読み込みに失敗しました。ファイルが壊れている可能性があります。");
        }
    };

    reader.readAsText(file);
}



// ===== 初期処理 =====
document.addEventListener("DOMContentLoaded",()=>{
  const select = document.getElementById("homeWeekdaySelect");
  if(select){
    select.value = currentHomeWeekday;
  }
  renderHome();
});