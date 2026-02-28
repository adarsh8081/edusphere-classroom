import * as React from 'react';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, Sphere, Torus, MeshDistortMaterial } from '@react-three/drei';

export function Floating3DShapes() {
    const group = useRef<THREE.Group>(null);

    // Slowly rotate the entire group of shapes
    useFrame((state) => {
        if (group.current) {
            group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
            group.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.1) * 0.2;
        }
    });

    // Calculate positions for shapes to float nicely in the background
    const positions = useMemo(() => {
        return Array.from({ length: 5 }).map(() => ({
            x: (Math.random() - 0.5) * 15,
            y: (Math.random() - 0.5) * 10,
            z: -5 - Math.random() * 10,
            scale: 0.5 + Math.random() * 1.5,
            type: Math.random() > 0.5 ? 'sphere' : 'torus',
            speed: 0.2 + Math.random() * 0.5
        }));
    }, []);

    return (
        <group ref={group}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} color="#C0F9FF" />
            <spotLight position={[-10, -10, 5]} intensity={0.5} color="#17E2FF" />

            {positions.map((props, i) => (
                <Float
                    key={i}
                    speed={props.speed}
                    rotationIntensity={1}
                    floatIntensity={2}
                    position={[props.x, props.y, props.z]}
                >
                    {props.type === 'sphere' ? (
                        <Sphere args={[1, 64, 64]} scale={props.scale}>
                            <MeshDistortMaterial
                                color="#17E2FF"
                                envMapIntensity={1}
                                clearcoat={1}
                                clearcoatRoughness={0.1}
                                metalness={0.8}
                                roughness={0.2}
                                distort={0.4}
                                speed={2}
                                transparent
                                opacity={0.3}
                            />
                        </Sphere>
                    ) : (
                        <Torus args={[1, 0.4, 32, 100]} scale={props.scale * 0.5}>
                            <meshPhysicalMaterial
                                color="#ffffff"
                                metalness={0.9}
                                roughness={0.1}
                                envMapIntensity={1}
                                transparent
                                opacity={0.4}
                                clearcoat={1}
                            />
                        </Torus>
                    )}
                </Float>
            ))}
        </group>
    );
}
