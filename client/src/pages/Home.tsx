/**
 * รัศมีนิติธรรม — แผนที่ความรู้กฎหมายแบบ organic radial constellation
 * จังหวะภาพ: ivory editorial canvas + color-family nodes + restrained orbital motion.
 */
import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject, type WheelEvent as ReactWheelEvent } from "react";
import { Link } from "wouter";
import ForceNetwork3D from "@/components/ForceNetwork3D";
import WebGLBoundary from "@/components/WebGLBoundary";
import LawSidePanel from "@/components/LawSidePanel";
import { caseGraphs, DEFAULT_CASE_ID, type CaseLawRef } from "@/data/caseGraphs";
import { civilHierarchy, criminalHierarchy, civproHierarchy, crimproHierarchy } from "@/data/legalHierarchy.generated";
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
function ringRadiusFor(baseRadius: number, count: number) {
  return Math.min(baseRadius * 2.1, Math.max(baseRadius, baseRadius * 0.55 + count * 7.5));
}

function autoRadialPosition(centerX: number, centerY: number, index: number, count: number, baseRadius: number) {
  const angle = (index / Math.max(1, count)) * Math.PI * 2 - Math.PI / 2;
  const radius = ringRadiusFor(baseRadius, count);
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
    color: "#1A2C79",
    softColor: "#A8AFCC",
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
    color: "#E80566",
    softColor: "#F58FBA",
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
        x: 1345,
        y: 120,
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
    color: "#6370A4",
    softColor: "#B9BFD6",
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
        children: civproHierarchy[0]?.children,
      },
      {
        id: "civil-procedure-part-2",
        label: "ภาค 2 · ศาลชั้นต้น",
        x: 475,
        y: 610,
        radius: 30,
        description: "ขั้นตอนสู้คดีตั้งแต่ยื่นฟ้องจนศาลชั้นต้นมีคำพิพากษา",
        references: ["คำฟ้อง", "คำให้การ", "เตรียมคดี"],
        children: civproHierarchy[1]?.children,
      },
      {
        id: "civil-procedure-part-3",
        label: "ภาค 3 · อุทธรณ์/ฎีกา",
        x: 448,
        y: 830,
        radius: 23,
        description: "การโต้แย้งคำตัดสินของศาลชั้นต้นในชั้นอุทธรณ์และฎีกา",
        references: ["อุทธรณ์", "ฎีกาอนุญาต"],
        children: civproHierarchy[2]?.children,
      },
      {
        id: "civil-procedure-part-4",
        label: "ภาค 4 · คุ้มครอง/บังคับคดี",
        x: 221,
        y: 826,
        radius: 27,
        description: "การคุ้มครองสิทธิชั่วคราวก่อนพิพากษา และการนำคำพิพากษาไปบังคับจริง",
        references: ["วิธีการชั่วคราว", "บังคับคดี"],
        children: civproHierarchy[3]?.children,
      },
    ],
  },
  {
    id: "criminal-procedure",
    shortLabel: "วิอาญา",
    title: "ประมวลกฎหมายวิธีพิจารณาความอาญา",
    abbreviation: "ป.วิ.อ.",
    color: "#811970",
    softColor: "#C698BF",
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
        children: crimproHierarchy[0]?.children,
      },
      {
        id: "criminal-procedure-part-2",
        label: "ภาค 2 · สอบสวน",
        x: 1262,
        y: 405,
        radius: 25,
        description: "ชั้นเจ้าพนักงาน ตั้งแต่สืบสวน สอบสวน หมายอาญา จนถึงชันสูตร",
        references: ["มาตรา 120–156", "สอบสวน"],
        children: crimproHierarchy[1]?.children,
      },
      {
        id: "criminal-procedure-part-3",
        label: "ภาค 3 · ศาลชั้นต้น",
        x: 1360,
        y: 554,
        radius: 29,
        description: "การยื่นฟ้อง ไต่สวน พิจารณา และคำพิพากษาในศาลชั้นต้น",
        references: ["มาตรา 157–192", "ศาลชั้นต้น"],
        children: crimproHierarchy[2]?.children,
      },
      {
        id: "criminal-procedure-part-4",
        label: "ภาค 4 · อุทธรณ์/ฎีกา",
        x: 1284,
        y: 736,
        radius: 21,
        description: "การโต้แย้งคำสั่งหรือคำพิพากษาไปยังศาลสูง",
        references: ["มาตรา 193–225", "อุทธรณ์และฎีกา"],
        children: crimproHierarchy[3]?.children,
      },
      {
        id: "criminal-procedure-part-5",
        label: "ภาค 5 · พยานหลักฐาน",
        x: 1130,
        y: 810,
        radius: 20,
        description: "หลักเกณฑ์การรับฟังพยานหลักฐานในคดีอาญา",
        references: ["มาตรา 226–267", "พยานหลักฐาน"],
        children: crimproHierarchy[4]?.children,
      },
      {
        id: "criminal-procedure-part-6",
        label: "ภาค 6 · บังคับคำพิพากษา",
        x: 965,
        y: 756,
        radius: 21,
        description: "การนำคำพิพากษาไปบังคับโทษและการจัดการค่าธรรมเนียม",
        references: ["มาตรา 245–258", "บังคับตามคำพิพากษา"],
        children: crimproHierarchy[5]?.children,
      },
      {
        id: "criminal-procedure-part-7",
        label: "ภาค 7 · อภัย/ลดโทษ",
        x: 930,
        y: 602,
        radius: 19,
        description: "ขั้นตอนอภัยโทษ เปลี่ยนโทษหนักเป็นเบา และลดโทษ",
        references: ["มาตรา 259–267", "อภัยโทษ"],
        children: crimproHierarchy[6]?.children,
      },
    ],
  },
  {
    id: "public",
    shortLabel: "มหาชน",
    title: "กฎหมายมหาชน",
    abbreviation: "มหาชน",
    color: "#FF8D68",
    softColor: "#FFC6B4",
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
    color: "#BAA45D",
    softColor: "#F4EABC",
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

// Base/home layout for the background particle swarm. Actual per-frame
// position is owned by a small physics sim (see useParticleSwarm below) -
// this array only supplies each particle's identity (home point, radius,
// color) and a per-particle speed multiplier so the swarm doesn't move as
// one uniform block.
const particles = Array.from({ length: 46 }, (_, index) => ({
  x: (index * 137 + 57) % 1440,
  y: (index * 89 + 31) % 900,
  r: index % 7 === 0 ? 4 : index % 3 === 0 ? 2.5 : 1.5,
  color: index % 3 === 0 ? "#811970" : index % 3 === 1 ? "#1A2C79" : "#FF8D68",
  // Wander phase/frequency and an overall speed multiplier (0.55x-1.85x) so
  // particles drift at visibly different paces rather than lock-step.
  phase: (index * 2.399963) % (Math.PI * 2),
  speed: 0.55 + ((index * 47) % 131) / 100,
}));

type ParticleState = { x: number; y: number; vx: number; vy: number };

// Drives the background particles as a light physics sim instead of a
// uniform CSS keyframe: each particle idles around its home point at its
// own speed, and when the user focuses a node (a domain/subject/มาตรา
// selection - an "event"), nearby particles get pulled into a loose cluster
// around that point, with closer particles pulled harder, easing back out
// once the selection changes again. Position is written straight to each
// circle's cx/cy via refs on every frame - no React re-render in the hot
// path, which matters for 46 elements at 60fps.
function useParticleSwarm(targetRef: RefObject<{ x: number; y: number } | null>, motionEnabled: boolean) {
  const circleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const stateRef = useRef<ParticleState[]>(particles.map((p) => ({ x: p.x, y: p.y, vx: 0, vy: 0 })));
  const impulseRef = useRef(0);
  const lastTargetKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!motionEnabled) return;
    let frame = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const target = targetRef.current;
      const targetKey = target ? `${target.x.toFixed(1)},${target.y.toFixed(1)}` : null;
      if (targetKey !== lastTargetKeyRef.current) {
        // A new node just became the focus - kick off a brief inward pull
        // that decays over ~1.1s, on top of the steady ambient attraction.
        if (targetKey) impulseRef.current = 1;
        lastTargetKeyRef.current = targetKey;
      }
      if (impulseRef.current > 0) impulseRef.current = Math.max(0, impulseRef.current - dt * 0.9);

      const states = stateRef.current;
      for (let i = 0; i < particles.length; i += 1) {
        const base = particles[i];
        const state = states[i];
        const t = now / 1000;
        // Ambient wander: a small Lissajous-ish orbit around home, unique
        // per particle via phase/speed so the field never looks uniform.
        const wanderX = Math.cos(t * 0.22 * base.speed + base.phase) * 14 * base.speed;
        const wanderY = Math.sin(t * 0.17 * base.speed + base.phase * 1.3) * 11 * base.speed;
        let ax = (base.x + wanderX - state.x) * 0.6;
        let ay = (base.y + wanderY - state.y) * 0.6;

        if (target) {
          const dx = target.x - state.x;
          const dy = target.y - state.y;
          const dist = Math.max(24, Math.hypot(dx, dy));
          // Closer particles cluster in harder (inverse-distance), capped
          // so they orbit near the node rather than collapsing onto it.
          const pull = Math.min(0.9, 90 / dist) * (0.22 + impulseRef.current * 0.7) * base.speed;
          ax += (dx / dist) * pull * 60;
          ay += (dy / dist) * pull * 60;
        }

        state.vx = (state.vx + ax * dt) * 0.9;
        state.vy = (state.vy + ay * dt) * 0.9;
        state.x += state.vx * dt * 60 * 0.5;
        state.y += state.vy * dt * 60 * 0.5;

        const circle = circleRefs.current[i];
        if (circle) {
          circle.setAttribute("cx", state.x.toFixed(1));
          circle.setAttribute("cy", state.y.toFixed(1));
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [motionEnabled, targetRef]);

  return circleRefs;
}

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

// Finds the selectedPath chain (domain id -> subject id -> ... -> leaf id)
// to a real มาตรา leaf inside one domain's tree, by book+number. Used to
// make the case-nexus overlay's law references actually navigate the
// background map to their real article, instead of only opening the side
// panel with no connection back to the ประมวล node.
function findArticlePathInNodes(nodes: LegalNode[], book: string, number: string, prefix: string[]): string[] | null {
  for (const node of nodes) {
    if (node.book === book && node.number === number) return [...prefix, node.id];
    if (node.children) {
      const found = findArticlePathInNodes(node.children, book, number, [...prefix, node.id]);
      if (found) return found;
    }
  }
  return null;
}

function findArticlePath(domain: LegalDomain, book: string, number: string): string[] | null {
  for (const subject of domain.children) {
    const found = findArticlePathInNodes(subject.children ?? [], book, number, [domain.id, subject.id]);
    if (found) return found;
  }
  return null;
}

// Same lookup, but tries every domain in turn instead of one - a case's
// cited laws routinely span more than one ประมวล (e.g. a criminal-domain
// case citing ป.วิ.อ., which lives under the separate criminal-procedure
// domain), and each law needs to resolve inside whichever domain's tree
// actually holds it, not just the case's own "home" domain.
function findArticlePathAnyDomain(book: string, number: string): { domainId: string; path: string[] } | null {
  for (const domain of legalDomains) {
    const path = findArticlePath(domain, book, number);
    if (path) return { domainId: domain.id, path };
  }
  return null;
}

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
  // Node ids that should reveal their children regardless of selectedPath -
  // used by the case-nexus overlay to keep multiple branches open at once
  // (e.g. two different ลักษณะ under the same ภาค, each holding a cited
  // มาตรา), which a single linear selectedPath can't represent.
  pinnedPathIds?: Set<string>;
};

// Recursively renders one ring of sibling nodes around a parent position,
// and - if one of them is the next step in selectedPath (or pinned open by
// the case overlay) - recurses into its children centered on its own
// computed position. Handles both hand-placed legacy nodes (explicit
// dx/dy) and auto-generated ones (radial layout) via the same code path,
// and terminates at มาตรา leaves (book+number set), which open the side
// panel instead of drilling further.
function LegalNodeRing({ nodes, centerX, centerY, depth, domainId, domainColor, domainSoftColor, groupLabel, selectedPath, pathPrefix, onSelectPath, onSelectArticle, showConnections, legacyScale, pinnedPathIds }: LegalNodeRingProps) {
  const baseRadius = LEVEL_RING_RADIUS[Math.min(depth, LEVEL_RING_RADIUS.length - 1)];
  const activeId = selectedPath[depth];
  // A case's pinned branches can be the only thing "focused" at this ring
  // (e.g. the subject itself is selected but none of its direct children
  // is individually drilled via activeId) - still dim the rest so the
  // pinned branches read as the point of the ring, not just two more
  // siblings among many.
  const hasFocus = Boolean(activeId) || nodes.some((node) => pinnedPathIds?.has(node.id));
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
            <path key={`ring-link-${node.id}`} d={curvedPath(centerX, centerY, pos.x, pos.y)} fill="none" stroke={domainColor} strokeWidth="0.8" opacity={hasFocus && activeId !== node.id && !pinnedPathIds?.has(node.id) ? 0.07 : 0.48} />
          ))}
        </g>
      )}
      {placed.map(({ node, pos }, index) => {
        const isLeaf = !node.children;
        const isActive = activeId === node.id;
        const isPinned = pinnedPathIds?.has(node.id) ?? false;
        const radius = node.radius ?? Math.max(6, 15 - depth * 1.4);
        const nodePath = [...pathPrefix, node.id];
        // node.book is the real codex book key ("crimpro", "civpro", ...) -
        // set only on มาตรา leaves specifically for this lookup. domainId is
        // a different string (e.g. "criminal-procedure") that only
        // coincides with the book key for civil/criminal; falling back to
        // it here was silently breaking the LawSidePanel fetch for every
        // other domain's leaves.
        const handleActivate = () => (isLeaf ? onSelectArticle(node.book ?? domainId, node, groupLabel) : onSelectPath(nodePath));
        return (
          <g key={node.id} className="micro-node-wrap" style={{ "--micro-delay": `${index * staggerStep}ms`, "--micro-drift-delay": `${(index % 5) * -1.1}s` } as CSSProperties}>
            <g className="micro-node-drift">
              <g
                className={`graph-node ${isLeaf ? "graph-node--article" : "graph-node--micro is-expandable"} ${isActive || isPinned ? "is-selected" : ""} ${hasFocus && !isActive && !isPinned ? "is-sibling-dimmed" : ""}`}
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
            {(isActive || isPinned) && node.children && (
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
                pinnedPathIds={pinnedPathIds}
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
      // Pan range scales with the current camera scale - a fixed
      // viewBox-unit clamp (the old ±300/±210) means the same drag covers
      // less and less real ground the more zoomed in the camera is (e.g.
      // drilled several levels deep, or focused on a cross-domain case),
      // making it feel stuck long before you've actually reached the edge
      // of the map. Math.max(1, ...) keeps the floor at the old bounds when
      // zoomed out so the overview doesn't gain excess empty pan room.
      const panScale = Math.max(1, cameraScale);
      const panLimitX = 340 * panScale;
      const panLimitY = 260 * panScale;
      setPan({ x: Math.max(-panLimitX, Math.min(panLimitX, gesture.startPanX + dx)), y: Math.max(-panLimitY, Math.min(panLimitY, gesture.startPanY + dy)) });
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
  const pathSteps = selectedDomain ? resolveSelectedPath(selectedDomain, selectedPath) : [];
  // Normal depth-based camera target - overridden below by a bounding-box
  // fit whenever the case nexus is open (see caseCameraFrame), since a
  // cross-domain case's cited law can sit far outside whatever this single
  // domain/depth's default framing would show.
  const baseCameraTarget = pathSteps.length ? pathSteps[pathSteps.length - 1] : null;

  // Background particle swarm: nearby particles cluster toward whatever
  // node is currently focused (the same point the camera follows), so
  // selecting something reads as a small event rather than a static field.
  // (particleTargetRef.current is set further down, once the final
  // cameraTarget - base or case-frame override - is known.)
  const particleTargetRef = useRef<{ x: number; y: number } | null>(null);
  const particleCircleRefs = useParticleSwarm(particleTargetRef, motionEnabled);

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
  const caseDomain = legalDomains.find((item) => item.id === activeCaseData.domainId) ?? null;

  // Resolves every law cited by the active case to its real place in the
  // ประมวล tree (domain + full id-chain + raw x/y), so the nexus's issue
  // nodes can point straight at the actual มาตรา node instead of drawing a
  // duplicate one of their own -
  // "ปลายสุดคือมาตราซึ่งเป็นอันเดียวกับปลายสุดของประมวล". Looks across every
  // domain (findArticlePathAnyDomain), not just the case's own home domain -
  // a case's laws routinely span more than one ประมวล (e.g. a
  // criminal-domain case citing ป.วิ.อ., which lives under the separate
  // criminal-procedure domain). Skips (rather than fabricates a position
  // for) any law not yet modeled in legalHierarchy.generated.ts anywhere.
  const caseLawTargets = useMemo(() => {
    if (!caseOverlayOpen) return [];
    return activeCaseData.issues.flatMap((issue) =>
      issue.laws.map((law) => {
        const found = findArticlePathAnyDomain(law.book, law.number);
        if (!found) return null;
        const lawDomain = legalDomains.find((item) => item.id === found.domainId);
        if (!lawDomain) return null;
        const steps = resolveSelectedPath(lawDomain, found.path);
        const leaf = steps[steps.length - 1];
        return leaf ? { issueId: issue.id, law, domainId: found.domainId, path: found.path, x: leaf.x, y: leaf.y } : null;
      }),
    ).filter((entry): entry is { issueId: string; law: CaseLawRef; domainId: string; path: string[]; x: number; y: number } => entry !== null);
  }, [caseOverlayOpen, activeCaseData]);

  // Every id along any resolved law's path (subject through the leaf
  // itself) - passed down as pinnedPathIds so LegalNodeRing keeps all of
  // them open simultaneously (a case's laws routinely span more than one
  // ลักษณะ under the same ภาค, which a single selectedPath can't represent
  // on its own) AND so the specific cited มาตรา - not just its ancestor
  // rings - gets the "in focus" treatment that fades its uncited siblings
  // (e.g. ม.290-294 sitting next to a cited ม.288/289 under the same หมวด).
  const casePinnedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const target of caseLawTargets) {
      for (const id of target.path.slice(1)) ids.add(id);
    }
    return ids;
  }, [caseLawTargets]);

  // Nexus overlay: hub + issue nodes positioned in the map's own raw
  // coordinate space (not a fixed viewport point). The hub anchors off the
  // primary law's immediate parent grouping (e.g. "หมวด 1" for ม.288 -
  // walked the same way resolveSelectedPath does, one level short of the
  // leaf) rather than the far edge of the whole subject/ลักษณะ ring, so it
  // reads as attached to the specific ประเด็น the case is about. It's then
  // pushed up-and-left of that anchor - clear of the anchor's own
  // มาตรา-leaf ring (ringRadiusFor at the next depth down, same formula
  // every ring uses) plus a margin for the hub circle/label. Sharing the
  // map's own coordinate space (rather than a fixed viewport point) means a
  // line from an issue straight to a real มาตรา node's resolved position
  // just works under the same camera transform, no separate screen-space
  // conversion needed.
  const caseOverlay2D = useMemo(() => {
    if (!caseOverlayOpen || !caseDomain) return null;
    const caseData = activeCaseData;
    const primaryPath = caseLawTargets[0]?.path ?? [];
    const subject = caseDomain.children.find((item) => item.id === primaryPath[1]) ?? caseDomain.children[0];
    if (!subject) return null;

    // Walk down to the anchor node (primaryPath minus its own มาตรา leaf),
    // mirroring resolveSelectedPath's loop, so we land on the leaf's
    // immediate parent grouping and know how many siblings it has (for its
    // own leaf-ring clearance below).
    let anchorX = subject.x;
    let anchorY = subject.y;
    let anchorChildCount = subject.children?.length ?? 0;
    let currentChildren = subject.children;
    const anchorPathLength = Math.max(2, primaryPath.length - 1);
    for (let depth = 2; depth < anchorPathLength; depth += 1) {
      if (!currentChildren) break;
      const index = currentChildren.findIndex((item) => item.id === primaryPath[depth]);
      if (index === -1) break;
      const node = currentChildren[index];
      const baseRadius = LEVEL_RING_RADIUS[Math.min(depth, LEVEL_RING_RADIUS.length - 1)];
      const legacyScale = caseDomain.id === "criminal" ? 1.82 : 1.58;
      const pos = node.dx !== undefined && node.dy !== undefined
        ? { x: anchorX + node.dx * legacyScale, y: anchorY + node.dy * legacyScale }
        : autoRadialPosition(anchorX, anchorY, index, currentChildren.length, baseRadius);
      anchorX = pos.x;
      anchorY = pos.y;
      anchorChildCount = node.children?.length ?? 0;
      currentChildren = node.children;
    }

    const anchorLeafRingRadius = ringRadiusFor(LEVEL_RING_RADIUS[4], anchorChildCount);
    const hubDistance = anchorLeafRingRadius + 150;
    const hubX = anchorX - hubDistance * 0.82;
    const hubY = anchorY - hubDistance * 0.82;
    const issueCount = Math.max(1, caseData.issues.length);
    const issueRadius = 78 + issueCount * 4;

    // Point each issue node toward the real direction of its own cited
    // มาตรา (average, if it cites more than one) instead of even angular
    // spacing - keeps the hub->issue link and the issue->มาตรา link
    // roughly collinear so they read as one path instead of crossing each
    // other. An issue with no resolved target (e.g. a law cited from a book
    // outside this case's domain, like ป.วิ.อ. inside a criminal-domain
    // case) has no real direction to point along - falls back to the same
    // direction the hub itself was already pushed from the anchor, since
    // that's the one side of the map guaranteed clear of the ring content.
    const hubOffsetAngle = Math.atan2(hubY - anchorY, hubX - anchorX);
    const naturalAngles = caseData.issues.map((issue) => {
      const relatedTargets = caseLawTargets.filter((target) => target.issueId === issue.id);
      if (relatedTargets.length === 0) return hubOffsetAngle;
      const avgX = relatedTargets.reduce((sum, target) => sum + target.x, 0) / relatedTargets.length;
      const avgY = relatedTargets.reduce((sum, target) => sum + target.y, 0) / relatedTargets.length;
      return Math.atan2(avgY - hubY, avgX - hubX);
    });

    // Enforce a minimum angular gap between neighboring issue nodes so two
    // issues whose real มาตรา happen to sit close together don't land on
    // top of each other - sort by natural angle, then nudge later ones
    // forward just enough to keep them apart.
    const MIN_ISSUE_GAP = Math.PI / 5;
    const order = naturalAngles.map((angle, index) => ({ angle, index })).sort((a, b) => a.angle - b.angle);
    const resolvedAngles = new Array<number>(issueCount);
    order.forEach((entry, sortedIndex) => {
      const prevAngle = sortedIndex === 0 ? entry.angle : resolvedAngles[order[sortedIndex - 1].index];
      resolvedAngles[entry.index] = sortedIndex === 0 ? entry.angle : Math.max(entry.angle, prevAngle + MIN_ISSUE_GAP);
    });

    const issues = caseData.issues.map((issue, issueIndex) => {
      const issueAngle = resolvedAngles[issueIndex];
      return { id: issue.id, title: issue.title, x: hubX + Math.cos(issueAngle) * issueRadius, y: hubY + Math.sin(issueAngle) * issueRadius };
    });
    return { title: caseData.title, x: hubX, y: hubY, issues };
  }, [caseOverlayOpen, activeCaseData, caseDomain, caseLawTargets]);

  // Every domain the open case actually touches - its own home domain plus
  // wherever any of its resolved laws landed. Used so a secondary domain
  // (e.g. criminal-procedure, pulled in only because the case cites ป.วิ.อ.)
  // renders its subject/ลักษณะ/มาตรา content and stays undimmed even though
  // it isn't the one the user manually drilled into via selectedPath.
  const caseRelevantDomainIds = useMemo(() => {
    if (!caseOverlayOpen) return null;
    const ids = new Set<string>(caseLawTargets.map((target) => target.domainId));
    if (caseDomain) ids.add(caseDomain.id);
    return ids;
  }, [caseOverlayOpen, caseLawTargets, caseDomain]);

  // Camera override while the nexus is open: fit every point the nexus
  // touches (hub, issue nodes, every resolved มาตรา) into one bounding box
  // instead of using the normal single-domain depth-based target. A
  // cross-domain case's second domain can sit far outside whatever the
  // primary domain's own drill-down framing would show, so without this
  // the real ป.วิ.อ. node (say) would resolve and draw a line correctly but
  // land off-screen. Falls back to the normal depth-based target when no
  // case is open.
  const caseCameraFrame = useMemo(() => {
    if (!caseOverlayOpen || !caseOverlay2D) return null;
    const points = [
      { x: caseOverlay2D.x, y: caseOverlay2D.y },
      ...caseOverlay2D.issues.map((issue) => ({ x: issue.x, y: issue.y })),
      ...caseLawTargets.map((target) => ({ x: target.x, y: target.y })),
    ];
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const margin = 130;
    const boxWidth = Math.max(1, maxX - minX + margin * 2);
    const boxHeight = Math.max(1, maxY - minY + margin * 2);
    const fitScale = Math.min(1440 / boxWidth, 900 / boxHeight);
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, scale: Math.min(1.55, Math.max(0.5, fitScale)) };
  }, [caseOverlayOpen, caseOverlay2D, caseLawTargets]);

  const cameraTarget = caseCameraFrame ?? baseCameraTarget;
  const cameraScale = cameraEnabled && cameraTarget
    ? caseCameraFrame
      ? zoom * caseCameraFrame.scale
      : zoom * cameraScaleForDepth(pathSteps.length)
    : zoom;
  const cameraTransform = cameraEnabled && cameraTarget
    ? `translate(${720 + pan.x} ${450 + pan.y}) scale(${cameraScale}) translate(${-cameraTarget.x} ${-cameraTarget.y})`
    : `translate(${720 + pan.x} ${450 + pan.y}) scale(${zoom}) translate(-720 -450)`;
  particleTargetRef.current = expanded && cameraTarget ? { x: cameraTarget.x, y: cameraTarget.y } : null;

  const toggleCaseOverlay = (caseId: string) => {
    if (caseOverlayOpen && activeCaseId === caseId) {
      setCaseOverlayOpen(false);
      setLawSelection(null);
      return;
    }
    const caseData = caseGraphs[caseId];
    const domain = legalDomains.find((item) => item.id === caseData.domainId) ?? null;
    const firstLaw = caseData.issues[0]?.laws[0];
    const path = domain && firstLaw ? findArticlePath(domain, firstLaw.book, firstLaw.number) : null;
    setActiveCaseId(caseId);
    setCaseOverlayOpen(true);
    setLawSelection(null);
    setExpanded(true);
    setPan({ x: 0, y: 0 });
    // Focus the camera on the case's domain+subject (rather than resetting
    // to the top-level overview) so the auto-revealed real มาตรา branches
    // land centered in view alongside the nexus, not off in a corner.
    setSelectedPath(path ? [path[0], path[1]] : domain ? [domain.id] : []);
    setZoom(1);
    setViewMode("network");
  };

  // Only used by the 3D nexus (ForceNetwork3D still renders its own law
  // nodes rather than pointing at real มาตรา positions - see the
  // project's memory notes on this being 3D-only follow-up work). The 2D
  // map instead lets the now-auto-revealed real มาตรา node itself open
  // this panel via the normal onSelectArticle click path.
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
                <div key={caseItem.id} className="case-menu-row">
                  <button className={isActive ? "is-active" : ""} aria-pressed={isActive} onClick={() => toggleCaseOverlay(caseItem.id)} title={caseItem.subtitle}>
                    <span>{caseItem.title}</span><GitBranch size={14} />
                  </button>
                  {caseItem.newsUrl && (
                    <a
                      className="case-menu-row__news"
                      href={caseItem.newsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`อ่านข่าว: ${caseItem.title} (coolunclelab.com)`}
                      aria-label={`อ่านข่าว ${caseItem.title} บน Cool Uncle Lab`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ArrowUpRight size={13} /> อ่านข่าว
                    </a>
                  )}
                </div>
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
            <ForceNetwork3D domains={legalDomains} expanded={expanded} selectedDomainId={selectedId} selectedSubjectId={selectedSubjectId} selectedPath={selectedPath} showConnections={showConnections} motionEnabled={motionEnabled} caseOverlay={caseOverlayOpen ? activeCaseData : null} onSelectPath={selectPath} onSelectArticle={handleSelectArticle} onOpen={() => { playSoftTone(); setExpanded(true); }} onReset={resetExplorer} onFallbackTo2D={() => setIs3D(false)} onSelectLaw={handleSelectOverlayLaw} />
          </WebGLBoundary>
        ) : (
        <svg className={`law-map ${isPanning ? "is-panning" : ""} ${lawSelection ? "law-focus" : ""}`} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="แผนที่ความสัมพันธ์ของประมวลกฎหมายไทย" onPointerDown={handleMapPointerDown} onPointerMove={handleMapPointerMove} onPointerUp={handleMapPointerUp} onPointerCancel={handleMapPointerUp} onPointerLeave={() => { if (panGestureRef.current.pointerId === -1) setIsPanning(false); }} onWheel={handleMapWheel} onClick={(event) => { if (event.target === event.currentTarget && !didDragRef.current) setLawSelection(null); }}>
          <defs>
            <filter id="softBlur"><feGaussianBlur stdDeviation="16" /></filter>
            <filter id="nodeShadow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#3C3651" floodOpacity="0.16" /></filter>
          </defs>

          <g className="map-zoom-layer" transform={cameraTransform}>
            <g className="atmospheric-zones" aria-hidden="true">
              {expanded && legalDomains.map((domain) => (
                <circle key={`zone-${domain.id}`} cx={domain.x} cy={domain.y} r={domain.radius * 2.55} fill={domain.softColor} opacity={selectedId && selectedId !== domain.id && !caseRelevantDomainIds?.has(domain.id) ? 0.025 : 0.105} filter="url(#softBlur)" />
              ))}
              <circle cx="720" cy="450" r="208" fill="#9D6EEA" opacity={expanded ? 0.035 : 0.08} filter="url(#softBlur)" />
              <circle cx="720" cy="450" r="178" fill="none" stroke="#9D6EEA" strokeWidth="1" opacity={expanded ? 0.1 : 0.18} />
              <circle cx="720" cy="450" r="237" fill="none" stroke="#B38AD9" strokeWidth="0.75" strokeDasharray="3 13" opacity={expanded ? 0.13 : 0.08} />
            </g>

            <g className="background-particles" aria-hidden="true">
              {particles.map((particle, index) => (
                <circle
                  key={index}
                  ref={(el) => { particleCircleRefs.current[index] = el; }}
                  className="map-particle"
                  cx={particle.x}
                  cy={particle.y}
                  r={particle.r}
                  fill={particle.color}
                  opacity={expanded ? 0.28 : 0.16}
                />
              ))}
            </g>

            {/* Rendered early, underneath every node circle drawn further down
                (domains/subjects/มาตรา leaves all paint after this in document
                order) - a line reaching a node should visually disappear behind
                it, not draw across on top of it. */}
            {caseOverlay2D && (
              <g className="case-overlay-2d__links" aria-hidden="true">
                {caseOverlay2D.issues.map((issue) => (
                  <path key={`nexus-link-${issue.id}`} d={curvedPath(caseOverlay2D.x, caseOverlay2D.y, issue.x, issue.y)} fill="none" stroke="#D64545" strokeWidth="1.4" opacity="0.4" />
                ))}
                {/* Straight to the real มาตรา node's own resolved position - no
                    duplicate law node in the nexus itself; the real node IS the
                    endpoint. Draws in as the real node's own arrival animation
                    plays, so the line reads as part of the same reveal. */}
                {caseLawTargets.map((target) => {
                  const issue = caseOverlay2D.issues.find((item) => item.id === target.issueId);
                  if (!issue) return null;
                  const linkPath = curvedPath(issue.x, issue.y, target.x, target.y);
                  const linkKey = `${target.issueId}-${target.law.book}-${target.law.number}`;
                  return (
                    <g key={`nexus-real-link-group-${linkKey}`}>
                      <path
                        className="nexus-real-link"
                        d={linkPath}
                        fill="none"
                        stroke="#1B4F91"
                        strokeWidth="1.6"
                        pathLength={1}
                      />
                      {/* Small dot travelling issue -> real มาตรา, on a loop -
                          the "effect" reinforcing which way the connection
                          reaches, once the initial draw-in has settled. */}
                      <circle r="3" fill="#1B4F91" className="nexus-real-link__pulse">
                        <animateMotion dur="2.6s" begin="0.85s" repeatCount="indefinite" path={linkPath} />
                        <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.15;0.85;1" dur="2.6s" begin="0.85s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  );
                })}
              </g>
            )}

            {expanded && showConnections && (
              <g className="network-connections">
                {legalDomains.map((domain) => {
                  const isDimmed = Boolean(selectedId && selectedId !== domain.id && !caseRelevantDomainIds?.has(domain.id));
                  return <path key={`root-${domain.id}`} d={curvedPath(720, 450, domain.x, domain.y)} fill="none" stroke={domain.color} strokeWidth={selectedId === domain.id ? 2 : 1.1} opacity={isDimmed ? 0.11 : selectedId === domain.id ? 0.64 : 0.37} />;
                })}
                <path d={curvedPath(342, 277, 1055, 244)} fill="none" stroke="#1A2C79" strokeWidth="0.9" strokeDasharray="4 7" opacity={selectedId === "civil" || selectedId === "criminal" ? 0.43 : 0.13} />
                <path d={curvedPath(950, 748, 1088, 235)} fill="none" stroke="#FF8D68" strokeWidth="0.8" strokeDasharray="3 9" opacity={selectedId === "public" || selectedId === "criminal" ? 0.38 : 0.1} />
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
            ) : !caseOverlayOpen ? (
              // Suppressed while the case nexus overlay is open: the nexus
              // hub renders its own diagram centered on this exact same
              // (720,450) viewport point, so both together used to overlap
              // into an unreadable double-circle. The corner "กลับภาพรวม"
              // chip still covers the return-to-overview affordance.
              <g className="origin-node origin-node--expanded" role="button" tabIndex={0} aria-label="กลับสู่ภาพรวมกฎหมายทั้งหมด" onPointerDown={(event) => event.stopPropagation()} onClick={() => { if (!didDragRef.current) resetExplorer(); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); resetExplorer(); } }}>
                <circle cx="720" cy="450" r="39" fill="#9D6EEA" opacity="0.12" filter="url(#softBlur)" />
                <circle cx="720" cy="450" r="16" fill="#9D6EEA" />
                <circle cx="720" cy="450" r="24" fill="none" stroke="#9D6EEA" strokeOpacity="0.45" strokeWidth="1" />
                <text x="720" y="454" textAnchor="middle" className="origin-return">ประมวลNN · กลับ</text>
              </g>
            ) : null}

            {expanded && legalDomains.map((domain, index) => {
              const isSelected = selectedId === domain.id;
              const isCaseRelevant = Boolean(caseRelevantDomainIds?.has(domain.id));
              const isDimmed = Boolean(selectedId && !isSelected && !isCaseRelevant);
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
                  {(isSelected || isCaseRelevant) && domain.children.map((subject, subjectIndex) => {
                    const isSubjectSelected = selectedSubjectId === subject.id;
                    const isSubjectPinned = casePinnedIds.has(subject.id);
                    return (
                      <g key={subject.id} className="subject-node-wrap" style={{ "--subject-delay": `${subjectIndex * 55}ms`, "--drift-delay": `${(subjectIndex % 7) * -0.9}s` } as CSSProperties}>
                        <g className="subject-node-drift">
                          <g className={`graph-node graph-node--subject ${isSubjectSelected || isSubjectPinned ? "is-selected" : ""} ${selectedSubjectId && !isSubjectSelected && !isSubjectPinned ? "is-sibling-dimmed" : ""}`} role="button" tabIndex={0} aria-label={`เปิดหัวข้อ ${subject.label}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => selectPath([domain.id, subject.id])} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectPath([domain.id, subject.id]); } }}>
                            <circle cx={subject.x} cy={subject.y} r={subject.radius + 10} fill={domain.color} opacity={isSubjectSelected ? 0.19 : 0.075} filter="url(#softBlur)" />
                            <circle cx={subject.x} cy={subject.y} r={subject.radius} fill={domain.softColor} stroke={domain.color} strokeWidth={isSubjectSelected ? 2.1 : 1.15} filter="url(#nodeShadow)" />
                            <circle cx={subject.x} cy={subject.y} r={Math.max(4, subject.radius * 0.3)} fill="#FFFFFF" opacity="0.38" />
                            <text x={subject.x} y={subject.y + subject.radius + 20} textAnchor="middle" className="subject-label">
                              <tspan x={subject.x}>{subject.label}</tspan>
                              {subject.range && <tspan x={subject.x} dy="13" className="node-label__range">{subject.range}</tspan>}
                            </text>
                          </g>
                        </g>
                        {(isSubjectSelected || isSubjectPinned) && subject.children && (
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
                            pinnedPathIds={casePinnedIds}
                            legacyScale={domain.id === "criminal" ? 1.82 : 1.58}
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
                {caseOverlay2D.issues.map((issue) => (
                  <g key={`issue-${issue.id}`} className="overlay-node overlay-node--issue">
                    <circle cx={issue.x} cy={issue.y} r="19" fill="#E8933A" opacity="0.14" filter="url(#softBlur)" />
                    <circle cx={issue.x} cy={issue.y} r="11" fill="#E8933A" filter="url(#nodeShadow)" />
                    <text x={issue.x} y={issue.y + 25} textAnchor="middle" className="overlay-label overlay-label--issue">{issue.title}</text>
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
