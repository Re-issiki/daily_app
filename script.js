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

// ランダムで5個選んで表示
function randomQuests(category) {
  const list = quests[category];
  if (!list) return;

  const shuffled = [...list].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 5);

  const ul = document.getElementById(category + "Quest");
  if (!ul) return;

  ul.innerHTML = "";
  selected.forEach(q => {
    const li = document.createElement("li");
    li.textContent = q;
    ul.appendChild(li);
  });
}

// 表示中のクエストをリセット
function resetQuests(category) {
  const ul = document.getElementById(category + "Quest");
  if (!ul) return;
  ul.innerHTML = "";
}

// ページ読み込み時に初期表示
document.addEventListener("DOMContentLoaded", () => {
  randomQuests('study');
  randomQuests('life');
});
