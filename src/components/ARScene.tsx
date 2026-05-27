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
        // VARIABLES
        // =========================

        let rootMesh: BABYLON.AbstractMesh | null = null;

        let marker: BABYLON.Mesh | null = null;

        let mainLantern: BABYLON.AbstractMesh | null = null;

        const subLanterns: BABYLON.AbstractMesh[] = [];

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

                    // CREATE PARENT NODE
                    const parent = new BABYLON.TransformNode(
                        "modelParent",
                        scene
                    );

                    // ATTACH ALL MESHES TO PARENT
                    meshes.forEach((mesh) => {

                        console.log("MESH NAME:", mesh.name);

                        mesh.parent = parent;

                        // MAIN LANTERN
                        if (mesh.name === "Mesh_0") {
                            mainLantern = mesh;
                        }

                        // SUB LANTERNS
                        if (mesh.name.startsWith("sublantern")) {
                            subLanterns.push(mesh);
                        }
                    });

                    // USE PARENT AS ROOT
                    rootMesh = parent as any;

                    // SCALE
                    if (rootMesh) {

                        rootMesh.scaling = new Vector3(
                            0.5,
                            0.5,
                            0.5
                        );

                        // START POSITION
                        rootMesh.position = new Vector3(
                            0,
                            0,
                            2
                        );
                    }

                    console.log("MAIN:", mainLantern);

                    console.log(
                        "SUB COUNT:",
                        subLanterns.length
                    );
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

                // HIT TEST
                const hitTest = fm.enableFeature(
                    BABYLON.WebXRHitTest,
                    "latest"
                );

                console.log("✅ HIT TEST ENABLED");

                // LOAD MODEL
                loadModel();

                // MARKER
                marker = MeshBuilder.CreateSphere(
                    "marker",
                    { diameter: 0.1 },
                    scene
                );

                marker.isVisible = false;

                // PLACE MODEL
                hitTest.onHitTestResultObservable.add((results: any) => {

                    if (
                        results.length &&
                        rootMesh &&
                        marker &&
                        !modelPlaced
                    ) {

                        const hit = results[0];

                        marker.isVisible = true;

                        marker.position.copyFrom(hit.position);

                        // PLACE ONLY ONCE
                        rootMesh.position = marker.position.clone();

                        rootMesh.position.y += 0.3;

                        modelPlaced = true;

                        console.log("MODEL PLACED");
                    }
                });

            } catch (err) {

                console.error("❌ XR FAILED TO START:", err);

            }
        };
        let modelPlaced = false;
        setupXR();

        // =========================
        // ANIMATION FIX
        // =========================

        engine.runRenderLoop(() => {

            // ROTATE WHOLE MODEL
            if (rootMesh) {

                rootMesh.rotation.y += 0.003;

            }

            // SUBLANTERNS REVERSE ROTATION
            subLanterns.forEach((lantern) => {

                lantern.rotation.y -= 0.01;

            });

            scene.render();
        });
        // =========================
        // RESIZE
        // =========================

        const resize = () => engine.resize();

        window.addEventListener("resize", resize);

        // =========================
        // CLEANUP
        // =========================

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