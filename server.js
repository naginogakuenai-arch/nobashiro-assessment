const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });
const express = require("express");
const {
  SCORE_LEVELS,
  NOBASHIRO_ITEMS,
  COMPETENCY_ITEMS,
  ALL_SCORED_ITEMS,
  NOBASHIRO_MAX,
  COMPETENCY_MAX,
  RANK_LABEL,
  NOBASHIRO_COEFFICIENT,
  rankFromTotal,
  applyGate,
  ageCoefficient,
  COEFFICIENT_FIELDS,
  findCoefficient,
  assessOrgRisk,
} = require("./rubric");
const store = require("./store");
const crypto = require("crypto");

const app = express();

// 簡易認証：外部公開時にAPIキーが無関係な第三者に使われないようにするための合言葉ゲート
const APP_USER = process.env.APP_USER;
const APP_PASSWORD = process.env.APP_PASSWORD;

if (APP_USER && APP_PASSWORD) {
  app.use((req, res, next) => {
    const header = req.headers.authorization || "";
    const [scheme, encoded] = header.split(" ");
    if (scheme === "Basic" && encoded) {
      const [user, pass] = Buffer.from(encoded, "base64").toString().split(":");
      if (user === APP_USER && pass === APP_PASSWORD) return next();
    }
    res.set("WWW-Authenticate", 'Basic realm="nobashiro-assessment"');
    res.status(401).send("認証が必要です");
  });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

let anthropicClient = null;
if (API_KEY) {
  const Anthropic = require("@anthropic-ai/sdk");
  anthropicClient = new Anthropic({ apiKey: API_KEY });
}

app.get("/api/questions", (req, res) => {
  res.json({
    nobashiroItems: NOBASHIRO_ITEMS.map((i) => ({ key: i.key, label: i.label, question: i.question, gate: i.gate })),
    competencyItems: COMPETENCY_ITEMS.map((i) => ({ key: i.key, label: i.label, question: i.question, gate: i.gate })),
    coefficientFields: COEFFICIENT_FIELDS.map((f) => ({
      key: f.key,
      label: f.label,
      options: f.options.map((o) => ({ value: o.value, label: o.label })),
    })),
    demoMode: !anthropicClient,
  });
});

async function scoreWithClaude(item, answerText) {
  const prompt = `あなたは人材の成長可能性・組織適性を評価する採点者です。以下の設問への回答を、0〜4点のルーブリックで採点してください。

# 設問
${item.question}

# 採点基準
0点: ${SCORE_LEVELS[0]}
1点: ${SCORE_LEVELS[1]}
2点: ${SCORE_LEVELS[2]}
3点: ${SCORE_LEVELS[3]}
4点: ${SCORE_LEVELS[4]}

# この設問固有の着眼点
${item.rubricHint}

# 回答者の回答
"""
${answerText || "(未回答)"}
"""

回答内容そのものの巧拙ではなく、行動事実の具体性・継続性・再現性を重視して採点してください。
出力は次のJSON形式のみ。説明文や前後の文章は一切付けないこと。
{"score": 0-4の整数, "rationale": "採点理由を日本語1〜2文で"}`;

  const msg = await anthropicClient.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error("Claude raw response debug:", JSON.stringify({ stop_reason: msg.stop_reason, content: msg.content }));
    throw new Error("Claude応答のJSON解析に失敗しました: " + text);
  }
  const parsed = JSON.parse(match[0]);
  const score = Math.max(0, Math.min(4, Math.round(Number(parsed.score))));
  return { score, rationale: parsed.rationale || "" };
}

// APIキー未設定時のデモ用フォールバック採点（文字数・具体性キーワードに基づく簡易ヒューリスティック）
function scoreHeuristic(item, answerText) {
  const text = (answerText || "").trim();
  if (!text) return { score: 0, rationale: "(デモ判定) 未回答のため0点。" };

  const len = text.length;
  const concretenessKeywords = ["年", "月", "結果", "具体的", "%", "円", "件"];
  const concretenessHits = concretenessKeywords.filter((k) => text.includes(k)).length;

  let score = 1;
  if (len > 40) score = 2;
  if (len > 100) score = 3;
  if (len > 150 && concretenessHits >= 2) score = 4;

  return {
    score,
    rationale: `(デモ判定：APIキー未設定のため文字数・具体性ワードのみで簡易採点。実運用ではAI採点に置き換え) 回答の長さ${len}文字、具体性ワード${concretenessHits}件を基に算出。`,
  };
}

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/submissions", (req, res) => {
  const all = store.loadAll();
  const summaries = all
    .map((r) => ({
      id: r.id,
      name: r.name,
      department: r.department,
      submittedAt: r.submittedAt,
      age: r.achievement.currentAge,
      nobashiroRank: r.nobashiro.rank,
      competencyRank: r.competency.rank,
      orgRiskLevel: r.orgRisk.level,
      years: r.achievement.years,
      predictedAge: r.achievement.predictedAge,
    }))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json({ submissions: summaries });
});

app.get("/api/submissions/:id", (req, res) => {
  const record = store.getById(req.params.id);
  if (!record) return res.status(404).json({ error: "見つかりません" });
  res.json(record);
});

app.delete("/api/submissions/:id", (req, res) => {
  const ok = store.deleteById(req.params.id);
  res.json({ ok });
});

app.post("/api/score", async (req, res) => {
  try {
    const name = (req.body.name || "").trim() || "無記名";
    const department = (req.body.department || "").trim();
    const answers = req.body.answers || {};
    const coefficientChoices = req.body.coefficients || {};
    const age = Number(req.body.age) || 30;
    const annualHours = Number(req.body.annualHours) || 1000;

    const results = {};
    for (const item of ALL_SCORED_ITEMS) {
      const answerText = answers[item.key] || "";
      const result = anthropicClient
        ? await scoreWithClaude(item, answerText)
        : scoreHeuristic(item, answerText);
      results[item.key] = { ...result, label: item.label, weight: item.weight, group: item.group };
    }

    const scoresOnly = Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.score]));

    // 伸び代コアスコア（36点満点）とゲート判定
    const nobashiroTotal = NOBASHIRO_ITEMS.reduce((sum, item) => sum + results[item.key].score * item.weight, 0);
    const gate = applyGate(scoresOnly);
    let nobashiroRank = rankFromTotal(nobashiroTotal, NOBASHIRO_MAX);
    if (gate.forced === "D") nobashiroRank = "D";
    else if (gate.forced === "B_CAP" && ["S", "A"].includes(nobashiroRank)) nobashiroRank = "B";

    // 管理職・経営職適性スコア（20点満点、ゲートなし）
    const competencyTotal = COMPETENCY_ITEMS.reduce((sum, item) => sum + results[item.key].score * item.weight, 0);
    const competencyRank = rankFromTotal(competencyTotal, (COMPETENCY_MAX * 36) / 20); // 36点スケール換算で同じ閾値を使う

    // 成就時間計算式
    const nobashiroCoefficient = NOBASHIRO_COEFFICIENT[nobashiroRank];
    const ageInfo = ageCoefficient(age);
    const careerCoef = findCoefficient("career", coefficientChoices.career);
    const positionCoef = findCoefficient("position", coefficientChoices.position);
    const barrierCoef = findCoefficient("barrier", coefficientChoices.barrier);
    const achievementCoef = findCoefficient("achievement", coefficientChoices.achievement);
    const strategyCoef = findCoefficient("strategy", coefficientChoices.strategy);
    const interpersonalCoef = findCoefficient("interpersonal", coefficientChoices.interpersonal);
    const practicalCoef = findCoefficient("practical", coefficientChoices.practical);

    const coefficientBreakdown = {
      伸び代係数: nobashiroCoefficient,
      年齢係数: ageInfo.coefficient,
      キャリア責任係数: careerCoef,
      希望ポジション係数: positionCoef,
      障壁係数: barrierCoef,
      実績係数: achievementCoef,
      戦略係数: strategyCoef,
      対人成果係数: interpersonalCoef,
      社会人実践係数: practicalCoef,
    };

    const achievementHours =
      10000 *
      nobashiroCoefficient *
      ageInfo.coefficient *
      careerCoef *
      positionCoef *
      barrierCoef *
      achievementCoef *
      strategyCoef *
      interpersonalCoef *
      practicalCoef;

    const yearsToComplete = achievementHours / annualHours;
    const predictedAge = Math.round(age + yearsToComplete);

    const orgRisk = assessOrgRisk({
      positionCoefficient: positionCoef,
      gateForced: gate.forced,
      wakimaeruScore: scoresOnly.wakimaeru,
      mizenboushiScore: scoresOnly.mizenboushi,
      ryoukiScore: scoresOnly.ryouiki,
    });

    const result = {
      id: crypto.randomUUID(),
      name,
      department,
      submittedAt: new Date().toISOString(),
      items: results,
      nobashiro: {
        total: nobashiroTotal,
        max: NOBASHIRO_MAX,
        rank: nobashiroRank,
        rankLabel: RANK_LABEL[nobashiroRank],
        gate,
      },
      competency: {
        total: competencyTotal,
        max: COMPETENCY_MAX,
        rank: competencyRank,
        rankLabel: RANK_LABEL[competencyRank],
      },
      achievement: {
        ageLabel: ageInfo.label,
        coefficientBreakdown,
        totalHours: Math.round(achievementHours),
        annualHours,
        years: Math.round(yearsToComplete * 10) / 10,
        currentAge: age,
        predictedAge,
      },
      orgRisk,
      demoMode: !anthropicClient,
    };

    store.saveSubmission(result);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`伸び代アセスメント プロトタイプ起動: http://localhost:${PORT}`);
  console.log(anthropicClient ? "AI採点モード（Claude API使用）" : "デモ判定モード（ANTHROPIC_API_KEY未設定）");
});
