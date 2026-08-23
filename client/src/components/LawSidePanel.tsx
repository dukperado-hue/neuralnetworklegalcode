/** แผงรายละเอียดมาตรา — ดึงเนื้อหาจริงจาก codex-data.json ของ coolunclelab.com เมื่อผู้ใช้คลิกโหนดมาตรา */
import { useEffect, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { CODEX_BOOK_LABELS, codexSearchUrl, fetchCodexArticle, type CodexArticle } from "@/lib/codexData";
import type { CaseLawRef } from "@/data/caseGraphs";

type LawSidePanelProps = {
  selection: { law: CaseLawRef; issueTitle: string } | null;
  onClose: () => void;
};

type LoadState = { status: "loading" } | { status: "error" } | { status: "ready"; article: CodexArticle | null };

export default function LawSidePanel({ selection, onClose }: LawSidePanelProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!selection) return;
    let cancelled = false;
    setState({ status: "loading" });
    fetchCodexArticle(selection.law.book, selection.law.number)
      .then((article) => { if (!cancelled) setState({ status: "ready", article }); })
      .catch(() => { if (!cancelled) setState({ status: "error" }); });
    return () => { cancelled = true; };
  }, [selection]);

  if (!selection) return null;
  const bookLabel = CODEX_BOOK_LABELS[selection.law.book] ?? selection.law.book;

  return (
    <aside className="law-side-panel" aria-label="รายละเอียดมาตรากฎหมาย">
      <button className="law-side-panel__close" onClick={onClose} aria-label="ปิดแผงรายละเอียด"><X size={16} /></button>
      <div className="law-side-panel__eyebrow">{selection.issueTitle}</div>
      <h2>มาตรา {selection.law.number}</h2>
      <div className="law-side-panel__book">{bookLabel}</div>

      {state.status === "loading" && <p className="law-side-panel__status">กำลังดึงเนื้อหามาตราจากประมวล.com…</p>}
      {state.status === "error" && <p className="law-side-panel__status law-side-panel__status--error">ดึงข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง</p>}
      {state.status === "ready" && !state.article && <p className="law-side-panel__status">ยังไม่มีเนื้อหามาตรานี้ในฐานข้อมูล</p>}
      {state.status === "ready" && state.article && (
        <>
          {state.article.meta?.laksanaTitle && (
            <div className="law-side-panel__breadcrumb">
              {[state.article.meta.phaakTitle, state.article.meta.laksanaTitle, state.article.meta.muadTitle].filter(Boolean).join(" · ")}
            </div>
          )}
          <p className="law-side-panel__text">{state.article.text}</p>
          {state.article.lectureNotes && state.article.lectureNotes.length > 0 && (
            <div className="law-side-panel__notes">
              <div className="law-side-panel__notes-label">หลักการสำคัญ</div>
              {state.article.lectureNotes.map((note) => (
                <p key={note.id}>{note.text}</p>
              ))}
            </div>
          )}
        </>
      )}

      <a className="law-side-panel__link" href={codexSearchUrl(selection.law.book, selection.law.number)} target="_blank" rel="noreferrer">
        เปิดในประมวล.com <ArrowUpRight size={12} />
      </a>
    </aside>
  );
}
