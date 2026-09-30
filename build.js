// bigwave.js（正本）のインタプリタ部分を index.html に埋め込む。
// 使い方：node build.js
// 目印コメント「interpreter」〜「end interpreter」の間を丸ごと置き換える。
// CSP を変えずにすむよう、外部ファイルとして読み込まずに直接埋め込んでいる。

const fs = require("fs");
const path = require("path");

const START = "/* ===== interpreter ===== */";
const END = "/* ===== end interpreter ===== */";

// text から「START 〜 END」（目印も含む）を取り出す
function extract(text, name) {
  const s = text.indexOf(START);
  const e = text.indexOf(END);
  if (s < 0 || e < 0 || e < s) throw new Error(`${name} に目印コメントが見つかりません`);
  return { s, e: e + END.length, body: text.slice(s, e + END.length) };
}

function build() {
  const jsPath = path.join(__dirname, "bigwave.js");
  const htmlPath = path.join(__dirname, "index.html");
  const js = fs.readFileSync(jsPath, "utf8");
  const html = fs.readFileSync(htmlPath, "utf8");

  const src = extract(js, "bigwave.js");
  const dst = extract(html, "index.html");
  const next = html.slice(0, dst.s) + src.body + html.slice(dst.e);

  if (next === html) return false;
  fs.writeFileSync(htmlPath, next);
  return true;
}

module.exports = { extract, START, END };

if (require.main === module) {
  console.log(build() ? "index.html を更新しました。" : "index.html はすでに最新です。");
}
