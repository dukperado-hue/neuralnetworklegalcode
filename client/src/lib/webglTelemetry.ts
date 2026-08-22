/**
 * ประมวลNN telemetry — บันทึกเฉพาะสถานะ WebGL ทางเทคนิคในเครื่องผู้ใช้
 * ไม่ส่งชื่อผู้ใช้ เนื้อหา กฎหมายที่เลือก หรือข้อมูลระบุตัวตนออกจากเบราว์เซอร์
 */
export type WebGLTelemetryType = "webgl-start" | "webgl-context-lost" | "webgl-context-restored" | "webgl-runtime-error" | "webgl-fallback";

export type WebGLTelemetryEvent = {
  type: WebGLTelemetryType;
  timestamp: string;
  detail?: string;
  viewport: string;
};

const STORAGE_KEY = "pramuan-nn-webgl-telemetry";
const MAX_EVENTS = 24;

function sanitizeDetail(value: unknown) {
  return String(value ?? "unknown")
    .replace(/https?:\/\/[^\s)]+/g, "[url]")
    .replace(/\s+/g, " ")
    .slice(0, 220);
}

export function recordWebGLTelemetry(type: WebGLTelemetryType, detail?: unknown) {
  if (typeof window === "undefined") return;
  const event: WebGLTelemetryEvent = {
    type,
    timestamp: new Date().toISOString(),
    detail: detail ? sanitizeDetail(detail) : undefined,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as WebGLTelemetryEvent[];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...saved.slice(-(MAX_EVENTS - 1)), event]));
  } catch {
    // Telemetry ต้องไม่ขัดขวางการทำงานของแผนที่ เมื่อ storage ถูกปิด
  }

  window.dispatchEvent(new CustomEvent("pramuan-nn:webgl-telemetry", { detail: event }));
  console.info("[ประมวลNN WebGL]", event);
}
