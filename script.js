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
  const input = document.getElementById(category + "Input");
  const value = input.value.trim();
  if (!value) return;

  quests[category].push(value);
  input.value = "";
  saveData();
  renderManage();
}

// 削除
function deleteQuest(category, index) {
  quests[category].splice(index, 1);
  saveData();
  renderManage();
}

// リスト表示（ホーム側）
function renderQuests(category) {
  const ul = document.getElementById(category + "Quest");
  ul.innerHTML = "";
  quests[category].forEach(q => {
    const li = document.createElement("li");
    li.textContent = q;
    ul.appendChild(li);
  });
}

// ランダム生成
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

  // 生成アニメーション後にクエスト表示
  setTimeout(() => {
    clearInterval(interval);
    ul.innerHTML = "";

    const list = quests[category];
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    selected.forEach(q => {
      const li = document.createElement("li");

      // チェックボックス
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";

      // Clearボタン
      const clearBtn = document.createElement("button");
      clearBtn.textContent = "Clear";
      clearBtn.classList.add("clear-btn");
      clearBtn.style.display = "none";

      checkbox.onchange = () => {
        if (checkbox.checked) {
          li.style.textDecoration = "line-through";
          clearBtn.style.display = "inline-block";
        } else {
          li.style.textDecoration = "none";
          clearBtn.style.display = "none";
        }
      };

      clearBtn.onclick = () => {
        checkbox.checked = false;
        li.style.textDecoration = "none";
        clearBtn.style.display = "none";
      };

      li.appendChild(checkbox);
      li.appendChild(document.createTextNode(q));
      li.appendChild(clearBtn);

      li.style.opacity = 0; // フェードイン用
      ul.appendChild(li);
      setTimeout(() => li.style.opacity = 1, 50);
    });
  }, 2000); // ← 待機時間（生成中表示の長さ）
}



// 完全リセット（必要なら使用）
function resetQuests(category) {
  const ul = document.getElementById(category + "Quest");
  if (!ul) return;
  ul.innerHTML = "";
}

//完了済み機能
function renderQuestsWithCheck(category) {
  const ul = document.getElementById(category + "Quest");
  ul.innerHTML = "";

  quests[category].forEach((q, i) => {
    const li = document.createElement("li");

    // チェックボックス
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    // Clearボタン
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear";
    clearBtn.classList.add("clear-btn");
    clearBtn.style.display = "none";

    checkbox.onchange = () => {
      if (checkbox.checked) {
        li.style.textDecoration = "line-through";
        clearBtn.style.display = "inline-block";
      } else {
        li.style.textDecoration = "none";
        clearBtn.style.display = "none";
      }
    };

    clearBtn.onclick = () => {
      checkbox.checked = false;
      li.style.textDecoration = "none";
      clearBtn.style.display = "none";
    };

    li.appendChild(checkbox);
    li.appendChild(document.createTextNode(q));
    li.appendChild(clearBtn);

    ul.appendChild(li);
  });
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
  renderQuestsWithCheck("study");
  renderQuestsWithCheck("life");
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

});
