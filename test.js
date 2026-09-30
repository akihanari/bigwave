// BigWave の自動テスト
// 使い方：node test.js
// examples/*.bw を実行して期待どおりの出力になるか、などを確かめる。

const fs = require("fs");
const path = require("path");
const { bigwave, BWError } = require("./bigwave.js");
const { extract } = require("./build.js");

// ファイルを読むときは改行を \n に揃える（ブラウザのテキストエリアと同じ挙動にするため）
function readBW(name) {
  return fs.readFileSync(path.join(__dirname, "examples", name), "utf8").replace(/\r\n?/g, "\n");
}

// 1〜n を1行ずつ（末尾に改行）
function lines(n, f = i => String(i)) {
  let s = "";
  for (let i = 1; i <= n; i++) s += f(i) + "\n";
  return s;
}
const fizzbuzz = lines(100, i => i % 15 === 0 ? "FizzBuzz" : i % 3 === 0 ? "Fizz" : i % 5 === 0 ? "Buzz" : String(i));

let pass = 0, fail = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`❌ ${name}\n   ${e.message}`);
    fail++;
  }
}
function eq(actual, expected, label = "出力") {
  if (actual !== expected) {
    throw new Error(`${label}が違います\n   期待: ${JSON.stringify(expected)}\n   実際: ${JSON.stringify(actual)}`);
  }
}
function throwsBW(code, msgPart) {
  try {
    bigwave(code);
  } catch (e) {
    if (!(e instanceof BWError)) throw new Error(`BWError ではないエラー: ${e.message}`);
    if (!e.message.includes(msgPart)) throw new Error(`エラーメッセージが違います: ${e.message}`);
    return;
  }
  throw new Error("エラーになりませんでした");
}

// ---- examples ----
console.log("■ examples");
check("hello.bw → Hello World!（42ステップ）", () => {
  const r = bigwave(readBW("hello.bw"));
  eq(r.out, "Hello World!");
  eq(r.steps, 42, "ステップ数");
});
check("hello_sun.bw → Hello World!", () => eq(bigwave(readBW("hello_sun.bw")).out, "Hello World!"));
check("multiply.bw → 12", () => eq(bigwave(readBW("multiply.bw")).out, "12"));
check("count.bw → 1〜15", () => eq(bigwave(readBW("count.bw")).out, lines(15)));
check("fizzbuzz.bw → FizzBuzz", () => eq(bigwave(readBW("fizzbuzz.bw")).out, fizzbuzz));
check("fizzbuzz_classic.bw → FizzBuzz", () => eq(bigwave(readBW("fizzbuzz_classic.bw")).out, fizzbuzz));
check("greet.bw（入力：たろう）→ こんにちは、たろうさん！", () => eq(bigwave(readBW("greet.bw"), "たろう").out, "こんにちは、たろうさん！"));
check("echo.bw（入力：BigWave!）→ BigWave!", () => eq(bigwave(readBW("echo.bw"), "BigWave!").out, "BigWave!"));
check("slip.bw → 💥がスベって何も出ない", () => {
  const r = bigwave(readBW("slip.bw"));
  eq(r.out, "");
  eq(r.box[0], 65, "箱の値");
});

// ---- テンション記号 ----
console.log("■ テンション記号");
check("🌊‼️‼️‼️↓ は7回", () => eq(bigwave("🌊‼️‼️‼️↓").box[0], 7, "箱の値"));
check("‼ （異体字セレクタなし）も ×2", () => eq(bigwave("🌊‼‼").box[0], 4, "箱の値"));
check("count が0以下はスベる", () => {
  eq(bigwave("🌊↓").box[0], 0, "箱の値");
  eq(bigwave("🌊💥↓").out, "");
});
check("🌞…🌞 のうしろの記号が効く", () => eq(bigwave("🌞Fizz🌞‼️").out, "FizzFizz"));
check("最初の命令より前の記号は無視", () => eq(bigwave("‼️↑🌊").box[0], 1, "箱の値"));
check("255 に +1 で 0 に戻る", () => eq(bigwave("🌊‼️‼️‼️‼️‼️‼️‼️‼️").box[0], 0, "箱の値"));
check("0 に −1 で 255", () => eq(bigwave("🐚").box[0], 255, "箱の値"));
check("命令以外は飾り", () => eq(bigwave("Yeah～🇯🇲🌞A🌞").out, "A"));

// ---- 🌺🌈🐬 ----
console.log("■ 🌺🌈🐬");
check("0 なら 🌺 側を実行", () => eq(bigwave("🌺🌞A🌞🌈🌞B🌞🐬").out, "A"));
check("0 でなければ 🌈 側を実行", () => eq(bigwave("🌊🌺🌞A🌞🌈🌞B🌞🐬").out, "B"));
check("🌈 省略・0 でなければ飛ばす", () => eq(bigwave("🌊🌺🌞A🌞🐬🌞C🌞").out, "C"));

// ---- 入力 💃👙 ----
console.log("■ 入力 💃👙");
check("💃💥 で1文字をそのまま返す", () => eq(bigwave("💃💥", "A").out, "A"));
check("💃 は文字の番号を入れる", () => eq(bigwave("💃🐠", "A").out, "65"));
check("💃 は256で割った余り（あ=12354 → 66）", () => eq(bigwave("💃🐠", "あ").out, "66"));
check("💃‼️ は2文字読んで最後の文字が残る", () => eq(bigwave("💃‼️💥", "AB").out, "B"));
check("💃 入力の終わりなら0", () => eq(bigwave("🌊💃🐠", "").out, "0"));
check("💃 で終わりまで読むループ", () => eq(bigwave("💃🌴💥💃🍧", "abc").out, "abc"));
check("👙 で1行をそのまま出力", () => eq(bigwave("🌞こんにちは、🌞👙🌞さん！🌞", "たろう").out, "こんにちは、たろうさん！"));
check("👙‼️ は2行読む（改行は出力しない）", () => eq(bigwave("👙‼️", "a\nb\nc").out, "ab"));
check("👙 は絵文字も壊さない", () => eq(bigwave("👙", "🇯🇲‼️🌊").out, "🇯🇲‼️🌊"));
check("👙 入力の終わりなら何も出さない", () => eq(bigwave("👙👙", "a").out, "a"));
check("👙 と 💃 は同じ入力を続きから読む", () => eq(bigwave("👙💃💥", "a\nb").out, "ab"));
check("入力の改行 CRLF も1行として扱う", () => eq(bigwave("👙🌞/🌞👙", "a\r\nb").out, "a/b"));

// ---- エラー ----
console.log("■ エラー");
check("🍧 に対応する 🌴 がない", () => throwsBW("🍧", "🍧 に対応する 🌴"));
check("🌴 が閉じていない", () => throwsBW("🌴", "🌴 が閉じていません"));
check("🌈 の前に 🌺 がない", () => throwsBW("🌈", "🌈 の前に"));
check("🌈 の重複", () => throwsBW("🌺🌈🌈🐬", "🌈 の前に"));
check("🐬 に対応する 🌺 がない", () => throwsBW("🐬", "🐬 に対応する 🌺"));
check("🌺 が閉じていない", () => throwsBW("🌺", "🌺 が閉じていません"));
check("🌞 が閉じていない", () => throwsBW("🌞abc", "🌞 が閉じていません"));
check("テンション上がりすぎ", () => throwsBW("🌊" + "‼️".repeat(31), "テンションが上がりすぎ"));
check("無限ループ", () => throwsBW("🌊🌴🍧", "ループが終わりません"));
check("左端より左", () => throwsBW("🏊", "最初の箱より左"));
check("箱 30000 個を超える", () => throwsBW("🏄" + "‼️".repeat(15), "沖に出すぎ"));
check("出力が多すぎ", () => throwsBW("🌊🌴🌞abc🌞🍧", "出力が多すぎ"));

// ---- サイトとの同期 ----
console.log("■ サイト");
check("index.html のインタプリタが bigwave.js と同じ（ずれていたら node build.js）", () => {
  const js = fs.readFileSync(path.join(__dirname, "bigwave.js"), "utf8");
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const norm = s => s.replace(/\r\n?/g, "\n");
  if (norm(extract(js, "bigwave.js").body) !== norm(extract(html, "index.html").body)) {
    throw new Error("ずれています。node build.js を実行してください。");
  }
});

console.log(`\n${pass} 件成功 / ${fail} 件失敗`);
process.exitCode = fail ? 1 : 0;
