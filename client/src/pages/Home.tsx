/**
 * รัศมีนิติธรรม — แผนที่ความรู้กฎหมายแบบ organic radial constellation
 * จังหวะภาพ: ivory editorial canvas + color-family nodes + restrained orbital motion.
 */
import { useMemo, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Layers2,
  Link2,
  List,
  Music2,
  Orbit,
  Network,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type LegalSubject = {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  description: string;
  references: string[];
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
    description: "ประมวลกฎหมายแพ่งและพาณิชย์ แบ่งเป็น 6 บรรพ ตั้งแต่หลักทั่วไปจนถึงมรดก",
    children: [
      { id: "civil-book-1", label: "บรรพ 1 · หลักทั่วไป", x: 201, y: 183, radius: 20, description: "หลักทั่วไปของประมวลกฎหมายแพ่งและพาณิชย์", references: ["มาตรา 4–193/35", "225 มาตรา"] },
      { id: "civil-book-2", label: "บรรพ 2 · หนี้", x: 254, y: 390, radius: 23, description: "หลักแห่งหนี้ สิทธิ และหน้าที่ของคู่กรณี", references: ["มาตรา 194–452", "259 มาตรา"] },
      { id: "civil-book-3", label: "บรรพ 3 · เอกเทศสัญญา", x: 403, y: 394, radius: 29, description: "เอกเทศสัญญาและกลุ่มสัญญาสำคัญ", references: ["มาตรา 453–798", "847 มาตรา"] },
      { id: "civil-book-4", label: "บรรพ 4 · ทรัพย์สิน", x: 493, y: 239, radius: 20, description: "ทรัพย์สินและทรัพยสิทธิ", references: ["มาตรา 1298–1434", "137 มาตรา"] },
      { id: "civil-book-5", label: "บรรพ 5 · ครอบครัว", x: 288, y: 508, radius: 21, description: "กฎหมายครอบครัว", references: ["มาตรา 1435–1598/41", "215 มาตรา"] },
      { id: "civil-book-6", label: "บรรพ 6 · มรดก", x: 139, y: 329, radius: 19, description: "การตกทอดและการจัดการมรดก", references: ["มาตรา 1599–1755", "157 มาตรา"] },
    ],
  },
  {
    id: "criminal",
    shortLabel: "อาญา",
    title: "ประมวลกฎหมายอาญา",
    abbreviation: "ป.อ.",
    color: "#7E3048",
    softColor: "#D99DAE",
    x: 1055,
    y: 244,
    radius: 40,
    description: "หลักความผิด โทษ ความรับผิดทางอาญา และกลุ่มความผิดสำคัญ",
    children: [
      { id: "criminal-general", label: "ภาคทั่วไป", x: 953, y: 160, radius: 22, description: "หลักทั่วไปของความรับผิดและโทษ", references: ["ภาค 1", "หลักทั่วไป"] },
      { id: "person-offence", label: "ความผิดต่อชีวิต", x: 1167, y: 174, radius: 22, description: "กลุ่มความผิดต่อชีวิตและร่างกาย", references: ["ภาค 2", "ความผิดต่อบุคคล"] },
      { id: "property-offence", label: "ความผิดเกี่ยวกับทรัพย์", x: 1178, y: 348, radius: 24, description: "กลุ่มความผิดต่อทรัพย์", references: ["ภาค 2", "ทรัพย์"] },
      { id: "attempt", label: "พยายาม", x: 950, y: 361, radius: 17, description: "เงื่อนไขความรับผิดในขั้นพยายามกระทำความผิด", references: ["ภาค 1", "ความพยายาม"] },
    ],
  },
  {
    id: "civ-procedure",
    shortLabel: "วิแพ่ง",
    title: "ประมวลกฎหมายวิธีพิจารณาความแพ่ง",
    abbreviation: "ป.วิ.พ.",
    color: "#7771D8",
    softColor: "#B0ABF2",
    x: 324,
    y: 668,
    radius: 38,
    description: "กระบวนพิจารณาคดีแพ่ง การฟ้องคดี พยานหลักฐาน และการบังคับคดี",
    children: [
      { id: "filing", label: "การฟ้องคดี", x: 177, y: 595, radius: 21, description: "จุดเริ่มต้นและเงื่อนไขของการดำเนินคดี", references: ["คำฟ้อง", "คู่ความ"] },
      { id: "evidence-civil", label: "พยานหลักฐาน", x: 436, y: 578, radius: 23, description: "การนำสืบและการรับฟังพยานหลักฐาน", references: ["พยาน", "การพิสูจน์"] },
      { id: "execution", label: "บังคับคดี", x: 436, y: 746, radius: 20, description: "ขั้นตอนภายหลังมีคำพิพากษา", references: ["บังคับคดี", "เจ้าพนักงาน"] },
    ],
  },
  {
    id: "criminal-procedure",
    shortLabel: "วิอาญา",
    title: "ประมวลกฎหมายวิธีพิจารณาความอาญา",
    abbreviation: "ป.วิ.อ.",
    color: "#A05AC8",
    softColor: "#D19BE6",
    x: 1145,
    y: 560,
    radius: 40,
    description: "กระบวนการยุติธรรมทางอาญา ตั้งแต่การสอบสวนไปจนถึงการพิจารณาคดี",
    children: [
      { id: "investigation", label: "สอบสวน", x: 1005, y: 470, radius: 22, description: "ขั้นตอนการสอบสวนและรวบรวมพยานหลักฐาน", references: ["สอบสวน", "พนักงานสอบสวน"] },
      { id: "detention", label: "จับและควบคุมตัว", x: 1247, y: 446, radius: 20, description: "มาตรการระหว่างการดำเนินคดี", references: ["จับกุม", "ควบคุมตัว"] },
      { id: "trial", label: "การพิจารณา", x: 1259, y: 665, radius: 22, description: "ขั้นตอนในชั้นศาล", references: ["พิจารณา", "คำพิพากษา"] },
    ],
  },
  {
    id: "public",
    shortLabel: "มหาชน",
    title: "กฎหมายมหาชน",
    abbreviation: "มหาชน",
    color: "#D6A83F",
    softColor: "#EBCF82",
    x: 720,
    y: 752,
    radius: 37,
    description: "โครงสร้างอำนาจรัฐ สิทธิและเสรีภาพ กฎหมายปกครอง และกลไกตรวจสอบของรัฐ",
    children: [
      { id: "public-constitution", label: "รัฐธรรมนูญ", x: 627, y: 647, radius: 22, description: "หลักรัฐธรรมนูญ สิทธิ เสรีภาพ และโครงสร้างของรัฐ", references: ["สิทธิ", "องค์กรของรัฐ"] },
      { id: "public-administration", label: "กฎหมายปกครอง", x: 838, y: 684, radius: 22, description: "การใช้อำนาจทางปกครองและการคุ้มครองสิทธิ", references: ["คำสั่งทางปกครอง", "คดีปกครอง"] },
      { id: "public-procedure", label: "วิธีพิจารณาคดีปกครอง", x: 789, y: 840, radius: 19, description: "กระบวนพิจารณาคดีและการตรวจสอบทางปกครอง", references: ["ศาลปกครอง", "กระบวนพิจารณา"] },
    ],
  },
  {
    id: "other",
    shortLabel: "อื่นๆ",
    title: "กฎหมายเฉพาะด้าน",
    abbreviation: "เฉพาะด้าน",
    color: "#B38AD9",
    softColor: "#D6C0EB",
    x: 1077,
    y: 746,
    radius: 34,
    description: "พื้นที่สำหรับกฎหมายเฉพาะด้านและกฎหมายที่มีความเชื่อมโยงข้ามประมวล",
    children: [
      { id: "labor", label: "แรงงาน", x: 947, y: 674, radius: 19, description: "กฎหมายแรงงานและความสัมพันธ์ในการจ้าง", references: ["แรงงาน", "จ้างงาน"] },
      { id: "tax", label: "ภาษี", x: 1162, y: 682, radius: 20, description: "กฎหมายด้านภาษีอากร", references: ["ภาษี", "อากร"] },
      { id: "digital", label: "ดิจิทัล", x: 1168, y: 826, radius: 18, description: "กฎหมายและประเด็นร่วมสมัยด้านดิจิทัล", references: ["ข้อมูล", "เทคโนโลยี"] },
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
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"network" | "book">("network");
  const [zoom, setZoom] = useState(1);
  const [showConnections, setShowConnections] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [is3D, setIs3D] = useState(false);

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

  const selectedDomain = legalDomains.find((domain) => domain.id === selectedId) ?? null;
  const selectedSubject = selectedDomain?.children.find((subject) => subject.id === selectedSubjectId) ?? null;

  const searchItems = useMemo(
    () =>
      legalDomains.flatMap((domain) => [
        { id: domain.id, domainId: domain.id, label: domain.title, meta: `${domain.abbreviation} · ประมวล`, type: "volume" },
        ...domain.children.map((subject) => ({
          id: subject.id,
          domainId: domain.id,
          label: subject.label,
          meta: `${domain.shortLabel} · หัวข้อย่อย`,
          type: "subject",
        })),
      ]),
    [],
  );

  const searchResults = searchQuery.trim()
    ? searchItems.filter((item) => `${item.label} ${item.meta}`.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase())).slice(0, 6)
    : [];

  const exploreDomain = (domainId: string, subjectId: string | null = null) => {
    playSoftTone();
    setExpanded(true);
    setSelectedId(domainId);
    setSelectedSubjectId(subjectId);
    setViewMode("network");
    setSearchQuery("");
  };

  const resetExplorer = () => {
    setExpanded(false);
    setSelectedId(null);
    setSelectedSubjectId(null);
    setSearchQuery("");
    setViewMode("network");
    setZoom(1);
  };

  const activeTitle = selectedSubject ? selectedSubject.label : selectedDomain?.title;
  const activeDescription = selectedSubject ? selectedSubject.description : selectedDomain?.description;
  const activeReferences = selectedSubject ? selectedSubject.references : selectedDomain ? [selectedDomain.abbreviation, "กลุ่มประมวล"] : [];

  return (
    <main className={`legal-universe ${motionEnabled ? "" : "motion-off"} ${is3D ? "is-3d" : ""}`}>
      <div className="graph-atmosphere" aria-hidden="true" />
      <header className="universe-header">
        <div className="header-brand-row">
          <a className="lab-return" href="https://coolunclelab.com" target="_blank" rel="noreferrer"><ArrowUpRight size={14} /> <span>Cool Uncle Legal Lab</span></a>
          <button className="brand-lockup" onClick={resetExplorer} aria-label="กลับสู่จุดเริ่มต้นของแผนที่กฎหมาย">
            <img src="/manus-storage/legal-atlas-mark_676ff7e4.png" alt="" className="brand-mark" />
            <span>
              <strong>คลังประมวลกฎหมาย</strong>
              <small>LEGAL KNOWLEDGE ATLAS</small>
            </span>
          </button>
        </div>

        <div className="header-center">
          <span className="header-kicker"><Sparkles size={13} /> LEGAL RELATIONSHIP ATLAS</span>
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

        <nav className="breadcrumb" aria-label="เส้นทางการสำรวจ">
          <button onClick={resetExplorer}>กฎหมายทั้งหมด</button>
          {selectedDomain && <><ChevronRight size={13} /><button onClick={() => exploreDomain(selectedDomain.id)}>{selectedDomain.shortLabel}</button></>}
          {selectedSubject && <><ChevronRight size={13} /><span>{selectedSubject.label}</span></>}
        </nav>

        <div className="atlas-controls" aria-label="ควบคุมการแสดงแผนที่">
          <button className={showConnections ? "is-active" : ""} onClick={() => setShowConnections((value) => !value)} aria-pressed={showConnections}><Link2 size={15} /><span>เส้นโยง</span></button>
          <button className={soundEnabled ? "is-active" : ""} onClick={() => setSoundEnabled((value) => !value)} aria-pressed={soundEnabled}>{soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}<span>เสียง</span></button>
          <button className={motionEnabled ? "is-active" : ""} onClick={() => setMotionEnabled((value) => !value)} aria-pressed={motionEnabled}><Orbit size={15} /><span>Motion</span></button>
          <button className={is3D ? "is-active" : ""} onClick={() => setIs3D((value) => !value)} aria-pressed={is3D}><Layers2 size={15} /><span>{is3D ? "3D" : "2D"}</span></button>
        </div>

        <div className="search-shell">
          <Search size={18} aria-hidden="true" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ค้นหาเล่ม หมวด หรือมาตรา"
            aria-label="ค้นหาประมวลกฎหมาย"
          />
          {searchQuery && <button className="clear-search" onClick={() => setSearchQuery("")} aria-label="ล้างคำค้น"><X size={15} /></button>}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <button key={`${result.domainId}-${result.id}`} onClick={() => exploreDomain(result.domainId, result.type === "subject" ? result.id : null)}>
                  <span className="result-orb" style={{ backgroundColor: legalDomains.find((domain) => domain.id === result.domainId)?.color }} />
                  <span><strong>{result.label}</strong><small>{result.meta}</small></span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
          )}
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

        <svg className="law-map" viewBox="0 0 1440 900" role="img" aria-label="แผนที่ความสัมพันธ์ของประมวลกฎหมายไทย">
          <defs>
            <filter id="softBlur"><feGaussianBlur stdDeviation="16" /></filter>
            <filter id="nodeShadow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#3C3651" floodOpacity="0.16" /></filter>
          </defs>

          <g className="map-zoom-layer" transform={`translate(720 450) scale(${zoom}) translate(-720 -450)`}>
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
                <path d={curvedPath(720, 752, 1055, 244)} fill="none" stroke="#D6A83F" strokeWidth="0.8" strokeDasharray="3 9" opacity={selectedId === "public" || selectedId === "criminal" ? 0.38 : 0.1} />
                {selectedDomain?.children.map((subject) => (
                  <path key={`subject-${subject.id}`} className="subject-connection" d={curvedPath(selectedDomain.x, selectedDomain.y, subject.x, subject.y)} fill="none" stroke={selectedDomain.color} strokeWidth={selectedSubjectId === subject.id ? 1.75 : 1.05} opacity={selectedSubjectId && selectedSubjectId !== subject.id ? 0.18 : 0.54} />
                ))}
              </g>
            )}

            {!expanded ? (
              <g className="origin-node origin-node--initial" role="button" tabIndex={0} aria-label="คลิกเพื่อสำรวจโครงสร้างกฎหมายไทย" onClick={() => { playSoftTone(); setExpanded(true); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); playSoftTone(); setExpanded(true); } }}>
                <circle cx="720" cy="450" r="94" fill="#9D6EEA" opacity="0.12" filter="url(#softBlur)" />
                <circle cx="720" cy="450" r="73" fill="none" stroke="#9D6EEA" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="2 7" />
                <circle cx="720" cy="450" r="58" fill="#9D6EEA" filter="url(#nodeShadow)" />
                <circle cx="720" cy="450" r="65" fill="none" stroke="#9D6EEA" strokeOpacity="0.7" strokeWidth="1.25" />
                <circle cx="720" cy="450" r="41" fill="#FFFFFF" opacity="0.13" />
                <text x="720" y="456" textAnchor="middle" className="origin-brand">ประมวล.com</text>
                <text x="720" y="548" textAnchor="middle" className="explore-prompt">เริ่มสำรวจแผนที่</text>
                <text x="720" y="574" textAnchor="middle" className="explore-caption">เลือกเพื่อเปิดกลุ่มประมวลกฎหมาย</text>
              </g>
            ) : (
              <g className="origin-node origin-node--expanded" role="button" tabIndex={0} onClick={() => { setSelectedId(null); setSelectedSubjectId(null); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(null); setSelectedSubjectId(null); } }}>
                <circle cx="720" cy="450" r="39" fill="#9D6EEA" opacity="0.12" filter="url(#softBlur)" />
                <circle cx="720" cy="450" r="16" fill="#9D6EEA" />
                <circle cx="720" cy="450" r="24" fill="none" stroke="#9D6EEA" strokeOpacity="0.45" strokeWidth="1" />
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
                  <g className={`graph-node graph-node--domain ${isSelected ? "is-selected" : ""}`} role="button" tabIndex={0} aria-label={`เปิด ${domain.title}`} onClick={() => exploreDomain(domain.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); exploreDomain(domain.id); } }}>
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
                      <g key={subject.id} className="subject-node-wrap" style={{ "--subject-delay": `${subjectIndex * 55}ms` } as CSSProperties}>
                        <g className={`graph-node graph-node--subject ${isSubjectSelected ? "is-selected" : ""}`} role="button" tabIndex={0} aria-label={`เปิดหัวข้อ ${subject.label}`} onClick={() => exploreDomain(domain.id, subject.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); exploreDomain(domain.id, subject.id); } }}>
                          <circle cx={subject.x} cy={subject.y} r={subject.radius + 10} fill={domain.color} opacity={isSubjectSelected ? 0.19 : 0.075} filter="url(#softBlur)" />
                          <circle cx={subject.x} cy={subject.y} r={subject.radius} fill={domain.softColor} stroke={domain.color} strokeWidth={isSubjectSelected ? 2.1 : 1.15} filter="url(#nodeShadow)" />
                          <circle cx={subject.x} cy={subject.y} r={Math.max(4, subject.radius * 0.3)} fill="#FFFFFF" opacity="0.38" />
                          <text x={subject.x} y={subject.y + subject.radius + 20} textAnchor="middle" className="subject-label">{subject.label}</text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>

        {!expanded && (
          <aside className="opening-note">
            <span className="note-rule" />
            <p>เริ่มจากจุดเดียว แล้วค่อยเห็นความสัมพันธ์ของกฎหมายไทยทีละชั้น</p>
          </aside>
        )}

        {expanded && !selectedDomain && (
          <aside className="map-instruction">
            <span>เลือกวงกลมหนึ่งวง</span>
            <strong>เพื่อขยายหมวดและจุดเชื่อมโยง</strong>
          </aside>
        )}

        {selectedDomain && (
          <aside className="detail-panel" aria-live="polite">
            <button className="panel-close" onClick={() => { setSelectedId(null); setSelectedSubjectId(null); }} aria-label="ปิดรายละเอียด"><X size={18} /></button>
            <div className="panel-topline"><span className="panel-orb" style={{ backgroundColor: selectedDomain.color }} />{selectedSubject ? selectedDomain.shortLabel : "เล่มประมวล"}</div>
            <p className="panel-code">{selectedSubject ? selectedDomain.abbreviation : selectedDomain.abbreviation}</p>
            <h1>{activeTitle}</h1>
            <p className="panel-description">{activeDescription}</p>
            <div className="panel-references">
              <span>จุดเชื่อมโยง</span>
              <div>{activeReferences.map((reference) => <button key={reference}>{reference}</button>)}</div>
            </div>
            <button className="panel-cta" onClick={() => setViewMode("book")}><BookOpen size={17} /> เปิดสารบัญแบบเล่ม <ArrowUpRight size={16} /></button>
            <img className="panel-ornament" src="/manus-storage/legal-detail-ornament_b47f6ab1.png" alt="" />
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
