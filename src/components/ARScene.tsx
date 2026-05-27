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
    SceneLoader,
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

        // GUI
        const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const text = new GUI.TextBlock();

        text.text = "Happy Vesak!";
        text.color = "white";
        text.fontSize = 48;

        gui.addControl(text);

        // =========================
        // STEP 1 — VARIABLES (YOUR PART - OK)
        // =========================

        let rootMesh: BABYLON.AbstractMesh | null = null;
        let marker: BABYLON.Mesh | null = null;

        let mainLantern: BABYLON.AbstractMesh | null = null;
        const subLanterns: BABYLON.AbstractMesh[] = [];

        // =========================
        // STEP 2 — LOAD MODEL
        // =========================

        const loadModel = () => {

            SceneLoader.ImportMesh(
                "",
                "/models/",
                "VLSSL.glb",
                scene,
                (meshes) => {

                    console.log("MODEL LOADED:", meshes);

                    rootMesh = meshes[0];

                    rootMesh.scaling = new Vector3(0.5, 0.5, 0.5);
                    rootMesh.position = new Vector3(0, 0, 2);

                    // =========================
                    // STEP 3 — ASSIGN MESHES (IMPORTANT FIX)
                    // =========================

                    meshes.forEach((mesh) => {

                        // MAIN LANTERN
                        if (mesh.name === "Mesh_0") {
                            mainLantern = mesh;
                        }

                        // SUB LANTERNS
                        if (mesh.name.startsWith("sublantern")) {
                            subLanterns.push(mesh);
                        }
                    });
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
                    uiOptions: {
                        sessionMode: "immersive-ar",
                    },
                    optionalFeatures: true,
                });

                console.log("✅ XR READY");

                const fm = xr.baseExperience.featuresManager;

                const hitTest = fm.enableFeature(
                    BABYLON.WebXRHitTest,
                    "latest"
                );

                console.log("✅ HIT TEST ENABLED");

                loadModel();

                marker = MeshBuilder.CreateSphere(
                    "marker",
                    { diameter: 0.1 },
                    scene
                );

                marker.isVisible = false;

                hitTest.onHitTestResultObservable.add((results: any) => {

                    if (results.length && rootMesh && marker) {

                        const hit = results[0];

                        marker.isVisible = true;
                        marker.position.copyFrom(hit.position);

                        rootMesh.position = marker.position.clone();
                        rootMesh.position.y += 0.3;
                    }
                });

            } catch (err) {

                console.error("❌ XR FAILED TO START:", err);

            }
        };

        setupXR();

        // =========================
        // STEP 4 — ANIMATION (NEW ADDITION)
        // =========================

        engine.runRenderLoop(() => {

            // MAIN LANTERN → CLOCKWISE
            if (mainLantern) {
                mainLantern.rotation.y += 0.003;
            }

            // SUB LANTERNS → COUNTER CLOCKWISE
            subLanterns.forEach((lantern) => {
                lantern.rotation.y -= 0.005;
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