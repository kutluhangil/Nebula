"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useQuery } from "@tanstack/react-query";
import { magnitudeColor } from "@/lib/dataviz";
import { fetchJson } from "@/lib/api-client";

/* ---------------------------------------------------------------------------
   Photorealistic 3D Earth: NASA Blue Marble surface + topographic bump map +
   ocean specular glint, drifting semi-transparent cloud deck, dual-layer
   Rayleigh blue Fresnel atmosphere, inclined orbital track, delicate LEO
   telemetry particles, live ISS reticle, and USGS seismic markers.
--------------------------------------------------------------------------- */

const R = 1;

/** Geographic lat/lon (degrees) → a point on a sphere of radius r. */
function latLonToVec3(lat: number, lon: number, r = R): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/** Deterministic PRNG for pure satellite & cloud buffers. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds a subtle orbital telemetry swarm around LEO/MEO shells. */
function useSatellitePoints() {
  return useMemo(() => {
    const random = mulberry32(0x5eed);
    const count = 1600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const palette = [
      new THREE.Color("#7ec8ff"),
      new THREE.Color("#e9eef8"),
      new THREE.Color("#9db8ff"),
      new THREE.Color("#ff6b5a"),
    ];

    for (let i = 0; i < count; i++) {
      const r = R + 0.065 + random() * 0.16;
      const theta = 2 * Math.PI * random();
      const phi = Math.acos(2 * random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const p = random();
      const c =
        p < 0.45
          ? palette[0]
          : p < 0.85
            ? palette[1]
            : p < 0.96
              ? palette[2]
              : palette[3];

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    return { positions, colors };
  }, []);
}

/** Generates a procedural seamless wispy cloud texture on an offscreen canvas. */
function createCloudTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, w, h);
  const rand = mulberry32(0xc10d);

  // Soft zonal trade-wind cloud bands + cyclonic wisps
  for (let i = 0; i < 650; i++) {
    const x = rand() * w;
    // Concentrate subtly toward mid-latitudes and ITCZ
    const latBias = (rand() + rand() - 1) * 0.44 + 0.5;
    const y = latBias * h;
    const rx = 14 + rand() * 52;
    const ry = 3 + rand() * 11;
    const alpha = 0.03 + rand() * 0.09;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, rx);
    grad.addColorStop(0, `rgba(246, 250, 255, ${alpha})`);
    grad.addColorStop(0.55, `rgba(232, 242, 255, ${alpha * 0.45})`);
    grad.addColorStop(1, "rgba(232, 242, 255, 0)");

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rand() - 0.5) * 0.35);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vViewDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const ATMOSPHERE_HALO_FRAGMENT = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vViewDir;
  uniform vec3 uColor;
  uniform float uIntensity;
  void main() {
    float viewDot = dot(normalize(vNormalWorld), normalize(vViewDir));
    float rim = pow(clamp(0.58 - viewDot, 0.0, 1.0), 4.6);
    gl_FragColor = vec4(uColor, rim * uIntensity);
  }
`;

const ATMOSPHERE_HAZE_FRAGMENT = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vViewDir;
  uniform vec3 uColor;
  void main() {
    float ndotv = max(dot(normalize(vNormalWorld), normalize(vViewDir)), 0.0);
    float fresnel = pow(1.0 - ndotv, 4.2) * 0.55;
    gl_FragColor = vec4(uColor, fresnel);
  }
`;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );
}

/* ---------------------------- marker components --------------------------- */

interface Quake {
  id: string;
  properties: { mag: number; place: string };
  geometry: { coordinates: [number, number, number] };
}

function QuakeMarker({ quake }: { quake: Quake }) {
  const [hovered, setHovered] = useState(false);
  const [lon, lat] = quake.geometry.coordinates;
  const mag = quake.properties.mag;
  const pos = useMemo(() => latLonToVec3(lat, lon, R + 0.005), [lat, lon]);
  const size = 0.008 + Math.max(0, mag - 4) * 0.0038;
  const color = magnitudeColor(mag);

  return (
    <group position={pos}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.7 : 1}
      >
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {hovered && (
        <Html center zIndexRange={[60, 0]}>
          <div className="globe-tip">
            <span className="globe-tip-mag" style={{ color }}>
              M{mag.toFixed(1)}
            </span>
            <span className="globe-tip-place">{quake.properties.place}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function ISSMarker({
  lat,
  lon,
  reduce,
}: {
  lat: number;
  lon: number;
  reduce: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => latLonToVec3(lat, lon, R + 0.052), [lat, lon]);
  const surfaceOffset = useMemo(
    () => latLonToVec3(lat, lon, R).sub(pos).toArray(),
    [lat, lon, pos]
  );

  useFrame(({ clock }) => {
    if (ref.current && !reduce) {
      const s = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.22;
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <group position={pos}>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, ...surfaceOffset]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#7fd1ff" transparent opacity={0.55} />
      </line>
      <mesh ref={ref}>
        <octahedronGeometry args={[0.017, 0]} />
        <meshBasicMaterial color="#9ae1ff" toneMapped={false} />
      </mesh>
      <Html center zIndexRange={[70, 0]}>
        <div className="globe-iss">ISS</div>
      </Html>
    </group>
  );
}

/** Inclined 51.6-degree orbital path ring around Earth. */
function OrbitalTrackRing() {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const r = R + 0.052;
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineLoop geometry={geometry} rotation={[0.9, 0.3, 0]}>
      <lineBasicMaterial color="#6cc4ff" transparent opacity={0.22} />
    </lineLoop>
  );
}

/* ------------------------------- the globe -------------------------------- */

// Self-hosted Earth textures (three-globe@2.45.2 MIT) in /public/textures.
const GLOBE_TEXTURE_BASE = "/textures";

function Globe({ reduce }: { reduce: boolean }) {
  const group = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const satellitesRef = useRef<THREE.Points>(null);

  const [colorMap, bumpMap, specularMap] = useTexture([
    `${GLOBE_TEXTURE_BASE}/earth-blue-marble.jpg`,
    `${GLOBE_TEXTURE_BASE}/earth-topology.png`,
    `${GLOBE_TEXTURE_BASE}/earth-water.png`,
  ]);

  const cloudTexture = useMemo(() => createCloudTexture(), []);
  useEffect(() => () => cloudTexture?.dispose(), [cloudTexture]);

  const { positions: satPositions, colors: satColors } = useSatellitePoints();

  const haloUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#4fa8ff") },
      uIntensity: { value: 0.72 },
    }),
    []
  );

  const hazeUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#9bd4ff") },
    }),
    []
  );

  const oceanSpecular = useMemo(() => new THREE.Color("#2e6699"), []);
  const earthEmissive = useMemo(() => new THREE.Color("#071324"), []);

  const { data: iss } = useQuery<{
    iss_position: { latitude: string; longitude: string };
  }>({
    queryKey: ["iss"],
    queryFn: () => fetchJson("/api/iss"),
    refetchInterval: 5000,
  });

  const { data: quakeData } = useQuery<{ features: Quake[] }>({
    queryKey: ["earthquakes"],
    queryFn: () => fetchJson("/api/earthquakes"),
    staleTime: 1000 * 60 * 10,
  });

  const quakes = useMemo(
    () =>
      (quakeData?.features ?? [])
        .filter((q) => Number.isFinite(q.geometry?.coordinates?.[1]))
        .slice(0, 36),
    [quakeData]
  );

  useFrame((_, delta) => {
    if (group.current && !reduce) {
      group.current.rotation.y += delta * 0.045;
    }
    if (cloudsRef.current && !reduce) {
      cloudsRef.current.rotation.y += delta * 0.015;
    }
    if (satellitesRef.current && !reduce) {
      satellitesRef.current.rotation.y -= delta * 0.018;
      satellitesRef.current.rotation.z += delta * 0.008;
    }
  });

  const issLat = iss ? parseFloat(iss.iss_position.latitude) : null;
  const issLon = iss ? parseFloat(iss.iss_position.longitude) : null;

  return (
    <>
      {/* Fixed space lighting so Earth rotates organically across the terminator */}
      <ambientLight intensity={0.44} color="#8fb5eb" />
      <directionalLight position={[5.6, 2.2, 2.8]} intensity={2.85} color="#fff6e6" />
      <directionalLight position={[-4.5, -1.8, -3.2]} intensity={0.7} color="#2864b8" />

      <group ref={group} rotation={[0.28, -1.05, 0.08]}>
        {/* Photorealistic Earth surface with topographic relief & ocean glint */}
        <mesh>
          <sphereGeometry args={[R, 64, 64]} />
          <meshPhongMaterial
            map={colorMap}
            bumpMap={bumpMap}
            bumpScale={0.03}
            specularMap={specularMap}
            specular={oceanSpecular}
            shininess={10}
            emissive={earthEmissive}
            emissiveIntensity={0.42}
          />
        </mesh>

        {/* Semi-transparent drifting cloud deck */}
        {cloudTexture && (
          <mesh ref={cloudsRef}>
            <sphereGeometry args={[R + 0.014, 48, 48]} />
            <meshLambertMaterial
              map={cloudTexture}
              transparent
              opacity={0.78}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Inner surface Rayleigh horizon haze */}
        <mesh>
          <sphereGeometry args={[R + 0.019, 48, 48]} />
          <shaderMaterial
            vertexShader={ATMOSPHERE_VERTEX}
            fragmentShader={ATMOSPHERE_HAZE_FRAGMENT}
            uniforms={hazeUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Outer volumetric Rayleigh atmospheric scattering halo */}
        <mesh>
          <sphereGeometry args={[R + 0.075, 48, 48]} />
          <shaderMaterial
            vertexShader={ATMOSPHERE_VERTEX}
            fragmentShader={ATMOSPHERE_HALO_FRAGMENT}
            uniforms={haloUniforms}
            side={THREE.BackSide}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Subtle LEO/MEO satellite swarm */}
        <points ref={satellitesRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[satPositions, 3]} />
            <bufferAttribute attach="attributes-color" args={[satColors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.007}
            vertexColors
            transparent
            opacity={0.45}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        <OrbitalTrackRing />

        {quakes.map((q) => (
          <QuakeMarker key={q.id} quake={q} />
        ))}

        {issLat !== null && issLon !== null && (
          <ISSMarker lat={issLat} lon={issLon} reduce={reduce} />
        )}
      </group>
    </>
  );
}

export default function Globe3D() {
  const reduce = usePrefersReducedMotion();
  return (
    <Canvas
      camera={{ position: [0, 0, 3.45], fov: 42 }}
      dpr={[1, 2]}
      frameloop={reduce ? "demand" : "always"}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
      aria-label="Interactive 3D realistic globe showing satellites, the live ISS position and recent earthquakes"
    >
      <Globe reduce={reduce} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.5}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
