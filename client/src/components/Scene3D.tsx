import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Floating3DShapes } from "./Floating3DShapes";
import { ErrorBoundary } from "./ErrorBoundary";

export default function Scene3D() {
    return (
        <div className="fixed inset-0 z-[-1] bg-background">
            <ErrorBoundary fallback={<div className="absolute inset-0 bg-background/50" />}>
                <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                    <Suspense fallback={null}>
                        <Environment preset="city" />
                        <Floating3DShapes />
                    </Suspense>
                </Canvas>
            </ErrorBoundary>
        </div>
    );
}
