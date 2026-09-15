import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Card, BetMap, HandEvaluation } from '../types/game';
import { soundEngine } from '../utils/audio';

interface Lucky9SceneProps {
  playerCards: Card[];
  enemyCards?: Card[];
  bankerCards: Card[];
  playerHand: HandEvaluation | null;
  enemyHand?: HandEvaluation | null;
  bankerHand: HandEvaluation | null;
  bets: BetMap;
  winner: 'player' | 'banker' | 'tie' | null;
  isDealing: boolean;
  cameraPreset: 'player' | 'overview' | 'cinematic';
  enemyProfile?: { name: string; avatar: string; coins: number; currentBet: number } | null;
  onPlaceBetDirect?: (betType: keyof BetMap) => void;
}

// Texture caches
const cardTextureCache = new Map<string, THREE.CanvasTexture>();
let cardBackTexture: THREE.CanvasTexture | null = null;

function getCardFaceTexture(card: Card): THREE.CanvasTexture {
  const key = `${card.suit}-${card.rank}`;
  if (cardTextureCache.has(key)) {
    return cardTextureCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 716;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 512, 716);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 500, 704);

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, 464, 668);

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitColor = isRed ? '#DC2626' : '#0F172A';

  const suitSymbols: Record<string, string> = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
  };
  const symbol = suitSymbols[card.suit] || '♠';

  // Corner Top-Left
  ctx.fillStyle = suitColor;
  ctx.font = 'bold 72px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.rank, 65, 75);
  ctx.font = '54px sans-serif';
  ctx.fillText(symbol, 65, 135);

  // Corner Bottom-Right (rotated)
  ctx.save();
  ctx.translate(512 - 65, 716 - 75);
  ctx.rotate(Math.PI);
  ctx.font = 'bold 72px Cinzel, serif';
  ctx.fillText(card.rank, 0, 0);
  ctx.font = '54px sans-serif';
  ctx.fillText(symbol, 0, 60);
  ctx.restore();

  // Center Court / Art
  if (['J', 'Q', 'K'].includes(card.rank)) {
    ctx.strokeStyle = suitColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(120, 160, 272, 396);

    ctx.fillStyle = isRed ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.06)';
    ctx.fillRect(124, 164, 264, 388);

    ctx.fillStyle = suitColor;
    ctx.font = 'bold 120px Cinzel, serif';
    ctx.fillText(card.rank, 256, 330);

    ctx.font = '90px sans-serif';
    ctx.fillText(symbol, 256, 460);
  } else {
    ctx.fillStyle = suitColor;
    ctx.font = '160px sans-serif';
    ctx.fillText(symbol, 256, 358);
  }

  // Value marker at bottom for Lucky 9 reference
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
  ctx.fillText(`L9: ${card.value}`, 256, 640);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  cardTextureCache.set(key, texture);
  return texture;
}

function getCardBackTexture(): THREE.CanvasTexture {
  if (cardBackTexture) return cardBackTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 716;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#831843'; // Rose 900
  ctx.fillRect(0, 0, 512, 716);

  ctx.lineWidth = 14;
  ctx.strokeStyle = '#FBBF24';
  ctx.strokeRect(14, 14, 484, 688);

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#FFFFFF';
  ctx.strokeRect(28, 28, 456, 660);

  ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
  ctx.lineWidth = 2;
  const step = 32;
  for (let x = -512; x < 1024; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 716, 716);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, 716);
    ctx.lineTo(x + 716, 0);
    ctx.stroke();
  }

  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(256, 358, 90, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = '#78350F';
  ctx.font = 'bold 80px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('9', 256, 358);

  cardBackTexture = new THREE.CanvasTexture(canvas);
  cardBackTexture.minFilter = THREE.LinearFilter;
  cardBackTexture.magFilter = THREE.LinearFilter;
  return cardBackTexture;
}

export const Lucky9Scene: React.FC<Lucky9SceneProps> = ({
  playerCards,
  enemyCards = [],
  bankerCards,
  winner,
  cameraPreset,
  bets,
  enemyProfile,
  onPlaceBetDirect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cardsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const chipsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const particleGroupRef = useRef<THREE.Points | null>(null);
  const spotlightRef = useRef<THREE.SpotLight | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.035);
    sceneRef.current = scene;

    // Camera oriented from player view facing the table (elevated so table and cards are fully visible above UI)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 7.4, 7.2);
    camera.lookAt(0, -0.3, -0.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff3db, 0.7);
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xffecd1, 2.8);
    mainSpot.position.set(0, 11, 4);
    mainSpot.angle = Math.PI / 4.2;
    mainSpot.penumbra = 0.55;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 2048;
    mainSpot.shadow.mapSize.height = 2048;
    mainSpot.shadow.bias = -0.0001;
    scene.add(mainSpot);
    spotlightRef.current = mainSpot;

    // Left spotlight for Banker area
    const bankerSpot = new THREE.SpotLight(0xf43f5e, 1.2);
    bankerSpot.position.set(-5, 8, 0);
    bankerSpot.lookAt(-2, 0, 0);
    scene.add(bankerSpot);

    // Rim light for depth
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(0, 5, -8);
    scene.add(rimLight);

    // 3D Table Construction
    const tableGroup = new THREE.Group();
    const tableW = 7.6;
    const tableH = 4.6;

    // Felt
    const feltShape = new THREE.Shape();
    feltShape.moveTo(-tableW / 2 + 1.2, -tableH / 2);
    feltShape.lineTo(tableW / 2 - 1.2, -tableH / 2);
    feltShape.quadraticCurveTo(tableW / 2, -tableH / 2, tableW / 2, 0);
    feltShape.quadraticCurveTo(tableW / 2, tableH / 2, tableW / 2 - 1.2, tableH / 2);
    feltShape.lineTo(-tableW / 2 + 1.2, tableH / 2);
    feltShape.quadraticCurveTo(-tableW / 2, tableH / 2, -tableW / 2, 0);
    feltShape.quadraticCurveTo(-tableW / 2, -tableH / 2, -tableW / 2 + 1.2, -tableH / 2);

    const feltGeo = new THREE.ShapeGeometry(feltShape, 32);
    const feltMat = new THREE.MeshStandardMaterial({
      color: 0x881337, // Rich Velvet Crimson Red (like the Uno digital tabletop)
      roughness: 0.82,
      metalness: 0.08,
    });
    const feltMesh = new THREE.Mesh(feltGeo, feltMat);
    feltMesh.rotation.x = -Math.PI / 2;
    feltMesh.receiveShadow = true;
    tableGroup.add(feltMesh);

    // Markings Canvas: Dynamic tabletop swirl arena with 1v1 Real Players and System Banker
    const markCanvas = document.createElement('canvas');
    markCanvas.width = 2048;
    markCanvas.height = 1024;
    const mctx = markCanvas.getContext('2d')!;
    mctx.clearRect(0, 0, 2048, 1024);

    // Outer border
    mctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
    mctx.lineWidth = 8;
    mctx.strokeRect(100, 80, 1848, 864);

    // Dynamic Central Swirl Ring (Matching the Uno arena screenshot)
    mctx.save();
    mctx.translate(1024, 512);
    mctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    mctx.lineWidth = 14;
    mctx.beginPath();
    mctx.arc(0, 0, 310, 0, Math.PI * 2);
    mctx.stroke();

    // Curved dynamic arrows
    mctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
    mctx.lineWidth = 10;
    mctx.beginPath();
    mctx.arc(0, 0, 260, 0.3, 2.8);
    mctx.stroke();

    mctx.beginPath();
    mctx.arc(0, 0, 260, 3.4, 5.9);
    mctx.stroke();
    mctx.restore();

    // Table Brand in center
    mctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
    mctx.font = '900 42px Cinzel, serif';
    mctx.textAlign = 'center';
    mctx.fillText('LUCKY 9 CASINO ROYALE', 1024, 490);
    mctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
    mctx.fillStyle = 'rgba(253, 230, 138, 0.75)';
    mctx.fillText('1v1 REAL PLAYERS • BANKER BY SYSTEM', 1024, 535);

    // 1. BANKER WING: Left side of table (PROVIDED BY SYSTEM)
    mctx.strokeStyle = '#F43F5E';
    mctx.lineWidth = 6;
    mctx.strokeRect(140, 190, 400, 644);
    mctx.fillStyle = '#F43F5E';
    mctx.font = 'bold 36px Cinzel, serif';
    mctx.fillText('BANKER', 340, 250);
    mctx.font = 'bold 22px Plus Jakarta Sans';
    mctx.fillStyle = '#FECDD3';
    mctx.fillText('PROVIDED BY SYSTEM', 340, 290);
    mctx.font = '18px Plus Jakarta Sans';
    mctx.fillStyle = '#FDA4AF';
    mctx.fillText('Automated House Dealer • Pays 1:1', 340, 325);

    // 2. ENEMY ZONE: Top center (OPPONENT / REAL PLAYER)
    mctx.strokeStyle = '#A855F7';
    mctx.lineWidth = 6;
    mctx.strokeRect(724, 110, 600, 230);
    mctx.fillStyle = '#C084FC';
    mctx.font = 'bold 34px Cinzel, serif';
    mctx.fillText('OPPONENT', 1024, 160);
    mctx.font = 'bold 22px Plus Jakarta Sans';
    mctx.fillStyle = '#E9D5FF';
    mctx.fillText('REAL PLAYER SEAT', 1024, 200);

    // 3. PLAYER ZONE: Bottom center (YOU / REAL PLAYER)
    mctx.strokeStyle = '#38BDF8';
    mctx.lineWidth = 6;
    mctx.strokeRect(724, 680, 600, 230);
    mctx.fillStyle = '#38BDF8';
    mctx.font = 'bold 34px Cinzel, serif';
    mctx.fillText('YOU', 1024, 730);
    mctx.font = 'bold 22px Plus Jakarta Sans';
    mctx.fillStyle = '#BAE6FD';
    mctx.fillText('REAL PLAYER SEAT • 1:1', 1024, 770);

    // 4. Center Tie & Natural 9
    mctx.strokeStyle = '#10B981';
    mctx.lineWidth = 5;
    mctx.strokeRect(1460, 280, 420, 180);
    mctx.fillStyle = '#10B981';
    mctx.font = 'bold 32px Cinzel, serif';
    mctx.fillText('TIE PAYS 8:1', 1670, 375);

    mctx.strokeStyle = '#F59E0B';
    mctx.lineWidth = 5;
    mctx.strokeRect(1460, 520, 420, 180);
    mctx.fillStyle = '#F59E0B';
    mctx.font = 'bold 30px Cinzel, serif';
    mctx.fillText('NATURAL 9 PAYS 3:1', 1670, 615);

    const markTexture = new THREE.CanvasTexture(markCanvas);
    const markMat = new THREE.MeshBasicMaterial({
      map: markTexture,
      transparent: true,
      depthWrite: false,
    });
    const markMesh = new THREE.Mesh(new THREE.PlaneGeometry(tableW, tableH), markMat);
    markMesh.rotation.x = -Math.PI / 2;
    markMesh.position.y = 0.005;
    tableGroup.add(markMesh);

    // Table Mahogany Rim
    const rimGeo = new THREE.BoxGeometry(tableW + 0.5, 0.25, tableH + 0.5);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x3b1d11,
      roughness: 0.35,
      metalness: 0.15,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = -0.13;
    tableGroup.add(rimMesh);

    // Brass Accent Trim
    const brassGeo = new THREE.BoxGeometry(tableW + 0.58, 0.06, tableH + 0.58);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.2,
      metalness: 0.85,
    });
    const brassMesh = new THREE.Mesh(brassGeo, brassMat);
    brassMesh.position.y = -0.01;
    tableGroup.add(brassMesh);

    // Banker Dealer Shoe on the left side of table
    const shoeGeo = new THREE.BoxGeometry(0.85, 0.5, 1.4);
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.5,
      transparent: true,
      opacity: 0.85,
    });
    const shoeMesh = new THREE.Mesh(shoeGeo, shoeMat);
    shoeMesh.position.set(-3.2, 0.25, -0.6);
    shoeMesh.rotation.y = Math.PI / 3;
    tableGroup.add(shoeMesh);

    // Banker Dealer Chip Rack on left side
    const rackGeo = new THREE.BoxGeometry(1.6, 0.12, 0.8);
    const rackMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.8,
    });
    const rackMesh = new THREE.Mesh(rackGeo, rackMat);
    rackMesh.position.set(-2.9, 0.06, 0.9);
    rackMesh.rotation.y = Math.PI / 2;
    tableGroup.add(rackMesh);

    // Discard tray on right side
    const discardGeo = new THREE.BoxGeometry(0.85, 0.35, 1.2);
    const discardMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.6,
    });
    const discardMesh = new THREE.Mesh(discardGeo, discardMat);
    discardMesh.position.set(3.2, 0.18, 0);
    tableGroup.add(discardMesh);

    scene.add(tableGroup);
    scene.add(cardsGroupRef.current);
    scene.add(chipsGroupRef.current);

    // Particle Fountain for celebration
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 8;
      particlePositions[i * 3 + 1] = Math.random() * 4 + 1;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      particleVelocities.push(
        (Math.random() - 0.5) * 0.02,
        Math.random() * 0.02 + 0.01,
        (Math.random() - 0.5) * 0.02
      );
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.08,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);
    particleGroupRef.current = particlePoints;

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (particleGroupRef.current && particleGroupRef.current.userData.active) {
        const positions = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += particleVelocities[i * 3];
          positions[i * 3 + 1] += particleVelocities[i * 3 + 1];
          positions[i * 3 + 2] += particleVelocities[i * 3 + 2];
          if (positions[i * 3 + 1] > 6) {
            positions[i * 3 + 1] = 0.2;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Camera based on Preset
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    if (cameraPreset === 'player') {
      camera.position.set(0, 8.2, 9.2);
      camera.lookAt(0, 0, 0.1);
    } else if (cameraPreset === 'overview') {
      camera.position.set(0, 11, 2.5);
      camera.lookAt(0, 0, 0);
    } else if (cameraPreset === 'cinematic') {
      camera.position.set(5.2, 7.2, 7.8);
      camera.lookAt(-0.5, 0, 0);
    }
  }, [cameraPreset]);

  // Render 3D Cards:
  // Player cards: Bottom center (front)
  // Enemy cards: Top center (across table in front of player)
  // Banker cards: Left side of table
  useEffect(() => {
    const cardsGroup = cardsGroupRef.current;
    if (!cardsGroup) return;

    while (cardsGroup.children.length > 0) {
      cardsGroup.remove(cardsGroup.children[0]);
    }

    const cardWidth = 1.28;
    const cardHeight = 1.82;
    const cardThickness = 0.02;

    const createPlaceholderMesh = (label: string, colorHex: string, fillRgba: string) => {
      const geo = new THREE.PlaneGeometry(cardWidth, cardHeight);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 364;
      const ctx = canvas.getContext('2d')!;
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 6;
      ctx.setLineDash([16, 12]);
      ctx.strokeRect(10, 10, 236, 344);
      ctx.fillStyle = fillRgba;
      ctx.fillRect(10, 10, 236, 344);
      ctx.fillStyle = colorHex;
      ctx.font = 'bold 28px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, 128, 165);
      ctx.font = 'bold 18px Plus Jakarta Sans';
      ctx.fillText('CARD SLOT', 128, 205);

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.012;
      return mesh;
    };

    const createCardMesh = (card: Card, faceUp: boolean) => {
      const cardGeo = new THREE.BoxGeometry(cardWidth, cardThickness, cardHeight);
      const faceMat = new THREE.MeshStandardMaterial({
        map: getCardFaceTexture(card),
        roughness: 0.35,
        metalness: 0.1,
      });
      const backMat = new THREE.MeshStandardMaterial({
        map: getCardBackTexture(),
        roughness: 0.35,
        metalness: 0.2,
      });
      const edgeMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.7,
      });

      const materials = [edgeMat, edgeMat, faceMat, backMat, edgeMat, edgeMat];
      const mesh = new THREE.Mesh(cardGeo, materials);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (!faceUp) {
        mesh.rotation.z = Math.PI;
      }
      return mesh;
    };

    // 1. PLAYER CARDS (Bottom Center): Dealt cards or 2 glowing card slots
    if (playerCards.length === 0) {
      // 2 Placeholder Slots
      [-0.72, 0.72].forEach((slotX) => {
        const ph = createPlaceholderMesh('YOU', '#38BDF8', 'rgba(56, 189, 248, 0.1)');
        ph.position.set(slotX, 0.012, 0.12);
        cardsGroup.add(ph);
      });
    } else {
      playerCards.forEach((card, idx) => {
        const mesh = createCardMesh(card, true);
        const targetX = (idx - (playerCards.length - 1) / 2) * 1.4;
        const targetZ = 0.12;
        mesh.position.set(targetX, 0.08 + idx * 0.018, targetZ);
        mesh.rotation.x = -0.28; // Tilted toward player's eyes!
        mesh.rotation.y = (idx - (playerCards.length - 1) / 2) * 0.06;
        cardsGroup.add(mesh);
      });
    }

    // 2. ENEMY / OPPONENT CARDS (Top Center): Dealt cards or 2 glowing card slots
    if (enemyCards.length === 0) {
      [-0.72, 0.72].forEach((slotX) => {
        const ph = createPlaceholderMesh('RIVAL', '#C084FC', 'rgba(192, 132, 252, 0.1)');
        ph.position.set(slotX, 0.012, -1.1);
        cardsGroup.add(ph);
      });
    } else {
      enemyCards.forEach((card, idx) => {
        const mesh = createCardMesh(card, true);
        const targetX = (idx - (enemyCards.length - 1) / 2) * 1.4;
        const targetZ = -1.1;
        mesh.position.set(targetX, 0.08 + idx * 0.018, targetZ);
        mesh.rotation.x = 0.28; // Tilted toward player
        mesh.rotation.y = Math.PI - (idx - (enemyCards.length - 1) / 2) * 0.06;
        cardsGroup.add(mesh);
      });
    }

    // 3. BANKER CARDS (Left Side - House Dealer): Dealt cards or 2 glowing card slots
    if (bankerCards.length === 0) {
      [-2.6, -1.8].forEach((slotX) => {
        const ph = createPlaceholderMesh('HOUSE', '#F43F5E', 'rgba(244, 63, 94, 0.1)');
        ph.position.set(slotX, 0.012, -0.2);
        ph.rotation.z = Math.PI / 6;
        cardsGroup.add(ph);
      });
    } else {
      bankerCards.forEach((card, idx) => {
        const mesh = createCardMesh(card, true);
        const targetX = -2.4 + idx * 1.25;
        const targetZ = -0.2;
        mesh.position.set(targetX, 0.08 + idx * 0.018, targetZ);
        mesh.rotation.x = -0.15;
        mesh.rotation.y = Math.PI / 4 + (idx - 0.5) * 0.05;
        cardsGroup.add(mesh);
      });
    }
  }, [playerCards, enemyCards, bankerCards]);

  // Render 3D Chip Stacks
  useEffect(() => {
    const chipsGroup = chipsGroupRef.current;
    if (!chipsGroup) return;

    while (chipsGroup.children.length > 0) {
      chipsGroup.remove(chipsGroup.children[0]);
    }

    const createChipMesh = (color: number) => {
      const chipGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.09, 24);
      const chipMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.25,
      });
      const chip = new THREE.Mesh(chipGeo, chipMat);
      chip.castShadow = true;
      chip.receiveShadow = true;
      return chip;
    };

    const renderChipStack = (betAmount: number, x: number, z: number) => {
      if (betAmount <= 0) return;
      const stackCount = Math.min(10, Math.max(1, Math.floor(betAmount / 100)));
      for (let i = 0; i < stackCount; i++) {
        const chip = createChipMesh(
          betAmount >= 1000 ? 0xd97706 : betAmount >= 500 ? 0x9333ea : 0x2563eb
        );
        chip.position.set(x, 0.05 + i * 0.1, z);
        chip.rotation.y = (i * Math.PI) / 6;
        chipsGroup.add(chip);
      }
    };

    // Player Bet Chips (bottom center zone)
    renderChipStack(bets.player, 0, 1.95);

    // Banker Bet Chips (left zone)
    renderChipStack(bets.banker, -2.1, 1.3);

    // Tie Bet Chips (right center zone)
    renderChipStack(bets.tie, 2.1, 0.5);

    // Natural 9 Bet Chips (right bottom zone)
    renderChipStack(bets.natural9, 2.1, 1.4);
  }, [bets]);

  // Win celebration effect
  useEffect(() => {
    if (!winner || !particleGroupRef.current) return;

    if (winner === 'player' || winner === 'banker') {
      const pMesh = particleGroupRef.current;
      pMesh.userData.active = true;
      (pMesh.material as THREE.PointsMaterial).opacity = 0.95;

      const timer = setTimeout(() => {
        if (particleGroupRef.current) {
          particleGroupRef.current.userData.active = false;
          (particleGroupRef.current.material as THREE.PointsMaterial).opacity = 0;
        }
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [winner]);

  // Direct table click detection
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onPlaceBetDirect || !containerRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hitPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, hitPoint);

      if (hitPoint) {
        soundEngine.playChipToss();
        if (hitPoint.x < -1.0) {
          onPlaceBetDirect('banker'); // Banker on left side
        } else if (Math.abs(hitPoint.x) <= 1.0 && hitPoint.z > 0.6) {
          onPlaceBetDirect('player'); // Player at bottom
        } else if (hitPoint.x > 1.0 && hitPoint.z > 1.0) {
          onPlaceBetDirect('natural9');
        } else if (hitPoint.x > 1.0) {
          onPlaceBetDirect('tie');
        }
      }
    },
    [onPlaceBetDirect]
  );

  return (
    <div
      ref={containerRef}
      id="three-canvas-container"
      onClick={handleCanvasClick}
      className="relative w-full h-full cursor-pointer select-none overflow-hidden"
    />
  );
};
