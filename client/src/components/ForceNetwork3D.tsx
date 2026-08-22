/**
 * ประมวลNN 3D — Three.js/WebGL legal knowledge universe บนพื้น ivory
 * ข้อมูล node, สี, ขนาด และลำดับชั้นใช้ชุดเดียวกับแผนที่ 2D เสมอ
 */
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import { forceCollide } from "d3-force-3d";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

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
  abbreviation?: string;
  color: string;
  softColor: string;
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

type UniverseLink = { source: string; target: string; color: string; kind: "root" | "subject" | "micro" };

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

const IVORY = "#FAF9F6";
const ORIGIN = { x: 0, y: 0, z: 0 };

function spherePoint(index: number, total: number, radius: number, tilt = 0) {
  const phi = Math.acos(1 - 2 * ((index + 0.5) / Math.max(total, 1)));
  const theta = Math.PI * (1 + Math.sqrt(5)) * (index + tilt);
  return {
    x: Math.cos(theta) * Math.sin(phi) * radius,
    y: Math.cos(phi) * radius * 0.76,
    z: Math.sin(theta) * Math.sin(phi) * radius,
  };
}

function labelTexture(text: string, color: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;
  const fontSize = 32;
  context.font = `600 ${fontSize}px \"IBM Plex Sans Thai Looped\", sans-serif`;
  const width = Math.ceil(context.measureText(text).width) + 36;
  canvas.width = Math.max(width, 80);
  canvas.height = 56;
  context.font = `600 ${fontSize}px \"IBM Plex Sans Thai Looped\", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(250, 249, 246, 0.92)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createNodeObject(node: UniverseNode, includeLabel: boolean) {
  const group = new THREE.Group();
  const radius = node.radius;
  const isOrigin = node.kind === "origin";
  const geometry = new THREE.SphereGeometry(radius, 28, 22);
  const material = new THREE.MeshStandardMaterial({
    color: node.color,
    emissive: new THREE.Color(node.color),
    emissiveIntensity: isOrigin ? 2.8 : 2.1,
    roughness: 0.34,
    metalness: 0.08,
    transparent: true,
    opacity: node.kind === "micro" ? 0.88 : 0.96,
  });
  const sphere = new THREE.Mesh(geometry, material);
  group.add(sphere);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(radius * (isOrigin ? 1.52 : 1.32), 22, 18),
    new THREE.MeshBasicMaterial({
      color: node.softColor,
      transparent: true,
      opacity: isOrigin ? 0.14 : 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    }),
  );
  group.add(halo);

  if (isOrigin) {
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.4, 20, 16),
      new THREE.MeshBasicMaterial({ color: "#FFFDF9", transparent: true, opacity: 0.22 }),
    );
    group.add(core);
  }

  if (includeLabel) {
    const texture = labelTexture(node.label, "#33283A");
    if (texture) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
      const scale = Math.max(46, Math.min(164, node.label.length * 7.1));
      sprite.scale.set(scale, 15, 1);
      sprite.position.set(0, -radius - 18, 0);
      sprite.name = "legal-node-label";
      group.add(sprite);
      group.userData.labelSprite = sprite;
    }
  }

  return group;
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

export default function ForceNetwork3D({ domains, expanded, selectedDomainId, selectedSubjectId, showConnections, motionEnabled, onExploreDomain, onOpen, onReset }: ForceNetwork3DProps) {
  const graphRef = useRef<ForceGraphMethods<UniverseNode, UniverseLink> | undefined>(undefined);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const initializedSceneRef = useRef(false);
  const nodeObjectCacheRef = useRef(new Map<string, THREE.Group>());
  const { hostRef, dimensions } = useGraphDimensions();
  const activeDomain = domains.find((domain) => domain.id === selectedDomainId) ?? null;
  const activeSubject = activeDomain?.children.find((subject) => subject.id === selectedSubjectId) ?? null;
  const graphKey = `${expanded ? "open" : "closed"}:${selectedDomainId ?? "overview"}:${selectedSubjectId ?? "none"}`;
  const previousGraphKeyRef = useRef(graphKey);
  if (previousGraphKeyRef.current !== graphKey) {
    previousGraphKeyRef.current = graphKey;
    initializedSceneRef.current = false;
    nodeObjectCacheRef.current.clear();
  }

  const graphData = useMemo(() => {
    const root: UniverseNode = {
      id: "origin",
      label: "ประมวล.com",
      abbreviation: "NN",
      color: "#9D6EEA",
      softColor: "#CBA9FA",
      radius: 38,
      kind: "origin",
      ...ORIGIN,
      fx: 0,
      fy: 0,
      fz: 0,
    };
    if (!expanded) return { nodes: [root], links: [] as UniverseLink[] };

    const domainNodes = domains.map((domain, index): UniverseNode => ({
      id: domain.id,
      label: domain.shortLabel,
      abbreviation: domain.abbreviation,
      color: domain.color,
      softColor: domain.softColor,
      radius: Math.max(24, domain.radius * 0.84),
      kind: "domain",
      domainId: domain.id,
      ...spherePoint(index, domains.length, 250, 0.4),
    }));

    const domainNode = domainNodes.find((node) => node.id === activeDomain?.id);
    const subjectNodes = activeDomain && domainNode
      ? activeDomain.children.map((subject, index): UniverseNode => {
          const offset = spherePoint(index, activeDomain.children.length, 136, 1.2);
          return {
            id: `${activeDomain.id}-${subject.id}`,
            label: subject.label,
            color: activeDomain.color,
            softColor: activeDomain.softColor,
            radius: Math.max(12, subject.radius * 0.77),
            kind: "subject",
            domainId: activeDomain.id,
            subjectId: subject.id,
            x: (domainNode.x ?? 0) + offset.x,
            y: (domainNode.y ?? 0) + offset.y,
            z: (domainNode.z ?? 0) + offset.z,
          };
        })
      : [];

    const subjectNode = subjectNodes.find((node) => node.subjectId === activeSubject?.id);
    const microNodes = activeDomain && activeSubject && subjectNode
      ? (activeSubject.microNodes ?? []).map((micro, index): UniverseNode => {
          const offset = spherePoint(index, activeSubject.microNodes?.length ?? 1, 72, 0.7);
          return {
            id: `${activeDomain.id}-${activeSubject.id}-${micro.id}`,
            label: micro.label,
            color: activeDomain.color,
            softColor: activeDomain.softColor,
            radius: Math.max(7, micro.radius * 0.72),
            kind: "micro",
            domainId: activeDomain.id,
            subjectId: activeSubject.id,
            x: (subjectNode.x ?? 0) + offset.x,
            y: (subjectNode.y ?? 0) + offset.y,
            z: (subjectNode.z ?? 0) + offset.z,
          };
        })
      : [];

    const rootLinks: UniverseLink[] = domainNodes.map((node) => ({ source: root.id, target: node.id, color: node.color, kind: "root" }));
    const subjectLinks: UniverseLink[] = subjectNodes.map((node) => ({ source: activeDomain!.id, target: node.id, color: activeDomain!.color, kind: "subject" }));
    const microLinks: UniverseLink[] = microNodes.map((node) => ({ source: `${activeDomain!.id}-${activeSubject!.id}`, target: node.id, color: activeDomain!.color, kind: "micro" }));
    return { nodes: [root, ...domainNodes, ...subjectNodes, ...microNodes], links: [...rootLinks, ...subjectLinks, ...microLinks] };
  }, [activeDomain, activeSubject, domains, expanded]);

  const configureScene = useCallback(() => {
    const graph = graphRef.current;
    if (!graph || initializedSceneRef.current) return;
    initializedSceneRef.current = true;
    const scene = graph.scene();
    scene.background = new THREE.Color(IVORY);
    scene.fog = null;
    scene.add(new THREE.HemisphereLight("#FFFDF8", "#CFC4D0", 2.2));
    const keyLight = new THREE.DirectionalLight("#FFFFFF", 1.15);
    keyLight.position.set(180, 240, 320);
    scene.add(keyLight);

    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(180 * 3);
    for (let index = 0; index < 180; index += 1) {
      const point = spherePoint(index, 180, 680, 0.25);
      dustPositions[index * 3] = point.x;
      dustPositions[index * 3 + 1] = point.y;
      dustPositions[index * 3 + 2] = point.z;
    }
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    scene.add(new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: "#D2C4B4", size: 2.2, transparent: true, opacity: 0.28, depthWrite: false })));

    const controls = graph.controls() as { enableDamping?: boolean; dampingFactor?: number; enablePan?: boolean; minDistance?: number; maxDistance?: number };
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 120;
    controls.maxDistance = 1500;
    graph.cameraPosition({ x: 0, y: 90, z: 720 }, ORIGIN, 0);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const graph = graphRef.current;
      if (!graph) return;
      const collision = forceCollide((node: UniverseNode) => node.radius * (node.kind === "micro" ? 1.85 : 2.25) + 12).strength(0.96);
      graph.d3Force("collision", collision);
      graph.d3ReheatSimulation();
      configureScene();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [configureScene, graphData.nodes]);

  useEffect(() => {
    if (!expanded || selectedDomainId) return;
    const frame = window.requestAnimationFrame(() => {
      graphRef.current?.cameraPosition({ x: 0, y: 90, z: 720 }, ORIGIN, 800);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expanded, selectedDomainId]);

  useEffect(() => {
    if (dimensions.width < 4 || dimensions.height < 4) return;
    let bloomPass: UnrealBloomPass | null = null;
    const frame = window.requestAnimationFrame(() => {
      const graph = graphRef.current;
      if (!graph) return;
      const composer = graph.postProcessingComposer();
      composer.setSize(dimensions.width, dimensions.height);
      bloomPass = new UnrealBloomPass(new THREE.Vector2(dimensions.width, dimensions.height), 0.08, 0.24, 1.32);
      bloomPass.threshold = 1.32;
      bloomPass.strength = 0.08;
      bloomPass.radius = 0.24;
      bloomPass.setSize(dimensions.width, dimensions.height);
      composer.addPass(bloomPass);
      bloomPassRef.current = bloomPass;
    });
    return () => {
      window.cancelAnimationFrame(frame);
      const graph = graphRef.current;
      if (graph && bloomPass) graph.postProcessingComposer().removePass(bloomPass);
      bloomPass?.dispose();
      if (bloomPassRef.current === bloomPass) bloomPassRef.current = null;
    };
  }, [dimensions.height, dimensions.width]);

  useEffect(() => {
    let frame = 0;
    const render = () => {
      const graph = graphRef.current;
      if (graph) {
        const controls = graph.controls() as { update?: () => void };
        controls.update?.();
        if (bloomPassRef.current) graph.postProcessingComposer().render();
        else graph.renderer().render(graph.scene(), graph.camera());
      }
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(frame);
  }, [dimensions.height, dimensions.width]);

  const onNodeClick = useCallback((node: UniverseNode) => {
    const graph = graphRef.current;
    if (graph && node.kind !== "origin") {
      const target = new THREE.Vector3(node.x ?? 0, node.y ?? 0, node.z ?? 0);
      const direction = target.lengthSq() > 1 ? target.clone().normalize() : new THREE.Vector3(0, 0, 1);
      const distance = node.kind === "domain" ? 380 : node.kind === "subject" ? 250 : 155;
      const cameraPosition = target.clone().add(direction.multiplyScalar(distance));
      graph.cameraPosition(cameraPosition, target, 850);
    }
    if (node.kind === "origin") {
      if (expanded) onReset(); else onOpen();
      return;
    }
    if (node.kind === "domain" && node.domainId) onExploreDomain(node.domainId);
    if ((node.kind === "subject" || node.kind === "micro") && node.domainId && node.subjectId) onExploreDomain(node.domainId, node.subjectId);
  }, [expanded, onExploreDomain, onOpen, onReset]);

  const onEngineTick = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const cameraPosition = graph.camera().position;
    graphData.nodes.forEach((node) => {
      const label = nodeObjectCacheRef.current.get(node.id)?.userData.labelSprite as THREE.Sprite | undefined;
      if (!label) return;
      const distance = cameraPosition.distanceTo(new THREE.Vector3(node.x ?? 0, node.y ?? 0, node.z ?? 0));
      label.visible = node.kind === "origin" || node.kind === "domain" || (node.kind === "subject" && distance < 620) || (node.kind === "micro" && distance < 300);
    });
  }, [graphData.nodes]);

  const nodeThreeObject = useCallback((node: UniverseNode) => {
    const cached = nodeObjectCacheRef.current.get(node.id);
    if (cached) return cached;
    const showLabel = node.kind === "origin" || node.kind === "domain" || node.kind === "subject";
    const object = createNodeObject(node, showLabel);
    nodeObjectCacheRef.current.set(node.id, object);
    return object;
  }, []);

  return (
    <div ref={hostRef} className="force-network-webgl" aria-label="จักรวาลความรู้กฎหมายสามมิติ">
      <div className="force-network-webgl__status"><span className="force-network-webgl__pulse" /> WEBGL LEGAL UNIVERSE · ลากเพื่อหมุน · scroll หรือ pinch เพื่อซูม</div>
      <ForceGraph3D<UniverseNode, UniverseLink>
        key={graphKey}
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor={IVORY}
        showNavInfo={false}
        numDimensions={3}
        warmupTicks={40}
        cooldownTicks={motionEnabled ? 210 : 90}
        d3AlphaDecay={motionEnabled ? 0.025 : 0.065}
        d3VelocityDecay={0.32}
        nodeThreeObject={nodeThreeObject}
        nodeOpacity={1}
        nodeLabel={(node) => `<span>${node.label}</span>`}
        linkColor={(link) => link.color}
        linkOpacity={showConnections ? 0.26 : 0}
        linkWidth={(link) => link.kind === "root" ? 0.56 : link.kind === "subject" ? 0.32 : 0.18}
        linkCurvature={(link) => link.kind === "root" ? 0.08 : 0.035}
        linkCurveRotation={(link) => link.kind === "root" ? 0.32 : -0.2}
        linkResolution={4}
        enableNodeDrag
        enableNavigationControls
        onNodeClick={onNodeClick}
        onEngineTick={onEngineTick}
        onEngineStop={configureScene}
      />
    </div>
  );
}
