'use client';

import { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface VRViewerProps {
  destination: string;
  onClose: () => void;
}

function VRSphere({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

  // Auto-rotate
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function Scene({ imageUrl }: { imageUrl: string }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 0.1);
  }, [camera]);

  return (
    <>
      <VRSphere imageUrl={imageUrl} />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={-0.5}
        zoomSpeed={1.2}
        minDistance={1}
        maxDistance={100}
        reverseOrbit={false}
      />
    </>
  );
}

export default function VRViewer({ destination, onClose }: VRViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const destLower = destination.toLowerCase();
        const response = await fetch(`/api/vr-images?destination=${destLower}`);
        const data = await response.json();
        setImages(data.images || []);
      } catch (error) {
        console.error('Error loading VR images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [destination]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const resetView = () => {
    window.location.reload(); // Simple reset, or implement proper camera reset
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [images.length]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading VR Experience...</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">No VR images available for {destination}</p>
          <Button onClick={onClose} variant="outline" className="text-white border-white hover:bg-white/20">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 to-transparent p-4 sm:p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h2 className="text-white text-xl sm:text-2xl font-bold capitalize">
              🌍 Virtual Tour - {destination}
            </h2>
            <p className="text-white/70 text-sm mt-1">
              {currentIndex + 1} of {images.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              title="Reset View"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              title="Close (ESC)"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 360° Canvas */}
      <div className="w-full h-full">
        <Canvas
          key={currentIndex}
          camera={{ position: [0, 0, 0.1], fov: 75 }}
          gl={{ antialias: true, alpha: false }}
        >
          <Scene imageUrl={images[currentIndex]} />
        </Canvas>
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <div className="absolute top-1/2 left-4 sm:left-8 transform -translate-y-1/2 z-10">
            <Button
              onClick={handlePrev}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 h-12 w-12 sm:h-14 sm:w-14 rounded-full p-0 shadow-lg"
              title="Previous (←)"
            >
              <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
            </Button>
          </div>

          <div className="absolute top-1/2 right-4 sm:right-8 transform -translate-y-1/2 z-10">
            <Button
              onClick={handleNext}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 h-12 w-12 sm:h-14 sm:w-14 rounded-full p-0 shadow-lg"
              title="Next (→)"
            >
              <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
            </Button>
          </div>
        </>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 to-transparent p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Image Indicators */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
          
          {/* Instructions */}
          <div className="text-center text-white/70 text-xs sm:text-sm space-y-1">
            <p>🖱️ Click & drag to look around • 🔍 Scroll to zoom • ⌨️ Arrow keys to navigate</p>
            <p className="text-white/50">Auto-rotating • Equirectangular 360° view</p>
          </div>
        </div>
      </div>
    </div>
  );
}