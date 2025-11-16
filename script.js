// ===== データ読み込み =====
let quests = JSON.parse(localStorage.getItem("quests")) || {}; // カテゴリとクエスト
let homeGenerated = JSON.parse(localStorage.getItem("homeGenerated")) || {}; // ホーム画面で生成されたクエストのチェック状態

// ===== データ保存 =====
function saveData() {
  localStorage.setItem("quests", JSON.stringify(quests));
  localStorage.setItem("homeGenerated", JSON.stringify(homeGenerated));
}

// ===== カテゴリ追加 =====
function addCategory() {
  const input = document.getElementById("newCategoryInput");
  const name = input.value.trim();
  if (!name || quests[name]) return;
  quests[name] = [];
  homeGenerated[name] = [];
  input.value = "";
  saveData();
  renderManage();
  renderHome();
}

// ===== カテゴリ削除 =====
function deleteCategory(name) {
  if (!quests[name]) return;
  delete quests[name];
  delete homeGenerated[name];
  saveData();
  renderManage();
  renderHome();
}

// ===== クエスト追加 =====
function addQuestToCategory(category) {
  const input = prompt("クエストを入力してください:");
  if (!input) return;
  quests[category].push(input);
  saveData();
  renderManage();
}

// ===== クエスト削除 =====
function deleteQuest(category, index) {
  quests[category].splice(index, 1);
  saveData();
  renderManage();
}

// ===== クエスト要素作成（ホーム用） =====
function createQuestElement(text, category, index) {
  const li = document.createElement("li");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("quest-check");

  const span = document.createElement("span");
  span.textContent = text;

  const clearLabel = document.createElement("span");
  clearLabel.textContent = "CLEAR";
  clearLabel.classList.add("clear-text");
  clearLabel.style.display = "none";

  // チェック状態を復元
  if (homeGenerated[category] && homeGenerated[category][index]) {
    checkbox.checked = true;
    span.style.textDecoration = "line-through";
    clearLabel.style.display = "inline";
  }

  checkbox.addEventListener("change", () => {
    if (!homeGenerated[category]) homeGenerated[category] = [];
    homeGenerated[category][index] = checkbox.checked;

    if (checkbox.checked) {
      span.style.textDecoration = "line-through";
      clearLabel.style.display = "inline";
    } else {
      span.style.textDecoration = "none";
      clearLabel.style.display = "none";
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
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    // homeGenerated を上書きせず、選ばれた index を正しくマッピング
    if (!homeGenerated[category]) homeGenerated[category] = [];
    const newGenerated = [];
    selected.forEach((q, i) => {
      newGenerated[i] = homeGenerated[category][i] || false;
      const li = createQuestElement(q, category, i);
      ul.appendChild(li);
    });

    homeGenerated[category] = newGenerated;
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
    h2.textContent = category;
    section.appendChild(h2);

    // カテゴリ削除ボタン
    const catDelBtn = document.createElement("button");
    catDelBtn.textContent = "カテゴリ削除";
    catDelBtn.classList.add("delete-btn");
    catDelBtn.onclick = () => deleteCategory(category);
    section.appendChild(catDelBtn);

    const ul = document.createElement("ul");
    ul.id = "manage_" + category;
    section.appendChild(ul);

    quests[category].forEach((q, i) => {
      const li = document.createElement("li");
      li.textContent = q;

      const btn = document.createElement("button");
      btn.textContent = "削除";
      btn.classList.add("delete-btn");
      btn.onclick = () => deleteQuest(category, i);

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

// ===== ホーム画面描画 =====
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

// ===== 初期描画 =====
document.addEventListener("DOMContentLoaded", () => {
  renderHome();
});
