/**
 * รัศมีนิติธรรม — แผนที่ความรู้กฎหมายแบบ organic radial constellation
 * จังหวะภาพ: ivory editorial canvas + color-family nodes + restrained orbital motion.
 */
import { Fragment, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { Link } from "wouter";
import ForceNetwork3D from "@/components/ForceNetwork3D";
import WebGLBoundary from "@/components/WebGLBoundary";
import LawSidePanel from "@/components/LawSidePanel";
import { caseGraphs, DEFAULT_CASE_ID, type CaseLawRef } from "@/data/caseGraphs";
import { civilHierarchy, criminalHierarchy } from "@/data/legalHierarchy.generated";
import {
  ArrowUpRight,
  ChevronRight,
  Crosshair,
  GitBranch,
  Layers2,
  Link2,
  List,
  Music2,
  Orbit,
  Network,
  RotateCcw,
  Scale,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const BACKGROUND_MUSIC_SRC = `${import.meta.env.BASE_URL}music/alex-morgan-jazz-restaurant-music-556244.mp3`;

// Generic recursive node: covers every tier below "subject" (ลักษณะ, หมวด,
// ส่วน, and finally มาตรา leaves) for both the hand-placed legacy domains
// (dx/dy/radius given explicitly) and the auto-generated civil/criminal
// hierarchy (dx/dy/radius omitted -> positioned automatically at render time).
export type LegalNode = {
  id: string;
  label: string;
  range?: string; // มาตรา span, e.g. "149–193" — rendered on its own line below label
  dx?: number;
  dy?: number;
  radius?: number;
  book?: string; // set only on มาตรา leaves, for LawSidePanel fetch
  number?: string; // set only on มาตรา leaves
  children?: LegalNode[];
};

type LegalSubject = {
  id: string;
  label: string;
  range?: string;
  x: number;
  y: number;
  radius: number;
  description: string;
  references: string[];
  children?: LegalNode[];
};

type LegalDomain = {
  id: string;
  shortLabel: string;
  title: string;
  abbreviation: string;
  color: string;
  softColor: string;
  x: number;
  y: number;
  radius: number;
  description: string;
  children: LegalSubject[];
};

// Positions a sibling node on a ring around its parent. Radius grows with the
// number of siblings so dense levels (e.g. 23 ลักษณะ under ภาค 2) don't
// overlap, while sparse levels stay compact. Used for every tier that has no
// hand-placed dx/dy (i.e. anything coming out of the auto-generated
// civil/criminal hierarchy).
function autoRadialPosition(centerX: number, centerY: number, index: number, count: number, baseRadius: number) {
  const angle = (index / Math.max(1, count)) * Math.PI * 2 - Math.PI / 2;
  const radius = Math.min(baseRadius * 2.1, Math.max(baseRadius, baseRadius * 0.55 + count * 7.5));
  return { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
}

function countLeaves(node: LegalNode): number {
  if (!node.children) return 1;
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

// Turns a top-level auto-generated tier (บรรพ for civil, already-placed for
// criminal) into LegalSubject entries laid out radially around the domain.
function buildBookSubjects(nodes: LegalNode[], centerX: number, centerY: number, ringRadius: number): LegalSubject[] {
  return nodes.map((node, index) => {
    const pos = autoRadialPosition(centerX, centerY, index, nodes.length, ringRadius);
    const weight = Math.log2(1 + countLeaves(node));
    return {
      id: node.id,
      label: node.label,
      range: node.range,
      x: pos.x,
      y: pos.y,
      radius: Math.round(Math.min(34, Math.max(18, weight * 3.2))),
      description: "",
      references: [],
      children: node.children,
    };
  });
}

// Camera scale multiplier per drill depth (1 = domain only, 2 = subject,
// 3 = ลักษณะ, 4 = หมวด, 5 = ส่วน, 6 = deeper still). The deeper we go, the
// more the current focus is blown up so its own children stay legible.
const DEPTH_CAMERA_SCALES = [1, 1.45, 1.72, 2.15, 2.6, 3.05, 3.45];

function cameraScaleForDepth(depth: number) {
  return DEPTH_CAMERA_SCALES[Math.min(depth, DEPTH_CAMERA_SCALES.length - 1)];
}

const legalDomains: LegalDomain[] = [
  {
    id: "civil",
    shortLabel: "แพ่ง",
    title: "ประมวลกฎหมายแพ่งและพาณิชย์",
    abbreviation: "ป.พ.พ.",
    color: "#5FD4E8",
    softColor: "#A4EAF1",
    x: 342,
    y: 277,
    radius: 52,
    description: "เครือข่ายกฎหมายเอกชนสำหรับสำรวจตั้งแต่นิติกรรม สัญญา หนี้ ทรัพย์ ละเมิด ครอบครัว และมรดก",
    children: buildBookSubjects(civilHierarchy, 342, 277, 195),
  },
  {
    id: "criminal",
    shortLabel: "อาญา",
    title: "ประมวลกฎหมายอาญา",
    abbreviation: "ป.อ.",
    color: "#7E3048",
    softColor: "#D99DAE",
    x: 1088,
    y: 235,
    radius: 40,
    description: "เครือข่ายโครงสร้างความผิด ตั้งแต่กฎทั่วไป ฐานความผิดเฉพาะเรื่อง จนถึงลหุโทษ",
    children: [
      {
        id: "criminal-part-1",
        label: "ภาค 1 · ภาคทั่วไป",
        x: 884,
        y: 111,
        radius: 27,
        description: "กฎกติกากลางที่นำไปใช้ร่วมกับความผิดทุกฐาน",
        references: ["มาตรา 1–106", "ภาคทั่วไป"],
        children: criminalHierarchy[0]?.children,
      },
      {
        id: "criminal-part-2",
        label: "ภาค 2 · ภาคความผิด",
        x: 1205,
        y: 181,
        radius: 31,
        description: "ฐานความผิดเฉพาะเรื่อง จัดตามสิ่งที่กฎหมายมุ่งคุ้มครอง",
        references: ["มาตรา 107–366/4", "ภาคความผิด"],
        children: criminalHierarchy[1]?.children,
      },
      {
        id: "criminal-part-3",
        label: "ภาค 3 · ลหุโทษ",
        x: 1070,
        y: 414,
        radius: 20,
        description: "ความผิดฐานลหุโทษและมาตราสำคัญในชีวิตประจำวัน",
        references: ["มาตรา 367–398", "ลหุโทษ"],
        children: criminalHierarchy[2]?.children,
      },
    ],
  },
  {
    id: "civ-procedure",
    shortLabel: "วิแพ่ง",
    title: "ประมวลกฎหมายวิธีพิจารณาความแพ่ง",
    abbreviation: "ป.วิ.พ.",
    color: "#7771D8",
    softColor: "#B0ABF2",
    x: 320,
    y: 680,
    radius: 38,
    description: "แผนที่กระบวนพิจารณาคดีแพ่ง ตั้งแต่อำนาจฟ้องจนถึงการบังคับคดีตามลำดับเวลา",
    children: [
      {
        id: "civil-procedure-part-1",
        label: "ภาค 1 · บททั่วไป",
        x: 143,
        y: 551,
        radius: 26,
        description: "กติกาพื้นฐานก่อนเริ่มคดี ใช้ร่วมกันในทุกขั้นตอนของคดีแพ่ง",
        references: ["บททั่วไป", "อำนาจฟ้อง", "พยานหลักฐาน"],
        children: [
          { id: "civil-right-to-sue", label: "อำนาจฟ้อง 55–56", dx: -94, dy: -67, radius: 13 },
          { id: "civil-venue", label: "เขตอำนาจ 4–7", dx: -12, dy: -108, radius: 14 },
          { id: "civil-parties", label: "คู่ความ/ร้องสอด 57–59", dx: 91, dy: -76, radius: 14 },
          { id: "civil-service", label: "ยื่น/ส่งหมาย 67–83", dx: 124, dy: 10, radius: 14 },
          { id: "civil-judgment", label: "คำพิพากษา 144–148", dx: 80, dy: 91, radius: 14 },
          { id: "civil-evidence", label: "พยาน 84/1 · 93–117", dx: -33, dy: 113, radius: 15 },
        ],
      },
      {
        id: "civil-procedure-part-2",
        label: "ภาค 2 · ศาลชั้นต้น",
        x: 475,
        y: 610,
        radius: 30,
        description: "ขั้นตอนสู้คดีตั้งแต่ยื่นฟ้องจนศาลชั้นต้นมีคำพิพากษา",
        references: ["คำฟ้อง", "คำให้การ", "เตรียมคดี"],
        children: [
          { id: "civil-ordinary", label: "วิธีสามัญ", dx: -126, dy: -48, radius: 16 },
          { id: "civil-pleading", label: "คำฟ้อง/คำให้การ 177", dx: -51, dy: -116, radius: 14 },
          { id: "civil-ending", label: "ทิ้ง/ถอนฟ้อง 174–175", dx: 62, dy: -109, radius: 14 },
          { id: "civil-pretrial", label: "เตรียมคดี 19 · 183", dx: 132, dy: -20, radius: 15 },
          { id: "civil-special", label: "วิธีวิสามัญ 189–196", dx: 102, dy: 83, radius: 15 },
          { id: "civil-default", label: "ขาดนัด 197–207", dx: -12, dy: 122, radius: 15 },
        ],
      },
      {
        id: "civil-procedure-part-3",
        label: "ภาค 3 · อุทธรณ์/ฎีกา",
        x: 448,
        y: 830,
        radius: 23,
        description: "การโต้แย้งคำตัดสินของศาลชั้นต้นในชั้นอุทธรณ์และฎีกา",
        references: ["อุทธรณ์", "ฎีกาอนุญาต"],
        children: [
          { id: "civil-appeal", label: "อุทธรณ์ 223–228", dx: -87, dy: -68, radius: 15 },
          { id: "civil-supreme", label: "ฎีกาอนุญาต 244/1 · 247", dx: 78, dy: -52, radius: 15 },
        ],
      },
      {
        id: "civil-procedure-part-4",
        label: "ภาค 4 · คุ้มครอง/บังคับคดี",
        x: 221,
        y: 826,
        radius: 27,
        description: "การคุ้มครองสิทธิชั่วคราวก่อนพิพากษา และการนำคำพิพากษาไปบังคับจริง",
        references: ["วิธีการชั่วคราว", "บังคับคดี"],
        children: [
          { id: "civil-provisional", label: "คุ้มครองชั่วคราว 254", dx: -88, dy: -71, radius: 15 },
          { id: "civil-execution", label: "บังคับคดี 271+", dx: 86, dy: -69, radius: 16 },
        ],
      },
    ],
  },
  {
    id: "criminal-procedure",
    shortLabel: "วิอาญา",
    title: "ประมวลกฎหมายวิธีพิจารณาความอาญา",
    abbreviation: "ป.วิ.อ.",
    color: "#A05AC8",
    softColor: "#D19BE6",
    x: 1092,
    y: 525,
    radius: 40,
    description: "แผนที่กระบวนการคดีอาญา ตั้งแต่เริ่มคดี สอบสวน ศาลชั้นต้น จนถึงอภัยโทษ",
    children: [
      {
        id: "criminal-procedure-part-1",
        label: "ภาค 1 · ข้อความทั่วไป",
        x: 1035,
        y: 370,
        radius: 22,
        description: "สถานะบุคคลและกติกาพื้นฐานก่อนเริ่มกระบวนการคดีอาญา",
        references: ["มาตรา 1–119 ทวิ", "ข้อความทั่วไป"],
        children: [
          { id: "crim-proc-status", label: "สถานะบุคคล ม.2", dx: -91, dy: -55, radius: 14 },
          { id: "crim-proc-victim", label: "ผู้เสียหาย/โจทก์ร่วม 4–6 · 30–31", dx: 5, dy: -111, radius: 14 },
          { id: "crim-proc-extinguish", label: "สิทธินำคดีระงับ ม.39", dx: 104, dy: -52, radius: 14 },
        ],
      },
      {
        id: "criminal-procedure-part-2",
        label: "ภาค 2 · สอบสวน",
        x: 1262,
        y: 405,
        radius: 25,
        description: "ชั้นเจ้าพนักงาน ตั้งแต่สืบสวน สอบสวน หมายอาญา จนถึงชันสูตร",
        references: ["มาตรา 120–156", "สอบสวน"],
        children: [
          { id: "crim-proc-investigation", label: "สืบสวน/สอบสวน", dx: -112, dy: -56, radius: 16 },
          { id: "crim-proc-warrants", label: "หมาย/ปล่อยชั่วคราว 52–105", dx: -11, dy: -120, radius: 15 },
          { id: "crim-proc-suspect-rights", label: "สิทธิผู้ต้องหา", dx: 104, dy: -63, radius: 14 },
          { id: "crim-proc-autopsy", label: "ชันสูตร 148–156", dx: 118, dy: 47, radius: 15 },
        ],
      },
      {
        id: "criminal-procedure-part-3",
        label: "ภาค 3 · ศาลชั้นต้น",
        x: 1360,
        y: 554,
        radius: 29,
        description: "การยื่นฟ้อง ไต่สวน พิจารณา และคำพิพากษาในศาลชั้นต้น",
        references: ["มาตรา 157–192", "ศาลชั้นต้น"],
        children: [
          { id: "crim-proc-charge", label: "คำฟ้อง ม.158", dx: -109, dy: -75, radius: 15 },
          { id: "crim-proc-civil-related", label: "แพ่งเกี่ยวเนื่อง 43 · 44/1", dx: -22, dy: -126, radius: 14 },
          { id: "crim-proc-inquiry", label: "ไต่สวนมูลฟ้อง", dx: 92, dy: -86, radius: 14 },
          { id: "crim-proc-hearing", label: "พิจารณา 172–173", dx: 126, dy: 14, radius: 15 },
          { id: "crim-proc-guilty", label: "รับสารภาพ ม.176", dx: 75, dy: 104, radius: 14 },
          { id: "crim-proc-judgment", label: "พิพากษา 185–192", dx: -50, dy: 117, radius: 15 },
        ],
      },
      {
        id: "criminal-procedure-part-4",
        label: "ภาค 4 · อุทธรณ์/ฎีกา",
        x: 1284,
        y: 736,
        radius: 21,
        description: "การโต้แย้งคำสั่งหรือคำพิพากษาไปยังศาลสูง",
        references: ["มาตรา 193–225", "อุทธรณ์และฎีกา"],
        children: [
          { id: "crim-proc-appeal", label: "อุทธรณ์/ฎีกา 193–225", dx: -81, dy: 4, radius: 16 },
        ],
      },
      {
        id: "criminal-procedure-part-5",
        label: "ภาค 5 · พยานหลักฐาน",
        x: 1130,
        y: 810,
        radius: 20,
        description: "หลักเกณฑ์การรับฟังพยานหลักฐานในคดีอาญา",
        references: ["มาตรา 226–244", "พยานหลักฐาน"],
        children: [
          { id: "crim-proc-evidence", label: "รับฟังพยาน 226–244", dx: -47, dy: 93, radius: 16 },
          { id: "crim-proc-expert", label: "พยานผู้เชี่ยวชาญ", dx: 74, dy: 60, radius: 14 },
        ],
      },
      {
        id: "criminal-procedure-part-6",
        label: "ภาค 6 · บังคับคำพิพากษา",
        x: 965,
        y: 756,
        radius: 21,
        description: "การนำคำพิพากษาไปบังคับโทษและการจัดการค่าธรรมเนียม",
        references: ["มาตรา 245–258", "บังคับตามคำพิพากษา"],
        children: [
          { id: "crim-proc-execution", label: "บังคับโทษ 245–258", dx: -93, dy: 27, radius: 16 },
          { id: "crim-proc-fine", label: "กักขังแทนค่าปรับ", dx: -31, dy: -90, radius: 14 },
        ],
      },
      {
        id: "criminal-procedure-part-7",
        label: "ภาค 7 · อภัย/ลดโทษ",
        x: 930,
        y: 602,
        radius: 19,
        description: "ขั้นตอนอภัยโทษ เปลี่ยนโทษหนักเป็นเบา และลดโทษ",
        references: ["มาตรา 259–267", "อภัยโทษ"],
        children: [
          { id: "crim-proc-pardon", label: "อภัย/ลดโทษ 259–267", dx: -102, dy: 8, radius: 16 },
        ],
      },
    ],
  },
  {
    id: "public",
    shortLabel: "มหาชน",
    title: "กฎหมายมหาชน",
    abbreviation: "มหาชน",
    color: "#D6A83F",
    softColor: "#EBCF82",
    x: 950,
    y: 748,
    radius: 37,
    description: "โครงสร้างอำนาจรัฐ สิทธิและเสรีภาพ กฎหมายปกครอง และกลไกตรวจสอบของรัฐ",
    children: [
      {
        id: "public-constitution",
        label: "กฎหมายรัฐธรรมนูญ",
        x: 796,
        y: 634,
        radius: 28,
        description: "หลักรัฐธรรมนูญ สิทธิ เสรีภาพ และโครงสร้างของรัฐ",
        references: ["รัฐธรรมนูญ", "16 หมวด"],
        children: [
          { id: "constitution-1", label: "หมวด 1 · บททั่วไป", dx: -144, dy: -59, radius: 12 },
          { id: "constitution-2", label: "หมวด 2 · พระมหากษัตริย์", dx: -80, dy: -128, radius: 12 },
          { id: "constitution-3", label: "หมวด 3 · สิทธิและเสรีภาพ", dx: 5, dy: -150, radius: 13 },
          { id: "constitution-4", label: "หมวด 4 · หน้าที่ปวงชน", dx: 91, dy: -123, radius: 12 },
          { id: "constitution-5", label: "หมวด 5 · หน้าที่รัฐ", dx: 150, dy: -55, radius: 12 },
          { id: "constitution-6", label: "หมวด 6 · แนวนโยบายรัฐ", dx: 157, dy: 32, radius: 12 },
          { id: "constitution-7", label: "หมวด 7 · รัฐสภา", dx: 112, dy: 106, radius: 13 },
          { id: "constitution-8", label: "หมวด 8 · คณะรัฐมนตรี", dx: 38, dy: 149, radius: 13 },
          { id: "constitution-9", label: "หมวด 9 · ผลประโยชน์", dx: -52, dy: 143, radius: 12 },
          { id: "constitution-10", label: "หมวด 10 · ศาล", dx: -124, dy: 93, radius: 12 },
          { id: "constitution-11", label: "หมวด 11 · ศาลรัฐธรรมนูญ", dx: -164, dy: 10, radius: 12 },
          { id: "constitution-12", label: "หมวด 12 · องค์กรอิสระ", dx: -153, dy: -82, radius: 12 },
          { id: "constitution-13", label: "หมวด 13 · องค์กรอัยการ", dx: -36, dy: -193, radius: 12 },
          { id: "constitution-14", label: "หมวด 14 · ท้องถิ่น", dx: 67, dy: -184, radius: 12 },
          { id: "constitution-15", label: "หมวด 15 · แก้ไขรัฐธรรมนูญ", dx: 164, dy: -135, radius: 12 },
          { id: "constitution-16", label: "หมวด 16 · ปฏิรูปประเทศ", dx: 197, dy: -9, radius: 12 },
          { id: "constitution-party", label: "พ.ร.ป. พรรคการเมือง", dx: 158, dy: 109, radius: 14 },
        ],
      },
      {
        id: "public-administration",
        label: "กฎหมายปกครอง",
        x: 1114,
        y: 730,
        radius: 29,
        description: "หลักการใช้อำนาจทางปกครองและการคุ้มครองสิทธิของประชาชน",
        references: ["กฎหมายปกครอง", "คำสั่งทางปกครอง"],
        children: [
          { id: "admin-court-establishment", label: "พ.ร.บ. จัดตั้งศาลปกครอง", dx: -103, dy: -63, radius: 15 },
          { id: "admin-procedure", label: "วิธีปฏิบัติราชการทางปกครอง", dx: 92, dy: 60, radius: 15 },
        ],
      },
    ],
  },
  {
    id: "other",
    shortLabel: "กฎหมายอื่นๆ",
    title: "กฎหมายอื่นๆ",
    abbreviation: "อื่นๆ",
    color: "#B38AD9",
    softColor: "#D6C0EB",
    x: 1245,
    y: 742,
    radius: 34,
    description: "พื้นที่สำหรับกฎหมายเฉพาะด้านและกฎหมายที่มีความเชื่อมโยงข้ามประมวล",
    children: [
      {
        id: "intellectual-property",
        label: "ทรัพย์สินทางปัญญา",
        x: 1166,
        y: 653,
        radius: 24,
        description: "กฎหมายเฉพาะด้านว่าด้วยการคุ้มครองผลงานสร้างสรรค์และนวัตกรรม",
        references: ["ทรัพย์สินทางปัญญา"],
        children: [
          { id: "ip-copyright", label: "ลิขสิทธิ์", dx: -88, dy: -53, radius: 14 },
          { id: "ip-patent", label: "สิทธิบัตร", dx: 5, dy: -104, radius: 14 },
          { id: "ip-trademark", label: "เครื่องหมายการค้า", dx: 100, dy: -45, radius: 14 },
          { id: "ip-trade-secret", label: "ความลับทางการค้า", dx: 77, dy: 79, radius: 14 },
          { id: "ip-geographical", label: "สิ่งบ่งชี้ทางภูมิศาสตร์", dx: -53, dy: 101, radius: 14 },
        ],
      },
    ],
  },
];

const particles = Array.from({ length: 46 }, (_, index) => ({
  x: (index * 137 + 57) % 1440,
  y: (index * 89 + 31) % 900,
  r: index % 7 === 0 ? 4 : index % 3 === 0 ? 2.5 : 1.5,
  color: index % 3 === 0 ? "#B38AD9" : index % 3 === 1 ? "#5FD4E8" : "#D6A83F",
  delay: `${(index % 11) * -1.2}s`,
}));

function curvedPath(fromX: number, fromY: number, toX: number, toY: number) {
  const midpointX = (fromX + toX) / 2;
  const midpointY = (fromY + toY) / 2;
  const bend = (toX - fromX) * 0.07 - (toY - fromY) * 0.12;
  return `M ${fromX} ${fromY} Q ${midpointX - bend} ${midpointY - bend} ${toX} ${toY}`;
}

// Base ring radius for each drill depth (index = position within
// selectedPath: 2 = ลักษณะ-tier under a subject, 3 = หมวด, 4 = ส่วน,
// 5 = มาตรา leaves, 6+ = fallback for anything deeper). Indices 0/1 are
// unused since domain/subject already carry their own absolute x/y.
const LEVEL_RING_RADIUS = [0, 0, 150, 95, 68, 52, 44];

type PathStep = { id: string; label: string; x: number; y: number };

// Walks selectedPath through the domain's tree, computing the absolute
// position of each step. Legacy hand-placed nodes (dx/dy given) use their
// authored offset; auto-generated civil/criminal nodes fall back to radial
// layout. Stops early (returns what it has) if a path segment can't be
// resolved, e.g. right after the underlying data changes.
function resolveSelectedPath(domain: LegalDomain, path: string[]): PathStep[] {
  const steps: PathStep[] = [];
  if (path.length === 0) return steps;
  steps.push({ id: domain.id, label: domain.shortLabel, x: domain.x, y: domain.y });
  if (path.length === 1) return steps;
  const subject = domain.children.find((item) => item.id === path[1]);
  if (!subject) return steps;
  steps.push({ id: subject.id, label: subject.label, x: subject.x, y: subject.y });
  const legacyScale = domain.id === "criminal" ? 1.82 : 1.58;
  let currentChildren = subject.children;
  let currentX = subject.x;
  let currentY = subject.y;
  for (let depth = 2; depth < path.length; depth += 1) {
    if (!currentChildren) break;
    const index = currentChildren.findIndex((item) => item.id === path[depth]);
    if (index === -1) break;
    const node = currentChildren[index];
    const baseRadius = LEVEL_RING_RADIUS[Math.min(depth, LEVEL_RING_RADIUS.length - 1)];
    const pos = node.dx !== undefined && node.dy !== undefined
      ? { x: currentX + node.dx * legacyScale, y: currentY + node.dy * legacyScale }
      : autoRadialPosition(currentX, currentY, index, currentChildren.length, baseRadius);
    steps.push({ id: node.id, label: node.label, x: pos.x, y: pos.y });
    currentX = pos.x;
    currentY = pos.y;
    currentChildren = node.children;
  }
  return steps;
}

type LegalNodeRingProps = {
  nodes: LegalNode[];
  centerX: number;
  centerY: number;
  depth: number;
  domainId: string;
  domainColor: string;
  domainSoftColor: string;
  groupLabel: string;
  selectedPath: string[];
  pathPrefix: string[];
  onSelectPath: (path: string[]) => void;
  onSelectArticle: (book: string, node: LegalNode, groupLabel: string) => void;
  showConnections: boolean;
  legacyScale: number;
};

// Recursively renders one ring of sibling nodes around a parent position,
// and - if one of them is the next step in selectedPath - recurses into its
// children centered on its own computed position. Handles both hand-placed
// legacy nodes (explicit dx/dy) and auto-generated ones (radial layout) via
// the same code path, and terminates at มาตรา leaves (book+number set),
// which open the side panel instead of drilling further.
function LegalNodeRing({ nodes, centerX, centerY, depth, domainId, domainColor, domainSoftColor, groupLabel, selectedPath, pathPrefix, onSelectPath, onSelectArticle, showConnections, legacyScale }: LegalNodeRingProps) {
  const baseRadius = LEVEL_RING_RADIUS[Math.min(depth, LEVEL_RING_RADIUS.length - 1)];
  const activeId = selectedPath[depth];
  const placed = nodes.map((node, index) => {
    const pos = node.dx !== undefined && node.dy !== undefined
      ? { x: centerX + node.dx * legacyScale, y: centerY + node.dy * legacyScale }
      : autoRadialPosition(centerX, centerY, index, nodes.length, baseRadius);
    return { node, pos };
  });
  const staggerStep = Math.min(70, Math.max(18, 480 / Math.max(1, nodes.length)));

  return (
    <>
      {showConnections && (
        <g className="micro-connections-layer" aria-hidden="true">
          {placed.map(({ node, pos }) => (
            <path key={`ring-link-${node.id}`} d={curvedPath(centerX, centerY, pos.x, pos.y)} fill="none" stroke={domainColor} strokeWidth="0.8" opacity={activeId && activeId !== node.id ? 0.16 : 0.48} />
          ))}
        </g>
      )}
      {placed.map(({ node, pos }, index) => {
        const isLeaf = !node.children;
        const isActive = activeId === node.id;
        const radius = node.radius ?? Math.max(6, 15 - depth * 1.4);
        const nodePath = [...pathPrefix, node.id];
        const handleActivate = () => (isLeaf ? onSelectArticle(domainId, node, groupLabel) : onSelectPath(nodePath));
        return (
          <g key={node.id} className="micro-node-wrap" style={{ "--micro-delay": `${index * staggerStep}ms`, "--micro-drift-delay": `${(index % 5) * -1.1}s` } as CSSProperties}>
            <g className="micro-node-drift">
              <g
                className={`graph-node ${isLeaf ? "graph-node--article" : "graph-node--micro is-expandable"} ${isActive ? "is-selected" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={isLeaf ? `มาตรา ${node.number} ${node.label}` : node.label}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={handleActivate}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleActivate(); } }}
              >
                <circle cx={pos.x} cy={pos.y} r={radius + (isLeaf ? 3 : 5)} fill={domainColor} opacity={isActive ? 0.22 : isLeaf ? 0.14 : 0.12} filter="url(#softBlur)" />
                <circle cx={pos.x} cy={pos.y} r={radius} fill={isLeaf ? "#FFFFFF" : domainSoftColor} stroke={domainColor} strokeWidth={isActive ? 1.9 : isLeaf ? 1.1 : 1} strokeDasharray={!isLeaf ? "2 2.5" : undefined} />
                <text x={pos.x} y={pos.y + radius + (isLeaf ? 12 : 14)} textAnchor="middle" className={isLeaf ? "article-label" : "micro-label"}>
                  {isLeaf ? (
                    `ม.${node.number}`
                  ) : (
                    <>
                      <tspan x={pos.x}>{node.label}</tspan>
                      {node.range && <tspan x={pos.x} dy="12" className="node-label__range">{node.range}</tspan>}
                    </>
                  )}
                </text>
              </g>
            </g>
            {isActive && node.children && (
              <LegalNodeRing
                nodes={node.children}
                centerX={pos.x}
                centerY={pos.y}
                depth={depth + 1}
                domainId={domainId}
                domainColor={domainColor}
                domainSoftColor={domainSoftColor}
                groupLabel={node.label}
                selectedPath={selectedPath}
                pathPrefix={nodePath}
                onSelectPath={onSelectPath}
                onSelectArticle={onSelectArticle}
                showConnections={showConnections}
                legacyScale={legacyScale}
              />
            )}
          </g>
        );
      })}
    </>
  );
}

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  // [domainId, subjectId(บรรพ/ภาค), ...ลักษณะ/หมวด/ส่วน ids down to whatever
  // depth the user has drilled into]. Replaces the old fixed-depth
  // selectedId/selectedSubjectId/selectedMicroNodeId trio now that the tree
  // goes arbitrarily deep.
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"network" | "book">("network");
  const [zoom, setZoom] = useState(1);
  const [showConnections, setShowConnections] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.16);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [is3D, setIs3D] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [caseMenuOpen, setCaseMenuOpen] = useState(false);
  const [caseOverlayOpen, setCaseOverlayOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState(DEFAULT_CASE_ID);
  const [lawSelection, setLawSelection] = useState<{ law: CaseLawRef; issueTitle: string } | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement>(null);
  const panGestureRef = useRef({ pointerId: -1, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const didDragRef = useRef(false);
  // Two-finger pinch-zoom, tracked manually via Pointer Events rather than
  // native gesture events: Safari's gesturestart/gesturechange is
  // WebKit-only and never fires on Android Chrome, so it's not a viable
  // cross-platform pinch source. Pointer Events (with touch-action:none,
  // already set on .law-map) work identically on both.
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);

  const hapticPulse = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(12); } catch { /* unsupported or blocked - iOS Safari never exposes this */ }
    }
  };

  const playSoftTone = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    const audio = new window.AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(392, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(523.25, audio.currentTime + 0.16);
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, audio.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.2);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.21);
    window.setTimeout(() => { void audio.close(); }, 260);
  };

  const toggleBackgroundMusic = () => {
    const track = backgroundMusicRef.current;
    if (!track) return;
    if (musicEnabled) {
      track.pause();
      setMusicEnabled(false);
      return;
    }
    track.volume = musicVolume;
    void track.play().then(() => setMusicEnabled(true)).catch(() => setMusicEnabled(false));
  };

  const updateMusicVolume = (nextVolume: number) => {
    setMusicVolume(nextVolume);
    if (backgroundMusicRef.current) backgroundMusicRef.current.volume = nextVolume;
  };

  const activateBackgroundMusic = () => {
    const track = backgroundMusicRef.current;
    if (!track || !musicEnabled || !track.muted) return;
    track.muted = false;
    track.volume = musicVolume;
    void track.play().catch(() => undefined);
  };

  const handleMapPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointersRef.current.size === 2) {
      const [a, b] = Array.from(activePointersRef.current.values());
      pinchStartRef.current = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), zoom };
      setIsPanning(false);
      didDragRef.current = true;
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* already released elsewhere */ }
      return;
    }
    const gesture = panGestureRef.current;
    gesture.pointerId = event.pointerId;
    gesture.startX = event.clientX;
    gesture.startY = event.clientY;
    gesture.startPanX = pan.x;
    gesture.startPanY = pan.y;
    didDragRef.current = false;
  };

  const handleMapPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (activePointersRef.current.size === 2 && pinchStartRef.current) {
      const [a, b] = Array.from(activePointersRef.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const ratio = distance / pinchStartRef.current.distance;
      setZoom(Math.max(0.42, Math.min(1.32, Number((pinchStartRef.current.zoom * ratio).toFixed(2)))));
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const gesture = panGestureRef.current;
    if (gesture.pointerId !== event.pointerId) return;
    const dx = ((event.clientX - gesture.startX) / bounds.width) * 1440;
    const dy = ((event.clientY - gesture.startY) / bounds.height) * 900;
    if (Math.hypot(dx, dy) > 4) {
      didDragRef.current = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
      setIsPanning(true);
      setPan({ x: Math.max(-300, Math.min(300, gesture.startPanX + dx)), y: Math.max(-210, Math.min(210, gesture.startPanY + dy)) });
    }
  };

  const handleMapPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
      const remaining = Array.from(activePointersRef.current.entries())[0];
      if (remaining) {
        const [remainingId, point] = remaining;
        const gesture = panGestureRef.current;
        gesture.pointerId = remainingId;
        gesture.startX = point.x;
        gesture.startY = point.y;
        gesture.startPanX = pan.x;
        gesture.startPanY = pan.y;
      }
    }
    if (panGestureRef.current.pointerId !== event.pointerId) return;
    panGestureRef.current.pointerId = -1;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    window.setTimeout(() => { didDragRef.current = false; }, 0);
  };

  const handleMapWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.06 : 0.06;
    setZoom((value) => Math.max(0.42, Math.min(1.32, Number((value + delta).toFixed(2)))));
  };

  const selectedId = selectedPath[0] ?? null;
  const selectedSubjectId = selectedPath[1] ?? null;
  const selectedDomain = legalDomains.find((domain) => domain.id === selectedId) ?? null;
  const selectedSubject = selectedDomain?.children.find((subject) => subject.id === selectedSubjectId) ?? null;
  const legacyScale = selectedDomain?.id === "criminal" ? 1.82 : 1.58;
  const pathSteps = selectedDomain ? resolveSelectedPath(selectedDomain, selectedPath) : [];
  const cameraTarget = pathSteps.length ? pathSteps[pathSteps.length - 1] : null;
  const cameraScale = cameraEnabled && cameraTarget ? zoom * cameraScaleForDepth(pathSteps.length) : zoom;
  const cameraTransform = cameraEnabled && cameraTarget
    ? `translate(${720 + pan.x} ${450 + pan.y}) scale(${cameraScale}) translate(${-cameraTarget.x} ${-cameraTarget.y})`
    : `translate(${720 + pan.x} ${450 + pan.y}) scale(${zoom}) translate(-720 -450)`;

  // Handles a click at any depth: the domain circle (path=[domainId]), a
  // subject/บรรพ/ภาค (path=[domainId,subjectId]), or any node further down
  // the auto-generated tree. Re-clicking the currently-focused node collapses
  // one level back up; clicking anything else drills straight to it,
  // discarding whatever was selected deeper than that.
  const selectPath = (path: string[]) => {
    if (didDragRef.current) return;
    playSoftTone();
    hapticPulse();
    setExpanded(true);
    setPan({ x: 0, y: 0 });
    const same = selectedPath.length === path.length && selectedPath.every((id, index) => id === path[index]);
    const next = same ? path.slice(0, -1) : path;
    setSelectedPath(next);
    setZoom(next.length > 1 ? 0.89 : 1);
    setViewMode("network");
  };

  // Thin compatibility shim: ForceNetwork3D (the separate 3D/WebGL mode,
  // untouched this pass) and the book-view list still call the old
  // two-argument shape.
  const exploreDomain = (domainId: string, subjectId: string | null = null) => {
    selectPath(subjectId ? [domainId, subjectId] : [domainId]);
  };

  const handleSelectArticle = (book: string, node: LegalNode, groupLabel: string) => {
    if (!node.number) return;
    setLawSelection({ law: { book, number: node.number, label: node.label }, issueTitle: groupLabel });
  };

  const activeCaseData = caseGraphs[activeCaseId];

  // Nexus overlay: a self-contained radial diagram (hub -> issues -> laws)
  // centered on the viewport, independent of the background map's selection
  // or camera state. Earlier versions anchored these nodes to background
  // micro-node positions, but that made the nexus fragile (it broke whenever
  // the underlying map data changed) and let corner UI chrome cover the hub
  // whenever its computed position happened to land near a menu. Being
  // self-positioned guarantees it's always fully visible.
  const caseOverlay2D = useMemo(() => {
    if (!caseOverlayOpen) return null;
    const caseData = activeCaseData;
    const hubX = 720;
    const hubY = 450;
    const issueCount = Math.max(1, caseData.issues.length);
    const issues = caseData.issues.map((issue, issueIndex) => {
      const issueAngle = (issueIndex / issueCount) * Math.PI * 2 - Math.PI / 2;
      const issueRadius = 130 + issueCount * 6;
      const issueX = hubX + Math.cos(issueAngle) * issueRadius;
      const issueY = hubY + Math.sin(issueAngle) * issueRadius;
      const lawCount = Math.max(1, issue.laws.length);
      const laws = issue.laws.map((law, lawIndex) => {
        const spread = issue.laws.length > 1 ? Math.PI / 3.4 : 0;
        const lawAngle = issueAngle + (lawIndex / Math.max(1, lawCount - 1) - 0.5) * spread;
        const lawRadius = issueRadius + 88;
        return { ...law, issueId: issue.id, x: hubX + Math.cos(lawAngle) * lawRadius, y: hubY + Math.sin(lawAngle) * lawRadius };
      });
      return { id: issue.id, title: issue.title, x: issueX, y: issueY, laws };
    });
    return { title: caseData.title, x: hubX, y: hubY, issues };
  }, [caseOverlayOpen, activeCaseData]);

  const toggleCaseOverlay = (caseId: string) => {
    if (caseOverlayOpen && activeCaseId === caseId) {
      setCaseOverlayOpen(false);
      setLawSelection(null);
      return;
    }
    setActiveCaseId(caseId);
    setCaseOverlayOpen(true);
    setLawSelection(null);
    setExpanded(true);
    setPan({ x: 0, y: 0 });
    setSelectedPath([]);
    setZoom(1);
    setViewMode("network");
  };

  const handleSelectOverlayLaw = (law: CaseLawRef, issueId: string) => {
    const issue = activeCaseData.issues.find((item) => item.id === issueId);
    setLawSelection({ law, issueTitle: issue?.title ?? "" });
  };

  const returnToAllDomains = () => {
    setSelectedPath([]);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const resetExplorer = () => {
    setExpanded(false);
    setSelectedPath([]);
    setViewMode("network");
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <main className={`legal-universe ${motionEnabled ? "" : "motion-off"} ${is3D ? "is-3d" : ""} ${cameraEnabled && cameraTarget ? "camera-focus" : ""}`} onPointerDownCapture={activateBackgroundMusic}>
      <audio ref={backgroundMusicRef} src={BACKGROUND_MUSIC_SRC} loop autoPlay muted preload="metadata" onLoadedMetadata={(event) => { event.currentTarget.volume = musicVolume; }} />
      <div className="graph-atmosphere" aria-hidden="true" />
      <header className="universe-header">
        <div className="header-brand-row">
          <button className="brand-lockup" onClick={resetExplorer} aria-label="กลับสู่จุดเริ่มต้นของแผนที่กฎหมาย">
            <span className="brand-mark" aria-hidden="true"><Scale size={19} /></span>
            <span>
              <strong>ประมวลกฎหมายฉบับ Neural Network</strong>
              <small>PRAMUAN NN · LEGAL KNOWLEDGE ATLAS</small>
            </span>
          </button>
        </div>

        <div className="header-center">
          <span className="header-kicker"><Sparkles size={13} /> NEURAL LEGAL NETWORK</span>
        </div>

        <div className="header-actions">
          <nav className="route-links" aria-label="เส้นทางเครือข่ายที่เกี่ยวข้อง">
            <a className="lab-return" href="https://coolunclelab.com" target="_blank" rel="noreferrer"><ArrowUpRight size={12} /> <span>Cool Uncle</span></a>
            <a className="lab-return" href="https://coolunclelab.com/lab" target="_blank" rel="noreferrer"><span>Lab</span></a>
            <a className="lab-return" href="https://ประมวล.com" target="_blank" rel="noreferrer"><span>ประมวล.com</span></a>
            <Link href="/case/serm-jenjira" className="lab-return"><GitBranch size={12} /> <span>โหมดคดี</span></Link>
          </nav>
          <div className="view-switch" aria-label="เลือกรูปแบบการแสดงผล">
            <button className={viewMode === "network" ? "is-active" : ""} onClick={() => setViewMode("network")}>
              <Network size={15} /> <span>แผนที่</span>
            </button>
            <button className={viewMode === "book" ? "is-active" : ""} onClick={() => setViewMode("book")}>
              <List size={15} /> <span>สารบัญ</span>
            </button>
          </div>
          <button className="text-action" onClick={resetExplorer}><RotateCcw size={15} /> เริ่มใหม่</button>
        </div>
      </header>

      <section className="explorer-stage" aria-label="แผนที่เชิงโต้ตอบของประมวลกฎหมายไทย">
        <div className="corner-meta corner-meta--top">
          <span className="status-dot" />
          <span>{expanded ? "กำลังสำรวจโครงสร้างกฎหมาย" : "เริ่มต้นจากภาพรวม"}</span>
        </div>

        {expanded && (
          <nav className="breadcrumb" aria-label="เส้นทางการสำรวจ">
            <button onClick={resetExplorer}>กฎหมายทั้งหมด</button>
            {pathSteps.map((step, index) => (
              <Fragment key={step.id}>
                <ChevronRight size={13} />
                {index === pathSteps.length - 1
                  ? <span>{step.label}</span>
                  : <button onClick={() => selectPath(selectedPath.slice(0, index + 1))}>{step.label}</button>}
              </Fragment>
            ))}
          </nav>
        )}

        <div className={`atlas-controls ${controlsOpen ? "is-open" : ""}`} aria-label="ควบคุมการแสดงแผนที่">
          <button className="atlas-controls__trigger" onClick={() => setControlsOpen((value) => !value)} aria-expanded={controlsOpen}><Settings2 size={16} /><span>ตัวเลือก</span></button>
          <div className="atlas-controls__content">
            <button className={showConnections ? "is-active" : ""} onClick={() => setShowConnections((value) => !value)} aria-pressed={showConnections}><Link2 size={15} /><span>เส้นโยง</span></button>
            <button className={soundEnabled ? "is-active" : ""} onClick={() => setSoundEnabled((value) => !value)} aria-pressed={soundEnabled}>{soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}<span>เสียง</span></button>
            <button className={`music-toggle ${musicEnabled ? "is-active" : ""}`} onClick={toggleBackgroundMusic} aria-pressed={musicEnabled} aria-label={musicEnabled ? "ปิดเพลงประกอบ" : "เปิดเพลงประกอบ"} title={musicEnabled ? "ปิดเพลงประกอบ" : "เปิดเพลงประกอบ"}><Music2 size={15} /><span>{musicEnabled ? "เพลง · เปิด" : "เพลง · ปิด"}</span></button>
            {musicEnabled && <label className="music-volume-control"><Volume2 size={14} /><input type="range" min="0" max="0.35" step="0.01" value={musicVolume} onChange={(event) => updateMusicVolume(Number(event.target.value))} aria-label="ระดับเสียงเพลงประกอบ" /></label>}
            <button className={motionEnabled ? "is-active" : ""} onClick={() => setMotionEnabled((value) => !value)} aria-pressed={motionEnabled}><Orbit size={15} /><span>Motion</span></button>
            <button className={cameraEnabled ? "is-active" : ""} onClick={() => setCameraEnabled((value) => !value)} aria-pressed={cameraEnabled}><Crosshair size={15} /><span>กล้อง</span></button>
            <button className={is3D ? "is-active" : ""} onClick={() => setIs3D((value) => !value)} aria-pressed={is3D} title={is3D ? "กลับสู่มุมมอง 2D" : "เปิดมุมมอง 3D แบบโต้ตอบ"}><Layers2 size={15} /><span>{is3D ? "3D · หมุนได้" : "2D"}</span></button>
          </div>
        </div>

        <div className={`atlas-controls atlas-controls--right ${caseMenuOpen ? "is-open" : ""}`} aria-label="เปิด-ปิดคดีตัวอย่างบนแผนที่">
          <button className="atlas-controls__trigger" onClick={() => setCaseMenuOpen((value) => !value)} aria-expanded={caseMenuOpen}><span>คดี</span><Scale size={16} /></button>
          <div className="atlas-controls__content">
            {Object.values(caseGraphs).map((caseItem) => {
              const isActive = caseOverlayOpen && activeCaseId === caseItem.id;
              return (
                <button key={caseItem.id} className={isActive ? "is-active" : ""} aria-pressed={isActive} onClick={() => toggleCaseOverlay(caseItem.id)} title={caseItem.subtitle}>
                  <span>{caseItem.title}</span><GitBranch size={14} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="zoom-controls" aria-label="ควบคุมการซูม">
          <button onClick={() => setZoom((value) => Math.max(0.42, Number((value - 0.12).toFixed(2))))} aria-label="ซูมออก"><ZoomOut size={18} /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((value) => Math.min(1.32, Number((value + 0.12).toFixed(2))))} aria-label="ซูมเข้า"><ZoomIn size={18} /></button>
        </div>

        <div className="legend" aria-label="คำอธิบายขนาดโหนด">
          <span><i className="legend-dot legend-dot--large" />เล่มประมวล</span>
          <span><i className="legend-dot legend-dot--medium" />หมวดหลัก</span>
          <span><i className="legend-dot legend-dot--small" />จุดเชื่อมโยง</span>
        </div>

        {selectedDomain && <button className={`return-overview-chip ${caseMenuOpen ? "is-veiled" : ""}`} onClick={returnToAllDomains}><RotateCcw size={14} /> กลับภาพรวม</button>}
        {is3D && viewMode === "network" ? (
          <WebGLBoundary onFallback={() => setIs3D(false)}>
            <ForceNetwork3D domains={legalDomains} expanded={expanded} selectedDomainId={selectedId} selectedSubjectId={selectedSubjectId} showConnections={showConnections} motionEnabled={motionEnabled} caseOverlay={caseOverlayOpen ? activeCaseData : null} onExploreDomain={exploreDomain} onOpen={() => { playSoftTone(); setExpanded(true); }} onReset={resetExplorer} onFallbackTo2D={() => setIs3D(false)} onSelectLaw={handleSelectOverlayLaw} />
          </WebGLBoundary>
        ) : (
        <svg className={`law-map ${isPanning ? "is-panning" : ""} ${lawSelection ? "law-focus" : ""}`} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="แผนที่ความสัมพันธ์ของประมวลกฎหมายไทย" onPointerDown={handleMapPointerDown} onPointerMove={handleMapPointerMove} onPointerUp={handleMapPointerUp} onPointerCancel={handleMapPointerUp} onPointerLeave={() => { if (panGestureRef.current.pointerId === -1) setIsPanning(false); }} onWheel={handleMapWheel}>
          <defs>
            <filter id="softBlur"><feGaussianBlur stdDeviation="16" /></filter>
            <filter id="nodeShadow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#3C3651" floodOpacity="0.16" /></filter>
          </defs>

          <g className="map-zoom-layer" transform={cameraTransform}>
            <g className="atmospheric-zones" aria-hidden="true">
              {expanded && legalDomains.map((domain) => (
                <circle key={`zone-${domain.id}`} cx={domain.x} cy={domain.y} r={domain.radius * 2.55} fill={domain.softColor} opacity={selectedId && selectedId !== domain.id ? 0.025 : 0.105} filter="url(#softBlur)" />
              ))}
              <circle cx="720" cy="450" r="208" fill="#9D6EEA" opacity={expanded ? 0.035 : 0.08} filter="url(#softBlur)" />
              <circle cx="720" cy="450" r="178" fill="none" stroke="#9D6EEA" strokeWidth="1" opacity={expanded ? 0.1 : 0.18} />
              <circle cx="720" cy="450" r="237" fill="none" stroke="#B38AD9" strokeWidth="0.75" strokeDasharray="3 13" opacity={expanded ? 0.13 : 0.08} />
            </g>

            <g className="background-particles" aria-hidden="true">
              {particles.map((particle, index) => (
                <circle key={index} className="map-particle" cx={particle.x} cy={particle.y} r={particle.r} fill={particle.color} opacity={expanded ? 0.28 : 0.16} style={{ animationDelay: particle.delay } as CSSProperties} />
              ))}
            </g>

            {expanded && showConnections && (
              <g className="network-connections">
                {legalDomains.map((domain) => {
                  const isDimmed = Boolean(selectedId && selectedId !== domain.id);
                  return <path key={`root-${domain.id}`} d={curvedPath(720, 450, domain.x, domain.y)} fill="none" stroke={domain.color} strokeWidth={selectedId === domain.id ? 2 : 1.1} opacity={isDimmed ? 0.11 : selectedId === domain.id ? 0.64 : 0.37} />;
                })}
                <path d={curvedPath(342, 277, 1055, 244)} fill="none" stroke="#B38AD9" strokeWidth="0.9" strokeDasharray="4 7" opacity={selectedId === "civil" || selectedId === "criminal" ? 0.43 : 0.13} />
                <path d={curvedPath(950, 748, 1088, 235)} fill="none" stroke="#D6A83F" strokeWidth="0.8" strokeDasharray="3 9" opacity={selectedId === "public" || selectedId === "criminal" ? 0.38 : 0.1} />
                {selectedDomain?.children.map((subject) => (
                  <path key={`subject-${subject.id}`} className="subject-connection" d={curvedPath(selectedDomain.x, selectedDomain.y, subject.x, subject.y)} fill="none" stroke={selectedDomain.color} strokeWidth={selectedSubjectId === subject.id ? 1.75 : 1.05} opacity={selectedSubjectId && selectedSubjectId !== subject.id ? 0.18 : 0.54} />
                ))}
              </g>
            )}

            {!expanded ? (
              <g className="origin-node origin-node--initial" role="button" tabIndex={0} aria-label="คลิกเพื่อสำรวจโครงสร้างกฎหมายไทย" onPointerDown={(event) => event.stopPropagation()} onClick={() => { if (didDragRef.current) return; playSoftTone(); setExpanded(true); setPan({ x: 0, y: 0 }); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); playSoftTone(); setExpanded(true); setPan({ x: 0, y: 0 }); } }}>
                <circle cx="720" cy="450" r="94" fill="#9D6EEA" opacity="0.12" filter="url(#softBlur)" />
                <circle cx="720" cy="450" r="73" fill="none" stroke="#9D6EEA" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="2 7" />
                <circle cx="720" cy="450" r="58" fill="#9D6EEA" filter="url(#nodeShadow)" />
                <circle cx="720" cy="450" r="65" fill="none" stroke="#9D6EEA" strokeOpacity="0.7" strokeWidth="1.25" />
                <circle cx="720" cy="450" r="41" fill="#FFFFFF" opacity="0.13" />
                <text x="720" y="456" textAnchor="middle" className="origin-brand">ประมวล.com</text>
                <text x="720" y="548" textAnchor="middle" className="explore-prompt">เข้าสู่ ประมวลNN</text>
                <text x="720" y="574" textAnchor="middle" className="explore-caption">เลือกเพื่อเปิดแผนที่เครือข่ายกฎหมาย</text>
              </g>
            ) : (
              <g className="origin-node origin-node--expanded" role="button" tabIndex={0} aria-label="กลับสู่ภาพรวมกฎหมายทั้งหมด" onPointerDown={(event) => event.stopPropagation()} onClick={() => { if (!didDragRef.current) resetExplorer(); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); resetExplorer(); } }}>
                <circle cx="720" cy="450" r="39" fill="#9D6EEA" opacity="0.12" filter="url(#softBlur)" />
                <circle cx="720" cy="450" r="16" fill="#9D6EEA" />
                <circle cx="720" cy="450" r="24" fill="none" stroke="#9D6EEA" strokeOpacity="0.45" strokeWidth="1" />
                <text x="720" y="454" textAnchor="middle" className="origin-return">ประมวลNN · กลับ</text>
              </g>
            )}

            {expanded && legalDomains.map((domain, index) => {
              const isSelected = selectedId === domain.id;
              const isDimmed = Boolean(selectedId && !isSelected);
              return (
                <g key={domain.id} className={`domain-cluster ${isDimmed ? "is-dimmed" : ""}`} style={{ "--delay": `${index * 90}ms` } as CSSProperties}>
                  <g className="cluster-satellites" aria-hidden="true" opacity={isDimmed ? 0.17 : 0.54}>
                    <circle cx={domain.x - domain.radius - 16} cy={domain.y + 11} r="5" fill={domain.softColor} />
                    <circle cx={domain.x + domain.radius + 14} cy={domain.y - 12} r="3.5" fill={domain.color} />
                    <circle cx={domain.x + 7} cy={domain.y - domain.radius - 18} r="3" fill={domain.softColor} />
                  </g>
                  <g className={`graph-node graph-node--domain ${isSelected ? "is-selected" : ""}`} role="button" tabIndex={0} aria-label={`เปิด ${domain.title}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => selectPath([domain.id])} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectPath([domain.id]); } }}>
                    <circle cx={domain.x} cy={domain.y} r={domain.radius + 17} fill={domain.color} opacity={isSelected ? 0.19 : 0.1} filter="url(#softBlur)" />
                    <circle cx={domain.x} cy={domain.y} r={domain.radius + 5} fill="none" stroke={domain.color} strokeOpacity={isSelected ? 0.65 : 0.28} strokeWidth="1.3" />
                    <circle cx={domain.x} cy={domain.y} r={domain.radius} fill={domain.color} filter="url(#nodeShadow)" />
                    <circle cx={domain.x} cy={domain.y} r={Math.max(9, domain.radius * 0.37)} fill="#FFFFFF" opacity="0.16" />
                    <text x={domain.x} y={domain.y - 3} textAnchor="middle" className="domain-abbr">{domain.abbreviation}</text>
                    <text x={domain.x} y={domain.y + domain.radius + 25} textAnchor="middle" className="domain-label">{domain.shortLabel}</text>
                  </g>
                  {isSelected && domain.children.map((subject, subjectIndex) => {
                    const isSubjectSelected = selectedSubjectId === subject.id;
                    return (
                      <g key={subject.id} className="subject-node-wrap" style={{ "--subject-delay": `${subjectIndex * 55}ms`, "--drift-delay": `${(subjectIndex % 7) * -0.9}s` } as CSSProperties}>
                        <g className="subject-node-drift">
                          <g className={`graph-node graph-node--subject ${isSubjectSelected ? "is-selected" : ""}`} role="button" tabIndex={0} aria-label={`เปิดหัวข้อ ${subject.label}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => selectPath([domain.id, subject.id])} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectPath([domain.id, subject.id]); } }}>
                            <circle cx={subject.x} cy={subject.y} r={subject.radius + 10} fill={domain.color} opacity={isSubjectSelected ? 0.19 : 0.075} filter="url(#softBlur)" />
                            <circle cx={subject.x} cy={subject.y} r={subject.radius} fill={domain.softColor} stroke={domain.color} strokeWidth={isSubjectSelected ? 2.1 : 1.15} filter="url(#nodeShadow)" />
                            <circle cx={subject.x} cy={subject.y} r={Math.max(4, subject.radius * 0.3)} fill="#FFFFFF" opacity="0.38" />
                            <text x={subject.x} y={subject.y + subject.radius + 20} textAnchor="middle" className="subject-label">
                              <tspan x={subject.x}>{subject.label}</tspan>
                              {subject.range && <tspan x={subject.x} dy="13" className="node-label__range">{subject.range}</tspan>}
                            </text>
                          </g>
                        </g>
                        {isSubjectSelected && subject.children && (
                          <LegalNodeRing
                            nodes={subject.children}
                            centerX={subject.x}
                            centerY={subject.y}
                            depth={2}
                            domainId={domain.id}
                            domainColor={domain.color}
                            domainSoftColor={domain.softColor}
                            groupLabel={subject.label}
                            selectedPath={selectedPath}
                            pathPrefix={[domain.id, subject.id]}
                            onSelectPath={selectPath}
                            onSelectArticle={handleSelectArticle}
                            showConnections={showConnections}
                            legacyScale={legacyScale}
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {caseOverlay2D && (
              <g className="case-overlay-2d" aria-label={`ภาพรวมคดี ${caseOverlay2D.title}`}>
                <g className="case-overlay-2d__links" aria-hidden="true">
                  {caseOverlay2D.issues.map((issue) => (
                    <path key={`nexus-link-${issue.id}`} d={curvedPath(caseOverlay2D.x, caseOverlay2D.y, issue.x, issue.y)} fill="none" stroke="#D64545" strokeWidth="1.4" opacity="0.4" />
                  ))}
                  {caseOverlay2D.issues.flatMap((issue) => issue.laws.map((law, lawIndex) => (
                    // First law under each issue reads as the primary basis (thicker,
                    // more opaque); the rest are secondary grounds (thinner, fainter) -
                    // gives the fan-out a sense of which มาตรา actually carries the issue.
                    <path
                      key={`law-link-${issue.id}-${law.book}-${law.number}`}
                      d={curvedPath(issue.x, issue.y, law.x, law.y)}
                      fill="none"
                      stroke="#3E7BD6"
                      strokeWidth={lawIndex === 0 ? 1.6 : 1}
                      strokeDasharray={lawIndex === 0 ? undefined : "1 4"}
                      opacity={lawIndex === 0 ? 0.5 : 0.32}
                    />
                  )))}
                </g>

                {caseOverlay2D.issues.map((issue) => (
                  <g key={`issue-${issue.id}`} className="overlay-node overlay-node--issue">
                    <circle cx={issue.x} cy={issue.y} r="19" fill="#E8933A" opacity="0.14" filter="url(#softBlur)" />
                    <circle cx={issue.x} cy={issue.y} r="11" fill="#E8933A" filter="url(#nodeShadow)" />
                    <text x={issue.x} y={issue.y + 25} textAnchor="middle" className="overlay-label overlay-label--issue">{issue.title}</text>
                    {issue.laws.map((law) => (
                      <g key={`law-${issue.id}-${law.book}-${law.number}`} className="overlay-node overlay-node--law" role="button" tabIndex={0} aria-label={`มาตรา ${law.number} ${law.label}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => handleSelectOverlayLaw(law, issue.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleSelectOverlayLaw(law, issue.id); } }}>
                        <circle cx={law.x} cy={law.y} r="12" fill="#3E7BD6" opacity="0.14" filter="url(#softBlur)" />
                        <circle cx={law.x} cy={law.y} r="7" fill="#3E7BD6" filter="url(#nodeShadow)" />
                        <text x={law.x} y={law.y + 19} textAnchor="middle" className="overlay-label overlay-label--law">ม.{law.number}</text>
                      </g>
                    ))}
                  </g>
                ))}

                <g className="overlay-node overlay-node--nexus" role="button" tabIndex={0} aria-label={caseOverlay2D.title} onPointerDown={(event) => event.stopPropagation()} onClick={() => setCaseOverlayOpen(false)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setCaseOverlayOpen(false); } }}>
                  <circle cx={caseOverlay2D.x} cy={caseOverlay2D.y} r="52" fill="#D64545" opacity="0.08" filter="url(#softBlur)" />
                  <circle cx={caseOverlay2D.x} cy={caseOverlay2D.y} r="30" fill="#D64545" opacity="0.14" filter="url(#softBlur)" />
                  <circle cx={caseOverlay2D.x} cy={caseOverlay2D.y} r="17" fill="#D64545" filter="url(#nodeShadow)" />
                  <circle cx={caseOverlay2D.x} cy={caseOverlay2D.y} r="21" fill="none" stroke="#D64545" strokeOpacity="0.5" strokeWidth="1.2" />
                  <text x={caseOverlay2D.x} y={caseOverlay2D.y + 33} textAnchor="middle" className="overlay-label overlay-label--nexus">{caseOverlay2D.title}</text>
                </g>
              </g>
            )}
          </g>
        </svg>
        )}

        {!expanded && (
          <aside className="opening-note">
            <span className="note-rule" />
            <p>เริ่มจากจุดเดียว แล้วค่อยเห็นเครือข่ายกฎหมายไทยทีละชั้น</p>
          </aside>
        )}

        {viewMode === "book" && (
          <section className="book-view" aria-label="สารบัญประมวลกฎหมาย">
            <div className="book-view__head">
              <div><span>LIST / BOOK VIEW</span><h2>สารบัญประมวลกฎหมาย</h2></div>
              <button onClick={() => setViewMode("network")} aria-label="กลับสู่แผนที่"><X size={19} /></button>
            </div>
            <p className="book-view__intro">เลือกเล่มเพื่อกลับไปดูโครงสร้างความสัมพันธ์บนแผนที่ หรือใช้รายการนี้เพื่อค้นหาจุดเริ่มต้นอย่างรวดเร็ว</p>
            <div className="book-list">
              {legalDomains.map((domain, index) => (
                <button key={domain.id} className={selectedId === domain.id ? "is-current" : ""} onClick={() => exploreDomain(domain.id)}>
                  <span className="book-index" style={{ color: domain.color }}>{String(index + 1).padStart(2, "0")}</span>
                  <span><strong>{domain.title}</strong><small>{domain.children.map((subject) => subject.label).slice(0, 3).join(" · ")}</small></span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          </section>
        )}

        <LawSidePanel selection={lawSelection} onClose={() => setLawSelection(null)} />
      </section>
    </main>
  );
}
