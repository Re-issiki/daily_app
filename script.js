const homeView = document.getElementById("homeView");
const createView = document.getElementById("createView");
const viewView = document.getElementById("viewView");

const headerTitle = document.getElementById("headerTitle");
const newBtn = document.getElementById("newBtn");
const backBtn = document.getElementById("backBtn");

const roadmapList = document.getElementById("roadmapList");
const titleInput = document.getElementById("titleInput");
const goalInput = document.getElementById("goalInput");
const stepsInput = document.getElementById("stepsInput");
const saveBtn = document.getElementById("saveBtn");

const tree = document.getElementById("tree");

let roadmaps = JSON.parse(localStorage.getItem("roadmaps") || "[]");
let currentIndex = null;

/* ---------- 画面制御 ---------- */

function show(view) {
  [homeView, createView, viewView].forEach(v => v.classList.add("hidden"));
  view.classList.remove("hidden");

  backBtn.classList.toggle("hidden", view === homeView);
}

backBtn.onclick = renderHome;

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
  headerTitle.textContent = "Create";
  show(createView);
};

/* ---------- CREATE ---------- */

saveBtn.onclick = () => {
  const roadmap = {
    title: titleInput.value,
    goal: goalInput.value,
    tree: parseSteps(stepsInput.value),
    done: {}
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
  drawTree(rm);
}

function drawTree(rm) {
  tree.innerHTML = "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "900");
  svg.setAttribute("height", "500");
  tree.appendChild(svg);

  const root = createNode(rm.goal, 400, 20, "root", rm);
  tree.appendChild(root);

  rm.tree.forEach((parent, i) => {
    const px = 200 + i * 300;
    const py = 120;

    const pNode = createNode(parent.text, px, py, `p${i}`, rm);
    tree.appendChild(pNode);
    svg.appendChild(createLine(450, 60, px + 40, py));

    parent.children.forEach((child, j) => {
      const cx = px;
      const cy = py + 80 + j * 60;

      const cNode = createNode(child, cx, cy, `p${i}c${j}`, rm);
      tree.appendChild(cNode);
      svg.appendChild(createLine(px + 40, py + 30, cx + 40, cy));
    });
  });
}

/* ---------- ノード ---------- */

function createNode(text, x, y, id, rm) {
  const div = document.createElement("div");
  div.className = "node";
  div.textContent = text;
  div.style.left = x + "px";
  div.style.top = y + "px";

  if (rm.done[id]) div.classList.add("done");

  div.onclick = () => {
    div.classList.toggle("done");
    rm.done[id] = div.classList.contains("done");
    localStorage.setItem("roadmaps", JSON.stringify(roadmaps));
  };

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

/* ---------- パース（多段化） ---------- */

function parseSteps(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const result = [];
  let current = null;

  lines.forEach(line => {
    if (!line.startsWith("-")) {
      current = { text: line, children: [] };
      result.push(current);
    } else if (current) {
      current.children.push(line.replace("-", "").trim());
    }
  });

  return result;
}

/* 初期 */
renderHome();
