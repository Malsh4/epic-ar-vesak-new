"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

const PRESET_WISHES = [
    {
        id: "peace",
        label: "🕊️ Peace & Harmony",
        text: "May the serene light of Vesak fill your heart and home with eternal peace, harmony, and happiness."
    },
    {
        id: "wisdom",
        label: "🪔 Wisdom & Light",
        text: "Wishing you the sacred blessings of Buddha: a path of truth, wisdom, and inner light to guide your journey."
    },
    {
        id: "compassion",
        label: "🌸 Compassion & Joy",
        text: "May Gautama Buddha bless your life with boundless compassion, deep joy, and mindful well-being."
    }
];

export default function ARScene() {
    const [started, setStarted] = useState(false);
    const [userName, setUserName] = useState("");
    const [selectedWishId, setSelectedWishId] = useState("peace");
    const [wishText, setWishText] = useState(PRESET_WISHES[0].text);
    const [sparks, setSparks] = useState<{ id: number; left: string; delay: string; duration: string; size: string }[]>([]);

    // AR tracking states
    const [arStatus, setArStatus] = useState("not-presenting");
    const [arSupported, setArSupported] = useState(true);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Background music states & ref
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const modelViewerRef = useRef<HTMLElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Load @google/model-viewer on the client side
    useEffect(() => {
        import("@google/model-viewer").catch((err) => {
            console.error("Failed to load @google/model-viewer:", err);
        });
    }, []);

    // Generate random spark coordinates for intro background
    useEffect(() => {
        const generatedSparks = Array.from({ length: 22 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 7}s`,
            duration: `${6 + Math.random() * 6}s`,
            size: `${4 + Math.random() * 6}px`,
        }));
        setSparks(generatedSparks);
    }, []);

    // =========================================
    // CAMERA FEED — start rear camera on launch
    // =========================================
    const startCamera = useCallback(async () => {
        try {
            // Request rear-facing camera (environment) for AR-like experience
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", "true");
                videoRef.current.setAttribute("muted", "true");
                videoRef.current.muted = true;
                await videoRef.current.play();
                setCameraReady(true);
                setCameraError(null);
                console.log("✅ Camera feed started");
            }
        } catch (err: any) {
            console.error("❌ Camera access failed:", err);
            setCameraError(err.message || "Camera access denied");
            setCameraReady(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraReady(false);
        console.log("📷 Camera feed stopped");
    }, []);

    // Start camera when the AR experience begins, but STOP it when WebXR is active (session-started)
    // to release the hardware camera lock so ARCore can initialize.
    // Uses a 700ms debounce delay when restarting to let ARCore completely release the camera lock.
    useEffect(() => {
        let active = true;
        let timeoutId: NodeJS.Timeout | null = null;

        if (started && arStatus === "not-presenting") {
            // Reset any residual camera errors instantly so the error box closes
            setCameraError(null);

            timeoutId = setTimeout(() => {
                if (active) {
                    startCamera();
                }
            }, 700);
        } else {
            stopCamera();
        }

        return () => {
            active = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            stopCamera();
        };
    }, [started, arStatus, startCamera, stopCamera]);

    // Make body and html background transparent during active AR to let the WebXR feed show through
    useEffect(() => {
        if (started) {
            const originalBodyBg = document.body.style.background;
            const originalBodyBgColor = document.body.style.backgroundColor;
            const originalHtmlBg = document.documentElement.style.background;
            const originalHtmlBgColor = document.documentElement.style.backgroundColor;

            document.body.style.background = "transparent";
            document.body.style.backgroundColor = "transparent";
            document.documentElement.style.background = "transparent";
            document.documentElement.style.backgroundColor = "transparent";

            return () => {
                document.body.style.background = originalBodyBg;
                document.body.style.backgroundColor = originalBodyBgColor;
                document.documentElement.style.background = originalHtmlBg;
                document.documentElement.style.backgroundColor = originalHtmlBgColor;
            };
        }
    }, [started]);



    // Handle AR Status changes
    useEffect(() => {
        const modelViewer = modelViewerRef.current;
        if (!modelViewer) return;

        const handleArStatus = (event: any) => {
            setArStatus(event.detail.status);
            console.log("AR Status changed:", event.detail.status);
        };

        modelViewer.addEventListener("ar-status", handleArStatus);
        return () => {
            modelViewer.removeEventListener("ar-status", handleArStatus);
        };
    }, [started]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // Toggle background music playback
    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch((err) => {
                console.warn("Playback failed or was blocked by browser autoplay policy:", err);
            });
            setIsPlaying(true);
        }
    }, [isPlaying]);

    // Start AR flow — no fullscreen needed (mobile viewport is already full)
    const handleStart = () => {
        setStarted(true);
        // Start background music automatically on user interaction
        if (audioRef.current) {
            audioRef.current.play().catch((err) => {
                console.warn("Autoplay blocked or failed:", err);
            });
            setIsPlaying(true);
        }
    };

    // Exit AR flow
    const handleExit = () => {
        setStarted(false);
        // Stop background music and reset track
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    // Hook into the model-viewer to update AR support state
    const handleModelLoad = (event: any) => {
        const modelViewer = event.target;

        // Update AR support state
        if (modelViewer) {
            setArSupported(!!modelViewer.canActivateAR);
        }
    };



    return (
        <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
            {/* Elegant Font & Intro View Styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Cinzel:wght@600;700;800&display=swap');

                /* Welcome Screen */
                .vesak-intro-container {
                    width: 100vw;
                    height: 100vh;
                    position: fixed;
                    top: 0;
                    left: 0;
                    background: radial-gradient(circle at center, #1b0f32 0%, #060211 100%);
                    color: #ffffff;
                    font-family: 'Outfit', sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    z-index: 999;
                }

                /* Animated rising golden sparks */
                .vesak-sparks-bg {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                    z-index: 1;
                }

                .vesak-spark {
                    position: absolute;
                    bottom: -20px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(254,204,40,0.85) 0%, rgba(212,175,55,0) 70%);
                    box-shadow: 0 0 10px rgba(254,204,40,0.6);
                    opacity: 0;
                    animation: floatUp 8s ease-in-out infinite;
                }

                @keyframes floatUp {
                    0% {
                        transform: translateY(0) translateX(0) scale(0.6);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.75;
                    }
                    90% {
                        opacity: 0.75;
                    }
                    100% {
                        transform: translateY(-115vh) translateX(60px) scale(0.3);
                        opacity: 0;
                    }
                }

                /* Glassmorphic card design */
                .vesak-card {
                    width: 90%;
                    max-width: 460px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(212, 175, 55, 0.25);
                    border-radius: 28px;
                    padding: 30px 24px;
                    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.65), 0 0 30px rgba(212,175,55,0.05) inset;
                    text-align: center;
                    z-index: 2;
                    animation: cardFadeIn 1s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes cardFadeIn {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .vesak-icon {
                    font-size: 40px;
                    margin-bottom: 12px;
                    filter: drop-shadow(0 0 15px rgba(254,204,40,0.7));
                    animation: pulseLight 2s infinite ease-in-out;
                }

                @keyframes pulseLight {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(254,204,40,0.5)); }
                    50% { transform: scale(1.1); filter: drop-shadow(0 0 20px rgba(254,204,40,0.85)); }
                }

                .vesak-title {
                    font-family: 'Cinzel', serif;
                    font-size: 26px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    color: #d4af37;
                    text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
                    margin: 0 0 10px 0;
                }

                .vesak-subtitle {
                    font-size: 13px;
                    font-weight: 300;
                    line-height: 1.5;
                    color: #d8d8d8;
                    margin: 0 0 24px 0;
                }

                /* Inputs & Labels styling */
                .vesak-input-group {
                    text-align: left;
                    margin-bottom: 20px;
                }

                .vesak-label {
                    display: block;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    color: #d4af37;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }

                .vesak-input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-family: 'Outfit', sans-serif;
                    font-size: 14px;
                    color: #ffffff;
                    box-sizing: border-box;
                    transition: all 0.3s ease;
                }

                .vesak-input:focus {
                    outline: none;
                    background: rgba(255, 255, 255, 0.09);
                    border-color: #d4af37;
                    box-shadow: 0 0 10px rgba(212,175,55,0.25);
                }

                /* Custom Tabs styling */
                .vesak-wish-selector {
                    text-align: left;
                    margin-bottom: 26px;
                }

                .vesak-preset-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .vesak-tab {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 10px 4px;
                    font-family: 'Outfit', sans-serif;
                    font-size: 11px;
                    font-weight: 500;
                    color: #b0b0b0;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    transition: all 0.3s ease;
                }

                .vesak-tab-text {
                    font-size: 9px;
                    opacity: 0.8;
                }

                .vesak-tab.active {
                    background: rgba(212, 175, 55, 0.12);
                    border-color: rgba(212, 175, 55, 0.8);
                    color: #f3e5ab;
                }

                .vesak-textarea {
                    width: 100%;
                    height: 70px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-family: 'Outfit', sans-serif;
                    font-size: 13px;
                    color: #eaeaea;
                    line-height: 1.4;
                    resize: none;
                    box-sizing: border-box;
                    transition: all 0.3s ease;
                }

                .vesak-textarea:focus {
                    outline: none;
                    background: rgba(255, 255, 255, 0.08);
                    border-color: #d4af37;
                    box-shadow: 0 0 10px rgba(212,175,55,0.25);
                }

                /* Glowing Gold Start Button */
                .vesak-btn-start {
                    width: 100%;
                    background: linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%);
                    border: none;
                    border-radius: 14px;
                    padding: 15px 24px;
                    font-family: 'Outfit', sans-serif;
                    font-size: 16px;
                    font-weight: 700;
                    color: #0b0518;
                    cursor: pointer;
                    box-shadow: 0 5px 20px rgba(212,175,55,0.4);
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    position: relative;
                    overflow: hidden;
                }

                .vesak-btn-start::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.4),
                        transparent
                    );
                    transition: all 0.6s ease;
                }

                .vesak-btn-start:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(212,175,55,0.55);
                }

                .vesak-btn-start:hover::before {
                    left: 100%;
                }

                .vesak-btn-start:active {
                    transform: translateY(1px);
                    box-shadow: 0 2px 10px rgba(212,175,55,0.4);
                }

                /* ==============================
                   CAMERA FEED VIDEO
                   ============================== */
                .ar-camera-feed {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    object-fit: cover;
                    z-index: 0;
                    background: #000;
                }

                /* ==============================
                   MODEL-VIEWER TRANSPARENT OVERLAY
                   ============================== */
                .ar-model-viewer-layer {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 1;
                    background: transparent !important;
                }

                .ar-model-viewer-layer model-viewer {
                    width: 100%;
                    height: 100%;
                    --poster-color: transparent;
                    background-color: transparent !important;
                    background: transparent !important;
                }

                /* Force the model-viewer's internal canvas to be transparent */
                .ar-model-viewer-layer model-viewer::part(default-ar-button) {
                    display: none;
                }
            `}</style>

            {/* Welcome / Wishing Screen (Intro UI) */}
            {!started && (
                <div className="vesak-intro-container">
                    {/* Rising warm sparks in bg */}
                    <div className="vesak-sparks-bg">
                        {sparks.map((spark) => (
                            <div
                                key={spark.id}
                                className="vesak-spark"
                                style={{
                                    left: spark.left,
                                    animationDelay: spark.delay,
                                    animationDuration: spark.duration,
                                    width: spark.size,
                                    height: spark.size,
                                }}
                            />
                        ))}
                    </div>

                    {/* Glassmorphic card welcome view */}
                    <div className="vesak-card">
                        <div className="vesak-icon">🪔</div>
                        <h1 className="vesak-title">VESAK AR LANTERN</h1>
                        <p className="vesak-subtitle">
                            Illuminate your physical environment in sacred light. Enter a name to compose a blessing and launch the experience.
                        </p>

                        {/* Name field */}
                        <div className="vesak-input-group">
                            <label className="vesak-label">Who is this blessing for?</label>
                            <input
                                type="text"
                                className="vesak-input"
                                placeholder="Enter name (e.g., Mother, My Family, Friend)"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                            />
                        </div>

                        {/* Preset Blessing Selector */}
                        <div className="vesak-wish-selector">
                            <label className="vesak-label">Select a Vesak Blessing</label>
                            <div className="vesak-preset-tabs">
                                {PRESET_WISHES.map((preset) => (
                                    <button
                                        key={preset.id}
                                        className={`vesak-tab ${selectedWishId === preset.id ? "active" : ""}`}
                                        onClick={() => {
                                            setSelectedWishId(preset.id);
                                            setWishText(preset.text);
                                        }}
                                    >
                                        <span>{preset.label.split(" ")[0]}</span>
                                        <span className="vesak-tab-text">
                                            {preset.label.split(" ").slice(1).join(" ")}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <textarea
                                className="vesak-textarea"
                                value={wishText}
                                onChange={(e) => {
                                    setSelectedWishId("custom");
                                    setWishText(e.target.value);
                                }}
                                placeholder="Write a custom Vesak blessing..."
                            />
                        </div>

                        {/* Glowing launch button */}
                        <button className="vesak-btn-start" onClick={handleStart}>
                            <span>✨ Start AR Experience</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ==============================
                AR EXPERIENCE CONTAINER
                ============================== */}
            <div
                className="ar-container"
                style={
                    started
                        ? {
                            width: "100vw",
                            height: "100vh",
                            position: "fixed",
                            top: 0,
                            left: 0,
                            zIndex: 9999,
                            backgroundColor: "transparent",
                        }
                        : {
                            position: "fixed",
                            left: "-9999px",
                            top: "-9999px",
                            width: "1px",
                            height: "1px",
                            opacity: 0,
                            pointerEvents: "none",
                        }
                }
            >
                <style>{`
                    /* Back Button Styling */
                    .ar-btn-back {
                        position: absolute;
                        top: 20px;
                        left: 20px;
                        z-index: 10000;
                        padding: 12px 20px;
                        font-family: 'Outfit', sans-serif;
                        font-size: 14px;
                        font-weight: 600;
                        color: #ffffff;
                        background: rgba(10, 5, 20, 0.6);
                        backdrop-filter: blur(8px);
                        border: 1px solid rgba(212, 175, 55, 0.3);
                        border-radius: 30px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                    }

                    .ar-btn-back:hover {
                        background: rgba(212, 175, 55, 0.2);
                        border-color: #d4af37;
                        transform: translateY(-2px);
                    }

                    /* Music Control Button */
                    .ar-btn-music {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        z-index: 10000;
                        width: 46px;
                        height: 46px;
                        border-radius: 50%;
                        background: rgba(10, 5, 20, 0.6);
                        backdrop-filter: blur(8px);
                        -webkit-backdrop-filter: blur(8px);
                        border: 1px solid rgba(212, 175, 55, 0.3);
                        cursor: pointer;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                        padding: 0;
                    }

                    .ar-btn-music:hover {
                        background: rgba(212, 175, 55, 0.2);
                        border-color: #d4af37;
                        transform: scale(1.08);
                    }

                    .ar-btn-music:active {
                        transform: scale(0.95);
                    }

                    /* Equalizer micro-animation when music is playing */
                    .eq-container {
                        display: flex;
                        align-items: flex-end;
                        gap: 3px;
                        height: 18px;
                        width: 21px;
                        justify-content: center;
                    }

                    .eq-bar {
                        width: 3px;
                        background-color: #d4af37;
                        border-radius: 1px;
                        height: 4px;
                        transition: height 0.3s ease;
                        box-shadow: 0 0 8px rgba(212, 175, 55, 0.8);
                    }

                    .ar-btn-music.playing .eq-bar-1 {
                        animation: bounceBar 0.8s ease-in-out infinite alternate;
                    }
                    .ar-btn-music.playing .eq-bar-2 {
                        animation: bounceBar 0.5s ease-in-out infinite alternate;
                        animation-delay: 0.15s;
                    }
                    .ar-btn-music.playing .eq-bar-3 {
                        animation: bounceBar 0.7s ease-in-out infinite alternate;
                        animation-delay: 0.3s;
                    }
                    .ar-btn-music.playing .eq-bar-4 {
                        animation: bounceBar 0.6s ease-in-out infinite alternate;
                        animation-delay: 0.1s;
                    }

                    @keyframes bounceBar {
                        0% { height: 4px; }
                        100% { height: 18px; }
                    }

                    /* Custom AR Button slot replacement */
                    .ar-btn-activate {
                        position: absolute;
                        bottom: 150px;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 10000;
                        background: linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%);
                        border: none;
                        border-radius: 30px;
                        padding: 14px 28px;
                        font-family: 'Outfit', sans-serif;
                        font-size: 15px;
                        font-weight: 700;
                        color: #0b0518;
                        cursor: pointer;
                        box-shadow: 0 5px 25px rgba(212,175,55,0.4);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                    }

                    .ar-btn-activate:hover {
                        transform: translateX(-50%) translateY(-2px);
                        box-shadow: 0 8px 30px rgba(212,175,55,0.65);
                    }

                    /* Floating Wishing Overlay Card */
                    .ar-wishing-overlay {
                        position: absolute;
                        bottom: 30px;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 10000;
                        width: 90%;
                        max-width: 420px;
                        background: rgba(10, 5, 20, 0.7);
                        backdrop-filter: blur(16px);
                        -webkit-backdrop-filter: blur(16px);
                        border: 1px solid rgba(212, 175, 55, 0.35);
                        border-radius: 20px;
                        padding: 16px 20px;
                        display: flex;
                        gap: 15px;
                        align-items: center;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
                        animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                        font-family: 'Outfit', sans-serif;
                    }

                    .ar-overlay-icon {
                        font-size: 28px;
                        filter: drop-shadow(0 2px 8px rgba(212,175,55,0.6));
                        animation: floatIcon 3s ease-in-out infinite;
                    }

                    .ar-overlay-content {
                        flex: 1;
                    }

                    .ar-overlay-title {
                        font-size: 16px;
                        font-weight: 700;
                        color: #f3e5ab;
                        margin: 0 0 4px 0;
                        letter-spacing: 0.5px;
                    }

                    .ar-overlay-text {
                        font-size: 13px;
                        color: #e0e0e0;
                        margin: 0;
                        line-height: 1.4;
                        font-style: italic;
                        font-weight: 300;
                    }

                    /* Instruction Banner */
                    .ar-scanning-toast {
                        position: absolute;
                        top: 80px;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 10000;
                        width: 85%;
                        max-width: 360px;
                        background: rgba(10, 5, 20, 0.85);
                        backdrop-filter: blur(8px);
                        border: 1px solid rgba(212, 175, 55, 0.3);
                        border-radius: 20px;
                        padding: 12px 20px;
                        text-align: center;
                        font-family: 'Outfit', sans-serif;
                        font-size: 13px;
                        color: #ffffff;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                        animation: slideDown 0.5s ease;
                    }

                    /* Camera error banner */
                    .ar-camera-error {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        z-index: 10000;
                        width: 85%;
                        max-width: 380px;
                        background: rgba(10, 5, 20, 0.9);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(220, 53, 69, 0.45);
                        border-radius: 20px;
                        padding: 24px 20px;
                        text-align: center;
                        font-family: 'Outfit', sans-serif;
                        color: #ffffff;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
                    }

                    /* Unsupported Context Banner */
                    .ar-unsupported-banner {
                        position: absolute;
                        bottom: 120px;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 10000;
                        width: 90%;
                        max-width: 420px;
                        background: rgba(220, 53, 69, 0.2);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(220, 53, 69, 0.45);
                        border-radius: 16px;
                        padding: 16px 20px;
                        text-align: center;
                        font-family: 'Outfit', sans-serif;
                        font-size: 13px;
                        color: #ffb3b3;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                        animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    @keyframes slideUp {
                        from { transform: translate(-50%, 40px); opacity: 0; }
                        to { transform: translate(-50%, 0); opacity: 1; }
                    }

                    @keyframes slideDown {
                        from { transform: translate(-50%, -40px); opacity: 0; }
                        to { transform: translate(-50%, 0); opacity: 1; }
                    }

                    @keyframes floatIcon {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-5px); }
                    }
                `}</style>

                {/* ==============================
                    LAYER 0: LIVE CAMERA FEED (Hidden during active WebXR to allow browser viewport projection)
                    ============================== */}
                <video
                    ref={videoRef}
                    className="ar-camera-feed"
                    autoPlay
                    playsInline
                    muted
                    style={arStatus === "session-started" ? { display: "none" } : {}}
                />

                {/* ==============================
                    LAYER 1: MODEL-VIEWER with DOM Overlays
                    ============================== */}
                <div className="ar-model-viewer-layer">
                    {/* @ts-ignore */}
                    <model-viewer
                        ref={modelViewerRef as any}
                        src="/models/VLSSL.glb"
                        ios-src="/models/VLSSL.usdz"
                        ar
                        autoplay
                        ar-modes="webxr scene-viewer quick-look"
                        camera-controls
                        shadow-intensity="0"
                        ar-placement="floor"
                        scale="1.0 1.0 1.0"
                        alt="Vesak AR Lantern"
                        interaction-prompt="auto"
                        environment-image="neutral"
                        exposure="1"
                        style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "transparent",
                            // @ts-ignore
                            "--poster-color": "transparent",
                        }}
                        onLoad={handleModelLoad}
                    >
                        {/* Custom AR Button — triggers native AR (Scene Viewer / Quick Look) */}
                        <button slot="ar-button" id="custom-ar-button" className="ar-btn-activate">
                            <span>🪔 Place Lantern in AR</span>
                        </button>

                        {/* ==============================
                            INTEGRATED DOM OVERLAYS (Visible inside WebXR AR Mode as well)
                            ============================== */}

                        {/* Audio element for Vesak background music */}
                        <audio
                            ref={audioRef}
                            src="/audio/vesakSong.mp3"
                            loop
                            preload="auto"
                        />

                        {/* Back button */}
                        <button className="ar-btn-back" onClick={handleExit} style={{ zIndex: 10001 }}>
                            <span>← Exit</span>
                        </button>

                        {/* Glassmorphic Music Toggle Button */}
                        <button
                            className={`ar-btn-music ${isPlaying ? "playing" : ""}`}
                            onClick={togglePlay}
                            style={{ zIndex: 10001 }}
                            title={isPlaying ? "Mute Background Music" : "Play Background Music"}
                        >
                            {isPlaying ? (
                                <div className="eq-container">
                                    <div className="eq-bar eq-bar-1" />
                                    <div className="eq-bar eq-bar-2" />
                                    <div className="eq-bar eq-bar-3" />
                                    <div className="eq-bar eq-bar-4" />
                                </div>
                            ) : (
                                <span style={{ fontSize: "16px", color: "#d4af37", textShadow: "0 0 5px rgba(212,175,55,0.5)" }}>🔇</span>
                            )}
                        </button>

                        {/* Camera status instruction toast */}
                        {cameraReady && (
                            <div className="ar-scanning-toast">
                                <span>📷 Camera active — drag to rotate, pinch to resize the lantern</span>
                            </div>
                        )}

                        {/* Camera error message */}
                        {cameraError && (
                            <div className="ar-camera-error">
                                <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
                                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#ffb3b3" }}>
                                    Camera Access Required
                                </div>
                                <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.5, marginBottom: 16 }}>
                                    {cameraError}
                                </div>
                                <div style={{ fontSize: 11, color: "#999", lineHeight: 1.4 }}>
                                    Please allow camera access in your browser settings and make sure you&apos;re using HTTPS.
                                    Try <code style={{ color: "#d4af37" }}>npm run dev:https</code>
                                </div>
                            </div>
                        )}

                        {/* Secure context / support fallback banner */}
                        {!arSupported && (
                            <div className="ar-unsupported-banner">
                                <span>⚠️ Native AR placement is not supported on this device.</span>
                                <small style={{ display: "block", marginTop: "4px", opacity: 0.8, fontSize: "11px" }}>
                                    You can still view the 3D lantern over your camera feed above.
                                </small>
                            </div>
                        )}

                        {/* Bottom customized wish greeting */}
                        <div className="ar-wishing-overlay">
                            <div className="ar-overlay-icon">🪔</div>
                            <div className="ar-overlay-content">
                                <h3 className="ar-overlay-title">
                                    Happy Vesak{userName ? `, ${userName}` : ""}! ✨
                                </h3>
                                <p className="ar-overlay-text">&ldquo; {wishText} &rdquo;</p>
                            </div>
                        </div>
                    </model-viewer>
                </div>
            </div>
        </div>
    );
}