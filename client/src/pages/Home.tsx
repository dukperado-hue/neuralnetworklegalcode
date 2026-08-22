/**
 * รัศมีนิติธรรม — แผนที่ความรู้กฎหมายแบบ organic radial constellation
 * จังหวะภาพ: ivory editorial canvas + color-family nodes + restrained orbital motion.
 */
import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import ForceNetwork3D from "@/components/ForceNetwork3D";
import WebGLBoundary from "@/components/WebGLBoundary";
import {
  ArrowUpRight,
  ChevronRight,
  Crosshair,
  Layers2,
  Link2,
  List,
  Music2,
  Orbit,
  Network,
  RotateCcw,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const MANUS_ASSET_ORIGIN = "https://legalcodes-wmdmwjtc.manus.space";

type LegalSubject = {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  description: string;
  references: string[];
  microNodes?: { id: string; label: string; dx: number; dy: number; radius: number }[];
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
    children: [
      { id: "juristic-contract", label: "นิติกรรมและสัญญา", x: 163, y: 165, radius: 25, description: "หลักนิติกรรมและสัญญา", references: ["นิติกรรม", "สัญญา"] },
      { id: "debt", label: "หนี้", x: 223, y: 420, radius: 24, description: "หลักแห่งหนี้และการระงับหนี้", references: ["หนี้", "การชำระหนี้"] },
      { id: "property", label: "ทรัพย์", x: 324, y: 530, radius: 22, description: "ทรัพย์สินและทรัพยสิทธิ", references: ["ทรัพย์สิน", "ทรัพยสิทธิ"] },
      { id: "sale", label: "ซื้อขาย", x: 505, y: 158, radius: 18, description: "สัญญาซื้อขาย", references: ["ซื้อขาย", "ส่งมอบ"] },
      { id: "exchange", label: "แลกเปลี่ยน", x: 526, y: 241, radius: 16, description: "สัญญาแลกเปลี่ยน", references: ["แลกเปลี่ยน"] },
      { id: "gift", label: "ให้", x: 522, y: 325, radius: 15, description: "สัญญาให้", references: ["ให้"] },
      { id: "lease", label: "เช่าทรัพย์", x: 477, y: 413, radius: 18, description: "สัญญาเช่าทรัพย์", references: ["เช่าทรัพย์"] },
      { id: "hire-purchase", label: "เช่าซื้อ", x: 383, y: 469, radius: 17, description: "สัญญาเช่าซื้อ", references: ["เช่าซื้อ"] },
      { id: "sale-redemption", label: "ขายฝาก", x: 214, y: 520, radius: 16, description: "สัญญาขายฝาก", references: ["ขายฝาก"] },
      { id: "loan", label: "ยืม", x: 93, y: 447, radius: 15, description: "ยืมใช้คงรูปและยืมใช้สิ้นเปลือง", references: ["ยืม"] },
      { id: "hire-work", label: "จ้างทำของ", x: 79, y: 344, radius: 17, description: "สัญญาจ้างทำของ", references: ["จ้างทำของ"] },
      { id: "agency", label: "ตัวแทน", x: 106, y: 246, radius: 16, description: "ตัวแทน", references: ["ตัวแทน"] },
      { id: "tort", label: "ละเมิด", x: 401, y: 142, radius: 29, description: "กลุ่มความรับผิดจากการกระทำละเมิด", references: ["มาตรา 420", "มาตรา 425", "มาตรา 429"], microNodes: [{ id: "tort-420", label: "ม.420", dx: -80, dy: 31, radius: 10 }, { id: "tort-425", label: "ม.425", dx: 76, dy: 26, radius: 10 }, { id: "tort-429", label: "ม.429", dx: 7, dy: -76, radius: 10 }, { id: "tort-employer", label: "ผู้ว่าจ้าง", dx: 90, dy: -50, radius: 9 }] },
      { id: "family", label: "ครอบครัว", x: 429, y: 510, radius: 20, description: "กฎหมายครอบครัว", references: ["ครอบครัว"] },
      { id: "inheritance", label: "มรดก", x: 267, y: 105, radius: 19, description: "การตกทอดและการจัดการมรดก", references: ["มรดก"] },
    ],
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
        microNodes: [
          { id: "criminal-definition", label: "บทนิยาม 1–17", dx: -103, dy: -50, radius: 13 },
          { id: "criminal-penalty", label: "โทษ 18–38", dx: -20, dy: -104, radius: 14 },
          { id: "criminal-liability", label: "ความรับผิด 59–79", dx: 94, dy: -73, radius: 17 },
          { id: "criminal-attempt", label: "พยายาม 80–82", dx: 128, dy: 17, radius: 13 },
          { id: "criminal-participants", label: "ผู้ร่วม 83–89", dx: 86, dy: 100, radius: 14 },
          { id: "criminal-counting", label: "กรรม/อายุความ 90–101", dx: -39, dy: 112, radius: 14 },
        ],
      },
      {
        id: "criminal-part-2",
        label: "ภาค 2 · ภาคความผิด",
        x: 1205,
        y: 181,
        radius: 31,
        description: "ฐานความผิดเฉพาะเรื่อง จัดตามสิ่งที่กฎหมายมุ่งคุ้มครอง",
        references: ["มาตรา 107–366/4", "ภาคความผิด"],
        microNodes: [
          { id: "crime-security", label: "มั่นคง 107–135/4", dx: -158, dy: -53, radius: 13 },
          { id: "crime-government", label: "การปกครอง 136–166", dx: -78, dy: -121, radius: 14 },
          { id: "crime-justice", label: "ยุติธรรม 167–205", dx: 40, dy: -133, radius: 14 },
          { id: "crime-public-safety", label: "สงบ/ภัย 209–239", dx: 133, dy: -74, radius: 14 },
          { id: "crime-forgery", label: "ปลอม 240–269/15", dx: 148, dy: 26, radius: 14 },
          { id: "crime-sex", label: "เพศ 276–287/2", dx: 65, dy: 111, radius: 13 },
          { id: "crime-life", label: "ชีวิต/ร่างกาย 288–308", dx: -50, dy: 128, radius: 17 },
          { id: "crime-liberty", label: "เสรีภาพ/ชื่อเสียง 309–333", dx: -150, dy: 78, radius: 14 },
          { id: "crime-property", label: "ทรัพย์ 334–366", dx: -166, dy: 6, radius: 17 },
          { id: "crime-corpse", label: "ศพ 366/1–366/4", dx: -148, dy: -94, radius: 12 },
        ],
      },
      {
        id: "criminal-part-3",
        label: "ภาค 3 · ลหุโทษ",
        x: 1070,
        y: 414,
        radius: 20,
        description: "ความผิดฐานลหุโทษและมาตราสำคัญในชีวิตประจำวัน",
        references: ["มาตรา 367–398", "ลหุโทษ"],
        microNodes: [
          { id: "crime-petty", label: "ลหุโทษ 367–398", dx: 79, dy: 50, radius: 16 },
          { id: "crime-petty-public", label: "ม.367 · 372 · 376", dx: 116, dy: -27, radius: 11 },
          { id: "crime-petty-harm", label: "ม.391 · 397", dx: -14, dy: 105, radius: 11 },
        ],
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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
        microNodes: [
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

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
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
  const backgroundMusicRef = useRef<HTMLAudioElement>(null);
  const panGestureRef = useRef({ pointerId: -1, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const didDragRef = useRef(false);

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
    const gesture = panGestureRef.current;
    gesture.pointerId = event.pointerId;
    gesture.startX = event.clientX;
    gesture.startY = event.clientY;
    gesture.startPanX = pan.x;
    gesture.startPanY = pan.y;
    didDragRef.current = false;
  };

  const handleMapPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
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
    if (panGestureRef.current.pointerId !== event.pointerId) return;
    panGestureRef.current.pointerId = -1;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    window.setTimeout(() => { didDragRef.current = false; }, 0);
  };

  const selectedDomain = legalDomains.find((domain) => domain.id === selectedId) ?? null;
  const selectedSubject = selectedDomain?.children.find((subject) => subject.id === selectedSubjectId) ?? null;
  const cameraTarget = selectedSubject ?? selectedDomain;
  const microOrbitScale = selectedDomain?.id === "criminal" ? 1.82 : 1.58;
  const cameraScale = cameraEnabled && cameraTarget ? zoom * (selectedSubject ? 1.72 : 1.45) : zoom;
  const cameraTransform = cameraEnabled && cameraTarget
    ? `translate(${720 + pan.x} ${450 + pan.y}) scale(${cameraScale}) translate(-${cameraTarget.x} -${cameraTarget.y})`
    : `translate(${720 + pan.x} ${450 + pan.y}) scale(${zoom}) translate(-720 -450)`;

  const exploreDomain = (domainId: string, subjectId: string | null = null) => {
    if (didDragRef.current) return;
    playSoftTone();
    setExpanded(true);
    setPan({ x: 0, y: 0 });
    if (!subjectId && selectedId === domainId) {
      setSelectedId(null);
      setSelectedSubjectId(null);
      return;
    }
    if (subjectId && selectedId === domainId && selectedSubjectId === subjectId) {
      setSelectedSubjectId(null);
      return;
    }
    setSelectedId(domainId);
    setSelectedSubjectId(subjectId);
    setViewMode("network");
  };

  const returnToAllDomains = () => {
    setSelectedId(null);
    setSelectedSubjectId(null);
    setPan({ x: 0, y: 0 });
  };

  const resetExplorer = () => {
    setExpanded(false);
    setSelectedId(null);
    setSelectedSubjectId(null);
    setViewMode("network");
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <main className={`legal-universe ${motionEnabled ? "" : "motion-off"} ${is3D ? "is-3d" : ""} ${cameraEnabled && cameraTarget ? "camera-focus" : ""}`} onPointerDownCapture={activateBackgroundMusic}>
      <audio ref={backgroundMusicRef} src={`${MANUS_ASSET_ORIGIN}/manus-storage/alex-morgan-jazz-restaurant-music-556244_b7af9a94.mp3`} loop autoPlay muted preload="metadata" onLoadedMetadata={(event) => { event.currentTarget.volume = musicVolume; }} />
      <div className="graph-atmosphere" aria-hidden="true" />
      <header className="universe-header">
        <div className="header-brand-row">
          <div className="route-links" aria-label="เส้นทางเครือข่ายที่เกี่ยวข้อง">
            <a className="lab-return" href="https://coolunclelab.com" target="_blank" rel="noreferrer"><ArrowUpRight size={13} /> <span>Cool Uncle</span></a>
            <a className="lab-return" href="https://coolunclelab.com/lab" target="_blank" rel="noreferrer"><span>Lab</span></a>
            <a className="lab-return" href="https://ประมวล.com" target="_blank" rel="noreferrer"><span>ประมวล.com</span></a>
          </div>
          <button className="brand-lockup" onClick={resetExplorer} aria-label="กลับสู่จุดเริ่มต้นของแผนที่กฎหมาย">
            <img src={`${MANUS_ASSET_ORIGIN}/manus-storage/legal-atlas-mark_676ff7e4.png`} alt="" className="brand-mark" />
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
            {selectedDomain && <><ChevronRight size={13} /><button onClick={() => exploreDomain(selectedDomain.id)}>{selectedDomain.shortLabel}</button></>}
            {selectedSubject && <><ChevronRight size={13} /><span>{selectedSubject.label}</span></>}
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

        <div className="zoom-controls" aria-label="ควบคุมการซูม">
          <button onClick={() => setZoom((value) => Math.max(0.78, Number((value - 0.12).toFixed(2))))} aria-label="ซูมออก"><ZoomOut size={18} /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((value) => Math.min(1.32, Number((value + 0.12).toFixed(2))))} aria-label="ซูมเข้า"><ZoomIn size={18} /></button>
        </div>

        <div className="legend" aria-label="คำอธิบายขนาดโหนด">
          <span><i className="legend-dot legend-dot--large" />เล่มประมวล</span>
          <span><i className="legend-dot legend-dot--medium" />หมวดหลัก</span>
          <span><i className="legend-dot legend-dot--small" />จุดเชื่อมโยง</span>
        </div>

        {selectedDomain && <button className="return-overview-chip" onClick={returnToAllDomains}><RotateCcw size={14} /> กลับภาพรวม</button>}
        {is3D && viewMode === "network" ? (
          <WebGLBoundary onFallback={() => setIs3D(false)}>
            <ForceNetwork3D domains={legalDomains} expanded={expanded} selectedDomainId={selectedId} selectedSubjectId={selectedSubjectId} showConnections={showConnections} motionEnabled={motionEnabled} onExploreDomain={exploreDomain} onOpen={() => { playSoftTone(); setExpanded(true); }} onReset={resetExplorer} onFallbackTo2D={() => setIs3D(false)} />
          </WebGLBoundary>
        ) : (
        <svg className={`law-map ${isPanning ? "is-panning" : ""}`} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="แผนที่ความสัมพันธ์ของประมวลกฎหมายไทย" onPointerDown={handleMapPointerDown} onPointerMove={handleMapPointerMove} onPointerUp={handleMapPointerUp} onPointerCancel={handleMapPointerUp} onPointerLeave={() => { if (panGestureRef.current.pointerId === -1) setIsPanning(false); }}>
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
                  <g className={`graph-node graph-node--domain ${isSelected ? "is-selected" : ""}`} role="button" tabIndex={0} aria-label={`เปิด ${domain.title}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => exploreDomain(domain.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); exploreDomain(domain.id); } }}>
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
                        {isSubjectSelected && showConnections && (
                          <g className="micro-connections-layer" aria-hidden="true">
                            {subject.microNodes?.map((micro) => (
                              <path key={`micro-link-${micro.id}`} d={curvedPath(subject.x, subject.y, subject.x + micro.dx * microOrbitScale, subject.y + micro.dy * microOrbitScale)} fill="none" stroke={domain.color} strokeWidth="0.8" opacity="0.48" />
                            ))}
                          </g>
                        )}
                        <g className="subject-node-drift">
                          <g className={`graph-node graph-node--subject ${isSubjectSelected ? "is-selected" : ""}`} role="button" tabIndex={0} aria-label={`เปิดหัวข้อ ${subject.label}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => exploreDomain(domain.id, subject.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); exploreDomain(domain.id, subject.id); } }}>
                            <circle cx={subject.x} cy={subject.y} r={subject.radius + 10} fill={domain.color} opacity={isSubjectSelected ? 0.19 : 0.075} filter="url(#softBlur)" />
                            <circle cx={subject.x} cy={subject.y} r={subject.radius} fill={domain.softColor} stroke={domain.color} strokeWidth={isSubjectSelected ? 2.1 : 1.15} filter="url(#nodeShadow)" />
                            <circle cx={subject.x} cy={subject.y} r={Math.max(4, subject.radius * 0.3)} fill="#FFFFFF" opacity="0.38" />
                            <text x={subject.x} y={subject.y + subject.radius + 20} textAnchor="middle" className="subject-label">{subject.label}</text>
                          </g>
                        </g>
                        {isSubjectSelected && subject.microNodes?.map((micro, microIndex) => (
                          <g key={micro.id} className="micro-node-wrap" style={{ "--micro-delay": `${microIndex * 75}ms`, "--micro-drift-delay": `${(microIndex % 5) * -1.1}s` } as CSSProperties}>
                            <g className="micro-node-drift">
                              <circle cx={subject.x + micro.dx * microOrbitScale} cy={subject.y + micro.dy * microOrbitScale} r={micro.radius + 5} fill={domain.color} opacity="0.12" filter="url(#softBlur)" />
                              <circle cx={subject.x + micro.dx * microOrbitScale} cy={subject.y + micro.dy * microOrbitScale} r={micro.radius} fill={domain.softColor} stroke={domain.color} strokeWidth="1" />
                              <text x={subject.x + micro.dx * microOrbitScale} y={subject.y + micro.dy * microOrbitScale + micro.radius + 14} textAnchor="middle" className="micro-label">{micro.label}</text>
                            </g>
                          </g>
                        ))}
                      </g>
                    );
                  })}
                </g>
              );
            })}
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
      </section>
    </main>
  );
}
