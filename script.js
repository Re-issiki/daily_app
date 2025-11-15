let player = { level:1, exp:0, hp:100, mp:50 };
let quests = [ {name:"クエスト1", exp:30}, {name:"クエスト2", exp:50}, {name:"クエスト3", exp:20} ];

const questsDiv = document.getElementById("quests");
quests.forEach(q => {
  const btn = document.createElement("button");
  btn.textContent = `${q.name} (+${q.exp}EXP)`;
  btn.onclick = () => completeQuest(q.exp);
  questsDiv.appendChild(btn);
});

function updateStatus() {
  document.getElementById("level").textContent = player.level;
  document.getElementById("exp").textContent = player.exp;
  document.getElementById("hp").textContent = player.hp;
  document.getElementById("mp").textContent = player.mp;
  document.getElementById("expBar").style.width = player.exp + "%";
}

function completeQuest(expGain) {
  player.exp += expGain;
  player.hp += 5;
  player.mp += 5;

  if(player.exp >= 100) {
    player.level++;
    player.exp -= 100;
    player.hp += 20;
    player.mp += 10;
    alert(`レベルアップ！ レベル ${player.level}`);
  }

  updateStatus();
}

updateStatus();
