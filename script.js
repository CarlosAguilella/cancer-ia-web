async function loadData() {
  const res = await fetch("data.json");
  return res.json();
}

function formatPercent(x) {
  return `${(x * 100).toFixed(1)}%`;
}

function makeScatter(el, x, y, label, title) {
  const benign = { x: [], y: [] };
  const malignant = { x: [], y: [] };

  for (let i = 0; i < x.length; i++) {
    if (label[i] === 1) {
      malignant.x.push(x[i]);
      malignant.y.push(y[i]);
    } else {
      benign.x.push(x[i]);
      benign.y.push(y[i]);
    }
  }

  const data = [
    {
      x: benign.x,
      y: benign.y,
      mode: "markers",
      name: "Benigno (B)",
      marker: { color: "#0f7aa5", size: 6, opacity: 0.7 }
    },
    {
      x: malignant.x,
      y: malignant.y,
      mode: "markers",
      name: "Maligno (M)",
      marker: { color: "#ff6b3d", size: 6, opacity: 0.7 }
    }
  ];

  const layout = {
    title: { text: title, font: { size: 14 } },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 35, r: 15, t: 35, b: 30 },
    legend: { orientation: "h", y: -0.2 },
    xaxis: { title: "Componente 1", gridcolor: "#eee" },
    yaxis: { title: "Componente 2", gridcolor: "#eee" }
  };

  Plotly.newPlot(el, data, layout, { displayModeBar: false, responsive: true });
}

function makeHeatmap(el, features, matrix) {
  const data = [
    {
      z: matrix,
      x: features,
      y: features,
      type: "heatmap",
      colorscale: "RdBu",
      zmid: 0,
      showscale: true
    }
  ];

  const layout = {
    title: { text: "Correlación entre variables (top 10)", font: { size: 14 } },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 80, r: 20, t: 35, b: 80 }
  };

  Plotly.newPlot(el, data, layout, { displayModeBar: false, responsive: true });
}

function drawScatter(canvas, x, y, label) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);

  const pad = 24;
  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const yMin = Math.min(...y);
  const yMax = Math.max(...y);

  const scaleX = (v) => pad + ((v - xMin) / (xMax - xMin)) * (w - pad * 2);
  const scaleY = (v) => h - pad - ((v - yMin) / (yMax - yMin)) * (h - pad * 2);

  for (let i = 0; i < x.length; i++) {
    ctx.beginPath();
    ctx.fillStyle = label[i] === 1 ? "rgba(255,107,61,0.65)" : "rgba(15,122,165,0.65)";
    ctx.arc(scaleX(x[i]), scaleY(y[i]), 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderCases(cases) {
  const wrap = document.getElementById("cases");
  wrap.innerHTML = "";
  cases.forEach((c) => {
    const badgeClass = c.label === "Maligno" ? "m" : "b";
    const items = Object.entries(c.values)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => `<li><strong>${k}</strong>: ${v.toFixed(2)}</li>`)
      .join("");

    const el = document.createElement("div");
    el.className = "case-card";
    el.innerHTML = `
      <div class="case-title">
        Caso #${c.id}
        <span class="case-badge ${badgeClass}">${c.label}</span>
      </div>
      <ul class="case-list">${items}</ul>
    `;
    wrap.appendChild(el);
  });
}

loadData().then((data) => {
  document.getElementById("samples").textContent = data.summary.n_samples;
  document.getElementById("features").textContent = data.summary.n_features;
  document.getElementById("balance").textContent = `${data.summary.malignant}/${data.summary.benign}`;
  document.getElementById("acc-pca").textContent = formatPercent(data.summary.kmeans_acc_pca);
  document.getElementById("acc-tsne").textContent = formatPercent(data.summary.kmeans_acc_tsne);

  makeScatter("pca-chart", data.pca.x, data.pca.y, data.pca.label, "PCA: reducción lineal");
  makeScatter("tsne-chart", data.tsne.x, data.tsne.y, data.tsne.label, "t‑SNE: vecindarios locales");

  makeHeatmap("heatmap", data.heatmap.features, data.heatmap.matrix);

  // Before/after scatter
  const rawCanvas = document.getElementById("raw-canvas");
  const normCanvas = document.getElementById("norm-canvas");
  drawScatter(rawCanvas, data.before_after.raw.x, data.before_after.raw.y, data.before_after.raw.label);
  drawScatter(normCanvas, data.before_after.normalized.x, data.before_after.normalized.y, data.before_after.normalized.label);

  const slider = document.getElementById("slider");
  const overlay = document.getElementById("overlay");
  const caption = document.getElementById("slider-caption");
  caption.textContent = `${data.before_after.feature_x} vs ${data.before_after.feature_y}`;

  const setOverlay = (val) => {
    overlay.style.width = `${val}%`;
  };
  setOverlay(slider.value);
  slider.addEventListener("input", (e) => setOverlay(e.target.value));

  renderCases(data.cases);
});
