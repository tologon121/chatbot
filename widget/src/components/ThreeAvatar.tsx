import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Mesh } from 'three';

function AnimatedSphere({ color }: { color: string }) {
  const meshRef = useRef<Mesh>(null!);

  useFrame((state, delta) => {
    // Кинематографичное медленное вращение
    meshRef.current.rotation.x += delta * 0.1;
    meshRef.current.rotation.y += delta * 0.2;
    
    // Эффект "дыхания" (пульсации)
    const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshPhysicalMaterial 
        color={color} 
        roughness={0.2}
        metalness={0.8}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
}

export default function ThreeAvatar({ color }: { color: string }) {
  return (
    <div className="w-10 h-10 relative overflow-hidden rounded-full shadow-inner bg-white/20">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <AnimatedSphere color={color} />
      </Canvas>
    </div>
  );
}
