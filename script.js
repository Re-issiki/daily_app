// ===== データ読み込み =====
let quests = JSON.parse(localStorage.getItem("quests")) || {}; 
let homeGenerated = JSON.parse(localStorage.getItem("homeGenerated")) || {}; 

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
function createQuestElement(obj, category, index) {
  const li = document.createElement("li");

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

  // チェック変更
  checkbox.addEventListener("change", () => {
    obj.checked = checkbox.checked;
    span.style.textDecoration = obj.checked ? "line-through" : "none";
    clearLabel.style.display = obj.checked ? "inline" : "none";
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

    // 選ばれたクエストを homeGenerated に格納
    homeGenerated[category] = selected.map(text => ({ text, checked: false }));

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

    // 保存されている homeGenerated から表示
    if (homeGenerated[category]) {
      homeGenerated[category].forEach((obj, i) => {
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
