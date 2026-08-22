/**
 * ประมวลNN 3D — ใช้ declarative API ของ react-force-graph-3d เท่านั้น
 * หลีกเลี่ยง custom scene, render loop และ Three.js object reconciliation เพื่อความเสถียร
 */
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { recordWebGLTelemetry } from "@/lib/webglTelemetry";

type MicroNode = { id: string; label: string; radius: number };
type Subject = { id: string; label: string; radius: number; microNodes?: MicroNode[] };

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

type UniverseKind = "origin" | "domain" | "subject" | "micro";
type UniverseNode = {
  id: string;
  label: string;
  color: string;
  radius: number;
  kind: UniverseKind;
  domainId?: string;
  subjectId?: string;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
};
type UniverseLink = {
  source: string | UniverseNode;
  target: string | UniverseNode;
  color: string;
  kind: "root" | "subject" | "micro";
};

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
  onFallbackTo2D: () => void;
};

const IVORY = "#FAF9F6";
const ORIGIN = { x: 0, y: 0, z: 0 };

function spherePoint(index: number, total: number, radius: number, tilt = 0) {
  const phi = Math.acos(1 - 2 * ((index + 0.5) / Math.max(total, 1)));
  const theta = Math.PI * (1 + Math.sqrt(5)) * (index + tilt);
  return { x: Math.cos(theta) * Math.sin(phi) * radius, y: Math.cos(phi) * radius * 0.76, z: Math.sin(theta) * Math.sin(phi) * radius };
}

function useGraphDimensions() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = () => setDimensions({ width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight) });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  return { hostRef, dimensions };
}

const endpointId = (endpoint: string | UniverseNode) => typeof endpoint === "string" ? endpoint : endpoint.id;

export default function ForceNetwork3D({ domains, expanded, selectedDomainId, selectedSubjectId, showConnections, motionEnabled, onExploreDomain, onOpen, onReset, onFallbackTo2D }: ForceNetwork3DProps) {
  const graphRef = useRef<ForceGraphMethods<UniverseNode, UniverseLink> | undefined>(undefined);
  const fallbackTriggeredRef = useRef(false);
  const { hostRef, dimensions } = useGraphDimensions();

  const fallbackTo2D = useCallback((reason: unknown) => {
    if (fallbackTriggeredRef.current) return;
    fallbackTriggeredRef.current = true;
    recordWebGLTelemetry("webgl-fallback", reason);
    window.setTimeout(onFallbackTo2D, 0);
  }, [onFallbackTo2D]);

  const graphData = useMemo(() => {
    const root: UniverseNode = { id: "origin", label: "ประมวล.com", color: "#9D6EEA", radius: 38, kind: "origin", ...ORIGIN, fx: 0, fy: 0, fz: 0 };
    const domainNodes = domains.map((domain, index): UniverseNode => ({
      id: domain.id, label: domain.shortLabel, color: domain.color, radius: Math.max(24, domain.radius * 0.84), kind: "domain", domainId: domain.id, ...spherePoint(index, domains.length, 250, 0.4),
    }));
    const subjectNodes: UniverseNode[] = [];
    const microNodes: UniverseNode[] = [];
    const links: UniverseLink[] = domainNodes.map((node) => ({ source: root.id, target: node.id, color: node.color, kind: "root" }));

    domains.forEach((domain) => {
      const domainNode = domainNodes.find((node) => node.id === domain.id)!;
      domain.children.forEach((subject, index) => {
        const offset = spherePoint(index, domain.children.length, 136, 1.2);
        const subjectNode: UniverseNode = {
          id: `${domain.id}-${subject.id}`, label: subject.label, color: domain.color, radius: Math.max(12, subject.radius * 0.77), kind: "subject", domainId: domain.id, subjectId: subject.id,
          x: (domainNode.x ?? 0) + offset.x, y: (domainNode.y ?? 0) + offset.y, z: (domainNode.z ?? 0) + offset.z,
        };
        subjectNodes.push(subjectNode);
        links.push({ source: domain.id, target: subjectNode.id, color: domain.color, kind: "subject" });
        (subject.microNodes ?? []).forEach((micro, microIndex) => {
          const microOffset = spherePoint(microIndex, subject.microNodes?.length ?? 1, 72, 0.7);
          const microNode: UniverseNode = {
            id: `${domain.id}-${subject.id}-${micro.id}`, label: micro.label, color: domain.color, radius: Math.max(7, micro.radius * 0.72), kind: "micro", domainId: domain.id, subjectId: subject.id,
            x: (subjectNode.x ?? 0) + microOffset.x, y: (subjectNode.y ?? 0) + microOffset.y, z: (subjectNode.z ?? 0) + microOffset.z,
          };
          microNodes.push(microNode);
          links.push({ source: subjectNode.id, target: microNode.id, color: domain.color, kind: "micro" });
        });
      });
    });
    return { nodes: [root, ...domainNodes, ...subjectNodes, ...microNodes], links };
  }, [domains]);

  const nodeVisibility = useCallback((node: UniverseNode) => {
    if (node.kind === "origin") return true;
    if (node.kind === "domain") return expanded;
    if (node.kind === "subject") return expanded && node.domainId === selectedDomainId;
    return expanded && node.domainId === selectedDomainId && node.subjectId === selectedSubjectId;
  }, [expanded, selectedDomainId, selectedSubjectId]);

  const linkVisibility = useCallback((link: UniverseLink) => {
    if (!showConnections || !expanded) return false;
    if (link.kind === "root") return true;
    if (link.kind === "subject") return endpointId(link.source) === selectedDomainId;
    return endpointId(link.source) === `${selectedDomainId}-${selectedSubjectId}`;
  }, [expanded, selectedDomainId, selectedSubjectId, showConnections]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const timer = window.setTimeout(() => {
      const canvas = host.querySelector("canvas");
      if (!canvas) return;
      recordWebGLTelemetry("webgl-start");
      const onContextLost = (event: Event) => { event.preventDefault(); recordWebGLTelemetry("webgl-context-lost"); fallbackTo2D("webgl context lost"); };
      const onContextRestored = () => recordWebGLTelemetry("webgl-context-restored");
      const onWindowError = (event: ErrorEvent) => {
        const detail = `${event.message} ${event.error?.stack ?? ""}`;
        if (/force-graph|\.tick\b|threedigest|webgl/i.test(detail)) { recordWebGLTelemetry("webgl-runtime-error", detail); fallbackTo2D(detail); }
      };
      canvas.addEventListener("webglcontextlost", onContextLost, false);
      canvas.addEventListener("webglcontextrestored", onContextRestored, false);
      window.addEventListener("error", onWindowError);
      host.dataset.webglListenersReady = "true";
      return () => {
        canvas.removeEventListener("webglcontextlost", onContextLost);
        canvas.removeEventListener("webglcontextrestored", onContextRestored);
        window.removeEventListener("error", onWindowError);
      };
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fallbackTo2D, hostRef]);

  useEffect(() => {
    if (!expanded || selectedDomainId) return;
    const timer = window.setTimeout(() => graphRef.current?.cameraPosition({ x: 0, y: 90, z: 720 }, ORIGIN, 700), 0);
    return () => window.clearTimeout(timer);
  }, [expanded, selectedDomainId]);

  const onNodeClick = useCallback((node: UniverseNode) => {
    const graph = graphRef.current;
    if (graph && node.kind !== "origin") {
      const target = { x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0 };
      const length = Math.max(1, Math.hypot(target.x, target.y, target.z));
      const distance = node.kind === "domain" ? 380 : node.kind === "subject" ? 250 : 155;
      graph.cameraPosition({ x: target.x + (target.x / length) * distance, y: target.y + (target.y / length) * distance, z: target.z + (target.z / length) * distance }, target, 800);
    }
    if (node.kind === "origin") { if (expanded) onReset(); else onOpen(); return; }
    if (node.kind === "domain" && node.domainId) onExploreDomain(node.domainId);
    if ((node.kind === "subject" || node.kind === "micro") && node.domainId && node.subjectId) onExploreDomain(node.domainId, node.subjectId);
  }, [expanded, onExploreDomain, onOpen, onReset]);

  return (
    <div ref={hostRef} className="force-network-webgl" aria-label="จักรวาลความรู้กฎหมายสามมิติ">
      <div className="force-network-webgl__status"><span className="force-network-webgl__pulse" /> WEBGL LEGAL UNIVERSE · ลากเพื่อหมุน · scroll หรือ pinch เพื่อซูม</div>
      <ForceGraph3D<UniverseNode, UniverseLink>
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor={IVORY}
        showNavInfo={false}
        numDimensions={3}
        controlType="orbit"
        warmupTicks={32}
        cooldownTicks={motionEnabled ? 180 : 80}
        d3AlphaDecay={motionEnabled ? 0.03 : 0.07}
        d3VelocityDecay={0.34}
        nodeVal={(node) => Math.pow(Math.max(1.1, node.radius / 10), 3)}
        nodeColor={(node) => node.color}
        nodeResolution={20}
        nodeVisibility={nodeVisibility}
        nodeLabel={(node) => node.label}
        linkVisibility={linkVisibility}
        linkColor={(link) => link.color}
        linkOpacity={0.24}
        linkWidth={(link) => link.kind === "root" ? 0.56 : link.kind === "subject" ? 0.32 : 0.18}
        enableNodeDrag={false}
        enableNavigationControls
        onNodeClick={onNodeClick}
      />
    </div>
  );
}
