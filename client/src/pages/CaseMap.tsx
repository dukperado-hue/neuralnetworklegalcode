/** หน้าใหม่: แผนที่ประเด็นกฎหมายแบบ Issue-centric สำหรับคดีตัวอย่าง — เปิดเผยทีละชั้น + side panel ดึงมาตราจริง */
import { useCallback, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import CaseGraph3D from "@/components/CaseGraph3D";
import WebGLBoundary from "@/components/WebGLBoundary";
import LawSidePanel from "@/components/LawSidePanel";
import { caseGraphs, DEFAULT_CASE_ID, type CaseIssue, type CaseLawRef } from "@/data/caseGraphs";

type Selection = { law: CaseLawRef; issueTitle: string } | null;

export default function CaseMap() {
  const params = useParams<{ caseId?: string }>();
  const caseData = caseGraphs[params.caseId ?? ""] ?? caseGraphs[DEFAULT_CASE_ID];

  const [expanded, setExpanded] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [use3D, setUse3D] = useState(true);

  const reset = useCallback(() => {
    setExpanded(false);
    setSelectedIssueId(null);
    setSelection(null);
  }, []);

  const handleSelectIssue = useCallback((issue: CaseIssue) => {
    setSelectedIssueId(issue.id);
    setSelection(null);
  }, []);

  const handleSelectLaw = useCallback((law: CaseLawRef, issueId: string) => {
    const issue = caseData.issues.find((item) => item.id === issueId);
    setSelection({ law, issueTitle: issue?.title ?? "" });
  }, [caseData.issues]);

  const selectedIssue = useMemo(() => caseData.issues.find((issue) => issue.id === selectedIssueId) ?? null, [caseData.issues, selectedIssueId]);

  return (
    <main className="case-map-page">
      <header className="universe-header">
        <div className="header-brand-row">
          <Link href="/" className="brand-lockup" aria-label="กลับสู่แผนที่ประมวลNN">
            <span>
              <strong>{caseData.title}</strong>
              <small>ISSUE-CENTRIC CASE MAP</small>
            </span>
          </Link>
        </div>
        <div className="header-center">
          <span className="header-kicker">{caseData.subtitle}</span>
        </div>
        <div className="header-actions">
          <nav className="route-links" aria-label="เส้นทางเครือข่ายที่เกี่ยวข้อง">
            <Link href="/" className="lab-return"><span>แผนที่ประมวลNN</span></Link>
            <a className="lab-return" href="https://coolunclelab.com" target="_blank" rel="noreferrer"><ArrowUpRight size={12} /> <span>Cool Uncle</span></a>
            <a className="lab-return" href="https://ประมวล.com" target="_blank" rel="noreferrer"><span>ประมวล.com</span></a>
          </nav>
          <button className="text-action" onClick={reset}><RotateCcw size={15} /> เริ่มใหม่</button>
        </div>
      </header>

      <section className="explorer-stage case-map-stage" aria-label="แผนที่ประเด็นกฎหมายของคดี">
        <div className="corner-meta corner-meta--top">
          <span className="status-dot" />
          <span>{!expanded ? "คลิกโหนดคดีเพื่อดูประเด็น" : selectedIssueId ? "คลิกโหนดมาตราเพื่อดูเนื้อหา" : "คลิกประเด็นเพื่อดูมาตราที่เกี่ยวข้อง"}</span>
        </div>

        <div className="legend case-map-legend" aria-label="คำอธิบายสีของโหนด">
          <span><i className="legend-dot case-legend-dot--case" />คดี</span>
          <span><i className="legend-dot case-legend-dot--issue" />ประเด็น</span>
          <span><i className="legend-dot case-legend-dot--law" />มาตรา</span>
        </div>

        {use3D ? (
          <WebGLBoundary onFallback={() => setUse3D(false)}>
            <CaseGraph3D
              caseData={caseData}
              expanded={expanded}
              selectedIssueId={selectedIssueId}
              motionEnabled
              onOpenCase={() => setExpanded(true)}
              onSelectIssue={handleSelectIssue}
              onSelectLaw={handleSelectLaw}
              onReset={reset}
              onFallback={() => setUse3D(false)}
            />
          </WebGLBoundary>
        ) : (
          <div className="case-map-fallback" role="list">
            <button className="case-map-fallback__case" onClick={() => setExpanded((value) => !value)}>{caseData.title}</button>
            {expanded && caseData.issues.map((issue) => (
              <div key={issue.id} className="case-map-fallback__issue-group">
                <button className="case-map-fallback__issue" onClick={() => setSelectedIssueId((value) => (value === issue.id ? null : issue.id))}>{issue.title}</button>
                {selectedIssueId === issue.id && (
                  <div className="case-map-fallback__laws">
                    {issue.laws.map((law) => (
                      <button key={`${law.book}-${law.number}`} className="case-map-fallback__law" onClick={() => handleSelectLaw(law, issue.id)}>ม.{law.number} — {law.label}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedIssue && !selection && (
          <div className="case-map-issue-summary">
            <strong>{selectedIssue.title}</strong>
            <p>{selectedIssue.summary}</p>
          </div>
        )}

        <LawSidePanel selection={selection} onClose={() => setSelection(null)} />
      </section>
    </main>
  );
}
