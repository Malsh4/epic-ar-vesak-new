"use client";

import { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    Vector3,
    Color4,
    MeshBuilder,
    SceneLoader,
} from "@babylonjs/core";

import "@babylonjs/loaders";
import * as GUI from "@babylonjs/gui";

// ─────────────────────────────────────────────
// SPLASH SCREEN COMPONENT
// ─────────────────────────────────────────────
function SplashScreen({ onEnter }: { onEnter: () => void }) {
    const [phase, setPhase] = useState<"title" | "subtitle" | "instruction" | "ready">("title");

    useEffect(() => {
        const t1 = setTimeout(() => setPhase("subtitle"), 1800);
        const t2 = setTimeout(() => setPhase("instruction"), 3400);
        const t3 = setTimeout(() => setPhase("ready"), 5000);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    return (
        <div
            onClick={phase === "ready" ? onEnter : undefined}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "radial-gradient(ellipse at 60% 30%, #3a1a00 0%, #1a0800 40%, #0a0008 100%)",
                overflow: "hidden",
                cursor: phase === "ready" ? "pointer" : "default",
                userSelect: "none",
            }}
        >
            {/* Ambient particles */}
            <Particles />

            {/* Decorative rings */}
            <div style={{
                position: "absolute",
                width: 340,
                height: 340,
                borderRadius: "50%",
                border: "1px solid rgba(255, 180, 50, 0.12)",
                boxShadow: "0 0 60px 10px rgba(255, 140, 20, 0.08)",
                animation: "ringPulse 4s ease-in-out infinite",
            }} />
            <div style={{
                position: "absolute",
                width: 480,
                height: 480,
                borderRadius: "50%",
                border: "1px solid rgba(255, 180, 50, 0.06)",
                animation: "ringPulse 4s ease-in-out infinite 0.8s",
            }} />

            {/* Lantern icon */}
            <div style={{
                fontSize: 72,
                marginBottom: 24,
                animation: "lanternFloat 3s ease-in-out infinite",
                filter: "drop-shadow(0 0 24px rgba(255,160,30,0.7))",
                opacity: 1,
                transition: "opacity 1s ease",
            }}>
                🏮
            </div>

            {/* Happy Vesak title */}
            <div style={{
                fontFamily: "'Cinzel Decorative', 'Palatino Linotype', serif",
                fontSize: "clamp(32px, 8vw, 52px)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textAlign: "center",
                lineHeight: 1.2,
                background: "linear-gradient(135deg, #ffe0a0 0%, #ffb830 40%, #ff8c00 70%, #ffcf6a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                opacity: 1,
                transform: "translateY(0)",
                transition: "opacity 1.2s cubic-bezier(0.16,1,0.3,1), transform 1.2s cubic-bezier(0.16,1,0.3,1)",
                filter: "drop-shadow(0 0 30px rgba(255,160,40,0.4))",
                padding: "0 16px",
            }}>
                Happy Vesak
            </div>

            {/* Decorative divider */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "18px 0",
                opacity: phase === "subtitle" || phase === "instruction" || phase === "ready" ? 1 : 0,
                transition: "opacity 1s ease 0.2s",
            }}>
                <div style={{ width: 48, height: 1, background: "linear-gradient(to right, transparent, rgba(255,180,60,0.6))" }} />
                <div style={{ fontSize: 14, color: "rgba(255,200,80,0.7)", letterSpacing: "0.3em" }}>✦</div>
                <div style={{ width: 48, height: 1, background: "linear-gradient(to left, transparent, rgba(255,180,60,0.6))" }} />
            </div>

            {/* Subtitle */}
            <div style={{
                fontFamily: "'IM Fell English', 'Georgia', serif",
                fontSize: "clamp(13px, 3.5vw, 17px)",
                color: "rgba(255, 210, 130, 0.75)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                textAlign: "center",
                padding: "0 24px",
                opacity: phase === "subtitle" || phase === "instruction" || phase === "ready" ? 1 : 0,
                transform: phase === "subtitle" || phase === "instruction" || phase === "ready"
                    ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 1s ease, transform 1s ease",
            }}>
                Wesak Poya · Virtual Lantern
            </div>

            {/* AR instruction */}
            <div style={{
                marginTop: 48,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                opacity: phase === "instruction" || phase === "ready" ? 1 : 0,
                transform: phase === "instruction" || phase === "ready" ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.9s ease, transform 0.9s ease",
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,160,30,0.08)",
                    border: "1px solid rgba(255,160,30,0.2)",
                    borderRadius: 40,
                    padding: "10px 22px",
                }}>
                    <span style={{ fontSize: 20 }}>📷</span>
                    <span style={{
                        fontFamily: "'Jost', 'Trebuchet MS', sans-serif",
                        fontSize: 13,
                        color: "rgba(255,210,130,0.8)",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                    }}>
                        Point camera at a flat surface
                    </span>
                </div>
            </div>

            {/* Tap CTA */}
            <div style={{
                marginTop: 32,
                opacity: phase === "ready" ? 1 : 0,
                transform: phase === "ready" ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.8s ease, transform 0.8s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
            }}>
                <div style={{
                    fontFamily: "'Jost', 'Trebuchet MS', sans-serif",
                    fontSize: "clamp(15px, 4vw, 18px)",
                    color: "rgba(255,220,140,0.95)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    animation: "tapPulse 2s ease-in-out infinite",
                }}>
                    Tap to begin
                </div>
                <div style={{
                    fontSize: 22,
                    animation: "tapBounce 1.8s ease-in-out infinite",
                    opacity: 0.7,
                }}>
                    ☞
                </div>
            </div>

            {/* Bottom glow */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "70%",
                height: 120,
                background: "radial-gradient(ellipse at 50% 100%, rgba(255,120,20,0.18) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=IM+Fell+English&family=Jost:wght@300;400&display=swap');

                @keyframes lanternFloat {
                    0%, 100% { transform: translateY(0px) rotate(-3deg); }
                    50% { transform: translateY(-12px) rotate(3deg); }
                }
                @keyframes ringPulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.04); }
                }
                @keyframes tapPulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                @keyframes tapBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(6px); }
                }
                @keyframes particleRise {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(-100vh) translateX(var(--drift)); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

// ─────────────────────────────────────────────
// PARTICLES COMPONENT
// ─────────────────────────────────────────────
function Particles() {
    const particles = Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 8,
        drift: `${(Math.random() - 0.5) * 80}px`,
        opacity: Math.random() * 0.5 + 0.2,
    }));

    return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            {particles.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: "absolute",
                        bottom: "-10px",
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        borderRadius: "50%",
                        background: `rgba(255, ${150 + Math.random() * 80}, 30, ${p.opacity})`,
                        boxShadow: `0 0 ${p.size * 2}px rgba(255,160,40,0.6)`,
                        animation: `particleRise ${p.duration}s ease-in infinite ${p.delay}s`,
                        ["--drift" as any]: p.drift,
                    }}
                />
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
// FADE OVERLAY COMPONENT
// ─────────────────────────────────────────────
function FadeOverlay({ visible }: { visible: boolean }) {
    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 99,
            background: "#000",
            opacity: visible ? 1 : 0,
            pointerEvents: "none",
            transition: "opacity 0.8s ease",
        }} />
    );
}

// ─────────────────────────────────────────────
// MAIN AR SCENE COMPONENT
// ─────────────────────────────────────────────
export default function ARScene() {

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [showSplash, setShowSplash] = useState(true);
    const [fading, setFading] = useState(false);
    const engineStarted = useRef(false);

    useEffect(() => {
        if (showSplash || engineStarted.current) return;
        engineStarted.current = true;

        const canvas = canvasRef.current;
        if (!canvas) return;

        console.log("Canvas found, starting engine");

        // ENGINE
        const engine = new Engine(canvas, true);

        engine.setHardwareScalingLevel(
            window.devicePixelRatio > 1
                ? 1 / window.devicePixelRatio
                : 1
        );

        // SCENE
        const scene = new Scene(engine);
        scene.clearColor = new Color4(0, 0, 0, 0);

        // CAMERA
        const camera = new ArcRotateCamera(
            "camera",
            Math.PI / 2,
            Math.PI / 2.5,
            15,
            Vector3.Zero(),
            scene
        );
        camera.attachControl(canvas, true);

        // LIGHT
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 2.2;

        // GUI — placed indicator
        const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const placedText = new GUI.TextBlock();
        placedText.text = "🏮 Lantern placed!";
        placedText.color = "rgba(255,220,140,0.9)";
        placedText.fontSize = 20;
        placedText.fontFamily = "Georgia, serif";
        placedText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        placedText.paddingBottom = "32px";
        placedText.isVisible = false;
        gui.addControl(placedText);

        // VARIABLES
        let rootMesh: BABYLON.AbstractMesh | null = null;
        let marker: BABYLON.Mesh | null = null;
        const subLanterns: BABYLON.AbstractMesh[] = [];
        let modelPlaced = false;

        // =========================
        // LOAD MODEL
        // =========================
        const loadModel = () => {
            SceneLoader.ImportMesh(
                "",
                "/models/",
                "VLSSL.glb",
                scene,
                (meshes) => {
                    console.log("MODEL LOADED:", meshes);

                    const parent = new BABYLON.TransformNode("modelParent", scene);

                    meshes.forEach((mesh) => {
                        // ✅ ALL meshes parented to root — sub-lanterns stay
                        // in the correct position relative to main lantern
                        mesh.parent = parent;

                        if (mesh.name.startsWith("sublantern")) {
                            subLanterns.push(mesh);
                        }
                    });

                    rootMesh = parent as any;

                    if (rootMesh) {
                        rootMesh.scaling = new Vector3(0.5, 0.5, 0.5);
                        rootMesh.position = new Vector3(0, 0, 2);
                    }

                    console.log("SUB COUNT:", subLanterns.length);
                }
            );
        };

        // =========================
        // XR SETUP
        // =========================
        const setupXR = async () => {
            try {
                console.log("👉 XR STARTING...");

                const xr = await scene.createDefaultXRExperienceAsync({
                    uiOptions: { sessionMode: "immersive-ar" },
                    optionalFeatures: true,
                });

                console.log("✅ XR READY");

                const fm = xr.baseExperience.featuresManager;
                const hitTest = fm.enableFeature(BABYLON.WebXRHitTest, "latest");

                console.log("✅ HIT TEST ENABLED");

                loadModel();

                marker = MeshBuilder.CreateSphere("marker", { diameter: 0.1 }, scene);
                marker.isVisible = false;

                hitTest.onHitTestResultObservable.add((results: any) => {
                    if (results.length && rootMesh && marker && !modelPlaced) {
                        const hit = results[0];
                        marker.isVisible = true;
                        marker.position.copyFrom(hit.position);

                        rootMesh.position = marker.position.clone();
                        rootMesh.position.y += 0.3;
                        modelPlaced = true;

                        placedText.isVisible = true;
                        setTimeout(() => { placedText.isVisible = false; }, 3000);

                        console.log("MODEL PLACED");
                    }
                });

            } catch (err) {
                console.error("❌ XR FAILED TO START:", err);
            }
        };

        setupXR();

        // =========================
        // RENDER LOOP
        // =========================
        engine.runRenderLoop(() => {

            // ROTATE WHOLE MODEL
            if (rootMesh) {
                rootMesh.rotation.y += 0.005;
            }

            // SUB LANTERNS — counter-rotate in world space
            // Formula: -(own spin) - (parent spin) = net world rotation
            // -0.025 (desired world spin) - 0.005 (cancel parent) = -0.030 local
            subLanterns.forEach((lantern) => {
                lantern.rotation.y -= 0.030;
            });

            scene.render();
        });

        // RESIZE
        const resize = () => engine.resize();
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            engine.dispose();
        };

    }, [showSplash]);

    // ── Handle splash → AR transition ──
    const handleEnter = () => {
        setFading(true);
        setTimeout(() => {
            setShowSplash(false);
            setTimeout(() => setFading(false), 900);
        }, 400);
    };

    return (
        <>
            {/* AR Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    width: "100vw",
                    height: "100vh",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    opacity: showSplash ? 0 : 1,
                    transition: "opacity 0.6s ease",
                }}
            />

            {/* Black fade overlay during transition */}
            <FadeOverlay visible={fading} />

            {/* Splash screen */}
            {showSplash && <SplashScreen onEnter={handleEnter} />}
        </>
    );
}