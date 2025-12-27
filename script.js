// ===== DOM =====
const home = document.getElementById("home");
const status = document.getElementById("status");
const edit = document.getElementById("edit");

const viewName = document.getElementById("viewName");
const viewSchool = document.getElementById("viewSchool");
const ach1 = document.getElementById("ach1");
const ach2 = document.getElementById("ach2");
const ach3 = document.getElementById("ach3");

const statusButtons = document.getElementById("statusButtons");
const statusTitle = document.getElementById("statusTitle");
const radarChart = document.getElementById("radarChart");

const itemSelect = document.getElementById("itemSelect");
const hourSelect = document.getElementById("hourSelect");
const minuteSelect = document.getElementById("minuteSelect");
const newItemName = document.getElementById("newItemName");
const itemList = document.getElementById("itemList");

const inputName = document.getElementById("inputName");
const inputSchool = document.getElementById("inputSchool");
const inputAch1 = document.getElementById("inputAch1");
const inputAch2 = document.getElementById("inputAch2");
const inputAch3 = document.getElementById("inputAch3");
const newStatusName = document.getElementById("newStatusName");
const statusManage = document.getElementById("statusManage");
const achievementList = document.getElementById("achievementList");
const newAchText = document.getElementById("newAchText");
const newAchRank = document.getElementById("newAchRank");
const achievementCards = document.getElementById("achievementCards");

const pomodoro = document.getElementById("pomodoro");


let chart = null;
let currentKey = "";

// ===== 永続化 =====
function saveStorage() {
  localStorage.setItem("profile", JSON.stringify(profile));
  localStorage.setItem("statusData", JSON.stringify(statusData));
}

function loadStorage() {
  const p = localStorage.getItem("profile");
  const s = localStorage.getItem("statusData");

  profile = p ? JSON.parse(p) : {
    name: "Re",
    school: "〇〇学校",
    achievements: [],
    displayAchievements: []
  };

  statusData = s ? JSON.parse(s) : {};

  // achievements が無い or 壊れてても必ず配列にする
  if (!Array.isArray(profile.achievements)) {
    profile.achievements = [];
  }

  if (!Array.isArray(profile.displayAchievements)) {
    profile.displayAchievements = [];
  }
}



// ===== データ =====
let profile = {
  name: "Re",
  school: "〇〇学校",

  // 実績データ（無制限）
  achievements: [],

  // ホームに表示する実績ID（最大3つ）
  displayAchievements: []
};



let statusData = {};


// ===== ランク =====
const rankTable = [
  { m: 2160 * 60, r: 7 }, // S
  { m: 720  * 60, r: 6 }, // A
  { m: 504  * 60, r: 5 }, // B
  { m: 168  * 60, r: 4 }, // C
  { m: 72   * 60, r: 3 }, // D
  { m: 24   * 60, r: 2 }, // E
  { m: 0,           r: 1 } // F
];


const rankLabel = ["","F","E","D","C","B","A","S"];
const minutesToRank = m => rankTable.find(t => m >= t.m).r;
function minutesToHM(m) {
  if (m <= 0) return "未学習";
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}時間${min}分`;
}


// ===== 初期化 =====
for (let i = 0; i <= 24; i++) hourSelect.innerHTML += `<option>${i}</option>`;
for (let i = 0; i <= 59; i++) minuteSelect.innerHTML += `<option>${i}</option>`;

// ===== ホーム =====
function renderHome() {
  viewName.textContent = `名前：${profile.name}`;
  viewSchool.textContent = `所属：${profile.school}`;

  const achEls = [ach1, ach2, ach3];

  achEls.forEach((el, i) => {
    const id = profile.displayAchievements[i];
    const a = profile.achievements.find(x => x.id === id);


    if (!a || !a.text) {
      el.innerHTML = `${i + 1}.`;
      return;
    }

    el.innerHTML = `
      <div>実績${i + 1}　ランク:${rankToJP(a.rank)}</div>
      <div class="achievement-text ${a.rank}">
        ${a.text}
      </div>
    `;
  });

  statusButtons.innerHTML = "";
 
  Object.keys(statusData).forEach(k => {
    const total = getStatusTotalMinutes(k);
    const card = document.createElement("div");
    card.className = "status-card";
    card.innerHTML = `
    <div class="status-title">${statusData[k].title}</div>
    <div class="status-time">
    総時間：${minutesToHM(total)}
    </div>
    `;
    card.onclick = () => openStatus(k);
    statusButtons.appendChild(card);
  });
}

function rankToJP(rank) {
  return {
    c: "C",
    b: "B",
    a: "A",
    s: "S",
    ss: "SS"
  }[rank];
}

function addAchievement() {
  const text = newAchText.value.trim();
  const rank = newAchRank.value;
  if (!text) return;

  const id = Date.now();

  profile.achievements.push({ id, text, rank });

  // ★ 3つまでは自動でホーム表示
  if (profile.displayAchievements.length < 3) {
    profile.displayAchievements.push(id);
  }

  newAchText.value = "";
  saveStorage();
  renderAchievementList();
  renderHome();
}




function openAchievementList() {
  hideAll();
  achievementList.classList.remove("hidden");
  renderAchievementList();
}


function renderAchievementList() {
  achievementCards.innerHTML = "";

  profile.achievements.forEach((a, i) => {
    if (!a.text) return;

    const card = document.createElement("div");
    card.className = "achievement-card";
    card.draggable = true;
    card.dataset.id = a.id;
    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragover", handleDragOver);
    card.addEventListener("drop", handleDrop);


    const selected = profile.displayAchievements.includes(a.id);

   
    card.innerHTML = `
    <div class="achievement-rank ${a.rank}">
    ${rankToJP(a.rank)}
    </div>
    <div class="achievement-content">
    <div class="achievement-text ${a.rank}">
    ${a.text}
    </div>
    <button class="small"
    style="background:${selected ? '#2563eb' : '#555'}"
    onclick="toggleDisplayAchievement(${a.id})">
    ${selected ? "表示中" : "ホーム表示"}
    </button>
    <button class="small" style="background:#dc2626"
    onclick="deleteAchievement(${a.id})">
    削除
    </button>
    </div>
    `;


    achievementCards.appendChild(card);
  });
}

let dragId = null;

function handleDragStart(e) {
  dragId = Number(e.currentTarget.dataset.id);
}

function handleDragOver(e) {
  e.preventDefault(); // これ必須
}

function handleDrop(e) {
  e.preventDefault();

  const dropId = Number(e.currentTarget.dataset.id);
  if (dragId === dropId) return;

  const list = profile.achievements;

  const from = list.findIndex(a => a.id === dragId);
  const to   = list.findIndex(a => a.id === dropId);

  if (from === -1 || to === -1) return;

  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);

  saveStorage();
  renderAchievementList();
  renderHome();
}


function deleteAchievement(id) {
  if (!confirm("この実績を削除しますか？")) return;

  // 実績本体を削除
  profile.achievements = profile.achievements.filter(a => a.id !== id);

  // ホーム表示IDからも削除
  profile.displayAchievements =
    profile.displayAchievements.filter(x => x !== id);

  saveStorage();
  renderAchievementList();
  renderHome();
}


function toggleDisplayAchievement(id) {
  const idx = profile.displayAchievements.indexOf(id);

  if (idx >= 0) {
    profile.displayAchievements.splice(idx, 1);
  } else {
    if (profile.displayAchievements.length >= 3) {
      alert("表示できるのは3つまで");
      return;
    }
    profile.displayAchievements.push(id);
  }

  saveStorage();
  renderAchievementList();
  renderHome();
}



// ===== ステータス =====
function openStatus(key) {
  currentKey = key;
  hideAll();
  status.classList.remove("hidden");

  statusTitle.textContent = statusData[key].title;
  updateItemSelect();
  renderItemList();
  drawChart();
}

function updateItemSelect() {
  itemSelect.innerHTML = "";
  statusData[currentKey].items.forEach((i, idx) => {
    itemSelect.innerHTML += `<option value="${idx}">${i.name}</option>`;
  });
}

function resetItemTime(idx) {
  if (!confirm("この項目の勉強時間をリセットしますか？")) return;
  statusData[currentKey].items[idx].minutes = 0;
  saveStorage();
  renderItemList();
  drawChart();
}


function renderItemList() {
  itemList.innerHTML = "";

  statusData[currentKey].items.forEach((i, idx) => {
    const row = document.createElement("div");
    row.className = "card";
    row.style.padding = "8px";

    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="flex:1; font-weight:600;">${i.name}</span>

        <button class="small"
          onclick="resetItemTime(${idx})">リセット</button>

        <button class="small" style="background:#dc2626"
          onclick="deleteItem(${idx})">削除</button>
      </div>

      <div style="font-size:13px; color:#555; margin-top:4px;">
        総時間：${minutesToHM(i.minutes)}
      </div>
    `;

    itemList.appendChild(row);
  });
}



function addItem() {
  if (!newItemName.value) return;
  statusData[currentKey].items.push({ name: newItemName.value, minutes: 0 });
  newItemName.value = "";
  saveStorage();
  updateItemSelect();
  renderItemList();
  drawChart();
}

function deleteItem(idx) {
  if (!confirm("この項目を削除しますか？")) return;
  statusData[currentKey].items.splice(idx, 1);
  saveStorage();
  updateItemSelect();
  renderItemList();
  drawChart();
}


function addStudy() {
  if (itemSelect.value === "") return;
  const m = hourSelect.value * 60 + Number(minuteSelect.value);
  if (m <= 0) return;
  statusData[currentKey].items[itemSelect.value].minutes += m;
  saveStorage();
  renderItemList();
  drawChart();
}

// ===== チャート =====
function drawChart() {
  const items = statusData[currentKey].items;
  if (chart) chart.destroy();
  if (!items.length) return;

  chart = new Chart(radarChart, {
    type: "radar",
    data: {
      labels: items.map(i => i.name),
      datasets: [{ data: items.map(i => minutesToRank(i.minutes)) }]
    },
    options: {
      scales: {
        r: {
          min: 1,
          max: 7,
          ticks: { callback: v => rankLabel[v] }
        }
      }
    }
  });
}

// ===== 編集 =====
function openEdit() {
  hideAll();
  edit.classList.remove("hidden");

  inputName.value = profile.name;
  inputSchool.value = profile.school;

  renderStatusManage();
}

function renderStatusManage() {
  statusManage.innerHTML = "";
  Object.keys(statusData).forEach(k => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.innerHTML = `
      <span style="flex:1">${statusData[k].title}</span>
      <button class="small danger" onclick="deleteStatus('${k}')">
        削除
      </button>
    `;
    statusManage.appendChild(row);
  });
}


function getStatusTotalMinutes(key) {
  return statusData[key].items.reduce((sum, item) => {
    return sum + item.minutes;
  }, 0);
}


function addStatus() {
  if (!newStatusName.value) return;

  const key = "s" + Date.now();

  statusData[key] = {
    title: newStatusName.value,
    items: []
  };

  newStatusName.value = "";
  saveStorage();
  renderStatusManage();
  renderHome(); // ← これ超重要
}


function deleteStatus(key) {
  if (!confirm("削除しますか？")) return;
  delete statusData[key];
  saveStorage();
  backHome();
}

function setBackgroundImage(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result;
    localStorage.setItem("bgImage", base64);
    applyBackground();
  };
  reader.readAsDataURL(file);
}

function applyBackground() {
  const bg = localStorage.getItem("bgImage");
  if (bg) {
    document.body.style.backgroundImage = `url(${bg})`;
    document.body.classList.add("has-bg");
  } else {
    document.body.style.backgroundImage = "";
    document.body.classList.remove("has-bg");
  }
}

function clearBackground() {
  if (!confirm("背景画像をリセットしますか？")) return;
  localStorage.removeItem("bgImage");
  applyBackground();
}

function setCardOpacity(value) {
  localStorage.setItem("cardOpacity", value);
  applyCardOpacity();
}

function applyCardOpacity() {
  const v = localStorage.getItem("cardOpacity") || 1;

  document.documentElement
    .style.setProperty("--card-bg-alpha", v);

  const slider = document.getElementById("cardOpacitySlider");
  if (slider) slider.value = v;
}

//ポモドーロタイマー
let pomodoroTimer = null;
let pomodoroStudySeconds = 25 * 60;
let pomodoroBreakSeconds = 5 * 60;
let pomodoroRemaining = pomodoroStudySeconds;
let pomodoroCycleCount = 4;
let currentCycle = 1;
let isStudyPhase = true; // true = 勉強中, false = 休憩中

const studyInput = document.getElementById("pomodoroStudyInput");
const breakInput = document.getElementById("pomodoroBreakInput");
const cyclesInput = document.getElementById("pomodoroCyclesInput");

// 設定が変わったら即反映
[studyInput, breakInput, cyclesInput].forEach(input => {
  input.addEventListener("input", () => {
    pomodoroStudySeconds = Number(studyInput.value) * 60 || 25*60;
    pomodoroBreakSeconds = Number(breakInput.value) * 60 || 5*60;
    pomodoroCycleCount = Number(cyclesInput.value) || 4;
    resetPomodoro();
  });
});

function openPomodoro() {
  hideAll();
  document.getElementById("pomodoro").classList.remove("hidden");
  drawPomodoro();
}

function drawPomodoro() {
  const canvas = document.getElementById("pomodoroCanvas");
  const ctx = canvas.getContext("2d");
  const radius = canvas.width / 2 - 10;
  const center = canvas.width / 2;

  // 背景円
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 10;
  ctx.stroke();

  // 進捗円
  const progress = (pomodoroSeconds - pomodoroRemaining) / pomodoroSeconds;
  ctx.beginPath();
  ctx.arc(center, center, radius, -Math.PI/2, -Math.PI/2 + 2 * Math.PI * progress);
  ctx.strokeStyle = "#4f46e5";
  ctx.lineWidth = 10;
  ctx.stroke();

  // 中心に残り時間表示
  ctx.fillStyle = "#374151";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const m = Math.floor(pomodoroRemaining / 60);
  const s = pomodoroRemaining % 60;
  ctx.fillText(`${m}:${s.toString().padStart(2,"0")}`, center, center);
}

function startPomodoro() {
  if (pomodoroTimer) return;
  pomodoroTimer = setInterval(() => {
    pomodoroRemaining--;
    if (pomodoroRemaining <= 0) {
      // フェーズ切り替え
      if (isStudyPhase) {
        alert(`勉強${currentCycle}セット終了！休憩開始`);
        pomodoroRemaining = pomodoroBreakSeconds;
      } else {
        if (currentCycle >= pomodoroCycleCount) {
          clearInterval(pomodoroTimer);
          pomodoroTimer = null;
          alert("ポモドーロ全サイクル終了！");
          resetPomodoro();
          return;
        } else {
          currentCycle++;
          alert(`休憩終了！次の勉強セット開始`);
          pomodoroRemaining = pomodoroStudySeconds;
        }
      }
      isStudyPhase = !isStudyPhase;
    }
    drawPomodoro();
  }, 1000);
}


function pausePomodoro() {
  if (pomodoroTimer) {
    clearInterval(pomodoroTimer);
    pomodoroTimer = null;
  }
}

const pomodoroMinutesInput = document.getElementById("pomodoroMinutes");

function resetPomodoro() {
  pausePomodoro();
  currentCycle = 1;
  isStudyPhase = true;
  pomodoroRemaining = pomodoroStudySeconds;
  drawPomodoro();
}

function pausePomodoro() {
  if (pomodoroTimer) {
    clearInterval(pomodoroTimer);
    pomodoroTimer = null;
  }
}

//確認ログ
function addPomodoroRecord() {
  if (!currentKey) {
    alert("ステータスを選択してから記録してください。");
    return;
  }

  const minutes = Math.floor((pomodoroSeconds - pomodoroRemaining) / 60);
  if (minutes <= 0) {
    alert("まだ勉強していません。");
    return;
  }

  if (!confirm(`${minutes}分を「${statusData[currentKey].title}」に追加しますか？`)) return;

  statusData[currentKey].items[0] = statusData[currentKey].items[0] || {name:"勉強時間", minutes:0};
  statusData[currentKey].items[0].minutes += minutes;

  saveStorage();
  renderItemList();
  drawChart();

  resetPomodoro();
}

pomodoroMinutesInput.addEventListener("input", () => {
  // 入力値取得
  const minutes = Number(pomodoroMinutesInput.value) || 25;
  pomodoroSeconds = minutes * 60;
  pomodoroRemaining = pomodoroSeconds;
  pausePomodoro();
  drawPomodoro();
});




// ===== 画面 =====
function saveData() {
  profile.name = inputName.value;
  profile.school = inputSchool.value;

  saveStorage();
  backHome();
}


function backHome() {
  hideAll();
  home.classList.remove("hidden");
  renderHome();
}

function hideAll() {
  home.classList.add("hidden");
  status.classList.add("hidden");
  edit.classList.add("hidden");
  achievementList.classList.add("hidden");
  pomodoro.classList.add("hidden"); // 追加
}


loadStorage();
applyBackground();
applyCardOpacity();
renderHome();

