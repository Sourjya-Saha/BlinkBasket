"use client";
import { useEffect, useRef } from "react";

export function LiquidEffectAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `
      import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js';
      
      const canvas = document.getElementById('liquid-canvas');

      if (canvas) {
        const app = LiquidBackground(canvas);

        // ✅ Black 1x1 pixel as data URL — no CORS issues
        app.loadImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

        const material = app.liquidPlane.material;

        material.color.set("#000000");
        material.metalness = 0.6;
        material.roughness = 0.4;
        material.emissive.set("#000000");
        material.emissiveIntensity = 0;

        app.liquidPlane.uniforms.displacementScale.value = 5;
        app.setRain(false);

        window.__liquidApp = app;
      }
    `;

    document.body.appendChild(script);

    return () => {
      if (window.__liquidApp && window.__liquidApp.dispose) {
        window.__liquidApp.dispose();
      }
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{ background: "#000" }}
    >
      <canvas
        ref={canvasRef}
        id="liquid-canvas"
        className="fixed inset-0 w-full h-full"
      />
    </div>
  );
}