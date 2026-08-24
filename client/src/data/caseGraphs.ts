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

/** The 3-root taxonomy CaseGalaxy clusters cases under (แพ่ง/อาญา/ระหว่างประเทศ)
 * - a separate, coarser grouping from domainId (which picks which ประมวล
 * domain/camera the Home.tsx nexus focuses on). A case's laws can span more
 * than one domainId (see syamol-forensic citing both criminal and crimpro),
 * but it still has exactly one galaxy category. */
export type CaseCategory = "civil" | "criminal" | "international";

export type CaseGraphData = {
  id: string;
  title: string;
  subtitle: string;
  domainId: string;
  category: CaseCategory;
  issues: CaseIssue[];
  /** Link out to the real news write-up on coolunclelab.com's "โหมดอ่านข่าว"
   * (news-reading mode) for this case, opened in a new tab from the คดี
   * menu. Omit for a case with no matching real-world write-up yet. */
  newsUrl?: string;
};

export const caseGraphs: Record<string, CaseGraphData> = {
  "serm-jenjira": {
    id: "serm-jenjira",
    title: "คดี: เสริม–เจนจิรา",
    subtitle: "สถานการณ์สมมติเพื่อการศึกษา — คดีฆาตกรรมหั่นศพ",
    domainId: "criminal",
    category: "criminal",
    newsUrl: "https://coolunclelab.com/news-case-khdii-serm-sakonrat-2541.html",
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
  "syamol-forensic": {
    id: "syamol-forensic",
    title: "คดี: ศยามล",
    subtitle: "สถานการณ์สมมติเพื่อการศึกษา — คดีจ้างวานฆ่าด้วยพยานหลักฐานนิติวิทยาศาสตร์",
    domainId: "criminal",
    category: "criminal",
    newsUrl: "https://coolunclelab.com/news-case-khdii-syamol-forensic-2536.html",
    issues: [
      {
        id: "hired-murder",
        title: "การจ้างวานฆ่าโดยไตร่ตรองไว้ก่อน",
        summary: "อดีตสามีจ้างวานกลุ่มมือปืนให้ฆ่าอดีตภรรยา ผู้ใช้ให้ผู้อื่นกระทำความผิดต้องรับโทษเสมือนเป็นตัวการ และเมื่อเป็นการฆ่าโดยไตร่ตรองไว้ก่อน โทษคือประหารชีวิต",
        laws: [
          { book: "criminal", number: "288", label: "ฆ่าผู้อื่น" },
          { book: "criminal", number: "289", label: "ฆ่าโดยไตร่ตรองไว้ก่อน" },
          { book: "criminal", number: "84", label: "ผู้ใช้ให้ผู้อื่นกระทำความผิด" },
        ],
      },
      {
        id: "forensic-evidence",
        title: "พยานหลักฐานทางนิติวิทยาศาสตร์",
        summary: "คดีแรกๆ ของไทยที่ใช้การตรวจ DNA คลี่คลายคดีอย่างเต็มรูปแบบ สร้างบรรทัดฐานให้ศาลรับฟังพยานหลักฐานทางวิทยาศาสตร์แทนพยานบุคคลเพียงอย่างเดียว",
        laws: [{ book: "crimpro", number: "226/2", label: "การรับฟังพยานหลักฐานทางวิทยาศาสตร์" }],
      },
    ],
  },
};

export const DEFAULT_CASE_ID = "serm-jenjira";
