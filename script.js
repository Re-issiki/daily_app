// データ読み込み
let quests = JSON.parse(localStorage.getItem("quests")) || {};
let homeGenerated = JSON.parse(localStorage.getItem("homeGenerated")) || {};

// 保存
function saveData() {
  localStorage.setItem("quests", JSON.stringify(quests));
  localStorage.setItem("homeGenerated", JSON.stringify(homeGenerated));
}

// ===== クエスト要素作成 =====
function createQuestElement(quest, category, index) {
  const li = document.createElement("li");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("quest-check");
  checkbox.checked = quest.done;

  const span = document.createElement("span");
  span.textContent = quest.text;
  span.style.textDecoration = quest.done ? "line-through" : "none";

  const clearLabel = document.createElement("span");
  clearLabel.textContent = "CLEAR";
  clearLabel.classList.add("clear-text");
  clearLabel.style.display = quest.done ? "inline" : "none";

  // チェック変更時に homeGenerated を更新
  checkbox.addEventListener("change", () => {
    quest.done = checkbox.checked;
    span.style.textDecoration = quest.done ? "line-through" : "none";
    clearLabel.style.display = quest.done ? "inline" : "none";
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
    const selected = shuffled.slice(0, 5).map(q => ({ text: q, done: false }));

    // 選ばれたクエストを保存
    homeGenerated[category] = selected;
    saveData();

    selected.forEach((q, i) => {
      const li = createQuestElement(q, category, i);
      ul.appendChild(li);
    });
  }, 2000);
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

    // 保存されている homeGenerated を反映
    if (homeGenerated[category]) {
      homeGenerated[category].forEach((q, i) => {
        const li = createQuestElement(q, category, i);
        ul.appendChild(li);
      });
    }

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
