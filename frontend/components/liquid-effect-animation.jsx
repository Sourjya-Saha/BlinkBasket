"use client";
import { useEffect, useRef } from "react";

export function LiquidEffectAnimation() {
  const canvasRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let destroyed = false;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };
    setCanvasSize();

    // Touch → Mouse bridge
    const simulateMouseEvent = (type, touch) => {
      const evt = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY,
      });
      canvas.dispatchEvent(evt);
      window.dispatchEvent(evt);
    };

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      simulateMouseEvent("mousedown", touch);
      simulateMouseEvent("click", touch);
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      simulateMouseEvent("mousemove", touch);
    };
    const onTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      simulateMouseEvent("mouseup", touch);
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });

    const initLiquid = (LiquidBackground) => {
      if (destroyed) return;

      const app = LiquidBackground(canvas);
      appRef.current = app;

      app.loadImage(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      );

      const material = app.liquidPlane.material;
      material.color.set("#000000");
      material.metalness = 0.6;
      material.roughness = 0.4;
      material.emissive.set("#000000");
      material.emissiveIntensity = 0;
      app.liquidPlane.uniforms.displacementScale.value = 5;
      app.setRain(false);

      const handleResize = () => {
        setCanvasSize();
        if (app.onWindowResize) app.onWindowResize();
      };
      window.addEventListener("resize", handleResize);
      appRef.current._resizeHandler = handleResize;
    };

    // If already loaded from a previous render, reuse it
    if (window.__LiquidBG) {
      initLiquid(window.__LiquidBG);
      return;
    }

    // Register a global callback that the module script will call
    // This is the key trick — the module script calls window.__onLiquidBGLoaded(LiquidBackground)
    // so we receive the ES module default export without webpack ever seeing the URL
    window.__onLiquidBGLoaded = (LiquidBackground) => {
      window.__LiquidBG = LiquidBackground;
      initLiquid(LiquidBackground);
    };

    if (!document.getElementById("liquid-bg-script")) {
      const script = document.createElement("script");
      script.id = "liquid-bg-script";
      script.type = "module";
      // The URL is inside a string literal — webpack never resolves it
      script.textContent = `
        import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js';
        if (window.__onLiquidBGLoaded) window.__onLiquidBGLoaded(LiquidBackground);
      `;
      document.head.appendChild(script);
    }

    return () => {
      destroyed = true;
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      if (appRef.current) {
        if (appRef.current._resizeHandler) {
          window.removeEventListener("resize", appRef.current._resizeHandler);
        }
        if (appRef.current.dispose) appRef.current.dispose();
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}