"use client";

import { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    Vector3,
    SceneLoader,
    Color4,
    Mesh,
    MeshBuilder,
} from "@babylonjs/core";

import "@babylonjs/loaders";

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

        scene.clearColor = new Color4(0, 0, 0, 0);

        // CAMERA (fallback non-AR view)
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

        // MODEL
        let rootMesh: Mesh | null = null;

        // MARKER (for AR placement point)
        let marker: Mesh | null = null;

        // LOAD MODEL
        SceneLoader.ImportMesh(
            "",
            "/models/",
            "vesak-lantern.glb",
            scene,
            (meshes) => {
                rootMesh = meshes[meshes.length - 1] as Mesh;
                rootMesh.scaling = new Vector3(0.5, 0.5, 0.5);

                console.log("Model loaded");
            }
        );

        // =========================
        // XR SETUP (REAL FIX)
        // =========================
        let xr: any;

        const setupXR = async () => {
            xr = await scene.createDefaultXRExperienceAsync({
                uiOptions: {
                    sessionMode: "immersive-ar",
                },
                optionalFeatures: true,
            });

            console.log("XR ready");

            const fm = xr.baseExperience.featuresManager;

            // HIT TEST (SURFACE DETECTION)
            const hitTest = fm.enableFeature(
                BABYLON.WebXRHitTest,
                "latest"
            );

            console.log("Hit test enabled");

            // CREATE MARKER (visual dot on table)
            marker = MeshBuilder.CreateSphere(
                "marker",
                { diameter: 0.1 },
                scene
            );

            marker.isVisible = false;

            // UPDATE MARKER POSITION ON REAL SURFACE
            hitTest.onHitTestResultObservable.add((results: any) => {
                if (results.length && marker) {
                    const hit = results[0];

                    marker.isVisible = true;
                    marker.position.copyFrom(hit.position);
                }
            });

            // TAP TO PLACE LANTERN
            xr.baseExperience.onScreenTouchEventObservable.add(() => {
                if (!rootMesh || !marker) return;

                rootMesh.position.copyFrom(marker.position);
            });
        };

        setupXR();

        // RENDER LOOP
        engine.runRenderLoop(() => {
            scene.render();
        });

        // RESIZE
        window.addEventListener("resize", () => {
            engine.resize();
        });

        // CLEANUP
        return () => {
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