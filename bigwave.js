// BigWave インタプリタ（正本）
// ここを直したら `node build.js` で index.html に反映する。
// 目印コメントの間だけが index.html に埋め込まれる。

/* ===== interpreter ===== */
class BWError extends Error {}
function bigwave(code, input=""){
  const OPS = ["🏄","🏊","🌊","🐚","💥","🐠","💃","👙","🌴","🍧","🌺","🌈","🐬"];
  const seg = new Intl.Segmenter("ja",{granularity:"grapheme"});
  const chars = [...seg.segment(code)].map(s=>s.segment);
  // 入力も見た目の1文字ずつに分ける（改行は \n に揃える）。ip は次に読む位置
  const inp = [...seg.segment(input.replace(/\r\n?/g,"\n"))].map(s=>s.segment);
  let ip = 0;

  const cmds = [];
  for (let k=0; k<chars.length; k++){
    const c = chars[k];
    const last = cmds[cmds.length-1];
    if (c==="🌞"){
      const end = chars.indexOf("🌞", k+1);
      if (end<0) throw new BWError("🌞 が閉じていません。文字のうしろにもう1つ 🌞 を置いてください。");
      cmds.push({op:"🌞", count:1, text:chars.slice(k+1,end).join("")});
      k = end; continue;
    }
    if (OPS.includes(c)) { cmds.push({op:c,count:1}); continue; }
    if (!last) continue;
    if (c==="↑") last.count += 1;
    else if (c==="↓") last.count -= 1;
    else if (c==="‼️"||c==="‼") last.count *= 2;
    if (Math.abs(last.count) > 1e9) throw new BWError("テンションが上がりすぎて波を制御できません。‼️を減らしてください。");
  }

  const jump = {}, stack = [];
  cmds.forEach((cmd,i)=>{
    const top = stack[stack.length-1];
    if (cmd.op==="🌴" || cmd.op==="🌺") stack.push({i, op:cmd.op, els:null});
    else if (cmd.op==="🍧"){
      if (!top || top.op!=="🌴") throw new BWError("🍧 に対応する 🌴 がありません。");
      stack.pop(); jump[i]=top.i; jump[top.i]=i;
    }
    else if (cmd.op==="🌈"){
      if (!top || top.op!=="🌺" || top.els!==null) throw new BWError("🌈 の前に対応する 🌺 がありません。");
      top.els = i;
    }
    else if (cmd.op==="🐬"){
      if (!top || top.op!=="🌺") throw new BWError("🐬 に対応する 🌺 がありません。");
      stack.pop();
      jump[top.i] = top.els!==null ? top.els : i;
      if (top.els!==null) jump[top.els] = i;
    }
  });
  if (stack.length){
    const t = stack[stack.length-1];
    throw new BWError(t.op==="🌴" ? "🌴 が閉じていません。🍧 を足してください。" : "🌺 が閉じていません。🐬 を足してください。");
  }

  const box = new Array(30000).fill(0);
  let p = 0, out = "", steps = 0;
  for (let i=0;i<cmds.length;i++){
    if (++steps > 5e6) throw new BWError("ループが終わりません。🌴〜🍧 の中で箱が0になるか確認してください。");
    const {op,count,text} = cmds[i];
    if (op==="🌴"){ if (box[p]===0) i=jump[i]; continue; }
    if (op==="🍧"){ if (box[p]!==0) i=jump[i]; continue; }
    if (op==="🌺"){ if (box[p]!==0) i=jump[i]; continue; }
    if (op==="🌈"){ i=jump[i]; continue; }
    if (op==="🐬") continue;
    if (count<=0) continue;
    if (op==="🏄"){ p+=count; if (p>=box.length) throw new BWError("沖に出すぎました。箱は30000個までです。"); }
    else if (op==="🏊"){ p-=count; if (p<0) throw new BWError("最初の箱より左には戻れません。"); }
    else if (op==="🌊") box[p]=(box[p]+count)%256;
    else if (op==="🐚") box[p]=((box[p]-count)%256+256)%256;
    else if (op==="💥"){
      if (out.length+count>100000) throw new BWError("出力が多すぎます。");
      out += String.fromCharCode(box[p]).repeat(count);
    }
    else if (op==="🌞"){
      if (out.length+text.length*count>100000) throw new BWError("出力が多すぎます。");
      out += text.repeat(count);
    }
    else if (op==="🐠"){
      const n = String(box[p]);
      if (out.length+n.length*count>100000) throw new BWError("出力が多すぎます。");
      out += n.repeat(count);
    }
    else if (op==="💃"){
      // count 文字読んで、最後に読んだ文字の番号を256で割った余りを入れる。入力の終わりなら0
      if (count <= inp.length-ip){ ip += count; box[p] = inp[ip-1].codePointAt(0)%256; }
      else { ip = inp.length; box[p] = 0; }
    }
    else if (op==="👙"){
      // count 行読んで、そのまま出力する（改行は出力しない）。入力の終わりなら何もしない
      for (let r=0; r<count && ip<inp.length; r++){
        let e = inp.indexOf("\n", ip);
        if (e<0) e = inp.length;
        const line = inp.slice(ip, e).join("");
        if (out.length+line.length>100000) throw new BWError("出力が多すぎます。");
        out += line; ip = e+1;
      }
    }
  }
  return {out, box, p, steps};
}
/* ===== end interpreter ===== */

// Node から require できるようにする（ブラウザでは module がないので何もしない）
if (typeof module !== "undefined") module.exports = { bigwave, BWError };
