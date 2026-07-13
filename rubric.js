// 伸び代アセスメント 採点ルーブリック・係数定義
// 出典: 伸びしろアセスメント.md（Projects/AI秘書/03_プロジェクト）
//
// 自由記述の設問は0〜4点でAI採点する。「頑張った経験」のみ重み2倍。
// gate: true の項目は0点なら自動D判定、1点なら最高でもB判定までしか出さない一発退場ゲート。

const SCORE_LEVELS = {
  0: "全くない（意識・行動のどちらも見られない）",
  1: "意識のみ（考えているが行動に移していない）",
  2: "行動は少しある（散発的・単発的な行動が見られる）",
  3: "継続している（一定期間、継続的な行動が見られる）",
  4: "成果まで出している（継続の結果、具体的な成果・変化が見られる）",
};

// ── 第1〜7群：伸び代コアスコア（36点満点、ゲート判定あり） ──────────────
const NOBASHIRO_ITEMS = [
  {
    key: "ganbari",
    label: "頑張った経験（努力耐性）",
    group: "nobashiro",
    weight: 2,
    gate: false,
    question:
      "これまでの人生で、最も長く本気で取り組んだことを教えてください。何に取り組んだか、何年間続けたか、最も苦しかった時期、その時どう乗り越えたか、得られた成果、現在どう活かされているかを含めて記載してください。",
    rubricHint:
      "見たいのは継続力・根気・メンタル・自己成長意欲。3年以上の継続経験、苦しい時期の具体的な乗り越え方、結果と現在への転用があるほど高評価。抽象的な精神論のみ、期間や成果が不明瞭なものは低評価。",
  },
  {
    key: "sunao",
    label: "素直さ",
    group: "nobashiro",
    weight: 1,
    gate: true,
    question:
      "過去1年間で受けた最も厳しい指摘を教えてください。誰から受けたか、内容、当時どう思ったか、その後どのような行動を取ったか、現在も継続して改善していることを記載してください。",
    rubricHint:
      "指摘内容ではなく『その後の行動』を評価する。事実確認→改善行動→継続的な反映まで具体的に書かれているほど高評価。指摘自体を書けない・正当化・他責に終始するものは低評価。",
  },
  {
    key: "koudou",
    label: "行動力",
    group: "nobashiro",
    weight: 1,
    gate: true,
    question:
      "過去半年以内に、面倒だったが必要だと思い実行したことを3つ教えてください。それぞれの結果も教えてください。",
    rubricHint:
      "知識で終わらず実際に動いたか。具体的な行動と結果が3つとも書かれていれば高評価。1つも挙げられない、または『思った』止まりで行動が伴わないものは低評価。",
  },
  {
    key: "koukishin",
    label: "好奇心",
    group: "nobashiro",
    weight: 1,
    gate: false,
    question:
      "過去3年間で新たに学び始めたことを教えてください。なぜ学ぼうと思ったか、現在どの程度継続しているか、何に活かそうとしているかを記載してください。",
    rubricHint:
      "専門分野以外への関心があり、学習が継続し、活用につながっているほど高評価。趣味であっても成長・貢献・価値提供との関連が説明できれば加点、関連が説明できない場合は評価しない。",
  },
  {
    key: "sekinin",
    label: "責任感",
    group: "nobashiro",
    weight: 1,
    gate: true,
    question:
      "自分には直接関係ないが放置できなかったことを教えてください。なぜ動いたのか、どのような行動を取ったのか、結果どうなったのかを記載してください。",
    rubricHint:
      "組織や他者の問題を自分事として捉え、実際に動いた具体例があるほど高評価。『関係ないので何もしなかった』『誰かがやるだろうと思った』は低評価。",
  },
  {
    key: "keizoku",
    label: "継続力",
    group: "nobashiro",
    weight: 1,
    gate: true,
    question:
      "現在3年以上継続していることがあれば教えてください。結果が出ない時期にどのような工夫をしたかを記載してください。",
    rubricHint:
      "3年以上の継続実績があり、停滞期に具体的な工夫で乗り越えた経験があるほど高評価。継続経験がない、または工夫が語れない場合は低評価。",
  },
  {
    key: "ritasei",
    label: "利他性・他喜力",
    group: "nobashiro",
    weight: 1,
    gate: false,
    question:
      "最近1か月以内に、誰かを喜ばせるために行ったことを3つ教えてください。なぜそうしようと思ったのか、相手はどのような反応だったかを教えてください。",
    rubricHint:
      "見返りを求めず相手視点で考えた具体例が複数あるほど高評価。挙げられない、または自分の利益目的が中心のものは低評価。",
  },
  {
    key: "saikoukei",
    label: "最高形設計力",
    group: "nobashiro",
    weight: 1,
    gate: false,
    question:
      "10年後、あなたはどのような人物になっていたいですか。できるだけ具体的に教えてください。また、そのために現在行っていることを教えてください。",
    rubricHint:
      "理想像が具体的で、現在地とのギャップを理解し、逆算した行動が伴っているほど高評価。理想像が抽象的、または理想はあるが今の行動と結びついていない場合は低評価。",
  },
];

// ── 第8〜11群：管理職・経営職適性（20点満点、ゲートなし） ──────────────
const COMPETENCY_ITEMS = [
  {
    key: "ryouiki",
    label: "領域拡張性",
    group: "competency",
    weight: 1,
    gate: false,
    question:
      "現在の専門分野以外で、新たに学び始めたことを教えてください。なぜ学び始めたのか、どのように学んでいるのか、どのような場面で活用しようとしているのか、あなたの理想像や希望する役職とどのような関係があるのかを記載してください。",
    rubricHint:
      "重要なのは学ぶ内容ではなく目的。自身の成長・組織貢献・顧客価値・希望する役職の準備につながっているかを評価する。単なる趣味で成長との関連が説明できないものは低評価。管理職以上希望でマネジメント・マーケティング・財務等を学んでいれば高評価。",
  },
  {
    key: "mizenboushi",
    label: "未然防止力・先回り力",
    group: "competency",
    weight: 1,
    gate: false,
    question:
      "過去1年間で発生したトラブルを1つ教えてください。①何が起きたか ②事前に防げた可能性はあったか ③発生後の対応 ④再発防止策 ⑤この経験をプラスに変えられたことがあるか、を記載してください。",
    rubricHint:
      "5段階評価：0点=問題発生後に対応するのみ／1点=再発防止を考える／2点=事前に防げなかったか考える／3点=事前防止の仕組みを作る／4点=問題を価値へ転換する。段階が上がるほど高評価。",
  },
  {
    key: "wakimaeru",
    label: "弁える力",
    group: "competency",
    weight: 1,
    gate: false,
    question:
      "組織にとって不利益になると分かっていることがあります。しかし指摘すると嫌われる可能性があります。あなたならどうしますか。理由も教えてください。",
    rubricHint:
      "組織利益・収支・権限・責任を同時に考えているかを評価する。黙る・誰かに任せるは弁えるではなく責任放棄として低評価。改善案を添えて責任者へ報告できていれば高評価。",
  },
  {
    key: "shigen",
    label: "経営責任感・資源活用力",
    group: "competency",
    weight: 1,
    gate: false,
    question:
      "売上を20%向上させてください。ただし追加予算はありません。あなたなら何を行いますか。優先順位も含めて教えてください。",
    rubricHint:
      "投資を求める前に既存資源（既存顧客・紹介・単価向上・オペレーション改善）を最大活用しようとしているかを評価する。いきなり広告費・予算を使う提案は低評価。無料施策を尽くした上で投資判断に触れていれば高評価。",
  },
  {
    key: "souzou",
    label: "0→1創造力",
    group: "competency",
    weight: 1,
    gate: false,
    question:
      "今までにあなたが発案した企画・制度・改善案を教えてください。なぜ思いついたか、どのように実現したか、収支や運営方法まで考えたか、結果どうなったかを教えてください。",
    rubricHint:
      "5段階評価：0点=思いつきのみ／1点=アイデアのみ／2点=実行案まで／3点=収支計画まで／4点=実行・改善・再現化まで。段階が上がるほど高評価。",
  },
];

const ALL_SCORED_ITEMS = [...NOBASHIRO_ITEMS, ...COMPETENCY_ITEMS];
const GATE_KEYS = NOBASHIRO_ITEMS.filter((i) => i.gate).map((i) => i.key);
const NOBASHIRO_MAX = NOBASHIRO_ITEMS.reduce((sum, i) => sum + i.weight * 4, 0); // 36点
const COMPETENCY_MAX = COMPETENCY_ITEMS.reduce((sum, i) => sum + i.weight * 4, 0); // 20点

const RANK_LABEL = {
  S: "非常に伸び代が高い",
  A: "伸び代が高い",
  B: "平均的",
  C: "伸び代が低い",
  D: "伸び代が極めて低い",
};

// 伸び代ランク → 成就時間計算式に使う係数
const NOBASHIRO_COEFFICIENT = { S: 0.6, A: 0.8, B: 1.0, C: 1.5, D: 2.5 };

function rankFromTotal(total, max) {
  const pct = total / max;
  if (pct >= 31 / 36) return "S";
  if (pct >= 25 / 36) return "A";
  if (pct >= 18 / 36) return "B";
  if (pct >= 10 / 36) return "C";
  return "D";
}

// ゲート項目の判定を適用してランクを補正する
// 0点が1つでもあれば強制D、1点が1つでもあれば最高B止まり
function applyGate(scores) {
  const gateScores = GATE_KEYS.map((k) => scores[k]);
  if (gateScores.some((s) => s === 0)) {
    return { forced: "D", reason: "素直さ・行動力・責任感・継続力のいずれかが0点のため自動D判定" };
  }
  if (gateScores.some((s) => s === 1)) {
    return { forced: "B_CAP", reason: "素直さ・行動力・責任感・継続力のいずれかが1点のため最高でもB判定" };
  }
  return { forced: null, reason: null };
}

// ── 成就時間計算式に使う係数テーブル ──────────────────────────────────
// 年齢は数値入力から自動判定、それ以外はプルダウン選択。

const AGE_BRACKETS = [
  { max: 24, coefficient: 1.0, label: "18〜24歳" },
  { max: 29, coefficient: 1.1, label: "25〜29歳" },
  { max: 34, coefficient: 1.2, label: "30〜34歳" },
  { max: 39, coefficient: 1.4, label: "35〜39歳" },
  { max: 44, coefficient: 1.7, label: "40〜44歳" },
  { max: 49, coefficient: 2.0, label: "45〜49歳" },
  { max: 54, coefficient: 2.3, label: "50〜54歳" },
  { max: Infinity, coefficient: 2.5, label: "55歳以上" },
];

function ageCoefficient(age) {
  const bracket = AGE_BRACKETS.find((b) => age <= b.max) || AGE_BRACKETS[AGE_BRACKETS.length - 1];
  return { coefficient: bracket.coefficient, label: bracket.label };
}

const CAREER_LEVELS = [
  { value: "general", label: "一般職", coefficient: 1.0 },
  { value: "leader", label: "主任・リーダー", coefficient: 1.2 },
  { value: "manager", label: "管理職", coefficient: 1.5 },
  { value: "division", label: "部門責任者", coefficient: 2.0 },
  { value: "executive", label: "経営者", coefficient: 3.0 },
];

const POSITION_LEVELS = [
  { value: "general", label: "一般職", coefficient: 1.0 },
  { value: "leader", label: "主任", coefficient: 1.2 },
  { value: "chief", label: "課長", coefficient: 1.5 },
  { value: "bucho", label: "部長", coefficient: 2.0 },
  { value: "yakuin", label: "役員", coefficient: 2.5 },
  { value: "shacho", label: "社長・理事長", coefficient: 3.0 },
];

const BARRIER_LEVELS = [
  { value: "none", label: "障壁なし", coefficient: 1.0 },
  { value: "light", label: "軽度（育児等）", coefficient: 1.1 },
  { value: "medium", label: "中度", coefficient: 1.3 },
  { value: "heavy", label: "重度", coefficient: 1.5 },
];

const ACHIEVEMENT_LEVELS = [
  { value: "national", label: "全国レベルの実績", coefficient: 0.6 },
  { value: "prefecture", label: "県レベルの実績", coefficient: 0.8 },
  { value: "regional", label: "地域レベルの実績", coefficient: 0.9 },
  { value: "internal", label: "組織内成果", coefficient: 1.0 },
  { value: "none", label: "実績なし", coefficient: 1.3 },
];

const STRATEGY_LEVELS = [
  { value: "clear", label: "明確な戦略あり", coefficient: 0.8 },
  { value: "partial", label: "一部あり", coefficient: 1.0 },
  { value: "none", label: "戦略なし", coefficient: 1.5 },
];

const INTERPERSONAL_LEVELS = [
  { value: "S", label: "組織全体へ影響を与えた", coefficient: 0.7 },
  { value: "A", label: "複数人を動かして成果", coefficient: 0.8 },
  { value: "B", label: "顧客対応で成果", coefficient: 1.0 },
  { value: "C", label: "個人成果のみ", coefficient: 1.3 },
  { value: "D", label: "対人成果なし", coefficient: 1.7 },
];

const PRACTICAL_LEVELS = [
  { value: "S", label: "売上・利益・採用・人材育成責任すべて経験", coefficient: 0.7 },
  { value: "A", label: "売上・顧客・部門責任を経験", coefficient: 0.8 },
  { value: "B", label: "顧客対応・対人責任の経験あり", coefficient: 1.0 },
  { value: "C", label: "社内業務中心", coefficient: 1.3 },
  { value: "D", label: "対人責任の経験なし", coefficient: 1.7 },
];

const COEFFICIENT_FIELDS = [
  { key: "career", label: "現在のキャリア（責任の重さ）", options: CAREER_LEVELS },
  { key: "position", label: "希望するポジション", options: POSITION_LEVELS },
  { key: "barrier", label: "障壁の状態", options: BARRIER_LEVELS },
  { key: "achievement", label: "これまでの実績レベル", options: ACHIEVEMENT_LEVELS },
  { key: "strategy", label: "成果に対する戦略の有無", options: STRATEGY_LEVELS },
  { key: "interpersonal", label: "対人成果（人を通じて出した成果）", options: INTERPERSONAL_LEVELS },
  { key: "practical", label: "社会人実践（売上・利益・人材への責任経験）", options: PRACTICAL_LEVELS },
];

function findCoefficient(fieldKey, value) {
  const field = COEFFICIENT_FIELDS.find((f) => f.key === fieldKey);
  if (!field) return 1.0;
  const opt = field.options.find((o) => o.value === value);
  return opt ? opt.coefficient : 1.0;
}

// 希望ポジション係数が課長(1.5)以上かどうかの判定に使う閾値
const MANAGEMENT_POSITION_THRESHOLD = 1.5;
const SENIOR_POSITION_THRESHOLD = 2.0; // 部長以上

// 組織リスク判定
// 希望ポジションが高いのに、弁える力・未然防止力・領域拡張性が低い場合にリスクを検出する
function assessOrgRisk({ positionCoefficient, gateForced, wakimaeruScore, mizenboushiScore, ryoukiScore }) {
  if (gateForced === "D") {
    return { level: "危険", reason: "素直さ・行動力・責任感・継続力のいずれかが欠如しており、伸び代以前に基礎的な組織リスクがある" };
  }
  if (positionCoefficient >= SENIOR_POSITION_THRESHOLD && (wakimaeruScore <= 1 || mizenboushiScore <= 1)) {
    return { level: "高", reason: "部長以上を希望しているが、弁える力または未然防止力が低く、組織への損害リスクが大きい" };
  }
  if (positionCoefficient >= MANAGEMENT_POSITION_THRESHOLD && ryoukiScore <= 1) {
    return { level: "中", reason: "課長以上を希望しているが、マネジメント等の専門外領域への学習（領域拡張性）が不足している" };
  }
  return { level: "低", reason: "現時点で希望ポジションと能力の間に大きな乖離は見られない" };
}

module.exports = {
  SCORE_LEVELS,
  NOBASHIRO_ITEMS,
  COMPETENCY_ITEMS,
  ALL_SCORED_ITEMS,
  GATE_KEYS,
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
};
