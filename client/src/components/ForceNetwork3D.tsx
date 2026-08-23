/**
 * ประมวลNN 3D — ใช้ declarative API ของ react-force-graph-3d เท่านั้น
 * หลีกเลี่ยง custom scene, render loop และ Three.js object reconciliation เพื่อความเสถียร
 */
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpriteText from "three-spritetext";
import * as THREE from "three";
import { recordWebGLTelemetry } from "@/lib/webglTelemetry";
import type { CaseGraphData, CaseLawRef } from "@/data/caseGraphs";

// radius is optional: the auto-generated civil/criminal hierarchy (Home.tsx
// legalHierarchy.generated.ts) doesn't carry hand-placed radii the way the
// legacy hand-authored micro-nodes do. MicroNode is recursive (mirrors
// LegalNode in Home.tsx) - the graph now drills to full depth (ลักษณะ ->
// หมวด -> ส่วน -> มาตรา), matching the 2D map, not just one level below
// subject.
type MicroNode = { id: string; label: string; radius?: number; book?: string; number?: string; children?: MicroNode[] };
type Subject = { id: string; label: string; radius: number; children?: MicroNode[] };

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

type UniverseKind = "origin" | "domain" | "subject" | "micro" | "nexus" | "issue" | "law";
type UniverseNode = {
  id: string;
  label: string;
  color: string;
  radius: number;
  kind: UniverseKind;
  domainId?: string;
  subjectId?: string;
  issueId?: string;
  law?: CaseLawRef;
  /** Full selectedPath chain (domain id -> ... -> this node's id) needed to
   * drill the shared 2D/3D selection state to this exact node. */
  path?: string[];
  /** Immediate parent's label, passed to onSelectArticle as the group label
   * (mirrors LegalNodeRing's groupLabel prop in the 2D map). */
  groupLabel?: string;
  book?: string;
  number?: string;
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
  kind: "root" | "subject" | "micro" | "nexus" | "issue" | "law" | "law-anchor";
};

type ForceNetwork3DProps = {
  domains: ForceNetworkDomain[];
  expanded: boolean;
  selectedDomainId: string | null;
  selectedSubjectId: string | null;
  selectedPath: string[];
  showConnections: boolean;
  motionEnabled: boolean;
  caseOverlay: CaseGraphData | null;
  onSelectPath: (path: string[]) => void;
  onSelectArticle: (book: string, node: { id: string; label: string; number?: string }, groupLabel: string) => void;
  onOpen: () => void;
  onReset: () => void;
  onFallbackTo2D: () => void;
  onSelectLaw: (law: CaseLawRef, issueId: string) => void;
};

const NEXUS_COLOR = "#D64545";
const ISSUE_COLOR = "#E8933A";
const LAW_COLOR = "#3E7BD6";

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

type NodeAdornment = { label: SpriteText; node: UniverseNode };

function labelTierForDistance(distance: number) {
  if (distance < 210) return 3;
  if (distance < 330) return 2;
  if (distance < 520) return 1;
  return 0;
}

// Labels stay visible at every zoom level per feedback that hiding them
// until zoomed-in made the graph hard to read; text is kept short (see
// shortenFor3D) specifically so this doesn't turn into clutter.
function labelIsVisible(_node: UniverseNode, _tier: number) {
  return true;
}

function shortenFor3D(text: string, max = 16) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
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

export default function ForceNetwork3D({ domains, expanded, selectedDomainId, selectedSubjectId, selectedPath, showConnections, motionEnabled, caseOverlay, onSelectPath, onSelectArticle, onOpen, onReset, onFallbackTo2D, onSelectLaw }: ForceNetwork3DProps) {
  const graphRef = useRef<ForceGraphMethods<UniverseNode, UniverseLink> | undefined>(undefined);
  const fallbackTriggeredRef = useRef(false);
  const adornmentsRef = useRef(new Map<string, NodeAdornment>());
  const lodTierRef = useRef(0);
  const glowTextureRef = useRef<THREE.CanvasTexture | null>(null);
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
          path: [domain.id, subject.id],
          x: (domainNode.x ?? 0) + offset.x, y: (domainNode.y ?? 0) + offset.y, z: (domainNode.z ?? 0) + offset.z,
        };
        subjectNodes.push(subjectNode);
        links.push({ source: domain.id, target: subjectNode.id, color: domain.color, kind: "subject" });

        // Only the currently active subject gets its descendant tree
        // materialized, and only as deep as selectedPath has already been
        // drilled - mirrors the 2D map's LegalNodeRing, which recurses into
        // a node's children only once that node is selected. Keeps
        // graphData bounded even for subjects with hundreds of มาตรา.
        const isActiveSubject = domain.id === selectedDomainId && subject.id === selectedSubjectId;
        if (isActiveSubject && subject.children) {
          const addLevel = (nodes: MicroNode[], parent: UniverseNode, baseRadius: number, depth: number) => {
            const parentPos = { x: parent.x ?? 0, y: parent.y ?? 0, z: parent.z ?? 0 };
            nodes.forEach((micro, microIndex) => {
              const microOffset = spherePoint(microIndex, nodes.length, baseRadius, 0.7 + depth * 0.31);
              const isLeaf = !micro.children;
              const microNode: UniverseNode = {
                id: `${domain.id}-${subject.id}-${micro.id}`, label: micro.label, color: domain.color,
                radius: Math.max(isLeaf ? 5 : 7, (micro.radius ?? 16) * 0.72) / (1 + depth * 0.4),
                kind: "micro", domainId: domain.id, subjectId: subject.id,
                path: [...(parent.path ?? []), micro.id], groupLabel: parent.label,
                book: micro.book, number: micro.number,
                x: parentPos.x + microOffset.x, y: parentPos.y + microOffset.y, z: parentPos.z + microOffset.z,
              };
              microNodes.push(microNode);
              links.push({ source: parent.id, target: microNode.id, color: domain.color, kind: "micro" });
              // Reveal the next ring only once this node is itself the
              // deepest step already selected - same progressive-drill rule
              // as the 2D map, so clicking a node is what exposes its own
              // children rather than the whole subtree appearing at once.
              const isNodeActive = selectedPath[selectedPath.length - 1] === micro.id;
              if (micro.children && isNodeActive) {
                addLevel(micro.children, microNode, Math.max(30, baseRadius * 0.62), depth + 1);
              }
            });
          };
          addLevel(subject.children, subjectNode, 72, 0);
        }
      });
    });

    // Nexus overlay: a free-floating hub, NOT a child of any domain node. Its own
    // position emerges from the centroid of what it connects to (like a hub node
    // in a general network graph — e.g. a "Google" node — rather than a branch of
    // the ภาค/หมวด tree). มาตรา nodes stay anchored to their real micro-node
    // neighbor; Issue nodes float at the centroid of their มาตรา; Nexus floats at
    // the centroid of its Issues.
    const overlayNodes: UniverseNode[] = [];
    const overlayLinks: UniverseLink[] = [];
    if (caseOverlay) {
      const issueNodes: UniverseNode[] = [];

      caseOverlay.issues.forEach((issue) => {
        const anchors = issue.laws
          .map((law) => microNodes.find((node) => node.id === law.anchorMicroNodeId))
          .filter((node): node is UniverseNode => Boolean(node));
        const centroid = anchors.length
          ? { x: anchors.reduce((sum, n) => sum + (n.x ?? 0), 0) / anchors.length, y: anchors.reduce((sum, n) => sum + (n.y ?? 0), 0) / anchors.length, z: anchors.reduce((sum, n) => sum + (n.z ?? 0), 0) / anchors.length }
          : ORIGIN;
        const issuePos = { x: centroid.x + 34, y: centroid.y + 46, z: centroid.z + 34 };
        const issueNode: UniverseNode = { id: `issue-${issue.id}`, label: issue.title, color: ISSUE_COLOR, radius: 14, kind: "issue", issueId: issue.id, ...issuePos };
        issueNodes.push(issueNode);
        overlayNodes.push(issueNode);

        issue.laws.forEach((law, lawIndex) => {
          const anchorMicro = microNodes.find((node) => node.id === law.anchorMicroNodeId);
          const base = anchorMicro ?? issueNode;
          const lawOffset = spherePoint(lawIndex, issue.laws.length, anchorMicro ? 24 : 30, 1.0);
          const lawNode: UniverseNode = {
            id: `law-${issue.id}-${law.book}-${law.number}`, label: `ม.${law.number}`, color: LAW_COLOR, radius: 9, kind: "law", issueId: issue.id, law,
            x: (base.x ?? 0) + lawOffset.x, y: (base.y ?? 0) + lawOffset.y, z: (base.z ?? 0) + lawOffset.z,
          };
          overlayNodes.push(lawNode);
          overlayLinks.push({ source: issueNode.id, target: lawNode.id, color: LAW_COLOR, kind: "law" });
          if (anchorMicro) overlayLinks.push({ source: anchorMicro.id, target: lawNode.id, color: LAW_COLOR, kind: "law-anchor" });
        });
      });

      const issueCentroid = issueNodes.length
        ? { x: issueNodes.reduce((sum, n) => sum + (n.x ?? 0), 0) / issueNodes.length, y: issueNodes.reduce((sum, n) => sum + (n.y ?? 0), 0) / issueNodes.length, z: issueNodes.reduce((sum, n) => sum + (n.z ?? 0), 0) / issueNodes.length }
        : ORIGIN;
      const nexusPos = { x: issueCentroid.x, y: issueCentroid.y + 74, z: issueCentroid.z };
      const nexusNode: UniverseNode = { id: `nexus-${caseOverlay.id}`, label: caseOverlay.title, color: NEXUS_COLOR, radius: 26, kind: "nexus", ...nexusPos };
      overlayNodes.push(nexusNode);
      issueNodes.forEach((issueNode) => overlayLinks.push({ source: nexusNode.id, target: issueNode.id, color: NEXUS_COLOR, kind: "nexus" }));
    }

    return { nodes: [root, ...domainNodes, ...subjectNodes, ...microNodes, ...overlayNodes], links: [...links, ...overlayLinks] };
  }, [domains, caseOverlay, selectedDomainId, selectedSubjectId, selectedPath]);

  const nodeVisibility = useCallback((node: UniverseNode) => {
    if (node.kind === "origin") return true;
    if (node.kind === "nexus" || node.kind === "issue" || node.kind === "law") return Boolean(caseOverlay);
    if (node.kind === "domain") return expanded;
    if (node.kind === "subject") return expanded && node.domainId === selectedDomainId;
    return expanded && node.domainId === selectedDomainId && node.subjectId === selectedSubjectId;
  }, [caseOverlay, expanded, selectedDomainId, selectedSubjectId]);

  const linkVisibility = useCallback((link: UniverseLink) => {
    if (link.kind === "nexus" || link.kind === "issue" || link.kind === "law") return Boolean(caseOverlay);
    if (link.kind === "law-anchor") {
      const source = typeof link.source === "string" ? undefined : link.source;
      return Boolean(caseOverlay) && source?.kind === "micro" && expanded && source.domainId === selectedDomainId && source.subjectId === selectedSubjectId;
    }
    if (!showConnections || !expanded) return false;
    if (link.kind === "root") return true;
    if (link.kind === "subject") return endpointId(link.source) === selectedDomainId;
    // "micro" links at any depth are only ever constructed for the active
    // subject's own (possibly partially-drilled) subtree, so once the
    // showConnections/expanded gate above passes they're always relevant.
    return true;
  }, [caseOverlay, expanded, selectedDomainId, selectedSubjectId, showConnections]);

  const applyLod = useCallback(() => {
    const camera = graphRef.current?.camera();
    if (!camera) return;
    const tier = labelTierForDistance(camera.position.length());
    if (tier === lodTierRef.current) return;
    lodTierRef.current = tier;
    adornmentsRef.current.forEach(({ label, node }) => {
      label.visible = labelIsVisible(node, tier);
    });
  }, []);

  useEffect(() => {
    let removeListener: (() => void) | undefined;
    const timer = window.setTimeout(() => {
      const controls = graphRef.current?.controls() as { addEventListener?: (event: string, callback: () => void) => void; removeEventListener?: (event: string, callback: () => void) => void } | undefined;
      if (!controls?.addEventListener) return;
      controls.addEventListener("change", applyLod);
      applyLod();
      removeListener = () => controls.removeEventListener?.("change", applyLod);
    }, 80);
    return () => {
      window.clearTimeout(timer);
      removeListener?.();
    };
  }, [applyLod]);

  useEffect(() => () => {
    adornmentsRef.current.forEach(({ label }) => label.material.map?.dispose());
    adornmentsRef.current.clear();
    glowTextureRef.current?.dispose();
  }, []);

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

  // OrbitControls: clamp the polar angle so the camera can never orbit past
  // the poles - past that point three.js flips the camera's up-vector,
  // which is what made labels render upside-down. Also add a very slow
  // idle auto-rotate (only while motion is enabled) so the graph never
  // feels static once the force simulation has cooled down.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const controls = graphRef.current?.controls() as { minPolarAngle?: number; maxPolarAngle?: number; autoRotate?: boolean; autoRotateSpeed?: number } | undefined;
      if (!controls) return;
      controls.minPolarAngle = 0.15;
      controls.maxPolarAngle = Math.PI - 0.15;
      controls.autoRotate = motionEnabled;
      controls.autoRotateSpeed = 0.35;
    }, 50);
    return () => window.clearTimeout(timer);
  }, [motionEnabled]);

  const onNodeClick = useCallback((node: UniverseNode) => {
    const graph = graphRef.current;
    if (graph && node.kind !== "origin") {
      const target = { x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0 };
      const length = Math.max(1, Math.hypot(target.x, target.y, target.z));
      const distance = node.kind === "domain" ? 380 : node.kind === "subject" ? 250 : 155;
      graph.cameraPosition({ x: target.x + (target.x / length) * distance, y: target.y + (target.y / length) * distance, z: target.z + (target.z / length) * distance }, target, 800);
    }
    if (node.kind === "origin") { if (expanded) onReset(); else onOpen(); return; }
    if (node.kind === "domain" && node.domainId) onSelectPath([node.domainId]);
    if (node.kind === "subject" && node.path) onSelectPath(node.path);
    if (node.kind === "micro" && node.path) {
      // มาตรา leaves (book+number set) open the side panel instead of
      // drilling further, matching the 2D map's handleActivate (leaves are
      // terminal - selectedPath stays at the leaf's parent group).
      if (node.number && node.domainId) onSelectArticle(node.domainId, { id: node.id, label: node.label, number: node.number }, node.groupLabel ?? "");
      else onSelectPath(node.path);
    }
    if (node.kind === "law" && node.law && node.issueId) onSelectLaw(node.law, node.issueId);
  }, [expanded, onSelectPath, onSelectArticle, onOpen, onReset, onSelectLaw]);

  const nodeThreeObject = useCallback((node: UniverseNode) => {
    const cached = adornmentsRef.current.get(node.id);
    if (cached) return cached.label.parent!;

    const group = new THREE.Group();
    const glowTexture = glowTextureRef.current ?? createGlowTexture();
    glowTextureRef.current = glowTexture;
    if (glowTexture) {
      const isOverlay = node.kind === "nexus" || node.kind === "issue" || node.kind === "law";
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture,
        color: node.color,
        transparent: true,
        opacity: node.kind === "origin" ? 0.16 : node.kind === "domain" ? 0.1 : isOverlay ? 0.14 : 0.06,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }));
      const haloSize = node.radius * (node.kind === "origin" ? 3.8 : isOverlay ? 2.4 : 3.1);
      halo.scale.set(haloSize, haloSize, 1);
      halo.raycast = () => {}; // decorative only — must not steal clicks meant for neighboring nodes
      group.add(halo);

      if (node.kind === "nexus") {
        // extra outer ring — makes the free-floating hub read as visually important, like a
        // high-degree hub node (à la Google/Facebook nodes in a general network graph)
        const outerHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: node.color, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.NormalBlending }));
        const outerSize = node.radius * 5.2;
        outerHalo.scale.set(outerSize, outerSize, 1);
        outerHalo.raycast = () => {};
        group.add(outerHalo);
      }
    }

    const label = new SpriteText(shortenFor3D(node.label));
    label.color = "#34283A";
    label.textHeight = node.kind === "origin" ? 9 : node.kind === "domain" ? 7 : node.kind === "subject" ? 5.4 : node.kind === "nexus" ? 6.4 : node.kind === "issue" ? 5 : node.kind === "law" ? 4 : 4.2;
    label.backgroundColor = "rgba(250,249,246,0.84)";
    label.padding = 1.8;
    label.borderRadius = 2;
    label.position.set(0, -node.radius - (node.kind === "micro" ? 10 : 16), 0);
    label.visible = labelIsVisible(node, lodTierRef.current);
    label.raycast = () => {};
    group.add(label);
    adornmentsRef.current.set(node.id, { label, node });
    return group;
  }, []);

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
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend
        linkVisibility={linkVisibility}
        linkColor={(link) => link.color}
        linkOpacity={0.48}
        linkWidth={(link) => link.kind === "root" ? 1 : link.kind === "subject" ? 0.6 : link.kind === "nexus" ? 0.85 : link.kind === "law" ? 0.62 : 0.4}
        linkCurvature={(link) => link.kind === "nexus" || link.kind === "issue" || link.kind === "law" ? 0.28 : link.kind === "law-anchor" ? 0.15 : 0}
        enableNodeDrag={false}
        enableNavigationControls
        onNodeClick={onNodeClick}
      />
    </div>
  );
}
