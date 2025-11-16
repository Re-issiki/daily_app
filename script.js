const quests = {
  study: [
    "数学の問題を10問解く",
    "英単語を20個覚える",
    "プログラミング1時間やる",
    "読書を30分する",
    "日記を1ページ書く",
    "英語のニュースを読む",
    "漢字を10個覚える",
    "歴史のまとめノートを書く"
  ],
  life: [
    "部屋を片付ける",
    "洗濯をする",
    "買い物に行く",
    "料理を作る",
    "ストレッチを10分する",
    "植物に水やりする",
    "掃除機をかける",
    "ゴミをまとめる"
  ]
};

function randomQuests(category) {
  const list = quests[category];
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 5);

  const ul = document.getElementById(category + "Quest");
  ul.innerHTML = "";

  selected.forEach(q => {
    const li = document.createElement("li");
    li.textContent = q;
    ul.appendChild(li);
  });
}

function resetQuests(category) {
  document.getElementById(category + "Quest").innerHTML = "";
}

function toggleEditor() {
  const panel = document.getElementById("editorPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
  updateQuestList();
}

function updateQuestList() {
  const category = document.getElementById("categorySelect").value;
  const list = quests[category];
  const ul = document.getElementById("questList");

  ul.innerHTML = "";
  list.forEach(q => {
    const li = document.createElement("li");
    li.textContent = q;

    const btn = document.createElement("button");
    btn.textContent = "削除";
    btn.style.background = "#ff5252";
    btn.style.marginTop = "5px";
    btn.onclick = () => {
      quests[category] = quests[category].filter(item => item !== q);
      updateQuestList();
    };

    li.appendChild(btn);
    ul.appendChild(li);
  });
}

function addQuest() {
  const category = document.getElementById("categorySelect").value;
  const text = document.getElementById("newQuest").value;

  if (text.trim() === "") return;
  quests[category].push(text);
  document.getElementById("newQuest").value = "";
  updateQuestList();
}

// 初期は表示なし → OK
document.addEventListener("DOMContentLoaded", () => {});
