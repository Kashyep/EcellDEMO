// Landing page: venture-curve hero, team list, footer clock, header state.
(function () {
  const STAGES = [
    { at: 0.04, title: "Ideathons", text: "Bring a problem you care about. An ideathon turns a hunch into a one-line thesis in a single evening." },
    { at: 0.3, title: "Talk to users", text: "Workshops on market research and customer interviews, so you build something people actually need." },
    { at: 0.55, title: "Hackathons", text: "Ship a working prototype in a weekend with designers and engineers from across branches." },
    { at: 0.78, title: "National stage", text: "We take student teams to the National Entrepreneurship Challenge by IIT Bombay and IIT Madras. SMVIT placed 16th at IIT Bombay." },
    { at: 0.99, title: "Startup expos", text: "Show the product to founders, investors and alumni, and leave with your first real conversations." },
  ];

  const TEAM = [
    ["Satvik Gupta", "https://www.linkedin.com/in/satvik--gupta/"],
    ["Anant Srivastava", "https://www.linkedin.com/in/anant-srivastava-709174293/"],
    ["Bhoomi Nayak", "https://www.linkedin.com/in/bhoomi-nayak-943083305/"],
    ["Shashwat Shaurya", "https://www.linkedin.com/in/shashwat-shaurya-0828a5207/"],
    ["Bikesh Kumar", "https://www.linkedin.com/in/bikesh-kumar-37b71428b/"],
    ["Ayush Thakur", "https://www.linkedin.com/in/ayush-thakur015/"],
    ["Sarthak Tripathi", "https://www.linkedin.com/in/sarthak-tripathi-b11458295/"],
    ["Anuj Kumar Dixit", "https://www.linkedin.com/in/anuj-kumar-dixit-668437280/"],
    ["Mariam Shuaib", "https://www.linkedin.com/in/mariam-shuaib-003362328/"],
    ["Shashwat Ranjan", "https://www.linkedin.com/in/shashwat-ranjan-140908227/"],
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVG_NS = "http://www.w3.org/2000/svg";

  // ---------- Hero curve ----------
  const path = document.getElementById("curve-path");
  const area = document.querySelector("#curve .area");
  const dotsG = document.getElementById("curve-dots");
  const buttons = Array.from(document.querySelectorAll("#stages .stage"));
  const capTitle = document.getElementById("chart-cap-title");
  const capText = document.getElementById("chart-cap-text");
  const dots = [];

  if (path && dotsG) {
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.setProperty("--len", String(len));
    path.classList.add("is-drawing");
    area.classList.add("is-drawing");

    STAGES.forEach((s, i) => {
      const p = path.getPointAtLength(len * s.at);
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", p.x.toFixed(1));
      c.setAttribute("cy", p.y.toFixed(1));
      c.setAttribute("r", "6");
      c.setAttribute("class", "dot");
      const t = document.createElementNS(SVG_NS, "text");
      t.setAttribute("class", "dot-label");
      t.textContent = buttons[i] ? buttons[i].textContent : "";
      // Labels sit above the point; the last ones move left so they stay inside the frame.
      const anchorEnd = s.at > 0.7;
      t.setAttribute("x", (p.x + (anchorEnd ? -14 : 0)).toFixed(1));
      t.setAttribute("y", (p.y - 16).toFixed(1));
      t.setAttribute("text-anchor", anchorEnd ? "end" : i === 0 ? "start" : "middle");
      dotsG.append(c, t);
      dots.push(c);
    });
  }

  let active = 0;
  function setStage(i) {
    active = i;
    buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
    dots.forEach((d, j) => d.classList.toggle("is-active", j === i));
    capTitle.textContent = STAGES[i].title;
    capText.textContent = STAGES[i].text;
  }

  let timer = null;
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => {
    if (reduceMotion || timer) return;
    timer = setInterval(() => setStage((active + 1) % STAGES.length), 3200);
  };

  buttons.forEach((b, i) => {
    b.addEventListener("click", () => { stop(); setStage(i); });
  });
  const chart = document.querySelector(".chart");
  if (chart) {
    chart.addEventListener("mouseenter", stop);
    chart.addEventListener("focusin", stop);
  }
  if (buttons.length) { setStage(0); start(); }

  // ---------- Team ----------
  const teamList = document.getElementById("team-list");
  if (teamList) {
    TEAM.forEach(([name, url]) => {
      const a = document.createElement("a");
      a.className = "member";
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
      a.innerHTML = '<span class="avatar" aria-hidden="true"></span><span><span class="member__name"></span><br><span class="member__sub">LinkedIn ↗</span></span>';
      a.querySelector(".avatar").textContent = initials;
      a.querySelector(".member__name").textContent = name;
      teamList.appendChild(a);
    });
  }

  // ---------- Footer clock ----------
  const clock = document.getElementById("clock");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // ---------- Header: show Dashboard when signed in ----------
  if (window.Auth) {
    Auth.me().then((res) => {
      if (!res) return;
      document.querySelectorAll("[data-guest]").forEach((el) => { el.hidden = true; });
      document.querySelectorAll("[data-member]").forEach((el) => { el.hidden = false; });
    }).catch(() => { /* header stays in guest state */ });
  }
})();
