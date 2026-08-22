/** ประมวลNN 3D — ขอบเขต error เฉพาะ WebGL เพื่อส่งผู้ใช้กลับมุมมอง 2D อย่างนุ่มนวล */
import { Component, type ReactNode } from "react";
import { recordWebGLTelemetry } from "@/lib/webglTelemetry";

type WebGLBoundaryProps = {
  children: ReactNode;
  onFallback: () => void;
};

type WebGLBoundaryState = { hasError: boolean };

export default class WebGLBoundary extends Component<WebGLBoundaryProps, WebGLBoundaryState> {
  state: WebGLBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WebGLBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    recordWebGLTelemetry("webgl-runtime-error", error.stack ?? error.message);
    window.setTimeout(this.props.onFallback, 0);
  }

  render() {
    if (this.state.hasError) {
      return <div className="force-network-webgl__fallback" role="status">กำลังกลับสู่แผนที่ 2 มิติ</div>;
    }
    return this.props.children;
  }
}
