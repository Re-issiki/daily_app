const homeView = document.getElementById("homeView");
const createView = document.getElementById("createView");
const viewView = document.getElementById("viewView");

const headerTitle = document.getElementById("headerTitle");
const newBtn = document.getElementById("newBtn");

const roadmapList = document.getElementById("roadmapList");
const titleInput = document.getElementById("titleInput");
const goalInput = document.getElementById("goalInput");
const stepsInput = document.getElementById("stepsInput");
const saveBtn = document.getElementById("saveBtn");

const tree = document.getElementById("tree");

let roadmaps = JSON.parse(localStorage.getItem("roadmaps") || "[]");
let currentIndex = null;

/* ---------- 共通：画面切り替え ---------- */

function show(view) {
  homeView.classList.add("hidden");
  createView.classList.add("hidden");
  viewView.classList.add("hidden");
  view.classList.remove("hidden");
}

/* ---------- HOME ---------- */

function renderHome() {
  headerTitle.textContent = "Roadmap App";
  show(homeView);
  roadmapList.innerHTML = "";

  roadmaps.forEach((rm, i) => {
    const li = document.createElement("li");
    li.textContent = rm.title || "No Title";
    li.onclick = () => {
      currentIndex = i;
      renderView();
    };
    roadmapList.appendChild(li);
  });
}

newBtn.onclick = () => {
  headerTitle.textContent = "Create Roadmap";
  show(createView);
};

/* ---------- CREATE ---------- */

saveBtn.onclick = () => {
  const roadmap = {
    title: titleInput.value,
    goal: goalInput.value,
    steps: stepsInput.value.split("\n").filter(Boolean)
  };

  roadmaps.push(roadmap);
  localStorage.setItem("roadmaps", JSON.stringify(roadmaps));

  titleInput.value = "";
  goalInput.value = "";
  stepsInput.value = "";

  renderHome();
};

/* ---------- VIEW ---------- */

function renderView() {
  const rm = roadmaps[currentIndex];
  headerTitle.textContent = rm.title;
  show(viewView);
  generateTree(rm.goal, rm.steps);
}

function generateTree(goal, steps) {
  tree.innerHTML = "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "700");
  svg.setAttribute("height", "320");
  tree.appendChild(svg);

  const root = createNode(goal || "最終目標", 300, 20);
  tree.appendChild(root);

  const spacing = 700 / (steps.length + 1);

  steps.forEach((text, i) => {
    const x = spacing * (i + 1) - 40;
    const y = 160;

    const node = createNode(text, x, y);
    tree.appendChild(node);

    const line = createLine(350, 60, x + 40, y);
    svg.appendChild(line);

    node.onclick = () => {
      node.classList.toggle("done");
      line.classList.toggle("done");
    };
  });
}

function createNode(text, x, y) {
  const div = document.createElement("div");
  div.className = "node";
  div.textContent = text;
  div.style.left = x + "px";
  div.style.top = y + "px";
  return div;
}

function createLine(x1, y1, x2, y2) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  return line;
}

/* 初期表示 */
renderHome();
