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
  const m = Number(hourSelect.value) * 60 + Number(minuteSelect.value);
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

//タイマー機能
const todayTotalEl = document.getElementById("todayTotal");
const weekTotalEl = document.getElementById("weekTotal");

todayTotalEl.textContent = `今日の学習時間：${minutesToHM(getTodayTotalMinutes())}`;
weekTotalEl.textContent = `今週の学習時間：${minutesToHM(getWeekTotalMinutes())}`;


let studyData = {
  statusKey: "",
  itemIndex: 0,
  totalMinutes: 0
};

let timer = null;
let remainingSeconds = 0;
let isPaused = false;

// ホームにボタンを追加
const studyButton = document.createElement("button");
studyButton.textContent = "勉強する";
studyButton.onclick = startStudyLog;
home.appendChild(studyButton);

function startStudyLog() {
  hideAll();
  studyLog.classList.remove("hidden");

  // 科目と項目を選択肢に追加
  studyStatusSelect.innerHTML = "";
  Object.keys(statusData).forEach(k => {
    const option = document.createElement("option");
    option.value = k;
    option.textContent = statusData[k].title;
    studyStatusSelect.appendChild(option);
  });
  updateStudyItemSelect();
}

function updateStudyItemSelect() {
  const key = studyStatusSelect.value;
  studyItemSelect.innerHTML = "";
  statusData[key].items.forEach((item, idx) => {
    const option = document.createElement("option");
    option.value = idx;
    option.textContent = item.name;
    studyItemSelect.appendChild(option);
  });
}

studyStatusSelect.onchange = updateStudyItemSelect;

function confirmStudyLog() {
  const key = studyStatusSelect.value;
  const idx = Number(studyItemSelect.value);
  const h = Number(studyHour.value) || 0;
  const m = Number(studyMinute.value) || 0;
  const total = h * 60 + m;
  if (total <= 0) {
    alert("学習時間を入力してください");
    return;
  }

  studyData = {
    statusKey: key,
    itemIndex: idx,
    totalMinutes: total
  };

  hideAll();
  studyTimer.classList.remove("hidden");
  startTimer(total * 60); // 秒に変換
}

function startTimer(seconds) {
  remainingSeconds = seconds;
  isPaused = false;
  drawTimer();

  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    if (!isPaused) {
      remainingSeconds--;
      drawTimer();
      if (remainingSeconds <= 0) finishTimer();
    }
  }, 1000);
}

function drawTimer() {
  const canvas = document.getElementById("timerCanvas");
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const radius = size / 2 - 20;
  const center = size / 2;

  ctx.clearRect(0, 0, size, size);

  // 背景円
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#eee";
  ctx.fill();

  // 進捗円
  const progress = 1 - remainingSeconds / (studyData.totalMinutes * 60);
  ctx.beginPath();
  ctx.arc(center, center, radius, -Math.PI/2, -Math.PI/2 + 2 * Math.PI * progress);
  ctx.lineWidth = 20;
  ctx.strokeStyle = "#4f46e5";
  ctx.stroke();

  // 残り時間テキスト
  const min = Math.floor(remainingSeconds / 60);
  const sec = remainingSeconds % 60;
  ctx.fillStyle = "#000";
  ctx.font = "30px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${min}分${sec}秒`, center, center);
}

function pauseResumeTimer() {
  isPaused = !isPaused;
}

function cancelTimer() {
  if (!confirm("勉強を中止しますか？")) return;
  clearInterval(timer);
  backHome();
}

function finishTimer() {
  clearInterval(timer);

  // 設定した項目に勉強時間を追加
  const item = statusData[studyData.statusKey].items[studyData.itemIndex];
  item.minutes += studyData.totalMinutes;

  if (!item.logs) item.logs = [];
  item.logs.push({ date: new Date().toISOString().slice(0,10), minutes: studyData.totalMinutes });

  saveStorage();
  backHome();
  renderHome(); // ホームに反映
  todayTotalEl.textContent = `今日の学習時間：${minutesToHM(getTodayTotalMinutes())}`;
  weekTotalEl.textContent = `今週の学習時間：${minutesToHM(getWeekTotalMinutes())}`;
}

function getTodayTotalMinutes() {
  const today = new Date().toISOString().slice(0,10);
  let total = 0;
  Object.values(statusData).forEach(s => {
    s.items.forEach(item => {
      if (item.logs) {
        item.logs.forEach(log => {
          if (log.date === today) total += log.minutes;
        });
      }
    });
  });
  return total;
}

function getWeekTotalMinutes() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0:日曜
  const start = new Date(today);
  start.setDate(today.getDate() - dayOfWeek); // 今週の日曜
  let total = 0;
  Object.values(statusData).forEach(s => {
    s.items.forEach(item => {
      if (item.logs) {
        item.logs.forEach(log => {
          const logDate = new Date(log.date);
          if (logDate >= start && logDate <= today) total += log.minutes;
        });
      }
    });
  });
  return total;
}

function confirmStudyLog() {
  const key = studyStatusSelect.value;
  const idx = Number(studyItemSelect.value);
  const h = Number(studyHour.value) || 0;
  const m = Number(studyMinute.value) || 0;
  const total = h * 60 + m;
  if (total <= 0) {
    alert("学習時間を入力してください");
    return;
  }

  studyData = {
    statusKey: key,
    itemIndex: idx,
    totalMinutes: total
  };

  studyLog.classList.add("hidden");     // ログ入力画面を隠す
  studyTimer.classList.remove("hidden"); // タイマーだけ表示
  startTimer(total * 60);               // 秒に変換
}


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
  todayTotalEl.textContent = `今日の学習時間：${minutesToHM(getTodayTotalMinutes())}`;
  weekTotalEl.textContent = `今週の学習時間：${minutesToHM(getWeekTotalMinutes())}`;
}

function hideAll() {
  home.classList.add("hidden");
  status.classList.add("hidden");
  edit.classList.add("hidden");
  achievementList.classList.add("hidden");
  studyLog.classList.add("hidden");      // 追加
  studyTimer.classList.add("hidden"); 
}

loadStorage();
applyBackground();
applyCardOpacity();
renderHome();
todayTotalEl.textContent = `今日の学習時間：${minutesToHM(getTodayTotalMinutes())}`;
weekTotalEl.textContent = `今週の学習時間：${minutesToHM(getWeekTotalMinutes())}`;
