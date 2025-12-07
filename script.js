// ===== データ読み込み =====
// localStorage からデータを取得（なければ初期値を作成）
let playerData = JSON.parse(localStorage.getItem("playerData")) || {
  name: "名無し",
  categories: {} // 各カテゴリごとの経験値・ランク
};
let radarChart = null;
let quests = JSON.parse(localStorage.getItem("quests")) || {}; // クエスト一覧
let homeGenerated = JSON.parse(localStorage.getItem("homeGenerated")) || {}; // ホーム画面に表示するランダム生成結果

// ===== ランク関連設定 =====
const rankOrder = ["F","E","D","C","B","A","S","SS","SSS"];
const baseExpPerRank = 100; // 最初のランクに必要な経験値

//レーダーチャート用ランク変換
function rankToNumber(rank) {
  const order = ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"];
  return order.indexOf(rank) + 1; // F=1, E=2, D=3 …
}


// ===== データ保存 =====
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

  // 新カテゴリにステータスが無い場合は初期化
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

// ===== クエスト要素生成 =====
// チェックしたかどうかで取り消し線・CLEARを反映
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

  // ★ 初期状態で取り消し線と CLEAR を反映
  if (obj.checked) {
    span.style.textDecoration = "line-through";
    clearLabel.style.display = "inline";
  } else {
    clearLabel.style.display = "none";
  }

  // チェック処理
  checkbox.addEventListener("change", () => {
    // チェックを外す操作は無効
    if (!checkbox.checked) return;

    if (!confirm("このクエストをクリアしますか？")) {
      checkbox.checked = false;
      return;
    }

    // クリア状態に変更
    obj.checked = true;
    span.style.textDecoration = "line-through";
    clearLabel.style.display = "inline";

    // カテゴリの経験値データがない場合は初期化
    if (!playerData.categories[category]) {
      playerData.categories[category] = { exp: 0, rank: "F" };
    }
    let catData = playerData.categories[category];

    // 経験値加算（レア度による）
    catData.exp += obj.rarity === "bronze" ? 10 : obj.rarity === "silver" ? 20 : 30;

    // ランクアップ処理
    let currentRank = catData.rank;
    let currentExp = catData.exp;
    let expPerRank = baseExpPerRank;

    // 現ランクまでの必要EXPを計算
    for (let i = 0; i < rankOrder.indexOf(currentRank); i++) expPerRank *= 2;

    // ランクアップループ
    while (currentExp >= expPerRank && rankOrder.indexOf(currentRank) < rankOrder.length - 1) {
      currentExp -= expPerRank;
      currentRank = rankOrder[rankOrder.indexOf(currentRank) + 1];
      expPerRank *= 2;
    }

    catData.rank = currentRank;
    catData.exp = currentExp;

    updateStatusScreen();
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

  // ローディング演出
  const loading = document.createElement("li");
  loading.textContent = "生成中";
  ul.appendChild(loading);

  let dots = 0;
  const interval = setInterval(() => {
    dots = (dots + 1) % 4;
    loading.textContent = "生成中" + ".".repeat(dots);
  }, 300);

  // 1.5秒後に生成
  setTimeout(() => {
    clearInterval(interval);
    ul.innerHTML = "";

    const list = quests[category];
    const selectedCount = Math.min(3, list.length);

    // クエストをシャッフルして3つ選ぶ
    const shuffled = [...list].sort(() => Math.random() - 0.5);

    // ホーム画面用の生成結果を保存
    homeGenerated[category] = shuffled.slice(0, selectedCount).map(obj => ({
      ...obj,
      checked: false
    }));

    // 生成されたクエストを描画
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

    const delBtn = document.createElement("button");
    delBtn.textContent = "カテゴリ削除";
    delBtn.classList.add("delete-btn");
    delBtn.onclick = () => deleteCategory(category);

    const ul = document.createElement("ul");

    // クエスト一覧を表示
    quests[category].forEach((q, i) => {
      const li = document.createElement("li");
      li.textContent = q.text;
      li.classList.add(q.rarity);

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

    section.appendChild(h2);
    section.appendChild(delBtn);
    section.appendChild(ul);
    section.appendChild(addBtn);

    container.appendChild(section);
  }
}

// ===== ホーム画面描画（横スライドカード版） =====
function renderHome() {
  const container = document.getElementById("homeCategories");
  container.innerHTML = "";

  for (const category in quests) {
    const card = document.createElement("div");
    card.classList.add("category-card");

    const h2 = document.createElement("h2");
    h2.textContent = category;

    const ul = document.createElement("ul");
    ul.id = "home_" + category;

    // すでに保存されているランダム生成結果の表示
    if (homeGenerated[category]) {
      homeGenerated[category].forEach((obj, i) => {
        const li = createQuestElement(obj, category, i);
        ul.appendChild(li);
      });
    }

    const genBtn = document.createElement("button");
    genBtn.textContent = "生成";
    genBtn.onclick = () => randomQuests(category);

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "リセット";
    resetBtn.classList.add("reset");
    resetBtn.onclick = () => {
      ul.innerHTML = "";
      homeGenerated[category] = [];
      saveData();
    };

    card.appendChild(h2);
    card.appendChild(ul);
    card.appendChild(genBtn);
    card.appendChild(resetBtn);

    container.appendChild(card);
  }
}

// ===== ステータス画面 =====
function showStatus() {
  document.getElementById("homeScreen").style.display = "none";
  document.getElementById("statusScreen").style.display = "block";

  document.getElementById("playerNameInput").value = playerData.name;
  updateStatusScreen();
}

// 名前保存
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

// ステータス更新（経験値バーは削除済み）
function updateStatusScreen() {
  const container = document.getElementById("categoryStatus");
  container.innerHTML = "";

  // カテゴリ一覧を画面表示（テキスト部）
  for (const cat in playerData.categories) {
    const div = document.createElement("div");
    div.classList.add("category-rank");

    const label = document.createElement("span");
    const data = playerData.categories[cat];
    const needExp = getExpForRank(data.rank);

    label.textContent = `${cat}: ランク${data.rank} / EXP ${data.exp}/${needExp}`;

    div.appendChild(label);
    container.appendChild(div);
  }

  // レーダーチャート作成
  const ctx = document.getElementById("statusRadar").getContext("2d");

  // 既に描画済みなら削除してから描き直す
  if (radarChart) {
    radarChart.destroy();
  }

  const labels = Object.keys(playerData.categories);
  const values = labels.map(cat =>
    rankToNumber(playerData.categories[cat].rank)
  );

  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: [{
        label: "ステータス",
        data: values,
        borderWidth: 2,
        backgroundColor: "rgba(33, 150, 243, 0.4)", 
        borderColor: "rgb(33, 150, 243)",           
        pointBackgroundColor: "rgb(33, 150, 243)"
      }]
    },
    options: {
      scales: {
        r: {
          beginAtZero: true,
          suggestedMin: 0,
          suggestedMax: 9, // SSS = 9相当
          grid: { color: "rgba(255,255,255,0.2)" },
          angleLines: { color: "rgba(255,255,255,0.2)" },
          ticks: { stepSize: 1, display: false },
          pointLabels: {
            color: "#fff",
            font: { size: 14 }
          }
        }
      },
      plugins: {
        legend: {
          labels: { color: "#fff" }
        }
      }
    }
  });
}

// ランクの必要EXP計算
function getExpForRank(rank) {
  let exp = baseExpPerRank;
  for (let i = 0; i < rankOrder.indexOf(rank); i++) exp *= 2;
  return exp;
}

// ===== ステータス全リセット =====
function resetAllStatus() {
  if (!confirm("本当に全てのカテゴリのステータスをリセットしますか？")) return;
  for (const cat in playerData.categories) {
    playerData.categories[cat] = { exp: 0, rank: "F" };
  }
  updateStatusScreen();
  saveData();
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

// 初期処理
document.addEventListener("DOMContentLoaded", () => {
  renderHome();
});
