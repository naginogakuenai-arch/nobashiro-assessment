const form = document.getElementById("assessmentForm");
const resultEl = document.getElementById("result");
const demoBanner = document.getElementById("demoBanner");
const sampleBtn = document.getElementById("sampleBtn");

let allItems = [];
let coefficientFields = [];

// 見本データ：なぎの学園の教室運営スタッフを想定した架空の回答例
const SAMPLE_DATA = {
  name: "見本 太郎",
  department: "Q-big〇〇教室",
  answers: {
    ganbari:
      "大学時代から10年間テニスを続けている。3年目に肘を怪我して辞めたくなったが、コーチと相談しながらフォームを改善して復帰し、県大会でベスト8まで進んだ。今はこの経験を活かして、後輩への指導方針を考える際の土台にしている。",
    sunao:
      "半年前、上司から会議資料が独りよがりだと厳しく指摘された。まず事実を確認し、翌週から現場の意見を先に聞いてから資料化する流れに変更した。今も毎回関係者にヒアリングしてから提案するようにしている。",
    koudou:
      "1つ目、面倒だった全教室の避難訓練マニュアル統一を自ら実施した。2つ目、退職を考えていたスタッフの相談に休日返上で対応し離職を防いだ。3つ目、老朽化した設備の点検を前倒しで実施した。",
    koukishin:
      "昨年からファイナンスの入門書を読み始めた。数字に弱いと感じていたためで、月1回のペースで読み進め、簡単な収支シミュレーションを自分の担当教室で試している。",
    sekinin:
      "自分の担当ではない他教室の会計処理に不備があるのに気づき、放置すると監査で問題になると思い、自ら経理責任者に報告し一緒に是正した。",
    keizoku:
      "10年以上、毎朝の教室巡回と記録を継続している。成果が見えない時期もあったが、記録を取り続けることで後から改善点が見えるようになった。",
    ritasei:
      "後輩の誕生日にお祝いの言葉を用意した。保護者が困っていた提出書類の書き方を先回りして説明した。同僚が忙しい時に自分の業務を調整して手伝った。",
    saikoukei:
      "複数教室を任せられるマネージャーになりたい。そのために月2回マネジメント関連の書籍を読み、上司に1on1で相談する時間を作っている。",
    ryouiki:
      "希望するポジションを見据えて、半年前からマーケティングの基礎をオンライン講座で学び始めた。実際に自教室の体験会告知に応用し、反応率の変化を記録している。",
    mizenboushi:
      "昨年、繁忙期にスタッフ不足でクレームが多発した。事後対応だけでなく、なぜ人員計画が甘かったかを分析し、需要予測に基づくシフト作成の仕組みを作った。この経験を他教室にも展開し、対応の標準化につなげた。",
    wakimaeru:
      "見て見ぬふりをすると後で大きな損失になると考え、収支への影響と改善案をまとめた上で責任者に報告した。嫌われるリスクよりも組織全体の利益を優先した。",
    shigen:
      "まず既存の保護者・生徒のリピート率向上と紹介施策を優先する。次に単価改善の余地を確認し、それでも足りない場合のみ小規模な広告テストを行い、費用対効果を見てから本格投資を判断する。",
    souzou:
      "属人化していた入退塾手続きをマニュアル化し、新人スタッフでも対応できる仕組みを作った。導入前に工数を試算した上で導入し、対応時間が3割短縮された。",
  },
  age: 38,
  annualHours: 800,
  coefficients: {
    career: "manager",
    position: "bucho",
    barrier: "light",
    achievement: "regional",
    strategy: "clear",
    interpersonal: "A",
    practical: "A",
  },
};

function questionCard(item) {
  const card = document.createElement("div");
  card.className = "question-card";
  card.innerHTML = `
    <div class="q-label">${item.label}${item.gate ? '<span class="gate-tag">重要項目</span>' : ""}</div>
    <div class="q-text">${item.question}</div>
    <textarea name="${item.key}" placeholder="具体的な行動事実を書いてください"></textarea>
  `;
  return card;
}

function sectionHeader(title, desc) {
  const el = document.createElement("div");
  el.className = "section-header";
  el.innerHTML = `<h2>${title}</h2>${desc ? `<p>${desc}</p>` : ""}`;
  return el;
}

async function loadQuestions() {
  const res = await fetch("/api/questions");
  const data = await res.json();
  allItems = [...data.nobashiroItems, ...data.competencyItems];
  coefficientFields = data.coefficientFields;
  if (data.demoMode) demoBanner.classList.remove("hidden");

  form.innerHTML = "";

  const whoCard = document.createElement("div");
  whoCard.className = "question-card";
  whoCard.innerHTML = `
    <div class="coef-grid">
      <label class="coef-field">
        <span>氏名</span>
        <input type="text" name="respondentName" placeholder="例：河野通有" />
      </label>
      <label class="coef-field">
        <span>所属・部署（任意）</span>
        <input type="text" name="respondentDept" placeholder="例：Q-big〇〇教室" />
      </label>
    </div>
  `;
  form.appendChild(whoCard);

  form.appendChild(
    sectionHeader("① 伸び代（基礎項目）", "今後どこまで伸びる可能性があるかを判定する8項目です。")
  );
  data.nobashiroItems.forEach((item) => form.appendChild(questionCard(item)));

  form.appendChild(
    sectionHeader("② 管理職・経営職適性", "未然防止力・弁える力など、上位ポジションほど重視される5項目です。")
  );
  data.competencyItems.forEach((item) => form.appendChild(questionCard(item)));

  form.appendChild(
    sectionHeader("③ 成就時間の計算に使う情報", "年齢・キャリア・希望ポジションなどから、成就までの想定時間を算出します。")
  );

  const coefCard = document.createElement("div");
  coefCard.className = "question-card";
  coefCard.innerHTML = `
    <div class="coef-grid">
      <label class="coef-field">
        <span>現在の年齢</span>
        <input type="number" name="age" min="15" max="80" value="30" />
      </label>
      <label class="coef-field">
        <span>年間投入可能時間（時間/年）</span>
        <input type="number" name="annualHours" min="1" value="1000" />
      </label>
      ${coefficientFields
        .map(
          (field) => `
        <label class="coef-field">
          <span>${field.label}</span>
          <select name="coef_${field.key}">
            ${field.options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("")}
          </select>
        </label>
      `
        )
        .join("")}
    </div>
  `;
  form.appendChild(coefCard);

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "submit";
  submitBtn.textContent = "採点する";
  form.appendChild(submitBtn);

  fillSample();
}

function rankColor(rank) {
  return { S: "#3d6b52", A: "#5c8a6e", B: "#8a8a6e", C: "#b5824a", D: "#a4413a" }[rank] || "#3d6b52";
}

function riskColor(level) {
  return { 低: "#3d6b52", 中: "#b5824a", 高: "#c0673a", 危険: "#a4413a" }[level] || "#8a8a6e";
}

function rankCard(title, rank, rankLabel, totalText, extraHtml) {
  return `
    <div class="rank-card">
      <div class="rank-card-title">${title}</div>
      <div class="rank-badge" style="color:${rankColor(rank)}">${rank}</div>
      <div class="rank-label">${rankLabel}</div>
      <div class="rank-total">${totalText}</div>
      ${extraHtml || ""}
    </div>
  `;
}

function renderResult(data) {
  resultEl.classList.remove("hidden");
  form.classList.add("hidden");

  const gateWarning = data.nobashiro.gate.forced
    ? `<div class="gate-warning">⚠ ${data.nobashiro.gate.reason}</div>`
    : "";

  const nobashiroCard = rankCard(
    "伸び代",
    data.nobashiro.rank,
    data.nobashiro.rankLabel,
    `合計 ${data.nobashiro.total} / ${data.nobashiro.max} 点`,
    gateWarning
  );

  const competencyCard = rankCard(
    "管理職・経営職適性",
    data.competency.rank,
    data.competency.rankLabel,
    `合計 ${data.competency.total} / ${data.competency.max} 点`
  );

  const a = data.achievement;
  const coefRows = Object.entries(a.coefficientBreakdown)
    .map(([label, value]) => `<div class="coef-row"><span>${label}</span><span>${value}</span></div>`)
    .join("");

  const achievementCard = `
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
  `;

  const riskCard = `
    <div class="risk-card" style="border-color:${riskColor(data.orgRisk.level)}">
      <div class="risk-title">組織リスク判定：<span style="color:${riskColor(data.orgRisk.level)}">${data.orgRisk.level}</span></div>
      <div class="risk-reason">${data.orgRisk.reason}</div>
    </div>
  `;

  const itemsHtml = allItems
    .map((item) => {
      const r = data.items[item.key];
      const pct = (r.score / 4) * 100;
      return `
        <div class="item-row">
          <div class="item-top">
            <span>${r.label}</span>
            <span>${r.score} / 4</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <div class="item-rationale">${r.rationale}</div>
        </div>
      `;
    })
    .join("");

  resultEl.innerHTML = `
    <div class="rank-card-row">${nobashiroCard}${competencyCard}</div>
    ${achievementCard}
    ${riskCard}
    <div class="section-header"><h2>設問別スコア内訳</h2></div>
    ${itemsHtml}
    <button class="retry-button" id="retryBtn">もう一度回答する</button>
  `;

  document.getElementById("retryBtn").addEventListener("click", () => {
    resultEl.classList.add("hidden");
    form.classList.remove("hidden");
    form.reset();
  });
}

function fillSample() {
  const nameEl = form.querySelector('[name="respondentName"]');
  const deptEl = form.querySelector('[name="respondentDept"]');
  if (nameEl) nameEl.value = SAMPLE_DATA.name;
  if (deptEl) deptEl.value = SAMPLE_DATA.department;

  Object.entries(SAMPLE_DATA.answers).forEach(([key, value]) => {
    const el = form.querySelector(`[name="${key}"]`);
    if (el) el.value = value;
  });
  Object.entries(SAMPLE_DATA.coefficients).forEach(([key, value]) => {
    const el = form.querySelector(`[name="coef_${key}"]`);
    if (el) el.value = value;
  });
  const ageEl = form.querySelector('[name="age"]');
  const annualHoursEl = form.querySelector('[name="annualHours"]');
  if (ageEl) ageEl.value = SAMPLE_DATA.age;
  if (annualHoursEl) annualHoursEl.value = SAMPLE_DATA.annualHours;
}

sampleBtn.addEventListener("click", fillSample);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector("button.submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "採点中...";

  const answers = {};
  allItems.forEach((item) => {
    const el = form.querySelector(`[name="${item.key}"]`);
    answers[item.key] = el.value;
  });

  const coefficients = {};
  coefficientFields.forEach((field) => {
    const el = form.querySelector(`[name="coef_${field.key}"]`);
    coefficients[field.key] = el.value;
  });

  const age = form.querySelector('[name="age"]').value;
  const annualHours = form.querySelector('[name="annualHours"]').value;
  const name = form.querySelector('[name="respondentName"]').value;
  const department = form.querySelector('[name="respondentDept"]').value;

  try {
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, coefficients, age, annualHours, name, department }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    renderResult(data);
  } catch (err) {
    alert("採点中にエラーが発生しました: " + err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "採点する";
  }
});

loadQuestions();
