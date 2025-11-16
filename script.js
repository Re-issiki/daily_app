localStorage.clear();
// データ読み込み
let quests = JSON.parse(localStorage.getItem("quests")) || {};

// 保存
function saveData() {
  localStorage.setItem("quests", JSON.stringify(quests));
}

// ===== カテゴリ追加 =====
function addCategory() {
  const input = document.getElementById("newCategoryInput");
  const name = input.value.trim();
  if (!name) return;          // 空欄は追加しない
  if (quests[name]) {          // 既存カテゴリは追加しない
    alert("そのカテゴリは既に存在します");
    return;
  }
  quests[name] = [];
  saveData();
  input.value = "";
  renderManage();
}

// ===== クエスト追加 =====
function addQuestToCategory(category) {
  const input = prompt("クエストを入力してください:");
  if (!input) return;

  quests[category].push(input);
  saveData();
  renderManage();
}

// ===== クエスト要素作成 =====
function createQuestElement(text) {
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

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      span.style.textDecoration = "line-through";
      clearLabel.style.display = "inline";
    } else {
      span.style.textDecoration = "none";
      clearLabel.style.display = "none";
    }
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(clearLabel);

  return li;
}

// ===== クエスト削除 =====
function deleteQuest(category, index) {
  quests[category].splice(index, 1);
  saveData();
  renderManage();
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
    selected.forEach(q => {
      const li = createQuestElement(q);
      ul.appendChild(li);
    });
  }, 2000);
}

// ===== 管理画面描画 =====
function renderManage() {
  const container = document.getElementById("manageCategories");
  container.innerHTML = "";

  for (const category in quests) {
    const section = document.createElement("div");
    section.classList.add("category");

    // カテゴリ名
    const h2 = document.createElement("h2");
    h2.textContent = category;
    section.appendChild(h2);

    // カテゴリ削除ボタン
    const delCatBtn = document.createElement("button");
    delCatBtn.textContent = "カテゴリ削除";
    delCatBtn.classList.add("delete-btn");
    delCatBtn.style.width = "auto"; // ボタンの幅を調整
    delCatBtn.style.marginLeft = "10px";
    delCatBtn.onclick = () => {
      if (confirm(`カテゴリ「${category}」を削除しますか？`)) {
        deleteCategory(category);
      }
    };
    section.appendChild(delCatBtn);

    // クエスト一覧
    const ul = document.createElement("ul");
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

    // クエスト追加ボタン
    const addBtn = document.createElement("button");
    addBtn.textContent = "追加";
    addBtn.onclick = () => addQuestToCategory(category);
    section.appendChild(addBtn);

    container.appendChild(section);
  }
}

// ===== カテゴリ削除 =====
function deleteCategory(category) {
  delete quests[category];  // questsオブジェクトから削除
  saveData();               // 保存
  renderManage();           // 再描画
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
    resetBtn.onclick = () => { ul.innerHTML = ""; };
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

// 初期描画
document.addEventListener("DOMContentLoaded", () => {
  renderHome();
});
