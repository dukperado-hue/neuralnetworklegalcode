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
export type CaseIssue = {
  id: string;
  title: string;
  summary: string;
  laws: CaseLawRef[];
  /** Why THIS specific nexus node exists - the real court's own reasoning
   * on this issue, distilled from the case's "ประเด็นกฎหมายที่คดีนี้ถาม"
   * section on its newsUrl page (same source as the case-level `basedOn`,
   * just the slice of it that maps to this particular issue). Shown when
   * the user clicks the issue node in the nexus overlay. Omit for an issue
   * with no real ruling behind it - the panel falls back to a note that
   * it's a hypothetical scenario. */
  reasoning?: string;
};
export type CaseGraphData = {
  id: string;
  title: string;
  subtitle: string;
  domainId: string;
  issues: CaseIssue[];
  /** Link out to the real news write-up on coolunclelab.com's "โหมดอ่านข่าว"
   * (news-reading mode) for this case, opened in a new tab from the คดี
   * menu. Omit for a case with no matching real-world write-up yet. */
  newsUrl?: string;
  /** One-line grounding note - why this nexus exists, distilled from the
   * real ฎีกา/case's own "ประเด็นกฎหมายที่คดีนี้ถาม" section on its newsUrl
   * page (not re-derived here - see that page for the full write-up).
   * Shown directly in the คดี menu so it's readable without hovering. Omit
   * for a case built from a purely pedagogical/exam-sourced fact pattern
   * with no real court precedent behind it - the menu falls back to
   * `subtitle` alone for those. */
  basedOn?: string;
};

export const caseGraphs: Record<string, CaseGraphData> = {
  "serm-jenjira": {
    id: "serm-jenjira",
    title: "คดี: เสริม–เจนจิรา",
    subtitle: "สถานการณ์สมมติเพื่อการศึกษา — คดีฆาตกรรมหั่นศพ",
    domainId: "criminal",
    newsUrl: "https://coolunclelab.com/news-case-khdii-serm-sakonrat-2541.html",
    basedOn: "จากคดีจริง เสริม สาครราษฎร์ (2541) — ศาลฎีกาปี 2545 ลดโทษจากประหารชีวิตเหลือจำคุกตลอดชีวิต เพราะจำเลยรับสารภาพเป็นประโยชน์ต่อการพิจารณา",
    issues: [
      {
        id: "murder",
        title: "การฆาตกรรม",
        summary: "ประเด็นความรับผิดฐานฆ่าผู้อื่นโดยเจตนา และเหตุฉกรรจ์จากการไตร่ตรองไว้ก่อน",
        laws: [
          { book: "criminal", number: "288", label: "ฆ่าผู้อื่น" },
          { book: "criminal", number: "289", label: "ฆ่าโดยไตร่ตรองไว้ก่อน" },
        ],
        reasoning: "ศาลชั้นต้นเห็นว่าเป็นการกระทำที่โหดเหี้ยมผิดวิสัยมนุษย์ พิพากษาประหารชีวิต ก่อนศาลฎีกาปี 2545 ลดโทษเหลือจำคุกตลอดชีวิต เพราะจำเลยให้การรับสารภาพซึ่งเป็นประโยชน์อย่างยิ่งต่อการพิจารณา (ป.อ. มาตรา 78)",
      },
      {
        id: "conceal-corpse",
        title: "การซ่อนเร้นทำลายศพ",
        summary: "ประเด็นความรับผิดฐานย้าย ซ่อนเร้น หรือทำลายศพเพื่อปิดบังเหตุแห่งการตาย",
        laws: [{ book: "criminal", number: "199", label: "ซ่อนเร้น ย้าย หรือทำลายศพ" }],
        reasoning: "การทำลายศพเป็นความผิดแยกต่างหากตาม ป.อ. มาตรา 199 แต่ในแง่คดีฆาตกรรม ศาลนำพฤติการณ์การหั่นศพมาพิจารณาประกอบเป็นเหตุแสดงถึงความโหดเหี้ยมทารุณของการกระทำด้วย",
      },
    ],
  },
  "syamol-forensic": {
    id: "syamol-forensic",
    title: "คดี: ศยามล",
    subtitle: "สถานการณ์สมมติเพื่อการศึกษา — คดีจ้างวานฆ่าด้วยพยานหลักฐานนิติวิทยาศาสตร์",
    domainId: "criminal",
    newsUrl: "https://coolunclelab.com/news-case-khdii-syamol-forensic-2536.html",
    basedOn: "จากคดีจริง ศยามล (2536) — คดีแรกๆ ของไทยที่ใช้การตรวจ DNA คลี่คลายคดี วางบรรทัดฐานให้ศาลรับฟังพยานหลักฐานทางนิติวิทยาศาสตร์แทนพยานบุคคลเพียงอย่างเดียว",
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
        reasoning: "ศาลพิพากษาประหารชีวิตทั้งอดีตสามีผู้ว่าจ้างและทีมมือปืน — การที่ผู้บงการเป็นแพทย์ผู้มีความรู้และหน้าที่ทางวิชาชีพ สะท้อนปัญหาการใช้ความรู้ทางวิชาชีพในทางที่ผิดเพื่อวางแผนอาชญากรรมที่ซับซ้อน",
      },
      {
        id: "forensic-evidence",
        title: "พยานหลักฐานทางนิติวิทยาศาสตร์",
        summary: "คดีแรกๆ ของไทยที่ใช้การตรวจ DNA คลี่คลายคดีอย่างเต็มรูปแบบ สร้างบรรทัดฐานให้ศาลรับฟังพยานหลักฐานทางวิทยาศาสตร์แทนพยานบุคคลเพียงอย่างเดียว",
        laws: [{ book: "crimpro", number: "226/2", label: "การรับฟังพยานหลักฐานทางวิทยาศาสตร์" }],
        reasoning: "การตรวจ DNA จากคราบอสุจิและเส้นผมในที่เกิดเหตุ เป็นเทคโนโลยีใหม่ในขณะนั้นที่นำไปสู่การจับกุมทีมฆ่าทั้งหมดได้ สร้างบรรทัดฐานให้ศาลไทยยอมรับพยานหลักฐานทางนิติวิทยาศาสตร์ที่มีความแม่นยำสูง แทนที่จะพึ่งพยานบุคคลเพียงอย่างเดียว",
      },
    ],
  },
  "estate-administrator-removal": {
    id: "estate-administrator-removal",
    title: "คดี: ถอนผู้จัดการมรดก",
    subtitle: "สถานการณ์สมมติเพื่อการศึกษา — พินัยกรรมปลอมและการวินิจฉัยชี้ขาดเบื้องต้น",
    domainId: "civil",
    issues: [
      {
        id: "estate-concealment",
        title: "การกำจัดทายาทมิให้รับมรดก",
        summary: "ทายาทฝ่ายหนึ่งขอให้ศาลวินิจฉัยว่าอีกฝ่ายถูกกำจัดมิให้รับมรดก เพราะปิดบังซ่อนเร้นหรือยักยอกทรัพย์มรดกเท่าส่วนที่ตนจะได้",
        laws: [{ book: "civil", number: "1605", label: "กำจัดทายาทผู้ปิดบัง/ยักยอกทรัพย์มรดก" }],
      },
      {
        id: "preliminary-ruling",
        title: "การวินิจฉัยชี้ขาดเบื้องต้นในปัญหาข้อกฎหมาย",
        summary: "คู่ความขอให้ศาลชี้ขาดปัญหาข้อกฎหมายก่อนสืบพยาน แต่ศาลมีดุลพินิจ (\"เมื่อศาลเห็นสมควร\") ไม่จำต้องวินิจฉัยทันทีเสมอไป โดยเฉพาะเมื่อยังมีปัญหาข้อเท็จจริงที่ต้องสืบให้ได้ความก่อน",
        laws: [{ book: "civpro", number: "24", label: "การวินิจฉัยชี้ขาดเบื้องต้นในปัญหาข้อกฎหมาย" }],
      },
    ],
  },
};

export const DEFAULT_CASE_ID = "serm-jenjira";
