from flask import Flask, render_template, request, jsonify
import math, State

# If `entrypoint` is not defined in app.yaml, App Engine will look for an app
# called `app` in `main.py`.
app = Flask(__name__)


@app.route('/')
def home():
  return render_template("index.html")

def calc_states(n, m, wts):  # fills in states
  print(wts)
  # M = matching size
  lab, N, M, levs, states = [0 for i in range(n + m)], n + m, 0, [], []
  partner = [-1 for i in range(N)]
  for i in range(n):
    lab[i] = max(wts[i])
  print("lab= {}".format(lab))

  def backtrack(src, tar, par):
    print("src={}, tar={}, par={}".format(src, tar, par))
    res = []
    while True:
      res.append(tar)
      if tar == src:
        break
      tar = par[tar]
    return res

  def search(src):
    # print("lab= {}".format(lab))
    nonlocal levs, N
    par, tar = [-1 for i in range(N)], -1
    levs = [[src]]
    par[src] = src  # to mark vis
    while True:
      lev = []
      for i in levs[-1]:
        for j in range(n, N):
          if wts[i][j] == lab[i] + lab[j] and par[j] == -1:
            par[j] = i
            lev.append(j)
            if partner[j] == -1:  # unmatched in set 2
              tar = j
              break
        if tar != -1:
          path = backtrack(src, tar, par)
          return path
        if len(lev) == 0:
          return []  # can't search anymore
        levs.append(lev)
        lev = []
        for i in levs[-1]:
          if partner[i] != -1:
            lev.append(partner[i])
            par[partner[i]] = i
        levs.append(lev)
    return []

  def augment(path):
    print(path)
    nonlocal partner, M
    for i in range(0, len(path), 2):
      u, v = path[i], path[i + 1]
      partner[u] = v
      partner[v] = u
    M += 2

  def augment_matching():
    for i in range(n):  # unmatched in V
      if partner[i] != -1:
        continue
      path = search(i)
      if len(path) == 0:
        continue
      augment(path)
      path.reverse()
      states.append(State.AP_State(State.TYPE.FOUND_AP, lab, partner, path).serialize())
      return True
    return False

  def update_labels():  # use levs
    S, T, d = [], [False for i in range(N)], math.inf
    for i in range(len(levs)):
      if i % 2:
        for j in levs[i]:
          T[j] = True
      else:
        S += levs[i]
    # print("levs= {}, S={}, T={}".format(levs, S, T))
    for i in S:
      for j in range(n, N):
        if not T[j]:  # j not in T
          d = min(d, lab[i] + lab[j] - wts[i][j])
    for i in S:
      lab[i] -= d
    for i in range(n, N):
      if T[i]:
        lab[i] += d
    return d

  states.append(State.Def_State(State.TYPE.DEFAULT, lab, partner).serialize())
  while M < min(n, m) * 2:
    if not augment_matching():
      old_labels, d = lab[:], update_labels()
      states.append(State.Imp_Lab_State(State.TYPE.IMP_LAB, old_labels, partner, lab, d).serialize())
  # print("partner= {}".format(partner))
  res = sum(wts[i][partner[i]] for i in range(n))
  # print("res= {}".format(res))
  return states


@app.route('/hungarian', methods=['GET', 'POST'])
def hungarian():
  BAD_JSON, input = jsonify(bad= True), request.data.split()
  if len(input) < 2 or any(not i.isdigit() for i in input):
    return BAD_JSON
  input = [int(i.decode('utf-8')) for i in input]
  n, m = input[0], input[1]
  if len(input) != n*m + 2:
    return BAD_JSON
  wts = [[0 for j in range(n + m)] for i in range(m + n)]
  for i in range(n):
    for j in range(m):
      wts[i][j + n] = wts[j + n][i] = input[i * m + j + 2]
  states = calc_states(n, m, wts)
  print("done")
  print(states)
  return jsonify(n=n, m=m, wts= [0]+ [[0] + wt for wt in wts], states = states, bad=False)


if __name__ == '__main__':
  # This is used when running locally only. When deploying to Google App
  # Engine, a webserver process such as Gunicorn will serve the app. This
  # can be configured by adding an `entrypoint` to app.yaml.
  app.run(host='127.0.0.1', port=8080, debug=True)
  # states = calc_states(3, 3,
  #             [[0, 0, 0, 7, 3, 4], [0, 0, 0, 8, 8, 2], [0, 0, 0, 7, 3, 1],
  #              [7, 8, 7, 0, 0, 0], [3, 8, 3, 0, 0, 0], [4, 2, 1, 0, 0, 0]])
  # for st in states:
  #   print(st.serialize())
  #   st.print()