/**
 * ข้อมูลกราฟแบบ Issue-centric: คดี (root) -> ประเด็นกฎหมาย (level 1) -> มาตรา (level 2)
 * เนื้อหามาตราจริงไม่ได้เก็บที่นี่ — ดึงสดจาก codex-data.json ผ่าน lib/codexData เวลาเปิด side panel
 *
 * The nexus overlay (Home.tsx caseOverlay2D) positions itself as a
 * self-contained radial diagram centered on the viewport - it no longer
 * anchors into the background legal-domain map's node positions, so only
 * domainId (which domain to focus the camera on) and book+number (for the
 * codex fetch) are needed here.
 */

export type CaseLawRef = {
  book: string;
  number: string;
  label: string;
  /** @deprecated only read by the separate 3D mode (ForceNetwork3D.tsx, out
   * of scope for the 2D map rewrite); no longer set or used for positioning. */
  anchorMicroNodeId?: string;
};
export type CaseIssue = { id: string; title: string; summary: string; laws: CaseLawRef[] };
export type CaseGraphData = { id: string; title: string; subtitle: string; domainId: string; issues: CaseIssue[] };

export const caseGraphs: Record<string, CaseGraphData> = {
  "serm-jenjira": {
    id: "serm-jenjira",
    title: "คดี: เสริม–เจนจิรา",
    subtitle: "สถานการณ์สมมติเพื่อการศึกษา — คดีฆาตกรรมหั่นศพ",
    domainId: "criminal",
    issues: [
      {
        id: "murder",
        title: "การฆาตกรรม",
        summary: "ประเด็นความรับผิดฐานฆ่าผู้อื่นโดยเจตนา และเหตุฉกรรจ์จากการไตร่ตรองไว้ก่อน",
        laws: [
          { book: "criminal", number: "288", label: "ฆ่าผู้อื่น" },
          { book: "criminal", number: "289", label: "ฆ่าโดยไตร่ตรองไว้ก่อน" },
        ],
      },
      {
        id: "conceal-corpse",
        title: "การซ่อนเร้นทำลายศพ",
        summary: "ประเด็นความรับผิดฐานย้าย ซ่อนเร้น หรือทำลายศพเพื่อปิดบังเหตุแห่งการตาย",
        laws: [{ book: "criminal", number: "199", label: "ซ่อนเร้น ย้าย หรือทำลายศพ" }],
      },
    ],
  },
};

export const DEFAULT_CASE_ID = "serm-jenjira";
