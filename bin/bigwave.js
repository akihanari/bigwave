#!/usr/bin/env node
// BigWave コマンド
// 使い方：bigwave ファイル名.bw

const fs = require("fs");
const { bigwave, BWError } = require("../bigwave.js");

const file = process.argv[2];
if (!file) {
  console.error("使い方：bigwave ファイル名.bw");
  process.exit(1);
}

let code;
try {
  // 改行を \n に揃える（ブラウザのプレイグラウンドと同じ出力にするため）
  code = fs.readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
} catch (e) {
  console.error(`ファイルが読めません：${file}`);
  process.exit(1);
}

try {
  process.stdout.write(bigwave(code).out);
} catch (e) {
  console.error(e instanceof BWError ? `エラー：${e.message}` : `予期しないエラー：${e.message}`);
  process.exit(1);
}
