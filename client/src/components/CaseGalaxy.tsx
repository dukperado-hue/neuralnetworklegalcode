/**
 * Galaxy mode — case browser overview, hero view of /case (no caseId).
 * Left cluster: one free-floating node per case (repelled apart via
 * many-body force, spread out like a star cluster instead of clumping).
 * Right roots: fixed-position anchors per CaseCategory (แพ่ง/อาญา/ระหว่างประเทศ),
 * each case linked to its root by a spring (forceLink) so it settles near
 * (not on top of) the category it belongs to. Black background + layered
 * drop-shadow glow + mix-blend-mode screen on the links, per the reference
 * spec - a 2D SVG technique, deliberately not the WebGL/3D system the other
 * force-graphs (CaseGraph3D, ForceNetwork3D) use.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { forceCollide, forceLink, forceManyBody, forceSimulation, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import { caseGraphs, type CaseCategory } from "@/data/caseGraphs";

export const GALAXY_ROOTS: { id: CaseCategory; label: string; color: string }[] = [
  { id: "civil", label: "แพ่ง", color: "#22D3EE" },
  { id: "criminal", label: "อาญา", color: "#FF4D6A" },
  { id: "international", label: "ระหว่างประเทศ", color: "#3DF2A0" },
];

type GalaxyNode = SimulationNodeDatum & {
  id: string;
  kind: "root" | "case";
  label: string;
  color: string;
  radius: number;
  caseId?: string;
  caseCount?: number;
};
type GalaxyLink = SimulationLinkDatum<GalaxyNode>;

function curvedPath(fromX: number, fromY: number, toX: number, toY: number) {
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const bend = (toX - fromX) * 0.06 - (toY - fromY) * 0.1;
  return `M ${fromX} ${fromY} Q ${midX - bend} ${midY - bend} ${toX} ${toY}`;
}

function useHostSize() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1200, height: 760 });
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = () => setSize({ width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight) });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  return { hostRef, size };
}

function buildGraph(width: number, height: number): { nodes: GalaxyNode[]; links: GalaxyLink[] } {
  const rootX = width * 0.76;
  const cases = Object.values(caseGraphs);
  const rootNodes: GalaxyNode[] = GALAXY_ROOTS.map((root, index) => {
    const y = height * ((index + 1) / (GALAXY_ROOTS.length + 1));
    const count = cases.filter((item) => item.category === root.id).length;
    return { id: `root-${root.id}`, kind: "root", label: root.label, color: root.color, radius: 30, caseCount: count, fx: rootX, fy: y, x: rootX, y };
  });
  const caseNodes: GalaxyNode[] = cases.map((caseItem) => {
    const root = rootNodes.find((item) => item.id === `root-${caseItem.category}`)!;
    const angle = Math.random() * Math.PI * 2;
    const spread = 90 + Math.random() * 60;
    return {
      id: `case-${caseItem.id}`,
      kind: "case",
      label: caseItem.title.replace(/^คดี:\s*/, ""),
      color: root.color,
      radius: Math.max(13, 9 + caseItem.issues.length * 3.4),
      caseId: caseItem.id,
      x: (root.x ?? rootX) - width * 0.3 + Math.cos(angle) * spread,
      y: (root.y ?? height / 2) + Math.sin(angle) * spread,
    };
  });
  const links: GalaxyLink[] = cases.map((caseItem) => ({ source: `case-${caseItem.id}`, target: `root-${caseItem.category}` }));
  return { nodes: [...rootNodes, ...caseNodes], links };
}

type CaseGalaxyProps = {
  onSelectCase: (caseId: string) => void;
};

export default function CaseGalaxy({ onSelectCase }: CaseGalaxyProps) {
  const { hostRef, size } = useHostSize();
  const simRef = useRef<Simulation<GalaxyNode, GalaxyLink> | null>(null);
  const [nodes, setNodes] = useState<GalaxyNode[]>([]);
  const [links, setLinks] = useState<GalaxyLink[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const graph = buildGraph(size.width, size.height);
    const simulation = forceSimulation<GalaxyNode>(graph.nodes)
      .force("charge", forceManyBody<GalaxyNode>().strength((node) => (node.kind === "root" ? -20 : -260)))
      .force("link", forceLink<GalaxyNode, GalaxyLink>(graph.links).id((node) => node.id).distance(180).strength(0.65))
      .force("collide", forceCollide<GalaxyNode>().radius((node) => node.radius + 16).strength(0.9))
      .alphaDecay(0.018)
      .on("tick", () => {
        setNodes([...simulation.nodes()]);
        setLinks([...graph.links]);
      });
    // Warm up synchronously (same pattern as CaseGraph3D's warmupTicks) so
    // the graph starts already-settled instead of nodes visibly flying in
    // from their random initial scatter on every load - the tick handler
    // above still keeps firing afterward via d3's own rAF-driven timer for
    // continued organic motion.
    simulation.tick(80);
    setNodes([...simulation.nodes()]);
    setLinks([...graph.links]);
    simRef.current = simulation;
    return () => { simulation.stop(); };
  }, [size.width, size.height]);

  const starfield = useMemo(
    () => Array.from({ length: 70 }, () => ({ x: Math.random() * 100, y: Math.random() * 100, r: 0.4 + Math.random() * 1.1, o: 0.15 + Math.random() * 0.45 })),
    [],
  );

  const resolve = (ref: string | number | GalaxyNode) => (typeof ref === "object" ? ref : nodes.find((node) => node.id === ref));

  return (
    <div ref={hostRef} className="case-galaxy" aria-label="แผนที่รวมคดีทั้งหมด แบบกาแล็กซี">
      <svg className="case-galaxy__svg" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="กาแล็กซีคดี">
        <g className="case-galaxy__starfield" aria-hidden="true">
          {starfield.map((star, index) => (
            <circle key={index} cx={(star.x / 100) * size.width} cy={(star.y / 100) * size.height} r={star.r} fill="#FFFFFF" opacity={star.o} />
          ))}
        </g>

        <g className="case-galaxy__links">
          {links.map((link, index) => {
            const source = resolve(link.source);
            const target = resolve(link.target);
            if (!source || !target || source.x === undefined || target.x === undefined) return null;
            const isHovered = hoveredId === source.id || hoveredId === target.id;
            return (
              <path
                key={index}
                className={`case-galaxy__link ${isHovered ? "is-hovered" : ""}`}
                d={curvedPath(source.x, source.y ?? 0, target.x, target.y ?? 0)}
                stroke={source.color}
                style={{ filter: `drop-shadow(0 0 3px ${source.color}) drop-shadow(0 0 8px ${source.color})` }}
              />
            );
          })}
        </g>

        <g className="case-galaxy__nodes">
          {nodes.map((node) => {
            if (node.x === undefined || node.y === undefined) return null;
            const isHovered = hoveredId === node.id;
            const isRoot = node.kind === "root";
            return (
              <g
                key={node.id}
                className={`case-galaxy__node ${isRoot ? "is-root" : "is-case"} ${isHovered ? "is-hovered" : ""}`}
                transform={`translate(${node.x} ${node.y})`}
                role={isRoot ? undefined : "button"}
                tabIndex={isRoot ? undefined : 0}
                aria-label={isRoot ? `หมวดหมู่ ${node.label}` : `เปิดคดี ${node.label}`}
                onPointerEnter={() => setHoveredId(node.id)}
                onPointerLeave={() => setHoveredId((current) => (current === node.id ? null : current))}
                onClick={() => node.caseId && onSelectCase(node.caseId)}
                onKeyDown={(event) => {
                  if (node.caseId && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelectCase(node.caseId); }
                }}
              >
                <circle
                  className="case-galaxy__node-glow"
                  r={node.radius * (isRoot ? 2.6 : 2.2)}
                  fill={node.color}
                  opacity={isRoot ? 0.16 : isHovered ? 0.28 : 0.14}
                />
                <circle
                  className="case-galaxy__node-core"
                  r={node.radius}
                  fill={isRoot ? "#0A0A12" : node.color}
                  stroke={node.color}
                  strokeWidth={isRoot ? 2.4 : 1.4}
                  style={{ filter: `drop-shadow(0 0 4px ${node.color}) drop-shadow(0 0 ${isHovered ? 16 : 9}px ${node.color})` }}
                />
                <text className="case-galaxy__node-label" y={node.radius + (isRoot ? 22 : 18)} textAnchor="middle">
                  {node.label}
                  {isRoot && node.caseCount !== undefined ? ` (${node.caseCount})` : ""}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
