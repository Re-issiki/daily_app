let chart;

const statusData = {
  body: {
    title: "身体能力",
    labels: ["筋力", "持久力", "柔軟性", "瞬発力", "回復力"],
    hours: [30, 40, 15, 20, 25]
  },
  math: {
    title: "数学",
    labels: ["計算力", "発想力", "理解力", "問題解決", "スピード"],
    hours: [50, 35, 40, 30, 45]
  }
};

function calcStatus(hours) {
  return hours.map(h => Math.min(100, Math.log(h + 1) * 20));
}

function openStatus(key) {
  document.getElementById("home").classList.add("hidden");
  document.getElementById("status").classList.remove("hidden");

  const data = statusData[key];
  document.getElementById("statusTitle").textContent = data.title;

  const values = calcStatus(data.hours);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("radarChart"), {
    type: "radar",
    data: {
      labels: data.labels,
      datasets: [{
        label: "ステータス",
        data: values,
        fill: true
      }]
    },
    options: {
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false }
        }
      }
    }
  });
}

function backHome() {
  document.getElementById("status").classList.add("hidden");
  document.getElementById("home").classList.remove("hidden");
}
