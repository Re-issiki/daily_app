const quests = {
  study: [
    "数学の問題を10問解く",
    "英単語を20個覚える",
    "プログラミング1時間やる",
    "読書を30分する",
    "日記を1ページ書く"
  ],
  life: [
    "部屋を片付ける",
    "洗濯をする",
    "買い物に行く",
    "料理を作る",
    "ストレッチを10分する"
  ]
};

function randomQuest(category) {
  const list = quests[category];
  const index = Math.floor(Math.random() * list.length);
  document.getElementById(category + "Quest").textContent = list[index];
}

// ページ開いたときに初期表示
randomQuest('study');
randomQuest('life');
