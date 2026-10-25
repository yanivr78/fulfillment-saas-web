'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface RackNode {
  id: string;
  tenant: 'Veloce Apparel' | 'Nordic Gear Co.' | 'Apex Robotics';
  sku: string;
  zone: 'HIGH-BAY STORAGE' | 'QUARANTINE STAGING' | 'OUTBOUND PACK';
  gx: number;
  gz: number;
  available: number;
  reserved: number;
  quarantined: number;
  damaged: number;
}

interface LaserBeam {
  id: number;
  targetRackId: string;
  color: string;
  createdAt: number;
}

const INITIAL_RACKS: RackNode[] = [
  { id: 'A-01', tenant: 'Veloce Apparel', sku: 'SKU-CARBON-PACK', zone: 'HIGH-BAY STORAGE', gx: -3.2, gz: -2.2, available: 48, reserved: 8, quarantined: 6, damaged: 2 },
  { id: 'A-02', tenant: 'Veloce Apparel', sku: 'SKU-AERO-SHELL', zone: 'HIGH-BAY STORAGE', gx: -1.1, gz: -2.2, available: 36, reserved: 12, quarantined: 4, damaged: 0 },
  { id: 'A-03', tenant: 'Nordic Gear Co.', sku: 'SKU-GLACIER-TENT', zone: 'HIGH-BAY STORAGE', gx: 1.1, gz: -2.2, available: 54, reserved: 6, quarantined: 8, damaged: 1 },
  { id: 'A-04', tenant: 'Apex Robotics', sku: 'SKU-LIDAR-CORE', zone: 'HIGH-BAY STORAGE', gx: 3.2, gz: -2.2, available: 29, reserved: 14, quarantined: 5, damaged: 1 },

  { id: 'B-01', tenant: 'Nordic Gear Co.', sku: 'SKU-ALPINE-STOVE', zone: 'HIGH-BAY STORAGE', gx: -3.2, gz: 0.0, available: 62, reserved: 10, quarantined: 4, damaged: 0 },
  { id: 'B-02', tenant: 'Veloce Apparel', sku: 'SKU-THERMAL-KNIT', zone: 'HIGH-BAY STORAGE', gx: -1.1, gz: 0.0, available: 44, reserved: 9, quarantined: 12, damaged: 2 },
  { id: 'B-03', tenant: 'Apex Robotics', sku: 'SKU-SERVO-ACTUATOR', zone: 'HIGH-BAY STORAGE', gx: 1.1, gz: 0.0, available: 38, reserved: 16, quarantined: 6, damaged: 1 },
  { id: 'B-04', tenant: 'Nordic Gear Co.', sku: 'SKU-CRAMPON-PRO', zone: 'HIGH-BAY STORAGE', gx: 3.2, gz: 0.0, available: 51, reserved: 4, quarantined: 3, damaged: 0 },

  { id: 'C-01', tenant: 'Veloce Apparel', sku: 'SKU-CARBON-PACK', zone: 'QUARANTINE STAGING', gx: -3.2, gz: 2.2, available: 18, reserved: 4, quarantined: 24, damaged: 2 },
  { id: 'C-02', tenant: 'Apex Robotics', sku: 'SKU-CHASSIS-MK4', zone: 'QUARANTINE STAGING', gx: -1.1, gz: 2.2, available: 22, reserved: 6, quarantined: 19, damaged: 1 },
  { id: 'C-03', tenant: 'Nordic Gear Co.', sku: 'SKU-ARCTIC-PARKA', zone: 'OUTBOUND PACK', gx: 1.1, gz: 2.2, available: 40, reserved: 18, quarantined: 2, damaged: 0 },
  { id: 'C-04', tenant: 'Apex Robotics', sku: 'SKU-BATTERY-CELL', zone: 'OUTBOUND PACK', gx: 3.2, gz: 2.2, available: 33, reserved: 20, quarantined: 4, damaged: 1 },
];

export default function Warehouse3DScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [racks, setRacks] = useState<RackNode[]>(INITIAL_RACKS);
  const [selectedRackId, setSelectedRackId] = useState<string>('A-01');
  const [tenantFilter, setTenantFilter] = useState<string>('ALL');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'orbit' | 'isometric' | 'top' | 'aisle'>('orbit');
  const [eventFeed, setEventFeed] = useState<Array<{ id: string; tag: string; color: string; detail: string }>>([
    {
      id: 'ev-1',
      tag: '3D_TWIN_ONLINE',
      color: '#38bdf8',
      detail: 'Spatial WebGL/Canvas Digital Twin synchronized with 12 high-bay racks & 4 AMRs',
    },
    {
      id: 'ev-2',
      tag: 'INVARIANT_LOCKED',
      color: '#10b981',
      detail: 'Global conservation verified: available = on_hand - reserved - quarantined - damaged',
    },
  ]);

  const cameraRef = useRef({
    yaw: 0.68,
    pitch: 0.56,
    zoom: 1.0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  const beamsRef = useRef<LaserBeam[]>([]);
  const projectedRacksRef = useRef<Array<{ id: string; sx: number; sy: number; radius: number }>>([]);

  const selectedRack = racks.find((r) => r.id === selectedRackId) || racks[0];

  const totals = racks.reduce(
    (acc, r) => {
      if (tenantFilter !== 'ALL' && r.tenant !== tenantFilter) return acc;
      const onHand = r.available + r.reserved + r.quarantined + r.damaged;
      return {
        available: acc.available + r.available,
        reserved: acc.reserved + r.reserved,
        quarantined: acc.quarantined + r.quarantined,
        damaged: acc.damaged + r.damaged,
        onHand: acc.onHand + onHand,
      };
    },
    { available: 0, reserved: 0, quarantined: 0, damaged: 0, onHand: 0 }
  );

  const pushEvent = useCallback((tag: string, color: string, detail: string) => {
    setEventFeed((prev) => [{ id: `${Date.now()}-${Math.random()}`, tag, color, detail }, ...prev.slice(0, 4)]);
  }, []);

  const triggerBeam = useCallback((rackId: string, color: string) => {
    beamsRef.current.push({
      id: Date.now() + Math.random(),
      targetRackId: rackId,
      color,
      createdAt: performance.now(),
    });
  }, []);

  const handleCameraPreset = (preset: 'orbit' | 'isometric' | 'top' | 'aisle') => {
    setCameraPreset(preset);
    if (preset === 'orbit') {
      cameraRef.current.yaw = 0.68;
      cameraRef.current.pitch = 0.56;
      cameraRef.current.zoom = 1.0;
      setAutoRotate(true);
    } else if (preset === 'isometric') {
      cameraRef.current.yaw = Math.PI / 4;
      cameraRef.current.pitch = 0.62;
      cameraRef.current.zoom = 1.05;
      setAutoRotate(false);
    } else if (preset === 'top') {
      cameraRef.current.yaw = 0.0;
      cameraRef.current.pitch = 1.28;
      cameraRef.current.zoom = 0.95;
      setAutoRotate(false);
    } else if (preset === 'aisle') {
      cameraRef.current.yaw = 0.18;
      cameraRef.current.pitch = 0.32;
      cameraRef.current.zoom = 1.28;
      setAutoRotate(false);
    }
  };

  // Interactive 3D simulation actions
  const handleReceiveASN = () => {
    setRacks((prev) =>
      prev.map((r) => {
        if (r.id === selectedRack.id || r.zone === 'QUARANTINE STAGING') {
          return { ...r, quarantined: r.quarantined + 8 };
        }
        return r;
      })
    );
    triggerBeam(selectedRack.id, '#f59e0b');
    triggerBeam('C-01', '#f59e0b');
    pushEvent(
      'ASN_DOCK_RECEIPT_3D',
      '#f59e0b',
      `Inbound ASN docked → +8 Quarantined units staged into ${selectedRack.id} & C-01 (Available unchanged)`
    );
  };

  const handleCompletePutaway = () => {
    setRacks((prev) =>
      prev.map((r) => {
        if (r.quarantined >= 6) {
          return { ...r, quarantined: r.quarantined - 6, available: r.available + 6 };
        }
        return r;
      })
    );
    triggerBeam(selectedRack.id, '#10b981');
    triggerBeam('A-02', '#10b981');
    pushEvent(
      'AMR_PUTAWAY_VERIFIED',
      '#10b981',
      `Autonomous AMRs transferred 6 units per rack from QUARANTINE → STORAGE (Available +6)`
    );
  };

  const handleAllocateWave = () => {
    setRacks((prev) =>
      prev.map((r) => {
        if (r.available >= 5 && (tenantFilter === 'ALL' || r.tenant === tenantFilter)) {
          triggerBeam(r.id, '#38bdf8');
          return { ...r, available: r.available - 5, reserved: r.reserved + 5 };
        }
        return r;
      })
    );
    pushEvent(
      'ATOMIC_WAVE_RESERVED',
      '#38bdf8',
      `100-way row-locked order wave allocated 5 units across active racks with zero oversells`
    );
  };

  const handleDispatchCarrier = () => {
    setRacks((prev) =>
      prev.map((r) => {
        if (r.reserved >= 4) {
          triggerBeam(r.id, '#a855f7');
          return { ...r, reserved: r.reserved - 4 };
        }
        return r;
      })
    );
    pushEvent(
      'CARRIER_FLEET_SHIPPED',
      '#a855f7',
      `Scan-verified cartons dispatched via HMAC carrier webhook (-4 Reserved & On-Hand per rack)`
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    // Draw a 3D extruded box with isometric/perspective projection
    const projectPoint = (
      x: number,
      y: number,
      z: number,
      cx: number,
      cy: number,
      scale: number,
      yaw: number,
      pitch: number
    ) => {
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      const rx = x * cosY - z * sinY;
      const rz = x * sinY + z * cosY;

      const ry = y * cosP - rz * sinP;
      const depth = y * sinP + rz * cosP;

      const fov = 11.5;
      const perspective = fov / Math.max(3.5, fov + depth * 0.45);

      return {
        sx: cx + rx * scale * perspective,
        sy: cy - ry * scale * perspective,
        depth,
        perspective,
      };
    };

    const drawCuboid = (
      cx: number,
      cy: number,
      scale: number,
      yaw: number,
      pitch: number,
      bx: number,
      by: number,
      bz: number,
      w: number,
      h: number,
      d: number,
      colors: { top: string; left: string; right: string; stroke: string }
    ) => {
      const hw = w / 2;
      const hd = d / 2;
      // 8 corners
      const corners = [
        projectPoint(bx - hw, by, bz - hd, cx, cy, scale, yaw, pitch), // 0: bottom-back-left
        projectPoint(bx + hw, by, bz - hd, cx, cy, scale, yaw, pitch), // 1: bottom-back-right
        projectPoint(bx + hw, by, bz + hd, cx, cy, scale, yaw, pitch), // 2: bottom-front-right
        projectPoint(bx - hw, by, bz + hd, cx, cy, scale, yaw, pitch), // 3: bottom-front-left
        projectPoint(bx - hw, by + h, bz - hd, cx, cy, scale, yaw, pitch), // 4: top-back-left
        projectPoint(bx + hw, by + h, bz - hd, cx, cy, scale, yaw, pitch), // 5: top-back-right
        projectPoint(bx + hw, by + h, bz + hd, cx, cy, scale, yaw, pitch), // 6: top-front-right
        projectPoint(bx - hw, by + h, bz + hd, cx, cy, scale, yaw, pitch), // 7: top-front-left
      ];

      const faces = [
        { indices: [0, 1, 5, 4], fill: colors.left },
        { indices: [1, 2, 6, 5], fill: colors.right },
        { indices: [2, 3, 7, 6], fill: colors.left },
        { indices: [3, 0, 4, 7], fill: colors.right },
        { indices: [4, 5, 6, 7], fill: colors.top },
      ];

      // Sort faces back-to-front by average depth
      faces.sort((a, b) => {
        const depthA = a.indices.reduce((sum, idx) => sum + corners[idx].depth, 0) / 4;
        const depthB = b.indices.reduce((sum, idx) => sum + corners[idx].depth, 0) / 4;
        return depthB - depthA;
      });

      for (const face of faces) {
        ctx.beginPath();
        ctx.moveTo(corners[face.indices[0]].sx, corners[face.indices[0]].sy);
        for (let i = 1; i < face.indices.length; i++) {
          ctx.lineTo(corners[face.indices[i]].sx, corners[face.indices[i]].sy);
        }
        ctx.closePath();
        ctx.fillStyle = face.fill;
        ctx.fill();
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (autoRotate && !cameraRef.current.isDragging) {
        cameraRef.current.yaw += dt * 0.22;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const cx = width * 0.5;
      const cy = height * 0.57;
      const baseScale = Math.min(width, height) * 0.095 * cameraRef.current.zoom;
      const { yaw, pitch } = cameraRef.current;

      // Deep space cyber-warehouse background
      const bgGrad = ctx.createRadialGradient(cx, cy * 0.75, 20, cx, cy, Math.max(width, height) * 0.75);
      bgGrad.addColorStop(0, '#0f1b36');
      bgGrad.addColorStop(0.55, '#070d1d');
      bgGrad.addColorStop(1, '#030611');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw 3D Warehouse Floor Grid (-5..5 in X and -4..4 in Z)
      ctx.lineWidth = 1;
      for (let gx = -5; gx <= 5; gx += 1) {
        const p1 = projectPoint(gx, 0, -4, cx, cy, baseScale, yaw, pitch);
        const p2 = projectPoint(gx, 0, 4, cx, cy, baseScale, yaw, pitch);
        ctx.strokeStyle = gx === 0 ? 'rgba(56, 189, 248, 0.32)' : 'rgba(148, 163, 184, 0.11)';
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }
      for (let gz = -4; gz <= 4; gz += 1) {
        const p1 = projectPoint(-5, 0, gz, cx, cy, baseScale, yaw, pitch);
        const p2 = projectPoint(5, 0, gz, cx, cy, baseScale, yaw, pitch);
        ctx.strokeStyle = gz === 0 ? 'rgba(99, 102, 241, 0.32)' : 'rgba(148, 163, 184, 0.11)';
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }

      // Glowing AMR Highway Splines on Floor
      const aisleZs = [-1.1, 1.1];
      for (const az of aisleZs) {
        const pStart = projectPoint(-4.6, 0.02, az, cx, cy, baseScale, yaw, pitch);
        const pEnd = projectPoint(4.6, 0.02, az, cx, cy, baseScale, yaw, pitch);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -(now * 0.03);
        ctx.beginPath();
        ctx.moveTo(pStart.sx, pStart.sy);
        ctx.lineTo(pEnd.sx, pEnd.sy);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Sort racks back-to-front by camera depth
      const sortedRacks = [...racks]
        .map((r) => {
          const center = projectPoint(r.gx, 0.9, r.gz, cx, cy, baseScale, yaw, pitch);
          return { rack: r, center };
        })
        .sort((a, b) => b.center.depth - a.center.depth);

      const clickableProjections: Array<{ id: string; sx: number; sy: number; radius: number }> = [];

      // Draw each 3D Multi-Tier Storage Rack & Autonomous Mobile Robots
      for (const { rack, center } of sortedRacks) {
        const isSelected = rack.id === selectedRackId;
        const isFilteredOut = tenantFilter !== 'ALL' && rack.tenant !== tenantFilter;
        const alpha = isFilteredOut ? 0.18 : 1.0;

        // Base plinth on warehouse floor
        drawCuboid(cx, cy, baseScale, yaw, pitch, rack.gx, 0, rack.gz, 1.35, 0.1, 0.95, {
          top: isSelected ? `rgba(56, 189, 248, ${0.42 * alpha})` : `rgba(30, 41, 59, ${0.85 * alpha})`,
          left: `rgba(15, 23, 42, ${0.9 * alpha})`,
          right: `rgba(15, 23, 42, ${0.9 * alpha})`,
          stroke: isSelected ? `rgba(56, 189, 248, ${0.95 * alpha})` : `rgba(148, 163, 184, ${0.28 * alpha})`,
        });

        // 3 vertical rack levels showing volumetric inventory bins
        const levels = [
          {
            y: 0.14,
            type: 'AVAILABLE',
            fillRatio: Math.min(1, rack.available / 60),
            top: `rgba(16, 185, 129, ${0.78 * alpha})`,
            left: `rgba(5, 150, 105, ${0.72 * alpha})`,
            right: `rgba(4, 120, 87, ${0.75 * alpha})`,
            stroke: `rgba(110, 231, 183, ${0.9 * alpha})`,
          },
          {
            y: 0.68,
            type: 'RESERVED',
            fillRatio: Math.min(1, Math.max(0.25, rack.reserved / 24)),
            top: `rgba(56, 189, 248, ${0.78 * alpha})`,
            left: `rgba(2, 132, 199, ${0.72 * alpha})`,
            right: `rgba(3, 105, 161, ${0.75 * alpha})`,
            stroke: `rgba(125, 211, 252, ${0.9 * alpha})`,
          },
          {
            y: 1.22,
            type: 'QUARANTINED',
            fillRatio: Math.min(1, Math.max(0.2, rack.quarantined / 25)),
            top:
              rack.quarantined > 10
                ? `rgba(245, 158, 11, ${0.84 * alpha})`
                : `rgba(99, 102, 241, ${0.68 * alpha})`,
            left:
              rack.quarantined > 10
                ? `rgba(217, 119, 6, ${0.76 * alpha})`
                : `rgba(79, 70, 229, ${0.64 * alpha})`,
            right:
              rack.quarantined > 10
                ? `rgba(180, 83, 9, ${0.78 * alpha})`
                : `rgba(67, 56, 202, ${0.68 * alpha})`,
            stroke:
              rack.quarantined > 10
                ? `rgba(252, 211, 77, ${0.92 * alpha})`
                : `rgba(165, 180, 252, ${0.85 * alpha})`,
          },
        ];

        for (const lvl of levels) {
          const boxWidth = 1.15 * (0.45 + 0.55 * lvl.fillRatio);
          drawCuboid(cx, cy, baseScale, yaw, pitch, rack.gx, lvl.y, rack.gz, boxWidth, 0.44, 0.76, {
            top: lvl.top,
            left: lvl.left,
            right: lvl.right,
            stroke: isSelected ? '#ffffff' : lvl.stroke,
          });
        }

        // Floating 3D Rack Label Pill above the top tier
        const topLabelPt = projectPoint(rack.gx, 2.02, rack.gz, cx, cy, baseScale, yaw, pitch);
        clickableProjections.push({
          id: rack.id,
          sx: center.sx,
          sy: center.sy,
          radius: 34 * center.perspective,
        });

        if (!isFilteredOut) {
          ctx.save();
          ctx.font = `700 ${Math.round(11 * center.perspective)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
          const labelText = `${rack.id} • ${rack.available}u`;
          const textWidth = ctx.measureText(labelText).width;
          const padX = 7;
          const pillW = textWidth + padX * 2;
          const pillH = 20;

          ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.95)' : 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = isSelected ? 1.5 : 1;
          ctx.beginPath();
          ctx.roundRect(topLabelPt.sx - pillW / 2, topLabelPt.sy - pillH / 2, pillW, pillH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isSelected ? '#020617' : '#f8fafc';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, topLabelPt.sx, topLabelPt.sy);
          ctx.restore();
        }
      }

      projectedRacksRef.current = clickableProjections;

      // Draw 4 Autonomous Mobile Robots (AMRs) moving along the 3D warehouse aisles
      const amrs = [
        { id: 'AMR-01', z: -1.1, speed: 0.85, phase: 0.0, color: '#38bdf8' },
        { id: 'AMR-02', z: -1.1, speed: -0.7, phase: 2.2, color: '#10b981' },
        { id: 'AMR-03', z: 1.1, speed: 0.75, phase: 1.4, color: '#f59e0b' },
        { id: 'AMR-04', z: 1.1, speed: -0.9, phase: 3.7, color: '#818cf8' },
      ];

      for (const bot of amrs) {
        const bx = Math.sin(now * 0.0007 * bot.speed + bot.phase) * 3.8;
        drawCuboid(cx, cy, baseScale, yaw, pitch, bx, 0.04, bot.z, 0.52, 0.24, 0.42, {
          top: bot.color,
          left: 'rgba(15, 23, 42, 0.95)',
          right: 'rgba(30, 41, 59, 0.95)',
          stroke: '#ffffff',
        });
      }

      // Draw Orbital 3D Control Tower Core suspended at (0, 3.3, 0)
      const corePt = projectPoint(0, 3.25, 0, cx, cy, baseScale, yaw, pitch);
      const pulse = 1 + Math.sin(now * 0.004) * 0.12;

      // Laser telemetry beams from Orbital Core to active racks
      beamsRef.current = beamsRef.current.filter((b) => now - b.createdAt < 1400);
      for (const beam of beamsRef.current) {
        const targetRack = racks.find((r) => r.id === beam.targetRackId);
        if (targetRack) {
          const targetPt = projectPoint(targetRack.gx, 1.5, targetRack.gz, cx, cy, baseScale, yaw, pitch);
          const progress = 1 - (now - beam.createdAt) / 1400;
          ctx.save();
          ctx.strokeStyle = beam.color;
          ctx.globalAlpha = progress;
          ctx.lineWidth = 3 * progress;
          ctx.beginPath();
          ctx.moveTo(corePt.sx, corePt.sy);
          ctx.lineTo(targetPt.sx, targetPt.sy);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Always draw subtle tether from Orbital Core to currently selected rack
      if (selectedRack) {
        const selPt = projectPoint(selectedRack.gx, 1.66, selectedRack.gz, cx, cy, baseScale, yaw, pitch);
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(corePt.sx, corePt.sy);
        ctx.lineTo(selPt.sx, selPt.sy);
        ctx.stroke();
        ctx.restore();
      }

      // Orbital Core Holo-Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(corePt.sx, corePt.sy, 18 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.fill();
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(corePt.sx, corePt.sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.restore();

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [racks, selectedRackId, selectedRack, tenantFilter, autoRotate]);

  // Pointer drag / click handlers for 3D canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    cameraRef.current.isDragging = true;
    cameraRef.current.lastX = e.clientX;
    cameraRef.current.lastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!cameraRef.current.isDragging) return;
    const dx = e.clientX - cameraRef.current.lastX;
    const dy = e.clientY - cameraRef.current.lastY;
    cameraRef.current.lastX = e.clientX;
    cameraRef.current.lastY = e.clientY;

    cameraRef.current.yaw += dx * 0.008;
    cameraRef.current.pitch = Math.max(0.2, Math.min(1.35, cameraRef.current.pitch + dy * 0.006));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const moveDist = Math.hypot(e.clientX - cameraRef.current.lastX, e.clientY - cameraRef.current.lastY);
    cameraRef.current.isDragging = false;

    // Check if user clicked a 3D rack node
    if (moveDist < 6 && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      for (const proj of projectedRacksRef.current) {
        if (Math.hypot(clickX - proj.sx, clickY - proj.sy) <= proj.radius) {
          setSelectedRackId(proj.id);
          triggerBeam(proj.id, '#38bdf8');
          break;
        }
      }
    }
  };

  const selectedOnHand =
    selectedRack.available + selectedRack.reserved + selectedRack.quarantined + selectedRack.damaged;

  return (
    <div className="spatial-shell">
      {/* Top 3D Viewport Control Bar */}
      <div className="spatial-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className="holo-badge">3D DIGITAL TWIN ENGINE • 60 FPS</span>
          <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
            Drag to orbit 3D warehouse • Click any rack to inspect volumetric bin ledger
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {(['orbit', 'isometric', 'top', 'aisle'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleCameraPreset(preset)}
              className={`btn btn-sm ${cameraPreset === preset ? 'btn-primary' : 'btn-secondary'}`}
            >
              {preset === 'orbit' && '🌐 Orbit 3D'}
              {preset === 'isometric' && '📐 Isometric'}
              {preset === 'top' && '🛰️ Top Radar'}
              {preset === 'aisle' && '🤖 Aisle Cam'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            className="btn btn-sm btn-secondary"
          >
            {autoRotate ? '⏸ Pause Orbit' : '▶ Auto-Orbit'}
          </button>
        </div>
      </div>

      {/* Main 3D Viewport + Spatial Telemetry Inspector Grid */}
      <div className="spatial-main-grid">
        {/* Left: Interactive 3D Canvas Viewport */}
        <div className="canvas-stage-wrapper">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              width: '100%',
              height: '500px',
              display: 'block',
              cursor: 'grab',
              touchAction: 'none',
            }}
          />

          {/* Floating HUD Legend inside 3D Viewport */}
          <div className="hud-overlay-top">
            <div className="hud-chip">
              <span className="hud-dot" style={{ background: '#10b981' }} />
              Tier 1: Available ({totals.available})
            </div>
            <div className="hud-chip">
              <span className="hud-dot" style={{ background: '#38bdf8' }} />
              Tier 2: Reserved ({totals.reserved})
            </div>
            <div className="hud-chip">
              <span className="hud-dot" style={{ background: '#f59e0b' }} />
              Tier 3: Quarantined ({totals.quarantined})
            </div>
          </div>

          {/* Floating Bottom Action Controls inside 3D Viewport */}
          <div className="hud-overlay-bottom">
            <button type="button" onClick={handleReceiveASN} className="btn btn-sm btn-secondary">
              + Dock ASN Receipt (+8 Quarantined)
            </button>
            <button type="button" onClick={handleCompletePutaway} className="btn btn-sm btn-secondary">
              ✓ AMR Putaway (+6 Available)
            </button>
            <button type="button" onClick={handleAllocateWave} className="btn btn-sm btn-primary">
              ⚡ Atomic 100-Way Order Wave
            </button>
            <button type="button" onClick={handleDispatchCarrier} className="btn btn-sm btn-secondary">
              🚚 Dispatch Carrier Fleet
            </button>
          </div>
        </div>

        {/* Right: Spatial Rack & RLS Telemetry Sidebar */}
        <div className="spatial-sidebar">
          {/* Multi-Tenant PostgreSQL RLS 3D Filter */}
          <div className="panel" style={{ marginBottom: '1rem' }}>
            <div className="panel-title">
              <span>PostgreSQL RLS 3D Tenant Lens</span>
              <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'monospace' }}>app.tenant_id</span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['ALL', 'Veloce Apparel', 'Nordic Gear Co.', 'Apex Robotics'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTenantFilter(t)}
                  className={`btn btn-sm ${tenantFilter === t ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  {t === 'ALL' ? 'All Tenants (Admin)' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Selected 3D Rack Volumetric Telemetry */}
          <div className="panel" style={{ marginBottom: '1rem' }}>
            <div className="panel-title">
              <span>Selected 3D Rack: {selectedRack.id}</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.18rem 0.55rem',
                  borderRadius: '999px',
                  background: 'rgba(56, 189, 248, 0.16)',
                  color: '#38bdf8',
                }}
              >
                {selectedRack.zone}
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              Tenant Owner: <strong style={{ color: '#f8fafc' }}>{selectedRack.tenant}</strong> • SKU:{' '}
              <code style={{ color: '#38bdf8' }}>{selectedRack.sku}</code>
            </div>

            <div className="invariant-box" style={{ fontSize: '0.78rem', padding: '0.65rem 0.8rem' }}>
              avail ({selectedRack.available}) = on_hand ({selectedOnHand}) - res ({selectedRack.reserved}) - quar (
              {selectedRack.quarantined}) - dmg ({selectedRack.damaged})
            </div>

            <div className="counter-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="counter-cell" style={{ borderColor: 'rgba(16, 185, 129, 0.45)' }}>
                <div className="counter-num" style={{ color: '#34d399' }}>
                  {selectedRack.available}
                </div>
                <div className="counter-tag">Avail</div>
              </div>
              <div className="counter-cell">
                <div className="counter-num" style={{ color: '#38bdf8' }}>
                  {selectedRack.reserved}
                </div>
                <div className="counter-tag">Resv</div>
              </div>
              <div className="counter-cell">
                <div className="counter-num" style={{ color: '#f59e0b' }}>
                  {selectedRack.quarantined}
                </div>
                <div className="counter-tag">Quar</div>
              </div>
              <div className="counter-cell">
                <div className="counter-num" style={{ color: '#f43f5e' }}>
                  {selectedRack.damaged}
                </div>
                <div className="counter-tag">Dmg</div>
              </div>
            </div>

            {/* Quick Rack Selector Matrix */}
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>
              QUICK-JUMP 3D RACK COORDINATES:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
              {racks.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedRackId(r.id);
                    triggerBeam(r.id, '#38bdf8');
                  }}
                  style={{
                    padding: '0.35rem',
                    borderRadius: '0.4rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: r.id === selectedRackId ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 6, 23, 0.65)',
                    border:
                      r.id === selectedRackId
                        ? '1px solid #38bdf8'
                        : '1px solid rgba(148, 163, 184, 0.16)',
                    color: r.id === selectedRackId ? '#f8fafc' : '#94a3b8',
                  }}
                >
                  {r.id}
                </button>
              ))}
            </div>
          </div>

          {/* Live 3D Telemetry Stream */}
          <div className="panel">
            <div className="panel-title">
              <span>Spatial Telemetry & Ledger Stream</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {eventFeed.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    fontSize: '0.76rem',
                    padding: '0.48rem 0.65rem',
                    borderRadius: '0.45rem',
                    background: 'rgba(2, 6, 23, 0.72)',
                    borderLeft: `3px solid ${ev.color}`,
                  }}
                >
                  <div style={{ fontWeight: 700, color: ev.color, fontFamily: 'monospace' }}>{ev.tag}</div>
                  <div style={{ color: '#cbd5e1', marginTop: '0.12rem' }}>{ev.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
