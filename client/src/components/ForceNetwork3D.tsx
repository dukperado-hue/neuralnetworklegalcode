/**
 * ประมวลNN 3D — editorial neural field; รับข้อมูล node เดียวกับแผนที่ 2D
 * เพื่อให้สี ขนาด และโครงสร้างกฎหมายอัปเดตจากแหล่งข้อมูลเดียวกันเสมอ
 */
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Subject = {
  id: string;
  label: string;
  radius: number;
  color?: string;
  microNodes?: { id: string; label: string; radius: number }[];
};

export type ForceNetworkDomain = {
  id: string;
  shortLabel: string;
  title: string;
  abbreviation: string;
  color: string;
  softColor: string;
  radius: number;
  children: Subject[];
};

type GraphNode = SimulationNodeDatum & {
  id: string;
  label: string;
  abbreviation?: string;
  color: string;
  softColor: string;
  radius: number;
  depth: number;
  kind: "origin" | "domain" | "subject" | "micro";
  domainId?: string;
  subjectId?: string;
  targetX?: number;
  targetY?: number;
  fx?: number | null;
  fy?: number | null;
};

type GraphLink = SimulationLinkDatum<GraphNode> & { source: string | GraphNode; target: string | GraphNode; color: string };

type ForceNetwork3DProps = {
  domains: ForceNetworkDomain[];
  expanded: boolean;
  selectedDomainId: string | null;
  selectedSubjectId: string | null;
  showConnections: boolean;
  motionEnabled: boolean;
  onExploreDomain: (domainId: string, subjectId?: string | null) => void;
  onOpen: () => void;
  onReset: () => void;
};

const VIEWBOX = { width: 1440, height: 900, centerX: 720, centerY: 450 };

function nodeDepth(index: number, kind: GraphNode["kind"]) {
  if (kind === "origin") return 90;
  const seed = Math.sin((index + 1) * 2.19) * 130;
  return kind === "domain" ? seed : seed * 0.68;
}

function project(node: GraphNode) {
  const depthFactor = 820 / (820 - node.depth);
  return {
    x: VIEWBOX.centerX + ((node.x ?? VIEWBOX.centerX) - VIEWBOX.centerX) * depthFactor,
    y: VIEWBOX.centerY + ((node.y ?? VIEWBOX.centerY) - VIEWBOX.centerY) * depthFactor,
    scale: Math.max(0.78, Math.min(1.2, depthFactor)),
    opacity: Math.max(0.3, Math.min(1, 0.72 + node.depth / 760)),
  };
}

export default function ForceNetwork3D({ domains, expanded, selectedDomainId, selectedSubjectId, showConnections, motionEnabled, onExploreDomain, onOpen, onReset }: ForceNetwork3DProps) {
  const activeDomain = domains.find((domain) => domain.id === selectedDomainId) ?? null;
  const activeSubject = activeDomain?.children.find((subject) => subject.id === selectedSubjectId) ?? null;
  const simulationRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const draggingRef = useRef<GraphNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const graph = useMemo(() => {
    const root: GraphNode = {
      id: "origin",
      label: "ประมวล.com",
      abbreviation: "NN",
      color: "#9D6EEA",
      softColor: "#CBA9FA",
      radius: 46,
      depth: nodeDepth(0, "origin"),
      kind: "origin",
      x: VIEWBOX.centerX,
      y: VIEWBOX.centerY,
      targetX: VIEWBOX.centerX,
      targetY: VIEWBOX.centerY,
    };

    if (!expanded) return { nodes: [root], links: [] as GraphLink[] };

    const domainNodes = domains.map((domain, index): GraphNode => {
      const angle = (index / domains.length) * Math.PI * 2 - Math.PI / 2;
      const isActive = domain.id === activeDomain?.id;
      const targetX = isActive ? 910 : VIEWBOX.centerX + Math.cos(angle) * 288;
      const targetY = isActive ? VIEWBOX.centerY : VIEWBOX.centerY + Math.sin(angle) * 230;
      return {
      id: domain.id,
      label: domain.shortLabel,
      abbreviation: domain.abbreviation,
      color: domain.color,
      softColor: domain.softColor,
      radius: domain.radius,
      depth: nodeDepth(index + 1, "domain"),
      kind: "domain",
      domainId: domain.id,
      x: targetX,
      y: targetY,
      targetX,
      targetY,
    };
    });

    const activeDomainNode = domainNodes.find((node) => node.id === activeDomain?.id);

    const subjectNodes = activeDomain
      ? activeDomain.children.map((subject, index): GraphNode => {
          const totalSubjects = Math.max(activeDomain.children.length, 1);
          const angle = (index / totalSubjects) * Math.PI * 2 - Math.PI / 2;
          const isSelectedSubject = subject.id === activeSubject?.id;
          const targetX = isSelectedSubject ? 1122 : (activeDomainNode?.targetX ?? VIEWBOX.centerX) + Math.cos(angle) * 178;
          const targetY = isSelectedSubject ? VIEWBOX.centerY : (activeDomainNode?.targetY ?? VIEWBOX.centerY) + Math.sin(angle) * 165;
          return {
          id: `${activeDomain.id}-${subject.id}`,
          label: subject.label,
          color: activeDomain.color,
          softColor: activeDomain.softColor,
          radius: subject.radius,
          depth: nodeDepth(index + 12, "subject"),
          kind: "subject",
          domainId: activeDomain.id,
          subjectId: subject.id,
          x: targetX,
          y: targetY,
          targetX,
          targetY,
        };
        })
      : [];

    const microNodes = activeDomain && activeSubject
      ? (activeSubject.microNodes ?? []).map((micro, index): GraphNode => ({
          id: `${activeDomain.id}-${activeSubject.id}-${micro.id}`,
          label: micro.label,
          color: activeDomain.color,
          softColor: activeDomain.softColor,
          radius: micro.radius,
          depth: nodeDepth(index + 42, "micro"),
          kind: "micro",
          domainId: activeDomain.id,
          subjectId: activeSubject.id,
          x: 1122 + Math.cos((index / Math.max(activeSubject.microNodes?.length ?? 1, 1)) * Math.PI * 2 - Math.PI / 2) * 208,
          y: VIEWBOX.centerY + Math.sin((index / Math.max(activeSubject.microNodes?.length ?? 1, 1)) * Math.PI * 2 - Math.PI / 2) * 208,
          targetX: 1122 + Math.cos((index / Math.max(activeSubject.microNodes?.length ?? 1, 1)) * Math.PI * 2 - Math.PI / 2) * 208,
          targetY: VIEWBOX.centerY + Math.sin((index / Math.max(activeSubject.microNodes?.length ?? 1, 1)) * Math.PI * 2 - Math.PI / 2) * 208,
        }))
      : [];

    const domainLinks: GraphLink[] = domainNodes.map((node) => ({ source: root.id, target: node.id, color: node.color }));
    const subjectLinks: GraphLink[] = subjectNodes.map((node) => ({ source: activeDomain!.id, target: node.id, color: activeDomain!.color }));
    const microLinks: GraphLink[] = microNodes.map((node) => ({ source: `${activeDomain!.id}-${activeSubject!.id}`, target: node.id, color: activeDomain!.color }));
    return { nodes: [root, ...domainNodes, ...subjectNodes, ...microNodes], links: [...domainLinks, ...subjectLinks, ...microLinks] };
  }, [activeDomain, activeSubject, domains, expanded]);

  useEffect(() => {
    const simulation = forceSimulation(graph.nodes)
      .force("link", forceLink<GraphNode, GraphLink>(graph.links).id((node) => node.id).distance((link) => String(link.source) === "origin" ? 235 : (typeof link.target === "object" && link.target.kind === "micro") ? 178 : 148).strength(0.44))
      .force("charge", forceManyBody<GraphNode>().strength((node) => node.kind === "origin" ? -940 : node.kind === "domain" ? -560 : node.kind === "subject" ? -365 : -225))
      .force("collide", forceCollide<GraphNode>().radius((node) => node.radius + (node.kind === "micro" ? 29 : node.kind === "subject" ? 34 : 48)).strength(0.98))
      .force("x", forceX<GraphNode>((node) => node.targetX ?? VIEWBOX.centerX).strength((node) => node.kind === "micro" ? 0.27 : node.kind === "subject" ? 0.16 : node.kind === "domain" ? 0.085 : 0.19))
      .force("y", forceY<GraphNode>((node) => node.targetY ?? VIEWBOX.centerY).strength((node) => node.kind === "micro" ? 0.27 : node.kind === "subject" ? 0.16 : node.kind === "domain" ? 0.085 : 0.19))
      .alpha(0.95)
      .alphaDecay(motionEnabled ? 0.025 : 0.08);

    if (!motionEnabled) simulation.stop();
    simulationRef.current = simulation;

    const renderTick = () => {
      animationFrameRef.current = null;
      setNodes([...graph.nodes]);
      setLinks([...graph.links]);
    };
    simulation.on("tick", () => {
      if (animationFrameRef.current === null) animationFrameRef.current = requestAnimationFrame(renderTick);
    });
    setNodes([...graph.nodes]);
    setLinks([...graph.links]);

    return () => {
      simulation.stop();
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [graph, motionEnabled]);

  const getPointerPosition = (event: ReactPointerEvent<SVGSVGElement | SVGGElement>) => {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * VIEWBOX.width,
      y: ((event.clientY - bounds.top) / bounds.height) * VIEWBOX.height,
    };
  };

  const handleNodePointerDown = (event: ReactPointerEvent<SVGGElement>, node: GraphNode) => {
    event.stopPropagation();
    if (node.kind === "origin") return;
    const position = getPointerPosition(event);
    draggingRef.current = node;
    node.fx = position.x;
    node.fy = position.y;
    simulationRef.current?.alphaTarget(0.22).restart();
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const node = draggingRef.current;
    if (!node) return;
    const position = getPointerPosition(event);
    node.fx = position.x;
    node.fy = position.y;
    simulationRef.current?.alpha(0.28).restart();
  };

  const releaseNode = (event: ReactPointerEvent<SVGSVGElement | SVGGElement>) => {
    const node = draggingRef.current;
    if (!node) return;
    node.fx = null;
    node.fy = null;
    simulationRef.current?.alphaTarget(0);
    draggingRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleNodeClick = (node: GraphNode) => {
    if (isDragging || node.kind === "origin") return;
    if (node.kind === "domain" && node.domainId) onExploreDomain(node.domainId);
    if ((node.kind === "subject" || node.kind === "micro") && node.domainId && node.subjectId) onExploreDomain(node.domainId, node.subjectId);
  };

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div className={`force-network-3d ${isDragging ? "is-dragging" : ""}`}>
      <div className="force-network-3d__status"><span className="force-network-3d__pulse" /> 3D NEURAL FIELD · ลาก node เพื่อจัดจังหวะเครือข่าย</div>
      <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="มุมมอง 3 มิติของโครงข่ายกฎหมาย" onPointerMove={handlePointerMove} onPointerUp={releaseNode} onPointerCancel={releaseNode}>
        <defs>
          <filter id="forceGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="forceShadow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#382842" floodOpacity="0.18" /></filter>
        </defs>
        <g className="force-network-3d__stars" aria-hidden="true">
          {Array.from({ length: 42 }, (_, index) => <circle key={index} cx={(index * 149 + 61) % 1440} cy={(index * 97 + 43) % 900} r={index % 6 === 0 ? 2.3 : 1.1} opacity={0.16 + (index % 4) * 0.05} />)}
        </g>
        {showConnections && <g className="force-network-3d__links" aria-hidden="true">
          {links.map((link, index) => {
            const source = typeof link.source === "string" ? nodeById.get(link.source) : link.source;
            const target = typeof link.target === "string" ? nodeById.get(link.target) : link.target;
            if (!source || !target) return null;
            const a = project(source);
            const b = project(target);
            return <path key={`${index}-${source.id}-${target.id}`} d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2 + (b.y - a.y) * 0.1} ${(a.y + b.y) / 2 - (b.x - a.x) * 0.1} ${b.x} ${b.y}`} stroke={link.color} strokeWidth={target.kind === "subject" ? 0.9 : 1.45} opacity={0.24 + Math.min(a.opacity, b.opacity) * 0.34} fill="none" />;
          })}
        </g>}
        <g className="force-network-3d__nodes">
          {nodes.sort((a, b) => a.depth - b.depth).map((node) => {
            const point = project(node);
            const radius = node.radius * point.scale;
            const isSelected = node.domainId === selectedDomainId && (node.kind === "domain" || node.subjectId === selectedSubjectId);
            return (
              <g key={node.id} className={`force-node force-node--${node.kind} ${isSelected ? "is-selected" : ""}`} transform={`translate(${point.x} ${point.y})`} opacity={point.opacity} role="button" tabIndex={0} aria-label={node.kind === "origin" ? (expanded ? "กลับสู่ภาพรวม" : "เปิดเครือข่ายกฎหมาย") : `เปิด ${node.label}`} onPointerDown={(event) => handleNodePointerDown(event, node)} onPointerUp={releaseNode} onClick={() => node.kind === "origin" ? (expanded ? onReset() : onOpen()) : handleNodeClick(node)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); node.kind === "origin" ? (expanded ? onReset() : onOpen()) : handleNodeClick(node); } }}>
                <circle r={radius + 18} fill={node.color} opacity="0.13" filter="url(#forceGlow)" />
                <circle r={radius + 6} fill="none" stroke={node.color} strokeWidth="1.1" opacity="0.52" />
                <circle r={radius} fill={node.color} filter="url(#forceShadow)" />
                <circle r={Math.max(7, radius * 0.38)} fill="#FFFFFF" opacity="0.17" />
                {node.abbreviation && <text y="3" textAnchor="middle" className="force-node__abbr">{node.abbreviation}</text>}
                <text y={radius + 23} textAnchor="middle" className="force-node__label">{node.label}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
