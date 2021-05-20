var n, m, N, wts, r, graph_dims, page_dims, circle_gap, circles = [], edges = [];
// circle_gap = gap between consecutive circles
const MARGIN = 5, CIRCLE_GAP_TO_R = 0.8, SVG_NS = "http://www.w3.org/2000/svg";

function create_circle(cx, cy, i) {
  let circle = document.createElementNS(SVG_NS, 'circle');
  setAttributes(circle, { "id": i, "cx": cx, "cy": cy, "r": r, "stroke": "green", "stroke-width": 0.1 * r, "fill": "yellow" });
  return circles[i] = circle;
}

// http://thenewcode.com/1068/Making-Arrows-in-SVG
function create_line(i, j) {
  var cl1 = circles[i], cl2 = circles[j];
  // console.log(cl1, cl2);
  let line = document.createElementNS(SVG_NS, 'line');
  setAttributes(line, { "x1": cl1.getAttribute("cx"), "y1": cl1.getAttribute("cy"), "x2": cl2.getAttribute("cx"), "y2": cl2.getAttribute("cy"), "r": r, "stroke": "grey", "stroke-width": 0.1 * r });
  return edges[i][j] = edges[j][i] = line;
}

function create_edge_label(i, j, wt) {
  let text = document.createElementNS(SVG_NS, 'text'), x1 = Number(circles[i].getAttribute("cx")), y1 = Number(circles[i].getAttribute("cy")), x2 = Number(circles[j].getAttribute("cx")), y2 = Number(circles[j].getAttribute("cy"));
  let dy = y2 - y1, dx = x2 - x1, a = Math.atan(dy / dx) * 180 / Math.PI;;
  let x = x1 + r, y = y1 + r * dy / dx;
  console.log(x, y, x1, y1);
  setAttributes(text, { "x": x, "y": y, "class": "small", "transform": `rotate(${a}, ${x}, ${y})`, "fill": "red" });
  text.innerHTML = wt;
  return text;
}

function create_label(i, lab) {
  let text = document.createElementNS(SVG_NS, 'text'), x = Number(circles[i].getAttribute("cx")), y = Number(circles[i].getAttribute("cy")), fs = r * 2 / String(lab).length;
  setAttributes(text, { "x": x, "y": y, "font-size": fs });
  text.innerHTML = lab;
  return text;
}

function render_graph() {
  console.log(circles, wts);
  page_dims = [window.innerHeight, window.innerWidth], graph = document.getElementById("graph"), graph_dims = [graph.offsetHeight, graph.offsetWidth];
  r = Math.max(20, Math.min(page_dims[1] / (Math.max(n, m) + CIRCLE_GAP_TO_R) / 4, 40));
  circle_gap = r * CIRCLE_GAP_TO_R;
  graph.style.height = page_dims[1];
  for (i = 1; i <= n; i++) {
    graph.appendChild(create_circle(MARGIN + r, MARGIN + (2 * r + circle_gap) * i, i));
    graph.appendChild(create_label(i, lab[i]));
  }
  for (i = 1; i <= m; ++i) {
    graph.appendChild(create_circle(MARGIN + r * 6, MARGIN + (2 * r + circle_gap) * i, n + i));
    graph.appendChild(create_label(i + n, lab[i + n]));
  }
  console.log(circles)
  for (i = 1; i <= n; i++) {
    for (j = 1; j <= m; ++j) {
      graph.appendChild(create_line(i, j + n));
      graph.appendChild(create_edge_label(i, j + n, wts[i - 1][j + n - 1]));
    }
  }
}

function submit_input() {
  input = document.getElementById('input-area').value;
  fetch('/hungarian', {
    method: 'POST',
    body: input
  }).then(response => response.json()).then(data => {
    n = data.n, m = data.m, wts = data.wts, N = n + m, states = data.states;
    console.log(states);
    // resize(circles, N + 1, null), resize2D(edges, N + 1, N + 1, null), render_graph();
  });
}