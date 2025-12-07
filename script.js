// ===== 初期データ =====
const weekdays = ["月曜日","火曜日","水曜日","木曜日","金曜日","土曜日","日曜日"];
let playerData = JSON.parse(localStorage.getItem("playerData")) || {name:"名無し", categories:{}};
let quests = JSON.parse(localStorage.getItem("quests")) || {}; 
let homeGenerated = JSON.parse(localStorage.getItem("homeGenerated")) || {};
let radarChart = null;

// 各曜日の初期化
weekdays.forEach(day=>{
  if(!quests[day]) quests[day]={};
  if(!homeGenerated[day]) homeGenerated[day]={};
});

const rankOrder = ["F","E","D","C","B","A","S","SS","SSS"];
const baseExpPerRank = 100;

// ===== ランク変換 =====
function rankToNumber(rank){
  return rankOrder.indexOf(rank)+1;
}

// ===== データ保存 =====
function saveData(){
  localStorage.setItem("quests", JSON.stringify(quests));
  localStorage.setItem("homeGenerated", JSON.stringify(homeGenerated));
  localStorage.setItem("playerData", JSON.stringify(playerData));
}

// ===== ホーム画面曜日 =====
let currentHomeWeekday = "月曜日";
function changeHomeWeekday(){
  currentHomeWeekday = document.getElementById("homeWeekdaySelect").value;
  renderHome();
}

// ===== 管理画面曜日 =====
let currentManageWeekday = "月曜日";
function changeManageWeekday(){
  currentManageWeekday = document.getElementById("manageWeekdaySelect").value;
  renderManage();
}

// ===== カテゴリ追加 =====
function addCategory(){
  const input = document.getElementById("newCategoryInput");
  const name = input.value.trim();
  if(!name) return;

  // ✅ 現在管理中の曜日だけに追加
  if(!quests[currentManageWeekday][name]) quests[currentManageWeekday][name]=[];
  if(!homeGenerated[currentManageWeekday][name]) homeGenerated[currentManageWeekday][name]=[];

  // ステータス用データは全体で1回だけ
  if(!playerData.categories[name]) playerData.categories[name]={exp:0, rank:"F"};

  input.value="";
  saveData();
  renderManage();
  renderHome();
}

// ===== カテゴリ削除 =====
function deleteCategory(name){
  // ✅ 現在管理中の曜日だけ削除
  delete quests[currentManageWeekday][name];
  delete homeGenerated[currentManageWeekday][name];

  // 他の曜日にも存在していなければステータスから削除
  const stillExists = weekdays.some(day => quests[day][name] && Object.keys(quests[day]).includes(name));
  if(!stillExists){
    delete playerData.categories[name];
  }

  saveData();
  renderManage();
  renderHome();
}

// ===== クエスト追加 =====
function addQuestToCategory(category){
  const text = prompt("クエストを入力:");
  if(!text) return;
  const rarity = prompt("レア度を入力（bronze / silver / gold）");
  if(!["bronze","silver","gold"].includes(rarity)){
    alert("bronze / silver / gold のどれかを入力してください。");
    return;
  }
  quests[currentManageWeekday][category].push({text, rarity});
  saveData();
  renderManage();
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
  checkbox.checked=obj.checked;

  const span=document.createElement("span");
  span.textContent=obj.text;

  const clearLabel=document.createElement("span");
  clearLabel.textContent="CLEAR";
  clearLabel.classList.add("clear-text");

  if(obj.checked){
    span.style.textDecoration="line-through";
    clearLabel.style.display="inline";
  }else{
    clearLabel.style.display="none";
  }

  checkbox.addEventListener("change",()=>{
    if(!checkbox.checked) return;
    if(!confirm("このクエストをクリアしますか？")){
      checkbox.checked=false;
      return;
    }
    obj.checked=true;
    span.style.textDecoration="line-through";
    clearLabel.style.display="inline";

    if(!playerData.categories[category]) playerData.categories[category]={exp:0, rank:"F"};
    let catData = playerData.categories[category];
    catData.exp += obj.rarity==="bronze"?10:obj.rarity==="silver"?20:30;

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

// ===== ランダム生成 =====
function randomQuests(category){
  const ul=document.getElementById("home_"+category);
  ul.innerHTML="";
  const loading=document.createElement("li");
  loading.textContent="生成中";
  ul.appendChild(loading);

  let dots=0;
  const interval=setInterval(()=>{
    dots=(dots+1)%4;
    loading.textContent="生成中"+".".repeat(dots);
  },300);

  setTimeout(()=>{
    clearInterval(interval);
    ul.innerHTML="";

    const list = quests[currentHomeWeekday][category];
    const selectedCount=Math.min(3,list.length);
    const shuffled=[...list].sort(()=>Math.random()-0.5);

    homeGenerated[currentHomeWeekday][category]=shuffled.slice(0,selectedCount).map(obj=>({...obj, checked:false}));

    homeGenerated[currentHomeWeekday][category].forEach((obj,i)=>{
      const li=createQuestElement(obj, category,i);
      ul.appendChild(li);
    });

    saveData();
  },1500);
}

// ===== 管理画面描画 =====
function renderManage(){
  const container=document.getElementById("manageCategories");
  container.innerHTML="";
  const categories=Object.keys(quests[currentManageWeekday]);

  categories.forEach(category=>{
    const card=document.createElement("div");
    card.classList.add("manage-card");

    const h2=document.createElement("h2");
    h2.textContent=category;

    const delBtn=document.createElement("button");
    delBtn.textContent="カテゴリ削除";
    delBtn.classList.add("delete-btn");
    delBtn.onclick=()=>deleteCategory(category);

    const ul=document.createElement("ul");
    quests[currentManageWeekday][category]?.forEach((q,i)=>{
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
    card.appendChild(delBtn);
    card.appendChild(ul);
    card.appendChild(addBtn);

    container.appendChild(card);
  });
}

// ===== ホーム画面描画 =====
function renderHome(){
  const container=document.getElementById("homeCategories");
  container.innerHTML="";
  const categories=Object.keys(quests[currentHomeWeekday]);

  categories.forEach(category=>{
    const card=document.createElement("div");
    card.classList.add("category-card");

    const h2=document.createElement("h2");
    h2.textContent=category;

    const ul=document.createElement("ul");
    ul.id="home_"+category;

    homeGenerated[currentHomeWeekday][category]?.forEach((obj,i)=>{
      const li=createQuestElement(obj, category,i);
      ul.appendChild(li);
    });

    const genBtn=document.createElement("button");
    genBtn.textContent="生成";
    genBtn.onclick=()=>randomQuests(category);

    const resetBtn=document.createElement("button");
    resetBtn.textContent="リセット";
    resetBtn.classList.add("reset");
    resetBtn.onclick=()=>{
      ul.innerHTML="";
      homeGenerated[currentHomeWeekday][category]=[];
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

function updateStatusScreen(){
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

  const ctx=document.getElementById("statusRadar").getContext("2d");
  if(radarChart) radarChart.destroy();
  const labels=Object.keys(playerData.categories);
  const values=labels.map(cat=>rankToNumber(playerData.categories[cat].rank));

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
function showManage(){
  document.getElementById("homeScreen").style.display="none";
  document.getElementById("manageScreen").style.display="block";
  renderManage();
}

function backHome(){
  document.getElementById("manageScreen").style.display="none";
  document.getElementById("homeScreen").style.display="block";
  renderHome();
}

// ===== 初期処理 =====
document.addEventListener("DOMContentLoaded",()=>{
  renderHome();
});
