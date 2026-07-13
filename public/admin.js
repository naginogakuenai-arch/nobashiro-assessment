const listView = document.getElementById("listView");
const detailView = document.getElementById("detailView");

function rankColor(rank) {
  return { S: "#3d6b52", A: "#5c8a6e", B: "#8a8a6e", C: "#b5824a", D: "#a4413a" }[rank] || "#3d6b52";
}

function riskColor(level) {
  return { 低: "#3d6b52", 中: "#b5824a", 高: "#c0673a", 危険: "#a4413a" }[level] || "#8a8a6e";
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

async function loadList() {
  detailView.classList.add("hidden");
  listView.classList.remove("hidden");
  listView.innerHTML = `<p class="muted-note">読み込み中...</p>`;

  const res = await fetch("/api/submissions");
  const data = await res.json();

  if (data.submissions.length === 0) {
    listView.innerHTML = `<p class="muted-note">まだ提出がありません。</p>`;
    return;
  }

  const rows = data.submissions
    .map(
      (s) => `
      <tr data-id="${s.id}" class="admin-row">
        <td>${s.name}</td>
        <td>${s.department || "-"}</td>
        <td>${s.age}歳</td>
        <td><span class="mini-badge" style="color:${rankColor(s.nobashiroRank)}">${s.nobashiroRank}</span></td>
        <td><span class="mini-badge" style="color:${rankColor(s.competencyRank)}">${s.competencyRank}</span></td>
        <td><span class="mini-badge" style="color:${riskColor(s.orgRiskLevel)}">${s.orgRiskLevel}</span></td>
        <td>${s.years}年（${s.predictedAge}歳頃）</td>
        <td class="muted-note">${formatDate(s.submittedAt)}</td>
        <td><button class="delete-btn" data-id="${s.id}">削除</button></td>
      </tr>
    `
    )
    .join("");

  listView.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>氏名</th><th>所属</th><th>年齢</th><th>伸び代</th><th>管理職適性</th><th>組織リスク</th><th>到達予測</th><th>提出日時</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  listView.querySelectorAll(".admin-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) return;
      loadDetail(row.dataset.id);
    });
  });

  listView.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("この提出データを削除しますか？")) return;
      await fetch(`/api/submissions/${btn.dataset.id}`, { method: "DELETE" });
      loadList();
    });
  });
}

function rankCard(title, rank, rankLabel, totalText) {
  return `
    <div class="rank-card">
      <div class="rank-card-title">${title}</div>
      <div class="rank-badge" style="color:${rankColor(rank)}">${rank}</div>
      <div class="rank-label">${rankLabel}</div>
      <div class="rank-total">${totalText}</div>
    </div>
  `;
}

async function loadDetail(id) {
  const res = await fetch(`/api/submissions/${id}`);
  const data = await res.json();
  if (data.error) {
    alert(data.error);
    return;
  }

  listView.classList.add("hidden");
  detailView.classList.remove("hidden");

  const gateWarning = data.nobashiro.gate.forced
    ? `<div class="gate-warning">⚠ ${data.nobashiro.gate.reason}</div>`
    : "";

  const a = data.achievement;
  const coefRows = Object.entries(a.coefficientBreakdown)
    .map(([label, value]) => `<div class="coef-row"><span>${label}</span><span>${value}</span></div>`)
    .join("");

  const itemsHtml = Object.values(data.items)
    .map((r) => {
      const pct = (r.score / 4) * 100;
      return `
        <div class="item-row">
          <div class="item-top"><span>${r.label}</span><span>${r.score} / 4</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <div class="item-rationale">${r.rationale}</div>
        </div>
      `;
    })
    .join("");

  detailView.innerHTML = `
    <button class="retry-button" id="backBtn">← 一覧に戻る</button>
    <div class="detail-header">
      <h2>${data.name}</h2>
      <p class="muted-note">${data.department || "所属未記入"} ／ 提出日時：${formatDate(data.submittedAt)}</p>
    </div>
    <div class="rank-card-row">
      ${rankCard("伸び代", data.nobashiro.rank, data.nobashiro.rankLabel, `合計 ${data.nobashiro.total} / ${data.nobashiro.max} 点`)}
      ${rankCard("管理職・経営職適性", data.competency.rank, data.competency.rankLabel, `合計 ${data.competency.total} / ${data.competency.max} 点`)}
    </div>
    ${gateWarning}
    <div class="achievement-card">
      <div class="achievement-title">成就時間予測</div>
      <div class="achievement-main">
        <div class="achievement-stat">
          <span class="stat-value">${a.totalHours.toLocaleString()}</span>
          <span class="stat-label">予想到達時間（時間）</span>
        </div>
        <div class="achievement-stat">
          <span class="stat-value">${a.years}</span>
          <span class="stat-label">予想到達年数（年）</span>
        </div>
        <div class="achievement-stat">
          <span class="stat-value">${a.predictedAge}歳</span>
          <span class="stat-label">到達予定年齢（現在${a.currentAge}歳・${a.ageLabel}）</span>
        </div>
      </div>
      <div class="achievement-note">年間投入可能時間：${a.annualHours.toLocaleString()}時間/年 として算出</div>
      <details class="coef-details">
        <summary>係数の内訳を見る</summary>
        <div class="coef-list">${coefRows}</div>
      </details>
    </div>
    <div class="risk-card" style="border-color:${riskColor(data.orgRisk.level)}">
      <div class="risk-title">組織リスク判定：<span style="color:${riskColor(data.orgRisk.level)}">${data.orgRisk.level}</span></div>
      <div class="risk-reason">${data.orgRisk.reason}</div>
    </div>
    <div class="section-header"><h2>設問別スコア内訳</h2></div>
    ${itemsHtml}
  `;

  document.getElementById("backBtn").addEventListener("click", loadList);
}

loadList();
