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

loadData().then((data) => {
  document.getElementById("samples").textContent = data.summary.n_samples;
  document.getElementById("features").textContent = data.summary.n_features;
  document.getElementById("balance").textContent = `${data.summary.malignant}/${data.summary.benign}`;
  document.getElementById("acc-pca").textContent = formatPercent(data.summary.kmeans_acc_pca);
  document.getElementById("acc-tsne").textContent = formatPercent(data.summary.kmeans_acc_tsne);

  makeScatter("pca-chart", data.pca.x, data.pca.y, data.pca.label, "PCA: reducción lineal");
  makeScatter("tsne-chart", data.tsne.x, data.tsne.y, data.tsne.label, "t‑SNE: vecindarios locales");
});
