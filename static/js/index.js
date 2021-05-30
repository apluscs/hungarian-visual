var n, m, N, wts, edges = []; // given data
var r, graph_dims, page_dims, circle_gap, circles = [];  // related to display
var states, state_i, S, in_interstitial;  // calculated by backend

// circle_gap = gap between consecutive circles
const MARGIN = 5, CIRCLE_GAP_TO_R = 0.8, SVG_NS = "http://www.w3.org/2000/svg";
const FOUND_AP = 2, IMP_LAB = 3;
const EXPL_HTML = ["Current value of the matching: %value",
  "The Hungarian Algorithm finished! The final matching had value %value. You can check this by summing the weights along the solid edges.",
  "We found an augmenting path from the blue node <i class=\"bi bi-circle-fill\" style=\"color: #7D8CC4;\"></i> to the red node <i class=\"bi bi-circle-fill\" style=\"color: #ED6A5E;\"></i>. An <i> augmenting</i > path alternates between edges not in the matching and edges in the matching, with just one not in the matching than in. When we \"flip\" edges along the path, we will end up with one more edge in the matching than before the flip.",
  "S = the nodes visited on the left and T = the nodes visited on the right while searching for the augmenting path. <br> There was no augmenting path to be found, so we must improve the labeling to bring more edges into the equality graph <i class=\"bi bi-info-circle\" id=\"eq-graph-icon\" data-toggle: \"popover\"></i>. <br>  We subtract %delta from the labels in S and add %delta from the labels in T <i class=\"bi bi-info-circle\" id=\"delta-icon\" data-toggle: \"popover\"></i>. See the new labels in the diagram."];

function create_circle(cx, cy, i) {
  let circle = document.createElementNS(SVG_NS, 'circle');
  setAttributes(circle, { "id": i, "cx": cx, "cy": cy, "r": r, "stroke": "#5e1647", "stroke-width": 0.1 * r, "fill": "#934474" });
  return circles[i] = circle;
}

// http://thenewcode.com/1068/Making-Arrows-in-SVG
//  "marker-start": "url(#startarrow)", "marker-end": "url(#endarrow)"
function create_line(i, j) {
  var cl1 = circles[i], cl2 = circles[j];
  // console.log(cl1, cl2);
  let line = document.createElementNS(SVG_NS, 'path');
  setAttributes(line, { "d": `M ${cl1.getAttribute("cx")} ${cl1.getAttribute("cy")} L ${cl2.getAttribute("cx")} ${cl2.getAttribute("cy")}`, "r": r, "stroke": "grey", "stroke-width": 0.1 * r, "stroke": "#29001f", "stroke-dasharray": "10 5", "class": "dashed-edge", "data-toggle": "popover" });
  return edges[i][j] = edges[j][i] = line;
}

function create_edge_label(i, j, wt) {
  let text = document.createElementNS(SVG_NS, 'text'), x1 = Number(circles[i].getAttribute("cx")), y1 = Number(circles[i].getAttribute("cy")), x2 = Number(circles[j].getAttribute("cx")), y2 = Number(circles[j].getAttribute("cy"));
  let dy = y2 - y1, dx = x2 - x1, a = Math.atan(dy / dx) * 180 / Math.PI;;
  let fs = r / Math.max(n, m), x = x1 + r * 1.1, y = y1 + r * 1.1 * dy / dx - fs / 2;
  // console.log(x, y, x1, y1);
  setAttributes(text, { "x": x, "y": y, "font-size": fs, "transform": `rotate(${a}, ${x}, ${y})`, "fill": "#A06454", "class": "edge-label", "data-toggle": "popover" });
  text.innerHTML = wt;
  return text;
}

function create_label(i, lab, shift_left) {
  let text = document.createElementNS(SVG_NS, 'text'), x = Number(circles[i].getAttribute("cx")), y = Number(circles[i].getAttribute("cy")), fs = r / String(lab).length;
  if (shift_left) x -= r / 2;
  setAttributes(text, { "x": x, "y": y, "font-size": fs, "fill": "#e7d3cc", "class": "node-label", "data-toggle": "popover" });
  text.innerHTML = lab;
  return text;
}

function render_graph(st) { // same thing as rendering  default state
  // console.log(st);
  page_dims = [window.innerHeight, window.innerWidth], graph = document.getElementById("graph"), graph_dims = [graph.offsetHeight, graph.offsetWidth];
  r = Math.max(20, Math.min(page_dims[0] / (Math.max(n, m) + CIRCLE_GAP_TO_R) / 4, 900000));
  circle_gap = r * CIRCLE_GAP_TO_R;
  graph.style.height = page_dims[1];
  for (i = 1; i <= n; i++) {
    graph.appendChild(create_circle(MARGIN + r, MARGIN + (2 * r + circle_gap) * i, i));
    graph.appendChild(create_label(i, st.labels[i], true));
  }
  for (i = 1; i <= m; ++i) {
    graph.appendChild(create_circle(MARGIN + r * 6, MARGIN + (2 * r + circle_gap) * i, n + i));
    graph.appendChild(create_label(i + n, st.labels[i + n], false));
  }
  for (i = 1; i <= n; i++) {
    for (j = 1; j <= m; ++j) {
      graph.appendChild(create_line(i, j + n));
      graph.appendChild(create_edge_label(i, j + n, wts[i][j + n]));
    }
  }
  to_start();
  $('.node-label').popover({  // all these popovers need to be added only once, never adjusted
    title: "Label",
    trigger: "hover",
    content: "The labeling for this node. At all times and for all edges (i, j), label[i] + label[j] &ge; weight[i][j].",
    html: true
  });
  $('.edge-label').popover({
    title: "Weight",
    trigger: "hover",
    content: "This is the weight of this edge.",
    html: true
  });
  $('#state-slider').popover({
    title: "State Slider",
    trigger: "hover",
    content: "Slide this to progress through the algorithm.",
    html: true
  });
}

function submit_input() {
  input = document.getElementById('input-area').value;
  fetch('/hungarian', {
    method: 'POST',
    body: input
  }).then(response => response.json()).then(data => {
    if (data.bad) {
      alert("Check that your input follows the structure. Click the information icon next to input for more information.");
      return;
    }
    var algo_div = document.getElementById('algo-div');
    document.getElementById("graph").innerHTML = "", algo_div.removeAttribute("hidden");
    n = data.n, m = data.m, wts = data.wts, N = n + m, states = data.states, S = states.length;
    // console.log(states);
    algo_div.scrollIntoView(true);
    resize(circles, N + 1, null), resize2D(edges, N + 1, N + 1, null), render_graph(states[0]);
  });
  setTimeout(function () {
    // console.log(document.getElementById("graph").getClientRects()[0].width);
    document.documentElement.style.setProperty("--graph_width", document.getElementById("graph").getClientRects()[0].width + "px");
  }, 500);

}

function calc_value(partner) {
  var value = 0;
  for (i = 1; i <= n; ++i) {
    value += wts[i][partner[i]];
  }
  return value;
}

function display_finish() {
  render_interstitial(states[S - 1]);
  var explanations = document.getElementById("explanations"), partner = states[S - 1].matching;
  // console.log(wts);
  var res = EXPL_HTML[1].replace("%value", calc_value(partner));
  explanations.innerHTML = res;
}

function create_animated_path(path_d, P) {
  let path = document.createElementNS(SVG_NS, 'path');
  setAttributes(path, {
    "id": "animated-path", "marker-end": "url(#endarrow)", "stroke": "white", "stroke-width": 0.1 * r
  });
  let animate = document.createElementNS(SVG_NS, 'animate'), dur = P;
  setAttributes(animate, {
    "dur": dur, "repeatCount": "indefinite", "attributeName": "d", "values": path_d
  });
  path.appendChild(animate);
  return path;
}

function render_path(st) {
  var st_path = st.path, P = st_path.length, path_d = "";
  for (i = 0; i < P - 1; i++) {  // connect node path[i] to path[i+1]
    var u = st_path[i], v = st_path[i + 1], cu = circles[u], cv = circles[v], d = edges[Math.min(u, v)][Math.max(u, v)].getAttribute("d").split(" "), start = d[1] + " " + d[2], end = d[4] + " " + d[5];
    if (u > v)  // go from d's first --> d's second
      start = [end, end = start][0];  // swap em
    path_d += "M" + start + " L" + start + "; M" + start + " L" + end + ";";
    if (i == P - 2)
      path_d += "M" + end + " L" + end + ";";
  }
  var cl_start = circles[st_path[0]], cl_end = circles[st_path[1]];
  setAttributes(cl_start, { "fill": "#7D8CC4" }), setAttributes(cl_end, { "fill": "#ED6A5E" });
  graph = document.getElementById("graph");
  graph.appendChild(create_animated_path(path_d, P));

}

function render_new_labels(st) {

}

function clear_other_states() {
  graph = document.getElementById("graph"), animated_path = document.getElementById("animated-path");
  if (document.body.contains(animated_path))
    graph.removeChild(animated_path);
  for (i = 1; i < circles.length; ++i) {
    setAttributes(circles[i], { "fill": "#934474" });
  }
  var partner;
  if (in_interstitial) partner = states[state_i].matching;
  else partner = states[state_i - 1].matching;
  for (i = 1; i <= n; ++i) {
    for (j = n + 1; j <= N; ++j) {
      var e = edges[i][j];
      setAttributes(e, { "stroke-dasharray": "10 5", "class": "dashed-edge", "data-toggle": "popover" });
      if (j == partner[i])
        setAttributes(e, { "stroke-dasharray": 0, "class": "solid-edge", "data-toggle": "popover" });
    }
  }
}

function render_interstitial(st) {
  var partner = st.matching, lab = st.labels;
  explanations.innerHTML = EXPL_HTML[0].replace("%value", calc_value(partner));
  // set correct labels
  // update matching colors (edges)
}

function render_step(st) {
  var st = states[state_i], t = st.type, explanations = document.getElementById("explanations"), expl = EXPL_HTML[t];
  switch (t) {
    case FOUND_AP:
      render_path(st);
    case IMP_LAB:
      expl = expl.replace("%delta", st.d).replace("%delta", st.d);
      render_new_labels(st);
  }
  explanations.innerHTML = expl;
}

function render_state() { // based on state_i and in_interstitial
  clear_other_states();
  if (state_i == S) {
    display_finish();
    return;
  }
  console.log(state_i, in_interstitial)
  if (in_interstitial) {
    render_interstitial(states[state_i]);
  } else {
    render_step(states[state_i]);
  }
  correct_popovers();
}

function next() { // advance next state
  if (state_i == S) {
    display_finish();
    return;
  }
  if (in_interstitial) ++state_i;
  in_interstitial = !in_interstitial;
  render_state();
}
// 0 is, 1, 1 is, 2, 2 is, 3, 3 is, 4, 4 is ... S
function prev() {
  if (state_i == 0) {
    render_interstitial(states[state_i]);
    return; // show this state and then leave
  }
  if (!in_interstitial) --state_i;
  in_interstitial = !in_interstitial;
  render_state();
}

function to_start() {
  state_i = 0, in_interstitial = true;
  render_state();
}

function to_end() {
  state_i = S, in_interstitial = false;
  render_state();
}

function correct_popovers() {
  $('.dashed-edge').popover('dispose');
  $('.dashed-edge').popover({
    title: "Dashed Line",
    trigger: "hover",
    content: "Indicates this edge is <strong>not</strong> in the matching.",
    html: true
  });
  $('.solid-edge').popover('dispose');
  $('.solid-edge').popover({
    title: "Solid Line",
    trigger: "hover",
    content: "Indicates this edge <strong>is</strong> in the matching.",
    html: true
  });
  $('#delta-icon').popover({
    title: "How Did We Get This Number?",
    trigger: "hover",
    content: "delta = min(label[i] + label[j] − weight[i][j] for all i in S and j in the right graph but not in T. <br> You can think of it as the minimum \"slack\" of this subset of edges.",
    html: true
  });
  $('#eq-graph-icon').popover({
    title: "Equality Graph",
    trigger: "hover",
    content: "The equality graph is the subset of edges E' and its set of incident edges. For every edge (i, j) in E', label[i] + label[j] = weight[i][j]. It is the edges that are \"tight\".",
    html: true
  })
}

function handle_slider() {
  i = Math.floor($('#state-slider').prop("value") / 100 * (S * 2 - 1));
  in_interstitial = 1 - i % 2, state_i = Math.floor(i / 2) + i % 2;
  // console.log(i, in_interstitial, state_i)
  render_state();
}