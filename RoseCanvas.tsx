import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoseSettings } from '../types';

interface RoseCanvasProps {
  settings: RoseSettings;
}

export const RoseCanvas: React.FC<RoseCanvasProps> = ({ settings }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<RoseSettings>(settings);

  // Keep settings reference updated to avoid recreating the whole scene on every setting change
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    // Deep cosmic fog
    scene.background = new THREE.Color('#03000a');
    scene.fog = new THREE.FogExp2('#03000a', 0.03);

    // --- CAMERA SETUP ---
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2, 8);

    // --- RENDERER SETUP ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // --- CONTROLS ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.minDistance = 3;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0; // Overridden by settings in animation loop

    // --- LIGHTING ---
    // Ambient deep space glow
    const ambientLight = new THREE.AmbientLight('#110724', 1.5);
    scene.add(ambientLight);

    // Cyberpunk Cyan backlight
    const cyanLight = new THREE.DirectionalLight('#00f0ff', 2.0);
    cyanLight.position.set(-5, 3, -3);
    scene.add(cyanLight);

    // Cosmic Magenta keylight
    const magentaLight = new THREE.DirectionalLight('#ff00aa', 2.0);
    magentaLight.position.set(5, 5, 5);
    scene.add(magentaLight);

    // --- PROCEDURAL 3D NEON CRYSTAL ROSE ---
    const roseGroup = new THREE.Group();
    scene.add(roseGroup);

    // 1. Crystal Materials
    const roseColor = new THREE.Color(settings.color);
    const petalMaterial = new THREE.MeshPhysicalMaterial({
      color: roseColor,
      emissive: new THREE.Color('#220011').multiplyScalar(settings.glowIntensity),
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85, // Crystalline glass look
      ior: 1.55,          // Crystal index of refraction
      thickness: 1.5,     // Refraction thickness
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });

    const stemMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#105030').lerp(roseColor, 0.3), // Crystalline dark green-rose
      emissive: new THREE.Color('#002211'),
      roughness: 0.2,
      metalness: 0.05,
      transmission: 0.75,
      ior: 1.5,
      thickness: 1.0,
      clearcoat: 1.0,
      side: THREE.DoubleSide
    });

    const leafMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0d4220').lerp(roseColor, 0.2),
      emissive: new THREE.Color('#021a05'),
      roughness: 0.25,
      metalness: 0.1,
      transmission: 0.7,
      ior: 1.45,
      thickness: 0.8,
      clearcoat: 0.8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });

    const orbitMaterial = new THREE.MeshPhysicalMaterial({
      color: roseColor,
      emissive: roseColor.clone().multiplyScalar(2.0),
      roughness: 0.05,
      metalness: 0.9,
      clearcoat: 1.0,
      side: THREE.DoubleSide
    });

    // 2. Glowing Heart of the Rose (PointLight inside)
    const roseHeartLight = new THREE.PointLight('#ff007f', 4.0, 6.0, 1.2);
    roseHeartLight.position.set(0, 1.2, 0);
    roseGroup.add(roseHeartLight);

    // 3. STEM (Procedural Curved Cylinder)
    const stemPoints: THREE.Vector3[] = [];
    const stemHeight = 3;
    const stemSegments = 30;
    for (let i = 0; i <= stemSegments; i++) {
      const t = i / stemSegments;
      const y = t * stemHeight - (stemHeight / 2);
      // Gentle S-curve
      const x = Math.sin(t * Math.PI * 1.5) * 0.12;
      const z = Math.cos(t * Math.PI * 1.0) * 0.08;
      stemPoints.push(new THREE.Vector3(x, y, z));
    }
    const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
    const stemGeometry = new THREE.TubeGeometry(stemCurve, 64, 0.06, 12, false);
    const stemMesh = new THREE.Mesh(stemGeometry, stemMaterial);
    roseGroup.add(stemMesh);

    // 4. THORNS along the stem
    const thornGeometry = new THREE.ConeGeometry(0.04, 0.15, 5);
    thornGeometry.rotateX(Math.PI / 2); // Point outward
    const stemPointsArray = stemCurve.getPoints(20);
    for (let i = 2; i < stemPointsArray.length - 2; i++) {
      if (i % 3 === 0) {
        const thorn = new THREE.Mesh(thornGeometry, stemMaterial);
        thorn.position.copy(stemPointsArray[i]);
        // Angle pointing away from curve tangent
        const tangent = stemCurve.getTangentAt(i / stemPointsArray.length);
        const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
        const angle = (i * 1.7) % (Math.PI * 2); // Spiral orientation
        normal.applyAxisAngle(tangent, angle);
        
        thorn.lookAt(stemPointsArray[i].clone().add(normal));
        roseGroup.add(thorn);
      }
    }

    // 5. LEAVES (Procedural curved plane geometry)
    const createLeafGeometry = () => {
      const geom = new THREE.PlaneGeometry(0.5, 0.8, 10, 10);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        // Taper bottom and top, bend in center to create cup shape
        const u = x + 0.25; // 0 to 0.5
        const v = y + 0.4;  // 0 to 0.8
        
        // Organic leaf curve
        const curveFactor = Math.sin((v / 0.8) * Math.PI);
        const bendX = Math.sin(x * Math.PI * 2) * 0.15 * curveFactor;
        const bendY = Math.pow(v / 0.8 - 0.5, 2) * 0.1;
        
        pos.setZ(i, bendX - bendY);
      }
      geom.computeVertexNormals();
      return geom;
    };

    // Add 3 leaves at different heights and rotations
    const leafGeom = createLeafGeometry();
    const leafPositions = [
      { height: 0.3, rotation: 0.5, scale: 0.9 },
      { height: -0.5, rotation: 2.2, scale: 1.1 },
      { height: -1.2, rotation: -1.3, scale: 1.0 }
    ];

    leafPositions.forEach((lp, idx) => {
      const leafMesh = new THREE.Mesh(leafGeom, leafMaterial);
      // Find position on stem
      const stemIndex = Math.floor(((lp.height + stemHeight/2) / stemHeight) * stemPointsArray.length);
      const attachPoint = stemPointsArray[Math.max(0, Math.min(stemPointsArray.length - 1, stemIndex))];
      
      leafMesh.position.copy(attachPoint);
      leafMesh.scale.set(lp.scale, lp.scale, lp.scale);
      
      // Rotate leaf outwards
      leafMesh.rotation.y = lp.rotation;
      leafMesh.rotation.x = 0.4;
      leafMesh.rotation.z = 0.3 * (idx % 2 === 0 ? 1 : -1);
      
      roseGroup.add(leafMesh);
    });

    // 6. ROSE FLOWER PETALS (Procedural spiral layers)
    const createPetalGeometry = (width: number, height: number) => {
      const geom = new THREE.PlaneGeometry(width, height, 15, 15);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        
        // Normalize coordinates (-0.5 to 0.5)
        const u = x / width;
        const v = y / height;
        
        // Narrow the bottom (v = -0.5 is bottom, v = 0.5 is top)
        const taper = 0.2 + 0.8 * (v + 0.5);
        pos.setX(i, x * taper);
        
        // Curve the petal inwards like a cup
        const cupFactor = Math.cos(u * Math.PI) * Math.cos(v * Math.PI);
        const zCurve = -cupFactor * (width * 0.4);
        
        // Curl top edge backwards slightly
        const topCurl = v > 0.2 ? Math.pow(v - 0.2, 2) * (height * 0.4) : 0;
        
        pos.setZ(i, zCurve + topCurl);
      }
      geom.computeVertexNormals();
      return geom;
    };

    const petalsGroup = new THREE.Group();
    petalsGroup.position.set(0, stemHeight / 2, 0); // Position at top of stem
    roseGroup.add(petalsGroup);

    // Generate nested concentric layers of petals
    const petalLayers = [
      { count: 3, radius: 0.05, size: 0.35, tilt: 0.0, heightOffset: 0.0 }, // Center core (tight bud)
      { count: 4, radius: 0.12, size: 0.50, tilt: 0.2, heightOffset: 0.05 }, // Bud layer
      { count: 5, radius: 0.22, size: 0.70, tilt: 0.4, heightOffset: 0.10 }, // Opening layer
      { count: 6, radius: 0.35, size: 0.90, tilt: 0.7, heightOffset: 0.15 }, // Outer open petals
      { count: 7, radius: 0.50, size: 1.15, tilt: 1.1, heightOffset: 0.10 }, // Fully bloomed
      { count: 8, radius: 0.65, size: 1.35, tilt: 1.4, heightOffset: 0.00 }  // Guard petals (drooping)
    ];

    petalLayers.forEach((layer, layerIdx) => {
      const geom = createPetalGeometry(layer.size, layer.size * 1.1);
      
      for (let i = 0; i < layer.count; i++) {
        const petal = new THREE.Mesh(geom, petalMaterial);
        
        // Angle around center (golden spiral or staggered offsets)
        const angle = (i / layer.count) * Math.PI * 2 + (layerIdx * 0.75);
        
        // Position on a cylinder
        const px = Math.cos(angle) * layer.radius;
        const pz = Math.sin(angle) * layer.radius;
        const py = layer.heightOffset + (layerIdx * 0.06);
        
        petal.position.set(px, py, pz);
        
        // Rotate petal to face outwards and tilt backward
        petal.rotation.y = -angle + Math.PI / 2; // Face outward
        petal.rotation.x = layer.tilt;           // Tilt outward
        petal.rotation.z = (Math.random() - 0.5) * 0.1; // Small organic variation
        
        petalsGroup.add(petal);
      }
    });

    // 7. ORBITAL THORNY BARBED WIRE RING
    const orbitGroup = new THREE.Group();
    // Position slightly tilted around center of stem
    orbitGroup.position.set(0, 0, 0);
    orbitGroup.rotation.x = 0.5; // Tilt
    orbitGroup.rotation.z = 0.3;
    scene.add(orbitGroup);

    // Create a metallic/neon wire ring
    const orbitRadius = 1.9;
    const ringGeom = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        Array.from({ length: 50 }, (_, k) => {
          const theta = (k / 50) * Math.PI * 2;
          // Add micro waviness to look like barbed wire
          const r = orbitRadius + Math.sin(theta * 16) * 0.03;
          return new THREE.Vector3(Math.cos(theta) * r, 0, Math.sin(theta) * r);
        }),
        true
      ),
      120,
      0.02,
      8,
      true
    );
    const ringMesh = new THREE.Mesh(ringGeom, orbitMaterial);
    orbitGroup.add(ringMesh);

    // Add sharp thorns and stars around orbital ring
    const ringThornGeometry = new THREE.ConeGeometry(0.025, 0.12, 4);
    ringThornGeometry.rotateX(Math.PI / 2); // Point outward
    
    const thornCount = 12;
    for (let i = 0; i < thornCount; i++) {
      const thorn = new THREE.Mesh(ringThornGeometry, orbitMaterial);
      const angle = (i / thornCount) * Math.PI * 2;
      
      const tx = Math.cos(angle) * orbitRadius;
      const tz = Math.sin(angle) * orbitRadius;
      
      thorn.position.set(tx, 0, tz);
      
      // Face outward from ring center
      thorn.rotation.y = -angle;
      // Alternate tilting up/down for barbs
      thorn.rotation.x = i % 2 === 0 ? 0.3 : -0.3;
      
      orbitGroup.add(thorn);
    }

    // --- COSMIC GALAXY PARTICLES (TWINKLING STARS) ---
    const starCount = 1500;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    const baseStarColor = new THREE.Color(settings.color);
    const nebulaColor = new THREE.Color(settings.nebulaColor);

    for (let i = 0; i < starCount; i++) {
      // Spiral galaxy distribution or spherical dome
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.0 + Math.pow(Math.random(), 2) * 15.0; // Dense center, sparse edges
      const spiralOffset = radius * 0.3; // Spiral arms
      const spiralAngle = angle + spiralOffset;

      const x = Math.cos(spiralAngle) * radius + (Math.random() - 0.5) * 0.6;
      const y = (Math.random() - 0.5) * (3.0 + radius * 0.1); // Thicker at core
      const z = Math.sin(spiralAngle) * radius + (Math.random() - 0.5) * 0.6;

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;

      // Color interpolation: stars closer to core are neon pink, outer are nebula cyan/blue
      const lerpColor = baseStarColor.clone().lerp(nebulaColor, Math.random() * 0.7);
      starColors[i * 3] = lerpColor.r;
      starColors[i * 3 + 1] = lerpColor.g;
      starColors[i * 3 + 2] = lerpColor.b;

      // Random twinkling size
      starSizes[i] = 0.05 + Math.random() * 0.2;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    // Custom star texture (Canvas soft circular gradient)
    const createStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 150, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
      }
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    const starMaterial = new THREE.PointsMaterial({
      size: 0.15,
      map: createStarTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // --- COSMIC NEBULAE SPRAYS (GLOWS) ---
    const createNebulaGlow = (colorHex: string, size: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, colorHex + '33'); // Transparent color
        gradient.addColorStop(0.5, colorHex + '11');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({
        map: texture,
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(size, size, 1);
      return sprite;
    };

    const nebulaGroup = new THREE.Group();
    scene.add(nebulaGroup);

    // Place a few nebula sprites in the background
    const n1 = createNebulaGlow(settings.color, 12);
    n1.position.set(-3, -2, -6);
    nebulaGroup.add(n1);

    const n2 = createNebulaGlow(settings.nebulaColor, 15);
    n2.position.set(4, 2, -7);
    nebulaGroup.add(n2);

    const n3 = createNebulaGlow('#6b00ff', 10);
    n3.position.set(0, -1, -5);
    nebulaGroup.add(n3);

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- ANIMATION LOOP ---
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Dynamic variables from settings
      const currentSettings = settingsRef.current;
      const currentRoseColor = new THREE.Color(currentSettings.color);
      const currentNebulaColor = new THREE.Color(currentSettings.nebulaColor);

      // 1. Update Materials and Lights based on UI Settings
      petalMaterial.color.copy(currentRoseColor);
      petalMaterial.emissive.copy(currentRoseColor).multiplyScalar(0.2 * currentSettings.glowIntensity);
      orbitMaterial.color.copy(currentRoseColor);
      orbitMaterial.emissive.copy(currentRoseColor).multiplyScalar(2.0 * currentSettings.glowIntensity);
      roseHeartLight.color.copy(currentRoseColor);
      roseHeartLight.intensity = 3.0 * currentSettings.glowIntensity + Math.sin(elapsed * 5) * 0.5;

      // 2. Main Rose Rotation & Floating
      roseGroup.rotation.y = elapsed * currentSettings.rotationSpeed;
      // Gentle floating up and down
      roseGroup.position.y = Math.sin(elapsed * 1.5) * 0.15;

      // 3. Orbital Ring Reverse/Different Spin
      orbitGroup.rotation.y = -elapsed * currentSettings.orbitSpeed;
      orbitGroup.position.y = Math.sin(elapsed * 1.5) * 0.15; // float with rose

      // 4. Subtle rotation for the star system
      starPoints.rotation.y = elapsed * 0.02;
      starPoints.rotation.z = Math.sin(elapsed * 0.05) * 0.05;

      // Nebulae slow drifting
      nebulaGroup.rotation.y = -elapsed * 0.01;
      n1.position.x = -3 + Math.sin(elapsed * 0.3) * 0.5;
      n2.position.y = 2 + Math.cos(elapsed * 0.2) * 0.4;

      // 5. Star Twinkling (jitter size or intensity)
      const starSizesAttr = starPoints.geometry.attributes.position;
      // Twinkle point light
      if (Math.random() > 0.85) {
        roseHeartLight.intensity += (Math.random() - 0.5) * 1.0;
      }

      controls.autoRotate = true;
      controls.autoRotateSpeed = currentSettings.rotationSpeed * 30.0; // match rotation vibe
      controls.update();

      renderer.render(scene, camera);
    };

    animate();

    // --- CLEANUP ---
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      
      // Dispose materials & geometries
      stemGeometry.dispose();
      thornGeometry.dispose();
      leafGeom.dispose();
      ringGeom.dispose();
      ringThornGeometry.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      stemMaterial.dispose();
      leafMaterial.dispose();
      petalMaterial.dispose();
      orbitMaterial.dispose();
      
      // Dispose petals specifically
      petalsGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []); // Run once, settings updated via Ref in loop

  return (
    <div 
      ref={mountRef} 
      id="rose-canvas-container" 
      className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden"
    >
      {/* Dynamic star dust canvas ambient layer */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-transparent to-black/80" />
    </div>
  );
};
