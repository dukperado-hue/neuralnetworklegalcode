/**
 * ข้อมูลกราฟแบบ Issue-centric: คดี (root) -> ประเด็นกฎหมาย (level 1) -> มาตรา (level 2)
 * เนื้อหามาตราจริงไม่ได้เก็บที่นี่ — ดึงสดจาก codex-data.json ผ่าน lib/codexData เวลาเปิด side panel
 *
 * domainId / anchorMicroNodeId ใช้เชื่อม overlay นี้เข้ากับ node จริงในแผนที่ ประมวลNN หลัก
 * (ForceNetwork3D บนหน้า Home) — ต้องตรงกับ id ของ domain/microNode ใน Home.tsx legalDomains
 */

export type CaseLawRef = { book: string; number: string; label: string; anchorMicroNodeId: string };
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
          { book: "criminal", number: "288", label: "ฆ่าผู้อื่น", anchorMicroNodeId: "crime-life" },
          { book: "criminal", number: "289", label: "ฆ่าโดยไตร่ตรองไว้ก่อน", anchorMicroNodeId: "crime-life" },
        ],
      },
      {
        id: "conceal-corpse",
        title: "การซ่อนเร้นทำลายศพ",
        summary: "ประเด็นความรับผิดฐานย้าย ซ่อนเร้น หรือทำลายศพเพื่อปิดบังเหตุแห่งการตาย",
        laws: [{ book: "criminal", number: "199", label: "ซ่อนเร้น ย้าย หรือทำลายศพ", anchorMicroNodeId: "crime-justice" }],
      },
    ],
  },
};

export const DEFAULT_CASE_ID = "serm-jenjira";
