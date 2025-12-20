const tree = document.getElementById("tree");
const btn = document.getElementById("generateBtn");

btn.addEventListener("click", generate);

function generate() {
  tree.innerHTML = "";

  const goal = document.getElementById("goalInput").value;
  const steps = document.getElementById("stepsInput").value
    .split("\n")
    .filter(s => s.trim() !== "");

  // SVG作成
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "700");
  svg.setAttribute("height", "300");
  tree.appendChild(svg);

  // ルート
  const root = createNode(goal || "最終目標", 300, 20);
  tree.appendChild(root);

  const spacing = 600 / (steps.length + 1);

  steps.forEach((text, i) => {
    const x = spacing * (i + 1);
    const y = 140;

    const node = createNode(text, x, y);
    tree.appendChild(node);

    const line = createLine(350, 60, x + 40, y);
    svg.appendChild(line);

    node.addEventListener("click", () => {
      node.classList.toggle("done");
      line.classList.toggle("done");
    });
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
