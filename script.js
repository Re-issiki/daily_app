const nodes = document.querySelectorAll(".node");

nodes.forEach(node => {
  node.addEventListener("click", () => {
    node.classList.toggle("done");
    updateLines();
  });
});

function updateLines() {
  checkLine("step1", "line1");
  checkLine("step2", "line2");
  checkLine("step3", "line3");
}

function checkLine(stepId, lineId) {
  const step = document.getElementById(stepId);
  const line = document.getElementById(lineId);

  if (step.classList.contains("done")) {
    line.classList.add("done");
  } else {
    line.classList.remove("done");
  }
}
