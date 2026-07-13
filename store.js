// 提出データの簡易永続化（JSONファイル）。管理画面から一覧・詳細を見るために使う。
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "submissions.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

function loadAll() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveSubmission(record) {
  ensureStore();
  const all = loadAll();
  all.push(record);
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf8");
  return record;
}

function getById(id) {
  return loadAll().find((r) => r.id === id) || null;
}

function deleteById(id) {
  const all = loadAll();
  const next = all.filter((r) => r.id !== id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(next, null, 2), "utf8");
  return next.length !== all.length;
}

module.exports = { loadAll, saveSubmission, getById, deleteById };
