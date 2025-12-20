let chart;

const profile = {
  name: "Re",
  school: "〇〇学校",
  achievements: [
    "毎日30分勉強を30日継続",
    "数学模試 偏差値+8",
    "腕立て100回達成"
  ]
};

const statusData = {
  body: {
    title: "身体能力",
    labels: ["筋力", "持久力", "柔軟性", "瞬発力", "回復力"],
    hours: [30, 40, 15, 20, 25]
  },
  math: {
    title: "数学",
    labels: ["計算力", "発想力", "理解力", "問題解決", "スピード"],
    hours: [50, 35, 40, 30, 45]
  }
};

function calcStatus(hours) {
  return hours.map(h => Math.min(100, Math.log(h + 1) * 20));
}

function renderHome() {
  viewName.textContent = `名前：${profile.name}`;
  viewSchool.textContent = `所属：${profile.school}`;
  ach1.textContent = "1. " + profile.achievements[0];
  ach2.textContent = "2. " + profile.achievements[1];
  ach3.textContent = "3. " + profile.achievements[2];
}

function openStatus(key) {
  hideAll();
  status.classList.remove("hidden");

  const data = statusData[key];
  statusTitle.textContent = data.title;

  if (chart) chart.destroy();
  chart = new Chart(radarChart, {
    type: "radar",
    data: {
      labels: data.labels,
      datasets: [{
        label: "ステータス",
        data: calcStatus(data.hours),
        fill: true
      }]
    },
    options: {
      scales: { r: { min: 0, max: 100 } }
    }
  });
}

function openEdit() {
  hideAll();
  edit.classList.remove("hidden");

  inputName.value = profile.name;
  inputSchool.value = profile.school;
  inputAch1.value = profile.achievements[0];
  inputAch2.value = profile.achievements[1];
  inputAch3.value = profile.achievements[2];
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
