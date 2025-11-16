// 保存データ読み込み or 初期データ
let quests = JSON.parse(localStorage.getItem("quests")) || {
  study: [
    "数学の問題を10問解く",
    "英単語を20個覚える",
    "プログラミング1時間やる",
    "読書を30分する",
    "日記を書く"
  ],
  life: [
    "部屋を片付ける",
    "洗濯する",
    "ストレッチ10分",
    "掃除機をかける"
  ]
};

// 保存処理
function saveData() {
  localStorage.setItem("quests", JSON.stringify(quests));
}

// クエスト追加
function addQuest(category) {
  const input = document.getElementById(category + "Input");
  const text = input.value.trim();
  if (!text) return;

  quests[category].push(text);
  input.value = "";
  saveData();
  renderQuests(category);
}

// 削除
function deleteQuest(category, index) {
  quests[category].splice(index, 1);
  saveData();
  renderQuests(category);
}

// 表示更新
function renderQuests(category) {
  const ul = document.getElementById(category + "Quest");
  ul.innerHTML = "";

  quests[category].forEach((q, i) => {
    const li = document.createElement("li");
    li.textContent = q;

    const btn = document.createElement("button");
    btn.textContent = "✖";
    btn.classList.add("delete-btn");
    btn.onclick = () => deleteQuest(category, i);

    li.appendChild(btn);
    ul.appendChild(li);
  });
}

// ランダム5個
function randomQuests(category) {
  const list = quests[category];
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  quests[category] = shuffled.slice(0, 5);
  saveData();
  renderQuests(category);
}

// 完全リセット
function resetQuests(category) {
  quests[category] = [];
  saveData();
  renderQuests(category);
}

document.addEventListener("DOMContentLoaded", () => {
  renderQuests("study");
  renderQuests("life");
});
