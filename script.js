// === Global Data ===
let participants = [];
let scores = {};
let totalScoresSubmitted = 0;

// === Navigation ===
let liveClockInterval = null;

function showSection(id) {
  // stop live clock when leaving Score Board
  if (liveClockInterval && id !== "scoreboard") {
    clearInterval(liveClockInterval);
    liveClockInterval = null;
  }

  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  if (id === "dashboard") updateDashboard();
  if (id === "metrics") updateMetrics();
  if (id === "scoreboard") {
    updateScoreboardAnonymous(); // only call the anonymous scoreboard
  }
}

// === Add Participant ===
function addParticipant() {
  const name = document.getElementById("participantName").value.trim();
  if (!name) return alert("Enter a valid name/team");
  if (participants.includes(name)) return alert("This name is already added!");
  participants.push(name);
  scores[name] = [];
  updateParticipantsUI();
  document.getElementById("participantName").value = "";
  updateMetrics();
}

// === Update Participant List & Select ===
function updateParticipantsUI() {
  const list = document.getElementById("participantsList");
  list.innerHTML = "";
  participants.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p;
    list.appendChild(li);
  });

  const select = document.getElementById("selectParticipant");
  select.innerHTML = "";
  participants.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });
  updateDashboard();
}

// === Add Scores ===
function addCriteriaScores() {
  const name = document.getElementById("selectParticipant").value;
  const perf = parseFloat(document.getElementById("perfScore").value);
  const style = parseFloat(document.getElementById("styleScore").value);
  const creativity = parseFloat(document.getElementById("creativityScore").value);

  if ([perf, style, creativity].some(isNaN))
    return alert("Enter valid numbers for all criteria (0–100).");
  if ([perf, style, creativity].some(s => s < 0 || s > 100))
    return alert("Scores must be between 0 and 100.");

  const total = perf + style + creativity;
  scores[name].push({ perf, style, creativity });
  totalScoresSubmitted++;
  logScore(name, perf, style, creativity, total);

  document.getElementById("perfScore").value = "";
  document.getElementById("styleScore").value = "";
  document.getElementById("creativityScore").value = "";

  updateDashboard();
  updateMetrics();
}

// === Log Score ===
function logScore(name, perf, style, creativity, total) {
  const logs = document.getElementById("logsList");
  const li = document.createElement("li");
  li.textContent = `${name}: Performance=${perf}, Style=${style}, Creativity=${creativity} → Total=${total}`;
  logs.appendChild(li);
}

// === Dashboard ===
function updateDashboard() {
  const tbody = document.querySelector("#scoreTable tbody");
  const winnerNameEl = document.getElementById("winnerName");
  const winnerScoreEl = document.getElementById("winnerScore");
  tbody.innerHTML = "";

  if (participants.length === 0) {
    winnerNameEl.textContent = "No participants yet";
    winnerScoreEl.textContent = "--";
    return;
  }

  const data = participants.map(name => {
    const totals = scores[name];
    const total = totals.reduce(
      (a, b) => a + b.perf + b.style + b.creativity,
      0
    );
    const avgPerf = totals.length
      ? (totals.reduce((a, b) => a + b.perf, 0) / totals.length).toFixed(2)
      : 0;
    const avgStyle = totals.length
      ? (totals.reduce((a, b) => a + b.style, 0) / totals.length).toFixed(2)
      : 0;
    const avgCreativity = totals.length
      ? (totals.reduce((a, b) => a + b.creativity, 0) / totals.length).toFixed(2)
      : 0;
    return { name, total, avgPerf, avgStyle, avgCreativity };
  });

  data.sort((a, b) => b.total - a.total);

  data.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="py-2 px-4">${row.name}</td>
      <td class="py-2 px-4">${row.avgPerf}</td>
      <td class="py-2 px-4">${row.avgStyle}</td>
      <td class="py-2 px-4">${row.avgCreativity}</td>
      <td class="py-2 px-4 font-semibold">${idx + 1}</td>
    `;
    tbody.appendChild(tr);
  });

  if (data[0].total > 0) {
    winnerNameEl.textContent = `🏆 ${data[0].name}`;
    winnerScoreEl.textContent = `Total: ${data[0].total}`;
  } else {
    winnerNameEl.textContent = "No scores yet";
    winnerScoreEl.textContent = "--";
  }
}

// === Live Date/Time ===
function startLiveClock() {
  const el = document.getElementById("liveDateTime");
  if (!el || liveClockInterval) return;

  liveClockInterval = setInterval(() => {
    const now = new Date();
    el.textContent = now.toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  }, 1000);
}

// === Anonymous Scoreboard ===
function updateScoreboardAnonymous() {
  const container = document.getElementById("scoreboardContainer");
  container.innerHTML = "";

  const totalAll = participants.reduce(
    (sum, n) =>
      sum +
      scores[n].reduce(
        (a, b) => a + b.perf + b.style + b.creativity,
        0
      ),
    0
  );

  const dateEl = document.getElementById("liveDateTime");
  if (totalAll > 0) {
    dateEl.classList.remove("hidden");
    startLiveClock();
  } else {
    dateEl.classList.add("hidden");
  }

  if (totalAll === 0) {
    container.innerHTML =
      '<p class="text-center text-gray-400 col-span-full py-12">No scores submitted yet.</p>';
    return;
  }

  const scoreData = participants
    .map(n => {
      const total = scores[n].reduce(
        (a, b) => a + b.perf + b.style + b.creativity,
        0
      );
      return {
        name: n,
        total,
        percent: ((total / totalAll) * 100).toFixed(2)
      };
    })
    .sort((a, b) => b.total - a.total);

  scoreData.forEach(p => {
    const card = document.createElement("div");
    card.className = "anon-card";
    card.innerHTML = `
      <img src="Anonymous photo.jpg" alt="Anonymous" class="anon-avatar-img" />
      <div class="anon-name">${p.name.charAt(0).toUpperCase()}</div>
      <div class="anon-percent">${p.percent}%</div>`;
    container.appendChild(card);
  });
}

// === Metrics ===
function updateMetrics() {
  document.getElementById("metricParticipants").textContent = participants.length;
  document.getElementById("metricScores").textContent = totalScoresSubmitted;

  let allTotals = [];
  for (let p in scores) {
    scores[p].forEach(s => {
      allTotals.push(s.perf + s.style + s.creativity);
    });
  }

  if (allTotals.length) {
    const highest = Math.max(...allTotals);
    const lowest = Math.min(...allTotals);
    const avg = (allTotals.reduce((a, b) => a + b, 0) / allTotals.length).toFixed(2);

    document.getElementById("metricHighest").textContent = highest;
    document.getElementById("metricLowest").textContent = lowest;
    document.getElementById("metricAverage").textContent = avg;
  } else {
    document.getElementById("metricHighest").textContent = "--";
    document.getElementById("metricLowest").textContent = "--";
    document.getElementById("metricAverage").textContent = "--";
  }
}

// === Default View ===
showSection("dashboard");

// === Enter Key for Participant ===
document.getElementById("participantName").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    addParticipant();
  }
});



