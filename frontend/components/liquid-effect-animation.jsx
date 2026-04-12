"use client";
import { useEffect, useRef } from "react";

export function LiquidEffectAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // --- Gyroscope → Mouse simulation ---
    // We convert device tilt (beta/gamma) into synthetic mousemove events
    // so the liquid library reacts to phone movement naturally

    let gyroEnabled = false;

    const handleOrientation = (e) => {
      // gamma = left/right tilt (-90 to 90), beta = front/back tilt (-180 to 180)
      const gamma = e.gamma ?? 0; // X axis (left/right)
      const beta = e.beta ?? 0;   // Y axis (front/back)

      // Normalize to 0–1 range relative to screen size
      // gamma range clamped to [-45, 45] for comfortable tilt
      const clampedGamma = Math.max(-45, Math.min(45, gamma));
      const clampedBeta = Math.max(-45, Math.min(45, beta - 45)); // offset so flat phone = center

      const x = ((clampedGamma + 45) / 90) * window.innerWidth;
      const y = ((clampedBeta + 45) / 90) * window.innerHeight;

      const evt = new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
      });
      window.dispatchEvent(evt);
      canvasRef.current?.dispatchEvent(evt);
    };

    const requestGyroPermission = async () => {
      // iOS 13+ requires explicit permission for DeviceOrientationEvent
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
            gyroEnabled = true;
          }
        } catch (err) {
          console.warn("Gyro permission denied:", err);
        }
      } else {
        // Android and non-iOS — no permission needed
        window.addEventListener("deviceorientation", handleOrientation);
        gyroEnabled = true;
      }
    };

    // Detect if touch device — only activate gyro on mobile
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (isMobile) {
      // iOS requires gyro permission to be triggered by a user gesture.
      // We attach a one-time tap listener to request it on first touch.
      const onFirstTouch = () => {
        requestGyroPermission();
        window.removeEventListener("touchstart", onFirstTouch);
      };
      window.addEventListener("touchstart", onFirstTouch, { once: true });

      // Also set up touch → click bridge so taps still trigger ripples
      const onTouchStart = (e) => {
        const touch = e.touches[0];
        const click = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        canvasRef.current?.dispatchEvent(click);
        window.dispatchEvent(click);
      };
      canvasRef.current?.addEventListener("touchstart", onTouchStart, { passive: true });
    }

    // --- Inject the liquid script (same approach as before) ---
    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `
      import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js';
      
      const canvas = document.getElementById('liquid-canvas');
      if (canvas) {
        const app = LiquidBackground(canvas);

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
      if (gyroEnabled) {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
      if (window.__liquidApp?.dispose) {
        window.__liquidApp.dispose();
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
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