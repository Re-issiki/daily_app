// 保存読み込み or 初期データ
let quests = JSON.parse(localStorage.getItem("quests")) || {
  study: [
    "数学を10問解く",
    "英単語20個覚える",
    "プログラミング1時間",
    "読書30分",
    "日記を書く"
  ],
  life: [
    "部屋の片付け",
    "洗濯する",
    "ストレッチ",
    "掃除機をかける"
  ]
};

// 保存処理
function saveData() {
  localStorage.setItem("quests", JSON.stringify(quests));
}

// 追加
function addQuest(category) {
  let input = prompt("クエストを入力してください:");
  if (!input) return;

  const ul = document.getElementById(category + "List");
  ul.appendChild(createQuestElement(input));

  quests[category].push(input);
  saveData();
}


// 削除
function deleteQuest(category, index) {
  quests[category].splice(index, 1);
  saveData();
  renderManage();
}

// ランダム生成（生成中アニメーション＋フェードイン）
function randomQuests(category) {
  const ul = document.getElementById(category + "Quest");
  ul.innerHTML = "";

  // 「生成中…」表示
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
       li.style.display = "flex";       // ←これ追加
       li.style.alignItems = "center";  // ←これ追加
       li.style.opacity = 0;
       ul.appendChild(li);
       setTimeout(() => li.style.opacity = 1, 50);
      });
    }, 2000);
  }

// 完全リセット（必要なら使用）
function resetQuests(category) {
  const ul = document.getElementById(category + "Quest");
  if (!ul) return;
  ul.innerHTML = "";
}
//チェックボックス
function createQuestElement(text) {
  let li = document.createElement("li");

  let checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("quest-check");

  let span = document.createElement("span");
  span.textContent = text;

  let clearLabel = document.createElement("span");
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


// ===== 画面切り替え =====
function showManage() {
  document.getElementById("homeScreen").style.display = "none";
  document.getElementById("manageScreen").style.display = "block";
  renderManage();
}

function backHome() {
  document.getElementById("manageScreen").style.display = "none";
  document.getElementById("homeScreen").style.display = "block";
}

// 管理画面リスト描画
function renderManage() {
  renderListEditor("study", "manageStudy");
  renderListEditor("life", "manageLife");
}

// 編集用描画関数
function renderListEditor(category, elementId) {
  const ul = document.getElementById(elementId);
  ul.innerHTML = "";

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
}

document.addEventListener("DOMContentLoaded", () => {
  // 最初は何も表示せず
});
