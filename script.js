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

  const h = Number(hourSelect.value);
  const min = Number(minuteSelect.value);
  const m = h * 60 + min;

  if (m <= 0) return;

  // 追加確認ダイアログ
  const targetName = statusData[currentKey].items[itemSelect.value].name;
  const message =
    `${targetName} に「${h}時間${min}分」を追加します。\n本当によろしいですか？`;

  if (!confirm(message)) return;

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
      datasets: [{
        data: items.map(i => minutesToRank(i.minutes))
      }]
    },
    options: {
      plugins: {
        legend: { display: false } // ← ここで表示を止める
      },
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

//ポモドーロ機能
// 1セッション単位で保存
let pomodoroSessions = JSON.parse(localStorage.getItem("pomodoroSessions") || "[]");

function savePomodoroSessions() {
  localStorage.setItem("pomodoroSessions", JSON.stringify(pomodoroSessions));
}

// ポモドーロ記録（1日→分）
let pomodoroLog = JSON.parse(localStorage.getItem("pomodoroLog") || "{}");

function savePomodoroLog() {
  localStorage.setItem("pomodoroLog", JSON.stringify(pomodoroLog));
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function addPomodoroMinutes(min) {
  const k = todayKey();
  pomodoroLog[k] = (pomodoroLog[k] || 0) + min;
  savePomodoroLog();
}

const pomodoro = document.getElementById("pomodoro");
const pomodoroTimer = document.getElementById("pomodoroTimer");

let timerId = null;
let remaining = 0;
let mode = "work"; // work / break

function openPomodoro() {
  hideAll();
  pomodoro.classList.remove("hidden");
  renderPomodoroStats();
}

function minutesToText(m){ return `${Math.floor(m/60)}時間${m%60}分`; }

function getWeekTotal() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);

  let sum = 0;
  for (const k in pomodoroLog) {
    const d = new Date(k);
    if (d >= start && d <= now) sum += pomodoroLog[k];
  }
  return sum;
}

function renderPomodoroStats() {
  const today = pomodoroLog[todayKey()] || 0;

  document.getElementById("todayPomodoro").textContent =
    `今日の合計：${minutesToText(today)}`;

  document.getElementById("weekPomodoro").textContent =
    `直近7日：${minutesToText(getWeekTotal())}`;

  const lastWeek = getLastWeekTotal();
  document.getElementById("lastWeekPomodoro").textContent =
    `先週の合計：${minutesToText(lastWeek)}`;

  drawPomodoroChart();
}

//記録リセット
let lastPomodoroAdd = null; // ← 直前の追加記録

function addPomodoroMinutes(min) {
  const session = {
    id: Date.now(),
    date: todayKey(),
    minutes: min
  };

  pomodoroSessions.push(session);
  savePomodoroSessions();

  lastPomodoroAdd = session;   // ← Undo もそのまま使える
  showUndoToast(min);
}


function showUndoToast(min) {
  const t = document.getElementById("undoToast");
  t.style.display = "block";
  t.firstChild.textContent =
    `${minutesToText(min)} を記録しました`;
  setTimeout(() => t.style.display = "none", 6000); // 6秒で消える
}

function undoPomodoro() {
  if (!lastPomodoroAdd) return;

  const { key, amount } = lastPomodoroAdd;
  pomodoroLog[key] = Math.max(0, (pomodoroLog[key] || 0) - amount);

  savePomodoroLog();
  lastPomodoroAdd = null;

  document.getElementById("undoToast").style.display = "none";
  renderPomodoroStats();
  alert("直前のポモドーロ記録を取り消しました");
}

function getTotalForDate(key) {
  return pomodoroSessions
    .filter(s => s.date === key)
    .reduce((a,b)=>a+b.minutes, 0);
}

function getWeekTotal() {
  const now = new Date();
  let sum = 0;

  for (let i=0;i<7;i++){
    const d = new Date(now);
    d.setDate(now.getDate()-i);
    sum += getTotalForDate(getDateKey(d));
  }
  return sum;
}

function renderPomodoroHistory() {
  const box = document.getElementById("pomodoroHistory");
  box.innerHTML = "";

  // 新しい順に
  const list = [...pomodoroSessions].sort((a,b)=>b.id-a.id);

  list.forEach(s => {
    const div = document.createElement("div");
    div.className = "achievement-card"; // 既存デザイン流用
    div.innerHTML = `
      <div style="flex:1;">
        ${s.date}　${minutesToText(s.minutes)}
      </div>
      <button class="small danger" onclick="deletePomodoro(${s.id})">
        削除
      </button>
    `;
    box.appendChild(div);
  });
}

function deletePomodoro(id) {
  if (!confirm("このポモドーロ記録を削除しますか？")) return;

  pomodoroSessions =
    pomodoroSessions.filter(s => s.id !== id);

  savePomodoroSessions();
  renderPomodoroStats();
  renderPomodoroHistory();
}

function renderPomodoroStats() {
  const today = getTotalForDate(todayKey());

  document.getElementById("todayPomodoro").textContent =
    `今日の合計：${minutesToText(today)}`;

  document.getElementById("weekPomodoro").textContent =
    `直近7日：${minutesToText(getWeekTotal())}`;

  const lastWeek = getLastWeekTotal();
  document.getElementById("lastWeekPomodoro").textContent =
    `先週の合計：${minutesToText(lastWeek)}`;

  drawPomodoroChart();
  renderPomodoroHistory(); // ← 追加
}

const pomodoroHistoryScreen =
  document.getElementById("pomodoroHistoryScreen");
const pomodoroHistoryList =
  document.getElementById("pomodoroHistoryList");

function openPomodoroHistory() {
  hideAll();
  pomodoroHistoryScreen.classList.remove("hidden");
  renderPomodoroHistoryScreen();
}

function renderPomodoroHistoryScreen() {
  pomodoroHistoryList.innerHTML = "";

  if (!pomodoroSessions.length) {
    pomodoroHistoryList.innerHTML =
      `<p style="color:#666;">履歴がありません</p>`;
    return;
  }

  const list = [...pomodoroSessions].sort((a,b)=>b.id-a.id);

  list.forEach(s => {
    const row = document.createElement("div");
    row.className = "achievement-card";
    row.innerHTML = `
      <div style="flex:1;">
        ${s.date}　${minutesToText(s.minutes)}
      </div>
      <button class="small danger"
        onclick="deletePomodoro(${s.id}); renderPomodoroHistoryScreen();">
        削除
      </button>
    `;
    pomodoroHistoryList.appendChild(row);
  });
}



function startPomodoro() {
  const work = Number(document.getElementById("pomodoroWork").value);
  const brk  = Number(document.getElementById("pomodoroBreak").value);

  mode = "work";
  remaining = work * 60;

  runTimer(work, brk);
}

function runTimer(work, brk) {
  clearInterval(timerId);

  timerId = setInterval(() => {
    remaining--;
    pomodoroTimer.textContent =
      `${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}`;

    if (remaining <= 0) {
      clearInterval(timerId);

      if (mode === "work") {
        addPomodoroMinutes(Number(document.getElementById("pomodoroWork").value));
        renderPomodoroStats();
        alert("作業終了！休憩に入ります");
        mode = "break";
        remaining = brk * 60;
        runTimer(work, brk);
      } else {
        alert("休憩終了！お疲れさま");
        renderPomodoroStats();
      }
    }
  }, 1000);
}

function cancelPomodoro() {
  clearInterval(timerId);
  pomodoroTimer.textContent = "00:00";
}

//折れ線グラフ
let pomoChart = null;

function getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
}

// 直近7日（今日含む）
function getLast7DaysData() {
  const days = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const k = getDateKey(d);
    days.push({
      label: `${d.getMonth()+1}/${d.getDate()}`,
      minutes: pomodoroLog[k] || 0
    });
  }
  return days;
}

// 先週（7〜13日前）
function getLastWeekTotal() {
  const now = new Date();
  let sum = 0;

  for (let i = 7; i <= 13; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const k = getDateKey(d);
    sum += pomodoroLog[k] || 0;
  }
  return sum;
}

function drawPomodoroChart() {
  const ctx = document.getElementById("pomodoroChart");

  const data = getLast7DaysData();

  if (pomoChart) pomoChart.destroy();

  pomoChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => Math.floor(d.minutes / 60 * 100) / 100),
        tension: 0.3
      }]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "時間（h）"
          }
        }
      }
    }
  });
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
}

function hideAll() {
  home.classList.add("hidden");
  status.classList.add("hidden");
  edit.classList.add("hidden");
  achievementList.classList.add("hidden");
}

loadStorage();
applyBackground();
applyCardOpacity();
renderHome();

