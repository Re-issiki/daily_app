// ===== DOM =====
const home = document.getElementById("home");
const status = document.getElementById("status");
const edit = document.getElementById("edit");

const viewName = viewName = document.getElementById("viewName");
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

const inputName = document.getElementById("inputName");
const inputSchool = document.getElementById("inputSchool");
const inputAch1 = document.getElementById("inputAch1");
const inputAch2 = document.getElementById("inputAch2");
const inputAch3 = document.getElementById("inputAch3");
const newStatusName = document.getElementById("newStatusName");

let chart;
let currentKey = "";

// ===== データ =====
const profile = {
  name: "Re",
  school: "〇〇学校",
  achievements: ["", "", ""]
};

const statusData = {
  body: { title: "身体能力", items: [] },
  math: { title: "数学", items: [] }
};

// ===== ランク =====
const rankTable = [
  { m: 15000, r: 7 },
  { m: 7200, r: 6 },
  { m: 3600, r: 5 },
  { m: 1800, r: 4 },
  { m: 900, r: 3 },
  { m: 300, r: 2 },
  { m: 0, r: 1 }
];

function minutesToRank(m) {
  return rankTable.find(t => m >= t.m).r;
}

// ===== 初期化 =====
for (let i = 0; i <= 24; i++) hourSelect.innerHTML += `<option>${i}</option>`;
for (let i = 0; i <= 60; i++) minuteSelect.innerHTML += `<option>${i}</option>`;

// ===== 表示 =====
function renderHome() {
  viewName.textContent = `名前：${profile.name}`;
  viewSchool.textContent = `所属：${profile.school}`;
  ach1.textContent = "1. " + profile.achievements[0];
  ach2.textContent = "2. " + profile.achievements[1];
  ach3.textContent = "3. " + profile.achievements[2];

  statusButtons.innerHTML = "";
  Object.keys(statusData).forEach(k => {
    statusButtons.innerHTML += `<button onclick="openStatus('${k}')">${statusData[k].title}</button>`;
  });
}

// ===== ステータス =====
function openStatus(key) {
  currentKey = key;
  hideAll();
  status.classList.remove("hidden");

  statusTitle.textContent = statusData[key].title;
  updateItemSelect();
  drawChart();
}

function updateItemSelect() {
  itemSelect.innerHTML = "";
  statusData[currentKey].items.forEach((i, idx) => {
    itemSelect.innerHTML += `<option value="${idx}">${i.name}</option>`;
  });
}

function addItem() {
  if (!newItemName.value) return;
  statusData[currentKey].items.push({ name: newItemName.value, minutes: 0 });
  newItemName.value = "";
  updateItemSelect();
  drawChart();
}

function addStudy() {
  const idx = itemSelect.value;
  const m = hourSelect.value * 60 + Number(minuteSelect.value);
  if (!m) return;
  statusData[currentKey].items[idx].minutes += m;
  drawChart();
}

// ===== チャート =====
function drawChart() {
  const items = statusData[currentKey].items;
  if (chart) chart.destroy();

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
          ticks: {
            callback: v => ["","F","E","D","C","B","A","S"][v]
          }
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
}

function addStatus() {
  if (!newStatusName.value) return;
  const key = "s" + Date.now();
  statusData[key] = { title: newStatusName.value, items: [] };
  newStatusName.value = "";
}

function saveData() {
  profile.name = inputName.value;
  profile.school = inputSchool.value;
  profile.achievements = [inputAch1.value, inputAch2.value, inputAch3.value];
  backHome();
}

// ===== 画面 =====
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
