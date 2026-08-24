/** แผงอธิบาย "ทำไมเกิด nexus node นี้ขึ้น" — เหตุผลทางกฎหมายจริงของประเด็นในคดี เมื่อผู้ใช้คลิกโหนดประเด็นในภาพรวมคดี */
import { ArrowUpRight, X } from "lucide-react";
import type { CaseGraphData, CaseIssue } from "@/data/caseGraphs";

type CaseIssuePanelProps = {
  selection: { issue: CaseIssue; caseData: CaseGraphData } | null;
  onClose: () => void;
};

export default function CaseIssuePanel({ selection, onClose }: CaseIssuePanelProps) {
  if (!selection) return null;
  const { issue, caseData } = selection;

  return (
    <aside className="law-side-panel" aria-label="เหตุผลของประเด็นในคดี">
      <button className="law-side-panel__close" onClick={onClose} aria-label="ปิดแผงรายละเอียด"><X size={16} /></button>
      <div className="law-side-panel__eyebrow">{caseData.title}</div>
      <h2>{issue.title}</h2>
      <p className="law-side-panel__text">{issue.summary}</p>

      {issue.reasoning ? (
        <div className="law-side-panel__notes">
          <div className="law-side-panel__notes-label">เหตุผลจริงจากคดี</div>
          <p>{issue.reasoning}</p>
        </div>
      ) : (
        <p className="law-side-panel__status">ประเด็นนี้เป็นสถานการณ์สมมติเพื่อการศึกษา ไม่มีคำวินิจฉัยจริงของศาลอ้างอิงในส่วนนี้</p>
      )}

      {caseData.newsUrl && (
        <a className="law-side-panel__link" href={caseData.newsUrl} target="_blank" rel="noreferrer">
          อ่านข่าวคดีเต็ม <ArrowUpRight size={12} />
        </a>
      )}
    </aside>
  );
}
