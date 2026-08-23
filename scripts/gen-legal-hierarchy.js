// Generates client/src/data/legalHierarchy.generated.ts from live codex-data.json
// Real บรรพ/ภาค->ลักษณะ->หมวด->ส่วน->มาตรา taxonomy, mined from per-article meta
// (the same classification codex-search.html itself uses) rather than hand-typed.
const fs = require("fs");

const CODEX_PATH = process.argv[2];
const OUT_PATH = process.argv[3];

const data = JSON.parse(fs.readFileSync(CODEX_PATH, "utf8"));

function numKey(n) {
  const m = String(n).match(/^(\d+)(?:\/(\d+))?/);
  if (!m) return [999999, 0];
  return [parseInt(m[1], 10), m[2] ? parseInt(m[2], 10) : 0];
}

function slug(s) {
  return String(s)
    .replace(/[^\wก-๙]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

// --- known upstream data corrections (verified against real article text) ---
function patchMeta(book, number, meta) {
  const m = { ...meta };
  if (book === "criminal") {
    const [n] = numKey(number);
    if (n === 1) {
      m.muad = m.muad ?? "หมวด 1";
      m.muadTitle = m.muadTitle ?? "บทนิยาม";
    }
    if (n <= 101 && !m.laksana) {
      m.laksana = "ลักษณะ 1";
      m.laksanaTitle = "บทบัญญัติที่ใช้แก่ความผิดทั่วไป";
    }
    if (n <= 106 && !m.phaak) {
      m.phaak = "ภาค 1";
      m.phaakTitle = "บทบัญญัติทั่วไป";
    }
  }
  if (book === "civil") {
    const [n] = numKey(number);
    // upstream mislabels 754-769 (จำนำ content) as ลักษณะ 22 ว่าด้วยการโอนหุ้นหรือหุ้นกู้
    if (n >= 754 && n <= 769 && m.laksana === "ลักษณะ 22") {
      m.laksana = "ลักษณะ 13";
      m.laksanaTitle = "จำนำ";
    }
    if (n >= 754 && n <= 757 && !m.muad) {
      m.muad = "หมวด 1";
      m.muadTitle = "บทเบ็ดเสร็จทั่วไป";
    }
  }
  return m;
}

function buildTree(bookId, idPrefix) {
  const book = data.books[bookId];
  const arts = Object.values(book.articles).sort((a, b) => {
    const ka = numKey(a.number), kb = numKey(b.number);
    return ka[0] - kb[0] || ka[1] - kb[1];
  });

  // root: map of phaak -> laksana -> muad -> suan -> [articles]
  const root = { key: "__root", title: null, children: new Map(), articles: [] };

  for (const a of arts) {
    const meta = patchMeta(bookId, a.number, a.meta || {});
    const chain = [
      meta.phaak ? { code: meta.phaak, title: meta.phaakTitle } : null,
      meta.laksana ? { code: meta.laksana, title: meta.laksanaTitle } : null,
      meta.muad ? { code: meta.muad, title: meta.muadTitle } : null,
      meta.suan ? { code: meta.suan, title: meta.suanTitle } : null,
    ].filter(Boolean);

    let node = root;
    for (const level of chain) {
      const key = level.code;
      if (!node.children.has(key)) {
        node.children.set(key, { key, code: level.code, title: level.title, children: new Map(), articles: [] });
      }
      node = node.children.get(key);
    }
    node.articles.push(a);
  }
  return { root, bookId, idPrefix };
}

// derive a short, real-text-grounded label for a leaf มาตรา node
function shortLabel(text) {
  let t = (text || "").replace(/\s+/g, " ").trim();
  t = t.replace(/^ผู้ใด/, "").trim();
  // cut at first strong clause boundary
  const cutMarks = ["ต้องระวางโทษ", " เว้นแต่", " ต้อง", "หมายความว่า", "ได้แก่"];
  let cut = t.length;
  for (const mark of cutMarks) {
    const idx = t.indexOf(mark);
    if (idx > 4 && idx < cut) cut = idx;
  }
  const MAXLEN = 46;
  if (cut > MAXLEN) {
    // Thai script has no spaces between words within a clause, only between
    // clauses - a hard character cut risks slicing mid-word. Extend to the
    // next clause-level space instead, within a small margin.
    const nextSpace = t.indexOf(" ", MAXLEN);
    cut = nextSpace !== -1 && nextSpace < MAXLEN + 35 ? nextSpace : MAXLEN;
  }
  let label = t.slice(0, cut).trim().replace(/[,\s]+$/, "");
  return label || "(ไม่มีชื่อย่อ)";
}

function rangeLabel(articles) {
  if (articles.length === 1) return articles[0].number;
  const sorted = [...articles].sort((a, b) => {
    const ka = numKey(a.number), kb = numKey(b.number);
    return ka[0] - kb[0] || ka[1] - kb[1];
  });
  return `${sorted[0].number}–${sorted[sorted.length - 1].number}`;
}

function toNode(group, idPrefix, path) {
  const id = `${idPrefix}-${slug(path.join("-"))}`;
  const label = group.title ? `${group.code} · ${group.title}` : group.code;
  const childGroups = Array.from(group.children.values());
  const children = [];

  for (const child of childGroups) {
    children.push(toNode(child, idPrefix, [...path, child.code]));
  }
  // direct articles at this level become leaf มาตรา nodes
  for (const a of group.articles) {
    children.push({
      id: `${idPrefix}-art-${slug(a.number)}`,
      label: shortLabel(a.text),
      book: idPrefix,
      number: a.number,
    });
  }

  return {
    id,
    label,
    range: rangeLabel([...group.articles, ...flattenArticles(childGroups)]),
    children: children.length ? children : undefined,
  };
}

function flattenArticles(groups) {
  const out = [];
  for (const g of groups) {
    out.push(...g.articles);
    out.push(...flattenArticles(Array.from(g.children.values())));
  }
  return out;
}

function build(bookId, idPrefix) {
  const { root } = buildTree(bookId, idPrefix);
  const topGroups = Array.from(root.children.values());
  return topGroups.map((g) => toNode(g, idPrefix, [g.code]));
}

const civil = build("civil", "civil");
const criminal = build("criminal", "criminal");

function countNodes(nodes) {
  let n = 0;
  for (const node of nodes) {
    n += 1;
    if (node.children) n += countNodes(node.children);
  }
  return n;
}
console.error("civil top-level (บรรพ):", civil.length, "total nodes:", countNodes(civil));
console.error("criminal top-level (ภาค):", criminal.length, "total nodes:", countNodes(criminal));

const header = `/**
 * Auto-generated from codex-data.json's real บรรพ/ภาค -> ลักษณะ -> หมวด -> ส่วน -> มาตรา
 * classification metadata (the same taxonomy codex-search.html uses).
 * Regenerate via scratchpad gen_hierarchy.js if the source data changes; do not hand-edit.
 */
import type { LegalNode } from "@/pages/Home";

`;

const body =
  `export const civilHierarchy: LegalNode[] = ${JSON.stringify(civil, null, 2)};\n\n` +
  `export const criminalHierarchy: LegalNode[] = ${JSON.stringify(criminal, null, 2)};\n`;

fs.writeFileSync(OUT_PATH, header + body, "utf8");
console.error("wrote", OUT_PATH);
