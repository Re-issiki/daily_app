// ===== データ読み込み =====
let playerData = JSON.parse(localStorage.getItem("playerData")) || {
  name: "名無し",
  categories: {} // カテゴリごとのランク・経験値
};

let quests = JSON.parse(localStorage.getItem("quests")) || {};
let homeGenerated = JSON.parse(localStorage.getItem("homeGenerated")) || {};

// ===== ランク定義 =====
const rankOrder = ["F","E","D","C","B","A","S","SS","SSS"];
const expPerRank = 100;

// ===== 保存 =====
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
  // ステータス用カテゴリも初期化
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

// ===== クエスト要素作成 =====
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
  clearLabel.style.display = obj.checked ? "inline" : "none";

  checkbox.addEventListener("change", () => {
    obj.checked = checkbox.checked;
    span.style.textDecoration = obj.checked ? "line-through" : "none";
    clearLabel.style.display = obj.checked ? "inline" : "none";

    if (obj.checked) {
      // 経験値加算
      if (!playerData.categories[category]) {
        playerData.categories[category] = { exp: 0, rank: "F" };
      }
      let catData = playerData.categories[category];
      catData.exp += (obj.rarity === "bronze" ? 10 : obj.rarity === "silver" ? 20 : 30);

      // ランクアップ判定
      let currentRank = catData.rank;
      let currentExp = catData.exp;
      while (currentExp >= expPerRank && rankOrder.indexOf(currentRank) < rankOrder.length -1) {
        currentExp -= expPerRank;
        currentRank = rankOrder[rankOrder.indexOf(currentRank)+1];
      }
      catData.rank = currentRank;
      catData.exp = currentExp;

      updateStatusScreen();
    }

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

    homeGenerated[category] = shuffled.slice(0, selectedCount).map(obj => ({ ...obj, checked:false }));

    homeGenerated[category].forEach((obj,i) => {
      const li = createQuestElement(obj, category, i);
      ul.appendChild(li);
    });

    saveData();
  },1500);
}

// ===== 管理画面 =====
function renderManage() {
  const container = document.getElementById("manageCategories");
  container.innerHTML = "";

  for (const category in quests) {
    const section = document.createElement("div");
    section.classList.add("category");

    const h2 = document.createElement("h2");
    h2.textContent = category;
    section.appendChild(h2);

    const delBtn = document.createElement("button");
    delBtn.textContent = "カテゴリ削除";
    delBtn.classList.add("delete-btn");
    delBtn.onclick = () => deleteCategory(category);
    section.appendChild(delBtn);

    const ul = document.createElement("ul");
    section.appendChild(ul);

    quests[category].forEach((q,i) => {
      const li = document.createElement("li");
      li.textContent = q.text;
      li.classList.add(q.rarity);

      const btn = document.createElement("button");
      btn.textContent = "削除";
      btn.classList.add("delete-btn");
      btn.onclick = () => deleteQuest(category,i);

      li.appendChild(btn);
      ul.appendChild(li);
    });

    const addBtn = document.createElement("button");
    addBtn.textContent = "追加";
    addBtn.onclick = () => addQuestToCategory(category);
    section.appendChild(addBtn);

    container.appendChild(section);
  }
}

// ===== ホーム画面 =====
function renderHome() {
  const container = document.getElementById("homeCategories");
  container.innerHTML = "";

  for (const category in quests) {
    const section = document.createElement("div");
    section.classList.add("category");

    const h2 = document.createElement("h2");
    h2.textContent = category;
    section.appendChild(h2);

    const ul = document.createElement("ul");
    ul.id = "home_" + category;
    section.appendChild(ul);

    if (homeGenerated[category]) {
      homeGenerated[category].forEach((obj,i) => {
        const li = createQuestElement(obj, category, i);
        ul.appendChild(li);
      });
    }

    const genBtn = document.createElement("button");
    genBtn.textContent = "生成";
    genBtn.onclick = () => randomQuests(category);
    section.appendChild(genBtn);

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "リセット";
    resetBtn.classList.add("reset");
    resetBtn.onclick = () => {
      ul.innerHTML = "";
      homeGenerated[category] = [];
      saveData();
    };
    section.appendChild(resetBtn);

    container.appendChild(section);
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

function updateStatusScreen() {
  const container = document.getElementById("categoryStatus");
  container.innerHTML = "";
  for (const cat in playerData.categories) {
    const data = playerData.categories[cat];

    const div = document.createElement("div");
    div.classList.add("category-rank");

    const label = document.createElement("span");
    label.textContent = `${cat}: ${data.rank}`;

    const expContainer = document.createElement("div");
    expContainer.classList.add("exp-container");

    const expBar = document.createElement("div");
    expBar.classList.add("exp-bar");
    expBar.style.width = `${Math.min(100, (data.exp/expPerRank*100))}%`;
    expContainer.appendChild(expBar);

    div.appendChild(label);
    div.appendChild(expContainer);
    container.appendChild(div);
  }
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

document.addEventListener("DOMContentLoaded", () => {
  renderHome();
});
