// แสดงคะแนนและระดับความเครียดจากพารามิเตอร์ score

import { requireAuth } from "./guard.js";
import { levelOf } from "./data.js";

requireAuth().then(() => {
  const params = new URLSearchParams(location.search);
  const score = Number(params.get("score"));
  if (!Number.isFinite(score)) { location.replace("board.html"); return; }

  const level = levelOf(score);
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level.label;
  document.getElementById("note").textContent = level.note;
  const link = document.getElementById("result-next");
  if (params.get("source") === "retake") link.textContent = "กลับไปดูประวัติบนหน้าหลัก";
});
