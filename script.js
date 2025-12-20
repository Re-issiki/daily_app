// ===== DOM =====
const home = document.getElementById("home");
const status = document.getElementById("status");
const edit = document.getElementById("edit");

const viewName = document.getElementById("viewName");
const viewSchool = document.getElementById("viewSchool");
const ach1 = document.getElementById("ach1");
const ach2 = document.getElementById("ach2");
const ach3 = document.getElementById("ach3");

const inputName = document.getElementById("inputName");
const inputSchool = document.getElementById("inputSchool");
const inputAch1 = document.getElementById("inputAch1");
const inputAch2 = document.getElementById("inputAch2");
const inputAch3 = document.getElementById("inputAch3");

const statusTitle = document.getElementById("statusTitle");
const radarChart = document.getElementById("radarChart");
const itemSelect = document.getElementById("itemSelect");
const addHoursInput = document.getElementById("addHours");
const editItems = document.getElementById("editItems");

let chart;
let currentKey = "";

// ===== データ =====
const profile = {
  name: "Re",
  school: "〇〇学校",
  achievements: ["", "", ""]
};

const statusData = {
  math: {
    title: "数学",
    items: [
      { name: "計算力", hours: 0 },
      { name: "発想力", hours: 0 },
      { name: "理解力", hours: 0 }
    ]
  },
  body: {
    title: "身体能力",
    items: [
      { name: "筋力", hours: 0 },
      { name: "持久力", hours: 0 },
      { name: "柔軟性", hours: 0 }
    ]
  }
};

// ===== ランク =====
const rankTable = [
  { h: 250, r: 7 },
  { h: 120, r: 6 },
  { h: 60, r: 5 },
  { h: 30, r: 4 },
  { h: 15, r: 3 },
  { h: 5, r: 2 },
  { h: 0, r: 1 }
];

function hoursToRank(h) {
  return rankTable.find(t => h >= t.h).r;
}

// ===== 表示 =====
function renderHome() {
  viewName.textContent = `名前：${profile.name}`;
  viewSchool.textContent = `所属：${profile.school}`;
  ach1.textContent = "1. " + profile.achievements[0];
  ach2.textContent = "2. " + profile.achievements[1];
  ach3.textContent = "3. " + profile.achievements[2];
}

// ===== ステータス =====
function openStatus(key) {
  currentKey = key;
  hideAll();
  status.classList.remove("hidden");

  const data = statusData[key];
  statusTitle.textContent = data.title;

  itemSelect.innerHTML = "";
  data.items.forEach((i, idx) => {
    itemSelect.innerHTML += `<option value="${idx}">${i.name}</option>`;
  });

  drawChart();
}

function addStudy() {
  const idx = itemSelect.value;
  const h = Number(addHoursInput.value);
  if (!h) return;
  statusData[currentKey].items[idx].hours += h;
  addHoursInput.value = "";
  drawChart();
}

function drawChart() {
  const data = statusData[currentKey];
  const labels = data.items.map(i => i.name);
  const values = data.items.map(i => hoursToRank(i.hours));

  if (chart) chart.destroy();
  chart = new Chart(radarChart, {
    type: "radar",
    data: {
      labels,
      datasets: [{ data: values }]
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

  editItems.innerHTML = "";
  statusData.math.items.forEach((item, i) => {
    editItems.innerHTML += `
      <input value="${item.name}"
        onchange="statusData.math.items[${i}].name=this.value">
    `;
  });
}

function addItem() {
  statusData.math.items.push({ name: "新項目", hours: 0 });
  openEdit();
}

function saveData() {
  profile.name = inputName.value;
  profile.school = inputSchool.value;
  profile.achievements = [
    inputAch1.value,
    inputAch2.value,
    inputAch3.value
  ];
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
