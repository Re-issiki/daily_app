// ===== データ読み込み =====
let playerData = JSON.parse(localStorage.getItem("playerData")) || {
  name: "名無し",
  categories: {}
};
let radarChart = null;

let quests = JSON.parse(localStorage.getItem("quests")) || {};
let homeGenerated = JSON.parse(localStorage.getItem("homeGenerated")) || {};

// ===== ランク関連設定 =====
const rankOrder = ["F","E","D","C","B","A","S","SS","SSS"];
const baseExpPerRank = 100;

// ===== データ保存 =====
function saveData() {
  localStorage.setItem("quests", JSON.stringify(quests));
  localStorage.setItem("homeGenerated", JSON.stringify(homeGenerated));
  localStorage.setItem("playerData", JSON.stringify(playerData));
}

// ===== カテゴリ追加 =====
function addCategory() {
  const input = document.getElementById("newCategoryInput");
  const name = input.value.trim();

  if (!name || quests[name]) return;

  quests[name] = [];
  homeGenerated[name] = [];

  if (!playerData.categories[name]) {
    playerData.categories[name] = { exp: 0, rank: "F" };
  }

  input.value = "";
  saveData();
  renderManage();
  renderHome();
}

// ===== カテゴリ削除 =====
function deleteCategory(name) {
  delete quests[name];
  delete homeGenerated[name];
  delete playerData.categories[name];

  saveData();
  renderManage();
  renderHome();
}

// ===== クエスト追加 =====
function addQuestToCategory(category) {
  const text = prompt("クエストを入力:");
  if (!text) return;

  const rarity = prompt("レア度を入力（bronze / silver / gold）");
  if (!["bronze","silver","gold"].includes(rarity)) {
    alert("bronze / silver / gold のどれかを入力してください。");
    return;
  }

  quests[category].push({ text, rarity });
  saveData();
  renderManage();
}

// ===== クエスト削除 =====
function deleteQuest(category, index) {
  quests[category].splice(index, 1);
  saveData();
  renderManage();
}

// ===== クエスト生成（取り消し線対応） =====
function createQuestElement(obj, category, index) {
  const li = document.createElement("li");
  li.classList.add(obj.rarity);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("quest-check");
  checkbox.checked = obj.checked;

  const span = document.createElement("span");
  span.textContent = obj.text;

  const clearLabel = document.createElement("span");
  clearLabel.textContent = "CLEAR";
  clearLabel.classList.add("clear-text");

  if (obj.checked) {
    span.style.textDecoration = "line-through";
    clearLabel.style.display = "inline";
  } else {
    clearLabel.style.display = "none";
  }

  checkbox.addEventListener("change", () => {
    if (!checkbox.checked) return;

    if (!confirm("このクエストをクリアしますか？")) {
      checkbox.checked = false;
      return;
    }

    obj.checked = true;
    span.style.textDecoration = "line-through";
    clearLabel.style.display = "inline";

    if (!playerData.categories[category]) {
      playerData.categories[category] = { exp: 0, rank: "F" };
    }

    let catData = playerData.categories[category];
    catData.exp += obj.rarity === "bronze" ? 10 : obj.rarity === "silver" ? 20 : 30;

    let currentRank = catData.rank;
    let currentExp = catData.exp;
    let expPerRank = baseExpPerRank;

    for (let i = 0; i < rankOrder.indexOf(currentRank); i++) expPerRank *= 2;

    while (currentExp >= expPerRank && rankOrder.indexOf(currentRank) < rankOrder.length - 1) {
      currentExp -= expPerRank;
      currentRank = rankOrder[rankOrder.indexOf(currentRank) + 1];
      expPerRank *= 2;
    }

    catData.rank = currentRank;
    catData.exp = currentExp;

    updateStatusScreen();
    saveData();
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(clearLabel);
  return li;
}

// ===== ランダム生成 =====
function randomQuests(category) {
  const ul = document.getElementById("home_" + category);
  ul.innerHTML = "";

  const loading = document.createElement("li");
  loading.textContent = "生成中";
  ul.appendChild(loading);

  let dots = 0;
  const interval = setInterval(() => {
    dots = (dots + 1) % 4;
    loading.textContent = "生成中" + ".".repeat(dots);
  }, 300);

  setTimeout(() => {
    clearInterval(interval);
    ul.innerHTML = "";

    const list = quests[category];
    const selectedCount = Math.min(3, list.length);
    const shuffled = [...list].sort(() => Math.random() - 0.5);

    homeGenerated[category] = shuffled.slice(0, selectedCount).map(obj => ({
      ...obj,
      checked: false
    }));

    homeGenerated[category].forEach((obj, i) => {
      const li = createQuestElement(obj, category, i);
      ul.appendChild(li);
    });

    saveData();
  }, 1500);
}

// ===== 管理画面描画 =====
function renderManage() {
  const container = document.getElementById("manageCategories");
  container.innerHTML = "";

  for (const category in quests) {
    const section = document.createElement("div");
    section.classList.add("category");

    const h2 = document.createElement("h2");
    h2.classList.add("category-title");
    h2.textContent = category;

    const delBtn = document.createElement("button");
    delBtn.textContent = "カテゴリ削除";
    delBtn.onclick = () => deleteCategory(category);

    const ul = document.createElement("ul");

    quests[category].forEach((q, i) => {
      const li = document.createElement("li");
      li.textContent = q.text;
      li.classList.add(q.rarity);

      const btn = document.createElement("button");
      btn.textContent = "削除";
      btn.onclick = () => deleteQuest(category, i);

      li.appendChild(btn);
      ul.appendChild(li);
    });

    const addBtn = document.createElement("button");
    addBtn.textContent = "追加";
    addBtn.onclick = () => addQuestToCategory(category);

    section.appendChild(h2);
    section.appendChild(delBtn);
    section.appendChild(ul);
    section.appendChild(addBtn);

    container.appendChild(section);
  }
}

// ===== ホーム画面（横スライド版） =====
function renderHome() {
  const container = document.getElementById("homeCategories");
  container.innerHTML = "";

  for (const category in quests) {
    const card = document.createElement("div");
    card.classList.add("category-card");

    const h2 = document.createElement("h2");
    h2.classList.add("category-title");
    h2.textContent = category;

    const ul = document.createElement("ul");
    ul.id = "home_" + category;

    if (homeGenerated[category]) {
      homeGenerated[category].forEach((obj, i) => {
        ul.appendChild(createQuestElement(obj, category, i));
      });
    }

    const genBtn = document.createElement("button");
    genBtn.textContent = "生成";
    genBtn.onclick = () => randomQuests(category);

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "リセット";
    resetBtn.onclick = () => {
      ul.innerHTML = "";
      homeGenerated[category] = [];
      saveData();
    };

    card.appendChild(h2);
    card.appendChild(ul);
    card.appendChild(genBtn);
    card.appendChild(resetBtn);

    container.appendChild(card);
  }
}

// ===== ステータス画面 =====
function showStatus() {
  document.getElementById("homeScreen").style.display = "none";
  document.getElementById("statusScreen").style.display = "block";

  document.getElementById("playerNameInput").value = playerData.name;
  updateStatusScreen();
}

function saveStatus() {
  const input = document.getElementById("playerNameInput");
  playerData.name = input.value.trim() || "名無し";
  saveData();
  alert("保存しました");
}

function backHomeFromStatus() {
  document.getElementById("statusScreen").style.display = "none";
  document.getElementById("homeScreen").style.display = "block";
}

// ===== ステータス更新（レーダーチャートのみ） =====
function updateStatusScreen() {
  const container = document.getElementById("categoryStatus");
  container.innerHTML = "";

  for (const cat in playerData.categories) {
    const div = document.createElement("div");
    div.classList.add("category-rank");

    const label = document.createElement("span");
    const data = playerData.categories[cat];
    const needExp = getExpForRank(data.rank);

    label.textContent = `${cat}: ランク${data.rank} / EXP ${data.exp}/${needExp}`;
    div.appendChild(label);

    container.appendChild(div);
  }

  const ctx = document.getElementById("statusRadar").getContext("2d");

  if (radarChart) radarChart.destroy();

  const labels = Object.keys(playerData.categories);
  const values = labels.map(cat => rankToNumber(playerData.categories[cat].rank));

  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [{
        label: "ステータス",
        data: values,
        borderWidth: 2,
        backgroundColor: "rgba(33, 150, 243, 0.4)",
        borderColor: "rgb(33, 150, 243)",
        pointBackgroundColor: "rgb(33, 150, 243)"
      }]
    },
    options: {
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: 9,
          grid: { color: "rgba(255,255,255,0.2)" },
          angleLines: { color: "rgba(255,255,255,0.2)" },
          ticks: { display: false },
          pointLabels: { color: "#fff", font: { size: 14 } }
        }
      },
      plugins: {
        legend: { labels: { color: "#fff" } }
      }
    }
  });
}

function getExpForRank(rank) {
  let exp = baseExpPerRank;
  for (let i = 0; i < rankOrder.indexOf(rank); i++) exp *= 2;
  return exp;
}

function rankToNumber(rank) {
  return rankOrder.indexOf(rank) + 1;
}

// ===== ステータス全リセット =====
function resetAllStatus() {
  if (!confirm("本当に全てのカテゴリのステータスをリセットしますか？")) return;

  for (const cat in playerData.categories) {
    playerData.categories[cat] = { exp: 0, rank: "F" };
  }
  updateStatusScreen();
  saveData();
}

// ===== 画面切り替え =====
function showManage() {
  document.getElementById("homeScreen").style.display = "none";
  document.getElementById("manageScreen").style.display = "block";
  renderManage();
}

function backHome() {
  document.getElementById("manageScreen").style.display = "none";
  document.getElementById("homeScreen").style.display = "block";
  renderHome();
}

// 初期処理
document.addEventListener("DOMContentLoaded", () => {
  renderHome();
});
