/**
 * Issue-centric case graph (3D) — คดี(แดง) -> ประเด็นกฎหมาย(ส้ม) -> มาตรา(น้ำเงิน)
 * เปิดเผยทีละชั้น (progressive disclosure) เพื่อลดความรกของกราฟ ตาม pattern เดียวกับ ForceNetwork3D
 */
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpriteText from "three-spritetext";
import * as THREE from "three";
import { recordWebGLTelemetry } from "@/lib/webglTelemetry";
import type { CaseGraphData, CaseIssue, CaseLawRef } from "@/data/caseGraphs";

const CASE_COLOR = "#D64545";
const ISSUE_COLOR = "#E8933A";
const LAW_COLOR = "#3E7BD6";
const IVORY = "#FAF9F6";
const ORIGIN = { x: 0, y: 0, z: 0 };

type NodeKind = "case" | "issue" | "law";
type GraphNode = {
  id: string;
  label: string;
  color: string;
  radius: number;
  kind: NodeKind;
  issueId?: string;
  law?: CaseLawRef;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
};
type GraphLink = { source: string | GraphNode; target: string | GraphNode; color: string };

type CaseGraph3DProps = {
  caseData: CaseGraphData;
  expanded: boolean;
  selectedIssueId: string | null;
  motionEnabled: boolean;
  onOpenCase: () => void;
  onSelectIssue: (issue: CaseIssue) => void;
  onSelectLaw: (law: CaseLawRef, issueId: string) => void;
  onReset: () => void;
  onFallback: (reason: unknown) => void;
};

function spherePoint(index: number, total: number, radius: number, tilt = 0) {
  const phi = Math.acos(1 - 2 * ((index + 0.5) / Math.max(total, 1)));
  const theta = Math.PI * (1 + Math.sqrt(5)) * (index + tilt);
  return { x: Math.cos(theta) * Math.sin(phi) * radius, y: Math.cos(phi) * radius * 0.7, z: Math.sin(theta) * Math.sin(phi) * radius };
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

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,0.82)");
  gradient.addColorStop(0.28, "rgba(255,255,255,0.28)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

type NodeAdornment = { label: SpriteText };

export default function CaseGraph3D({ caseData, expanded, selectedIssueId, motionEnabled, onOpenCase, onSelectIssue, onSelectLaw, onReset, onFallback }: CaseGraph3DProps) {
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const fallbackTriggeredRef = useRef(false);
  const adornmentsRef = useRef(new Map<string, NodeAdornment>());
  const glowTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const { hostRef, dimensions } = useGraphDimensions();

  const fallback = useCallback((reason: unknown) => {
    if (fallbackTriggeredRef.current) return;
    fallbackTriggeredRef.current = true;
    recordWebGLTelemetry("webgl-fallback", reason);
    window.setTimeout(() => onFallback(reason), 0);
  }, [onFallback]);

  const graphData = useMemo(() => {
    const root: GraphNode = { id: "case-root", label: caseData.title, color: CASE_COLOR, radius: 34, kind: "case", ...ORIGIN, fx: 0, fy: 0, fz: 0 };
    const issueNodes: GraphNode[] = caseData.issues.map((issue, index) => ({
      id: `issue-${issue.id}`, label: issue.title, color: ISSUE_COLOR, radius: 20, kind: "issue", issueId: issue.id,
      ...spherePoint(index, caseData.issues.length, 210, 0.4),
    }));
    const lawNodes: GraphNode[] = [];
    const links: GraphLink[] = issueNodes.map((node) => ({ source: root.id, target: node.id, color: ISSUE_COLOR }));

    caseData.issues.forEach((issue) => {
      const issueNode = issueNodes.find((node) => node.issueId === issue.id)!;
      issue.laws.forEach((law, lawIndex) => {
        const offset = spherePoint(lawIndex, issue.laws.length, 120, 1.1);
        const lawNode: GraphNode = {
          id: `law-${issue.id}-${law.book}-${law.number}`, label: `ม.${law.number}`, color: LAW_COLOR, radius: 13, kind: "law", issueId: issue.id, law,
          x: (issueNode.x ?? 0) + offset.x, y: (issueNode.y ?? 0) + offset.y, z: (issueNode.z ?? 0) + offset.z,
        };
        lawNodes.push(lawNode);
        links.push({ source: issueNode.id, target: lawNode.id, color: LAW_COLOR });
      });
    });
    return { nodes: [root, ...issueNodes, ...lawNodes], links };
  }, [caseData]);

  const nodeVisibility = useCallback((node: GraphNode) => {
    if (node.kind === "case") return true;
    if (node.kind === "issue") return expanded;
    return expanded && node.issueId === selectedIssueId;
  }, [expanded, selectedIssueId]);

  const linkVisibility = useCallback((link: GraphLink) => {
    if (!expanded) return false;
    const target = typeof link.target === "string" ? undefined : link.target;
    if (target?.kind === "issue") return true;
    return target?.issueId === selectedIssueId;
  }, [expanded, selectedIssueId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const timer = window.setTimeout(() => {
      const canvas = host.querySelector("canvas");
      if (!canvas) return;
      recordWebGLTelemetry("webgl-start");
      const onContextLost = (event: Event) => { event.preventDefault(); recordWebGLTelemetry("webgl-context-lost"); fallback("webgl context lost"); };
      const onWindowError = (event: ErrorEvent) => {
        const detail = `${event.message} ${event.error?.stack ?? ""}`;
        if (/force-graph|\.tick\b|threedigest|webgl/i.test(detail)) { recordWebGLTelemetry("webgl-runtime-error", detail); fallback(detail); }
      };
      canvas.addEventListener("webglcontextlost", onContextLost, false);
      window.addEventListener("error", onWindowError);
      return () => {
        canvas.removeEventListener("webglcontextlost", onContextLost);
        window.removeEventListener("error", onWindowError);
      };
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fallback, hostRef]);

  useEffect(() => () => {
    adornmentsRef.current.forEach(({ label }) => label.material.map?.dispose());
    adornmentsRef.current.clear();
    glowTextureRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (!expanded) {
      const timer = window.setTimeout(() => graphRef.current?.cameraPosition({ x: 0, y: 70, z: 520 }, ORIGIN, 700), 0);
      return () => window.clearTimeout(timer);
    }
  }, [expanded]);

  const onNodeClick = useCallback((node: GraphNode) => {
    const graph = graphRef.current;
    if (graph && node.kind !== "case") {
      const target = { x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0 };
      const length = Math.max(1, Math.hypot(target.x, target.y, target.z));
      const distance = node.kind === "issue" ? 280 : 150;
      graph.cameraPosition({ x: target.x + (target.x / length) * distance, y: target.y + (target.y / length) * distance, z: target.z + (target.z / length) * distance }, target, 700);
    }
    if (node.kind === "case") { if (expanded) onReset(); else onOpenCase(); return; }
    if (node.kind === "issue" && node.issueId) {
      const issue = caseData.issues.find((item) => item.id === node.issueId);
      if (issue) onSelectIssue(issue);
    }
    if (node.kind === "law" && node.law && node.issueId) onSelectLaw(node.law, node.issueId);
  }, [caseData.issues, expanded, onOpenCase, onReset, onSelectIssue, onSelectLaw]);

  const nodeThreeObject = useCallback((node: GraphNode) => {
    const cached = adornmentsRef.current.get(node.id);
    const group = new THREE.Group();
    const glowTexture = glowTextureRef.current ?? createGlowTexture();
    glowTextureRef.current = glowTexture;
    if (glowTexture) {
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture, color: node.color, transparent: true,
        opacity: node.kind === "case" ? 0.2 : node.kind === "issue" ? 0.12 : 0.08,
        depthWrite: false, blending: THREE.NormalBlending,
      }));
      const haloSize = node.radius * (node.kind === "case" ? 3.6 : 3.0);
      halo.scale.set(haloSize, haloSize, 1);
      halo.raycast = () => {}; // decorative only — must not steal clicks meant for neighboring nodes
      group.add(halo);
    }
    const label = cached?.label ?? new SpriteText(node.label);
    label.text = node.label;
    label.color = "#34283A";
    label.textHeight = node.kind === "case" ? 8 : node.kind === "issue" ? 6 : 4.6;
    label.backgroundColor = "rgba(250,249,246,0.86)";
    label.padding = 1.8;
    label.borderRadius = 2;
    label.position.set(0, -node.radius - 14, 0);
    label.raycast = () => {};
    group.add(label);
    adornmentsRef.current.set(node.id, { label });
    return group;
  }, []);

  return (
    <div ref={hostRef} className="case-graph-webgl" aria-label="แผนที่ประเด็นกฎหมายของคดีตัวอย่าง สามมิติ">
      <div className="force-network-webgl__status"><span className="force-network-webgl__pulse" /> ISSUE MAP · ลากเพื่อหมุน · scroll หรือ pinch เพื่อซูม</div>
      <ForceGraph3D<GraphNode, GraphLink>
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor={IVORY}
        showNavInfo={false}
        numDimensions={3}
        controlType="orbit"
        warmupTicks={24}
        cooldownTicks={motionEnabled ? 150 : 60}
        d3AlphaDecay={motionEnabled ? 0.035 : 0.08}
        d3VelocityDecay={0.36}
        nodeVal={(node) => Math.pow(Math.max(1.1, node.radius / 9), 3)}
        nodeColor={(node) => node.color}
        nodeResolution={20}
        nodeVisibility={nodeVisibility}
        nodeLabel={(node) => node.label}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend
        linkVisibility={linkVisibility}
        linkColor={(link) => link.color}
        linkOpacity={0.28}
        linkWidth={(link) => (typeof link.target !== "string" && link.target.kind === "issue" ? 0.5 : 0.26)}
        enableNodeDrag={false}
        enableNavigationControls
        onNodeClick={onNodeClick}
      />
    </div>
  );
}
