"use client";

import { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    Vector3,
    Color4,
    MeshBuilder,
} from "@babylonjs/core";

import "@babylonjs/loaders";
import * as GUI from "@babylonjs/gui";

export default function ARScene() {

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {

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

        // BLACK BACKGROUND
        scene.clearColor = new Color4(0, 0, 0, 1);

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
        const light = new HemisphericLight(
            "light",
            new Vector3(0, 1, 0),
            scene
        );

        light.intensity = 2.2;

        // =========================
        // GUI TEXT
        // =========================

        const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const text = new GUI.TextBlock();

        text.text = "Happy Vesak!";
        text.color = "white";
        text.fontSize = 48;

        gui.addControl(text);

        // =========================
        // XR SETUP (SAFE FIX)
        // =========================

        const setupXR = async () => {

            try {

                console.log("👉 XR STARTING...");

                const xr = await scene.createDefaultXRExperienceAsync({
                    uiOptions: {
                        sessionMode: "immersive-ar",
                    },
                    optionalFeatures: true,
                });

                console.log("✅ XR READY");

                const fm = xr.baseExperience.featuresManager;

                // HIT TEST
                const hitTest = fm.enableFeature(
                    BABYLON.WebXRHitTest,
                    "latest"
                );

                console.log("✅ HIT TEST ENABLED");

                // DEBUG MARKER
                const marker = MeshBuilder.CreateSphere(
                    "marker",
                    { diameter: 0.1 },
                    scene
                );

                marker.isVisible = false;

                // UPDATE MARKER POSITION
                hitTest.onHitTestResultObservable.add((results: any) => {

                    if (results.length) {

                        const hit = results[0];

                        marker.isVisible = true;
                        marker.position.copyFrom(hit.position);
                    }
                });

            } catch (err) {

                console.error("❌ XR FAILED TO START:", err);

            }
        };

        setupXR();

        // RENDER LOOP
        engine.runRenderLoop(() => {
            scene.render();
        });

        // RESIZE
        const resize = () => engine.resize();
        window.addEventListener("resize", resize);

        // CLEANUP
        return () => {
            window.removeEventListener("resize", resize);
            engine.dispose();
        };

    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100vw",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
            }}
        />
    );
}