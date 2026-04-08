(() => {
  const board = document.querySelector("[data-dynamic-leaderboard]");
  if (!board) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReducedMotion.matches) {
    return;
  }

  const rowsWrap = board.querySelector(".lb-rows");
  const statusEl = board.querySelector("[data-lb-status]");
  const eventEl = board.querySelector("[data-lb-event]");
  const footerEl = board.querySelector("[data-lb-footer]");
  const rankEl = board.querySelector("[data-lb-rank]");

  if (!rowsWrap || !statusEl || !eventEl || !footerEl || !rankEl) {
    return;
  }

  const players = Array.from(rowsWrap.querySelectorAll(".lb-row")).map((row) => ({
    id: row.dataset.playerId,
    row,
    score: Number.parseInt(row.dataset.score || "0", 10),
    history: (row.dataset.history || "")
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value)),
  }));

  if (players.length === 0) {
    return;
  }

  const scenarios = [
    {
      status: "Quickfire bonus",
      event: "38' You hit the live call and the board starts to wobble.",
      deltas: { you: 46, nico: 12, alex: 8, mara: -18, zane: 5 },
    },
    {
      status: "Pack reshuffle",
      event: "44' A missed card prediction rattles the leaders and opens the lane.",
      deltas: { you: 14, nico: -24, alex: 31, mara: 22, zane: -8 },
    },
    {
      status: "Chaos active",
      event: "61' Chaos doubles the swing for a heartbeat and places start flipping.",
      deltas: { you: 52, nico: 9, alex: -21, mara: 26, zane: 18 },
    },
    {
      status: "Pressure rising",
      event: "74' NorthStandNico slips. You are breathing on the top spot.",
      deltas: { you: 18, nico: -34, alex: 16, mara: 7, zane: 29 },
    },
    {
      status: "Late surge",
      event: "83' Ultra_Mara catches fire and the podium suddenly looks shaky.",
      deltas: { you: -11, nico: 20, alex: -17, mara: 48, zane: 14 },
    },
    {
      status: "Final push",
      event: "89' Last prediction locked. You land the finish kick.",
      deltas: { you: 37, nico: 11, alex: 5, mara: -19, zane: -23 },
    },
  ];

  const formatScore = (score) => score.toLocaleString("en-GB");

  const getFormState = (history) => {
    const recent = history.slice(-3);
    const total = recent.reduce((sum, value) => sum + value, 0);

    if (total >= 70) {
      return { arrow: "🔥", label: "Red hot", className: "lb-form--up" };
    }

    if (total >= 25) {
      return { arrow: "🚀", label: "Charging", className: "lb-form--up" };
    }

    if (total <= -40) {
      return { arrow: "💀", label: "Spiralling", className: "lb-form--down" };
    }

    if (total < 0) {
      return { arrow: "🥶", label: "Under pressure", className: "lb-form--down" };
    }

    return { arrow: "🎯", label: "Steady", className: "lb-form--even" };
  };

  const updateRow = (player, rank, movement, delta) => {
    const rankElForRow = player.row.querySelector(".lb-rank");
    const scoreEl = player.row.querySelector(".lb-score");
    const deltaEl = player.row.querySelector(".lb-delta");
    const formEl = player.row.querySelector(".lb-form");
    const formArrowEl = player.row.querySelector(".lb-form__arrow");
    const formLabelEl = player.row.querySelector(".lb-form__label");

    if (!rankElForRow || !scoreEl || !deltaEl || !formEl || !formArrowEl || !formLabelEl) {
      return;
    }

    const form = getFormState(player.history);

    rankElForRow.textContent = String(rank);
    scoreEl.textContent = formatScore(player.score);
    deltaEl.textContent = `${delta >= 0 ? "+" : ""}${delta}`;
    deltaEl.classList.toggle("lb-delta--up", delta >= 0);
    deltaEl.classList.toggle("lb-delta--down", delta < 0);

    formEl.classList.remove("lb-form--up", "lb-form--down", "lb-form--even");
    formEl.classList.add(form.className);
    formArrowEl.textContent = form.arrow;
    formLabelEl.textContent = form.label;

    player.row.classList.toggle("lb-row--up", movement > 0);
    player.row.classList.toggle("lb-row--down", movement < 0);
    player.row.classList.toggle("lb-row--surged", delta >= 30);
    player.row.classList.toggle("lb-row--hit", delta <= -20);
  };

  const animateReorder = () => {
    const firstPositions = new Map(
      players.map((player) => [player.id, player.row.getBoundingClientRect().top])
    );

    players.forEach((player) => {
      rowsWrap.appendChild(player.row);
    });

    players.forEach((player) => {
      const firstTop = firstPositions.get(player.id);
      const lastTop = player.row.getBoundingClientRect().top;
      const deltaY = firstTop - lastTop;

      player.row.style.transition = "none";
      player.row.style.transform = deltaY ? `translateY(${deltaY}px)` : "";
    });

    rowsWrap.offsetHeight;

    players.forEach((player) => {
      player.row.style.transition = "transform 720ms cubic-bezier(0.2, 0.9, 0.2, 1)";
      player.row.style.transform = "";
    });
  };

  const updateFooter = () => {
    const you = players.find((player) => player.id === "you");
    if (!you) {
      return;
    }

    const yourRank = players.findIndex((player) => player.id === "you") + 1;
    const leader = players[0];

    rankEl.textContent = `Your rank: ${yourRank}`;

    if (yourRank === 1) {
      const cushion = Math.max(leader.score - players[1].score, 0);
      footerEl.textContent = `You are Match MVP right now. Hold the ${formatScore(cushion)}-pt gap.`;
      return;
    }

    const gap = Math.max(leader.score - you.score, 0);
    footerEl.textContent = `${formatScore(gap)} pts off Match MVP. One swing changes everything.`;
  };

  let stepIndex = 0;
  let timerId = null;

  const runScenario = () => {
    const scenario = scenarios[stepIndex % scenarios.length];
    const previousRanks = new Map(players.map((player, index) => [player.id, index + 1]));

    players.forEach((player) => {
      const delta = scenario.deltas[player.id] || 0;
      player.score += delta;
      player.history.push(delta);
      player.history = player.history.slice(-4);
    });

    players.sort((left, right) => right.score - left.score);

    players.forEach((player, index) => {
      const currentRank = index + 1;
      const movement = previousRanks.get(player.id) - currentRank;
      const delta = scenario.deltas[player.id] || 0;
      updateRow(player, currentRank, movement, delta);
    });

    animateReorder();
    updateFooter();

    statusEl.textContent = scenario.status;
    eventEl.textContent = scenario.event;

    board.classList.remove("leaderboard-mock--flash");
    board.offsetHeight;
    board.classList.add("leaderboard-mock--flash");

    stepIndex += 1;
  };

  const start = () => {
    if (timerId !== null) {
      return;
    }

    runScenario();
    timerId = window.setInterval(runScenario, 2200);
  };

  const stop = () => {
    if (timerId === null) {
      return;
    }

    window.clearInterval(timerId);
    timerId = null;
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !document.hidden) {
        start();
      } else {
        stop();
      }
    },
    { threshold: 0.35 }
  );

  observer.observe(board);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
      return;
    }

    const rect = board.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      start();
    }
  });
})();
