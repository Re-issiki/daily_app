const quests = [
    "腕立て10回",
    "水をコップ1杯飲む",
    "写真1枚撮る",
    "英単語5個覚える",
    "部屋の物を1つ片付ける",
    "深呼吸を5回する",
    "日記を1行書く"
];

const questBox = document.getElementById("quest-box");
const btn = document.getElementById("generate-btn");

btn.addEventListener("click", () => {
    const randomIndex = Math.floor(Math.random() * quests.length);
    questBox.textContent = quests[randomIndex];
});
