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

  if (p) {
    profile = JSON.parse(p);
  }

  if (s) {
    statusData = JSON.parse(s);
  } else {
    // 初回起動時だけ初期データを入れる
    statusData = {};
  }
}


// ===== データ =====
let profile = {
  name: "Re",
  school: "〇〇学校",
  achievements: ["", "", ""]
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
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}時間${min}分`;
}


// ===== 初期化 =====
for (let i = 0; i <= 24; i++) hourSelect.innerHTML += `<option>${i}</option>`;
for (let i = 0; i <= 60; i++) minuteSelect.innerHTML += `<option>${i}</option>`;

loadStorage();

// ===== ホーム =====
function renderHome() {
  viewName.textContent = `名前：${profile.name}`;
  viewSchool.textContent = `所属：${profile.school}`;

  const achEls = [ach1, ach2, ach3];

  achEls.forEach((el, i) => {
    const a = profile.achievements[i];

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
    const btn = document.createElement("button");
    btn.textContent = statusData[k].title;
    btn.onclick = () => openStatus(k);
    statusButtons.appendChild(btn);
  });
}

function rankToJP(rank) {
  return {
    bronze: "銅",
    silver: "銀",
    gold: "金",
    red: "赤"
  }[rank];
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
  inputAch1.value = profile.achievements[0];
  inputAch2.value = profile.achievements[1];
  inputAch3.value = profile.achievements[2];

  renderStatusManage();
}

function renderStatusManage() {
  statusManage.innerHTML = "";
  Object.keys(statusData).forEach(k => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.innerHTML = `
      <span style="flex:1">${statusData[k].title}</span>
      <button style="background:#dc2626" onclick="deleteStatus('${k}')">削除</button>
    `;
    statusManage.appendChild(row);
  });
}

function addStatus() {
  if (!newStatusName.value) return;
  statusData["s" + Date.now()] = { title: newStatusName.value, items: [] };
  newStatusName.value = "";
  saveStorage();
  renderStatusManage();
  renderHome();
}

function deleteStatus(key) {
  if (!confirm("削除しますか？")) return;
  delete statusData[key];
  saveStorage();
  backHome();
}

// ===== 画面 =====
function saveData() {
  profile.name = inputName.value;
  profile.school = inputSchool.value;
  profile.achievements = [inputAch1.value, inputAch2.value, inputAch3.value];
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
}

renderHome();
