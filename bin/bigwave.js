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

// 💃 か 👙 を使うプログラムのときだけ、標準入力を最後まで読む
// （パイプなら `echo たろう | bigwave hello.bw`、キーボードなら入力後に Ctrl+Z → Enter（Mac/Linux は Ctrl+D））
let input = "";
const seg = new Intl.Segmenter("ja", { granularity: "grapheme" });
const usesInput = [...seg.segment(code)].some(s => s.segment === "💃" || s.segment === "👙");
if (usesInput) {
  if (process.stdin.isTTY) {
    console.error(`入力してください（終わったら ${process.platform === "win32" ? "Ctrl+Z → Enter" : "Ctrl+D"}）`);
  }
  try {
    // Windows の PowerShell から渡すと先頭に BOM（見えない印）が付くことがあるので取り除く
    input = fs.readFileSync(0, "utf8").replace(/^﻿+/, "");
  } catch (e) {
    // 入力がない（閉じている）ときは空として扱う
    if (e.code !== "EOF") throw e;
  }
}

try {
  process.stdout.write(bigwave(code, input).out);
} catch (e) {
  console.error(e instanceof BWError ? `エラー：${e.message}` : `予期しないエラー：${e.message}`);
  process.exit(1);
}
