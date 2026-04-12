"use client";
import { useEffect, useRef } from "react";

export function LiquidEffectAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Give canvas a unique ID so the inline module script can find it
    canvas.id = "liquid-canvas-" + Date.now();
    const canvasId = canvas.id;

    let gyroEnabled = false;
    let disposed = false;

    // ── Gyroscope handler ──────────────────────────────────────────
    const handleOrientation = (e) => {
      if (disposed) return;
      const gamma = Math.max(-45, Math.min(45, e.gamma ?? 0));
      const beta  = Math.max(-45, Math.min(45, (e.beta ?? 45) - 45));

      const x = ((gamma + 45) / 90) * window.innerWidth;
      const y = ((beta  + 45) / 90) * window.innerHeight;

      // Dispatch on all three targets — different builds listen on different targets
      [canvas, document, window].forEach((target) => {
        target.dispatchEvent(new MouseEvent("mousemove", {
          bubbles: true, cancelable: true, clientX: x, clientY: y,
          screenX: x,   screenY: y,
        }));
      });
    };

    // ── Touch → click (ripple on tap) ─────────────────────────────
    const handleTouchStart = (e) => {
      const t = e.touches[0];
      [canvas, document, window].forEach((target) => {
        target.dispatchEvent(new MouseEvent("click", {
          bubbles: true, cancelable: true,
          clientX: t.clientX, clientY: t.clientY,
          screenX: t.screenX, screenY: t.screenY,
        }));
      });
    };

    // ── Touch → mousemove (drag on touchmove) ─────────────────────
    const handleTouchMove = (e) => {
      e.preventDefault();
      const t = e.touches[0];
      [canvas, document, window].forEach((target) => {
        target.dispatchEvent(new MouseEvent("mousemove", {
          bubbles: true, cancelable: true,
          clientX: t.clientX, clientY: t.clientY,
          screenX: t.screenX, screenY: t.screenY,
        }));
      });
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove",  handleTouchMove,  { passive: false });

    // ── Gyro permission (iOS needs user gesture) ───────────────────
    const enableGyro = async () => {
      try {
        if (typeof DeviceOrientationEvent?.requestPermission === "function") {
          const res = await DeviceOrientationEvent.requestPermission();
          if (res !== "granted") return;
        }
        window.addEventListener("deviceorientation", handleOrientation, true);
        gyroEnabled = true;
      } catch (err) {
        console.warn("Gyro unavailable:", err);
      }
    };

    const isMobile = navigator.maxTouchPoints > 0;
    if (isMobile) {
      // Trigger gyro on first touch — satisfies iOS user-gesture requirement
      window.addEventListener("touchstart", enableGyro, { once: true });
    }

    // ── Inject liquid script ───────────────────────────────────────
    // URL is inside textContent — webpack never sees it as an import()
    // canvasId is interpolated so the script finds the exact canvas element
    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `
      import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js';

      const canvas = document.getElementById('${canvasId}');
      if (!canvas) { console.error('liquid: canvas not found'); }
      else {
        try {
          const app = LiquidBackground(canvas);

          app.loadImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

          const mat = app.liquidPlane.material;
          mat.color.set('#000000');
          mat.metalness = 0.6;
          mat.roughness = 0.4;
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0;

          app.liquidPlane.uniforms.displacementScale.value = 5;
          app.setRain(false);

          window.__liquidApp = app;
          console.log('liquid: initialized ✓');
        } catch(err) {
          console.error('liquid: init failed', err);
        }
      }
    `;
    document.head.appendChild(script); // head is safer than body for modules

    return () => {
      disposed = true;

      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove",  handleTouchMove);
      window.removeEventListener("touchstart",  enableGyro);

      if (gyroEnabled) {
        window.removeEventListener("deviceorientation", handleOrientation, true);
      }
      if (window.__liquidApp?.dispose) {
        window.__liquidApp.dispose();
        window.__liquidApp = null;
      }
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      width: "100%", height: "100%",
      overflow: "hidden", background: "#000",
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed", inset: 0,
          width: "100%", height: "100%",
          display: "block",
          touchAction: "none", // ← critical: stops browser swallowing touch events
        }}
      />
    </div>
  );
}