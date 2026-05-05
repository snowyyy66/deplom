import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Bike, Trophy, RotateCcw } from 'lucide-react';

const W = 360, H = 540;
const ROAD_L = 72, ROAD_R = 288, ROAD_W = ROAD_R - ROAD_L;
const LANE_CENTERS = [ROAD_L + ROAD_W / 6, ROAD_L + ROAD_W / 2, ROAD_L + (5 * ROAD_W) / 6];
const PLAYER_Y = H - 100, PLAYER_W = 30, PLAYER_H = 52;
const PROMO_DIST = 2500;
const WIN_DIST  = 5000;
const MIN_SCORE_SERVER = 2500;
const ENDING_DUR = 5000;

// ─── helpers ────────────────────────────────────────────────────────────────
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}
function shadeColor(hex, p) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + p));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + p));
  const b = Math.min(255, Math.max(0, (n & 0xff) + p));
  return `rgb(${r},${g},${b})`;
}
const easeOut  = x => 1 - Math.pow(1 - x, 3);
const easeInOut = x => x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const phaseOf = (t, start, end) => clamp((t - start) / (end - start), 0, 1);

// ─── draw: дорога ─────────────────────────────────────────────────────────
function drawRoad(c, roadOffset) {
  // Трава
  c.fillStyle = '#1e3a1e'; c.fillRect(0, 0, ROAD_L, H); c.fillRect(ROAD_R, 0, W - ROAD_R, H);
  c.strokeStyle = 'rgba(40,80,40,0.5)'; c.lineWidth = 2;
  for (let x = 4; x < ROAD_L; x += 8) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); }
  for (let x = ROAD_R+4; x < W; x += 8) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); }
  // Асфальт
  const road = c.createLinearGradient(ROAD_L, 0, ROAD_R, 0);
  road.addColorStop(0, '#2c2c2c'); road.addColorStop(0.5, '#363636'); road.addColorStop(1, '#2c2c2c');
  c.fillStyle = road; c.fillRect(ROAD_L, 0, ROAD_W, H);
  // Жёлтые края
  c.strokeStyle = '#f59e0b'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(ROAD_L, 0); c.lineTo(ROAD_L, H); c.stroke();
  c.beginPath(); c.moveTo(ROAD_R, 0); c.lineTo(ROAD_R, H); c.stroke();
  // Разметка
  const dashH = 36, dashGap = 24, cycle = dashH + dashGap;
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2;
  c.setLineDash([dashH, dashGap]);
  const off = (roadOffset % cycle);
  [ROAD_L + ROAD_W/3, ROAD_L + 2*ROAD_W/3].forEach(lx => {
    c.beginPath(); c.moveTo(lx, -cycle + off); c.lineTo(lx, H + cycle); c.stroke();
  });
  c.setLineDash([]);
}

// ─── draw: деревья ───────────────────────────────────────────────────────
function drawTree(c, x, y, r) {
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath(); c.ellipse(x+3, y+r*0.2, r*0.6, r*0.15, 0, 0, Math.PI*2); c.fill();
  c.fillStyle = '#5c3a1e'; c.fillRect(x-3, y-r*0.3, 6, r*0.5);
  c.fillStyle = '#1a4d1a'; c.beginPath(); c.arc(x, y-r*0.1, r, 0, Math.PI*2); c.fill();
  c.fillStyle = '#256325'; c.beginPath(); c.arc(x-r*0.2, y-r*0.2, r*0.75, 0, Math.PI*2); c.fill();
  c.fillStyle = '#2d7a2d'; c.beginPath(); c.arc(x+r*0.15, y-r*0.3, r*0.6, 0, Math.PI*2); c.fill();
  c.fillStyle = 'rgba(100,200,100,0.18)'; c.beginPath(); c.arc(x-r*0.2, y-r*0.4, r*0.35, 0, Math.PI*2); c.fill();
}

// ─── draw: яма ───────────────────────────────────────────────────────────
function drawPit(c, pit) {
  c.fillStyle = 'rgba(0,0,0,0.45)';
  c.beginPath(); c.ellipse(pit.x+3, pit.y+4, pit.rx+2, pit.ry+2, 0, 0, Math.PI*2); c.fill();
  const g = c.createRadialGradient(pit.x-pit.rx*0.3, pit.y-pit.ry*0.3, 2, pit.x, pit.y, pit.rx);
  g.addColorStop(0, '#111'); g.addColorStop(0.6, '#1a1a1a'); g.addColorStop(1, '#2a2a2a');
  c.fillStyle = g; c.beginPath(); c.ellipse(pit.x, pit.y, pit.rx, pit.ry, 0, 0, Math.PI*2); c.fill();
  c.strokeStyle = '#404040'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(pit.x, pit.y, pit.rx, pit.ry, 0, 0, Math.PI*2); c.stroke();
}

// ─── draw: машина ────────────────────────────────────────────────────────
function drawCar(c, car) {
  const { x, y, w, h, color, color2, flash } = car;
  const left = x - w/2, top = y - h/2;
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.beginPath(); c.ellipse(x+4, y+h/2, w*0.45, 8, 0, 0, Math.PI*2); c.fill();
  const bg = c.createLinearGradient(left, 0, left+w, 0);
  bg.addColorStop(0, shadeColor(color,-20)); bg.addColorStop(0.4, color); bg.addColorStop(1, shadeColor(color,-30));
  c.fillStyle = bg; roundRect(c, left, top+h*0.1, w, h*0.8, 6); c.fill();
  c.fillStyle = color2; roundRect(c, left+w*0.12, top+h*0.22, w*0.76, h*0.38, 5); c.fill();
  c.fillStyle = 'rgba(150,210,255,0.7)'; roundRect(c, left+w*0.15, top+h*0.52, w*0.7, h*0.12, 3); c.fill();
  c.fillStyle = 'rgba(150,210,255,0.5)'; roundRect(c, left+w*0.15, top+h*0.25, w*0.7, h*0.1, 3); c.fill();
  c.fillStyle = '#111';
  [[left-2,top+h*0.18],[left+w-6,top+h*0.18],[left-2,top+h*0.68],[left+w-6,top+h*0.68]].forEach(([wx,wy]) => {
    c.fillRect(wx, wy, 8, 14); c.fillStyle = '#333'; c.fillRect(wx+1, wy+2, 6, 10); c.fillStyle = '#111';
  });
  c.fillStyle = flash ? 'rgba(255,255,180,0.95)' : 'rgba(255,240,150,0.7)';
  c.beginPath(); c.ellipse(left+w*0.22, top+h*0.88, 5, 4, 0, 0, Math.PI*2); c.fill();
  c.beginPath(); c.ellipse(left+w*0.78, top+h*0.88, 5, 4, 0, 0, Math.PI*2); c.fill();
}

// ─── draw: скутер (вид сверху) ───────────────────────────────────────────
function drawScooter(c, x, y, lean, crashAngle) {
  lean = lean || 0;
  c.save();
  c.translate(x, y);
  c.rotate((lean * 0.12) + (crashAngle || 0));

  // Тень
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.beginPath(); c.ellipse(2, 4, 18, 26, 0, 0, Math.PI*2); c.fill();

  // Заднее колесо (снизу = задняя часть скутера)
  c.fillStyle = '#1a1a1a';
  roundRect(c, -10, 18, 20, 10, 3); c.fill();
  c.fillStyle = '#333';
  roundRect(c, -8, 19, 16, 8, 2); c.fill();
  c.strokeStyle = '#555'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, 19); c.lineTo(0, 27); c.stroke();

  // Доставочная сумка (сзади)
  const sb = c.createLinearGradient(-14, 8, 14, 8);
  sb.addColorStop(0, '#0d1117'); sb.addColorStop(0.5, '#1a2033'); sb.addColorStop(1, '#0d1117');
  c.fillStyle = sb;
  roundRect(c, -14, 8, 28, 16, 5); c.fill();
  c.strokeStyle = '#f59e0b'; c.lineWidth = 1;
  c.strokeRect(-14, 8, 28, 16);
  c.fillStyle = '#f59e0b'; c.font = 'bold 6px sans-serif'; c.textAlign = 'center';
  c.fillText('LOOK', 0, 20);

  // Корпус скутера — вытянутый кузов
  const body = c.createLinearGradient(-12, -20, 12, -20);
  body.addColorStop(0, '#b03010'); body.addColorStop(0.5, '#e8541a'); body.addColorStop(1, '#b03010');
  c.fillStyle = body;
  roundRect(c, -12, -22, 24, 34, 8); c.fill();
  // Блик на кузове
  c.fillStyle = 'rgba(255,200,150,0.15)';
  roundRect(c, -7, -20, 10, 20, 4); c.fill();

  // Водитель — вид сверху (голова + плечи)
  // Плечи
  c.fillStyle = '#1e3a5f';
  c.beginPath(); c.ellipse(0, -4, 11, 8, 0, 0, Math.PI*2); c.fill();
  // Голова (шлем сверху)
  const helm = c.createRadialGradient(-2, -12, 1, 0, -12, 9);
  helm.addColorStop(0, '#f06020'); helm.addColorStop(0.6, '#e8541a'); helm.addColorStop(1, '#c04010');
  c.fillStyle = helm;
  c.beginPath(); c.ellipse(0, -12, 9, 9, 0, 0, Math.PI*2); c.fill();
  // Визор шлема
  c.fillStyle = 'rgba(150,210,255,0.6)';
  c.beginPath(); c.ellipse(0, -10, 6, 3, 0, 0, Math.PI*2); c.fill();
  // Руки на руле
  c.fillStyle = '#1e3a5f';
  c.beginPath(); c.ellipse(-10, -18, 4, 3, -0.4, 0, Math.PI*2); c.fill();
  c.beginPath(); c.ellipse(10, -18, 4, 3, 0.4, 0, Math.PI*2); c.fill();

  // Руль
  c.strokeStyle = '#555'; c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-12, -20); c.lineTo(12, -20); c.stroke();
  c.beginPath(); c.moveTo(0, -20); c.lineTo(0, -16); c.stroke();

  // Переднее колесо
  c.fillStyle = '#1a1a1a';
  roundRect(c, -9, -30, 18, 9, 3); c.fill();
  c.fillStyle = '#333';
  roundRect(c, -7, -29, 14, 7, 2); c.fill();
  c.strokeStyle = '#555'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, -30); c.lineTo(0, -22); c.stroke();

  c.restore();
}

// ─── draw: дом ───────────────────────────────────────────────────────────
function drawHouse(c, x, y, w, h, roofCol, wallCol, doorCol) {
  // тень
  c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(x+5, y+h*0.35+5, w, h*0.65);
  // стена
  const wg = c.createLinearGradient(x, 0, x+w, 0);
  wg.addColorStop(0, shadeColor(wallCol,-15)); wg.addColorStop(0.6, wallCol); wg.addColorStop(1, shadeColor(wallCol,-25));
  c.fillStyle = wg; c.fillRect(x, y+h*0.35, w, h*0.65);
  // крыша
  c.fillStyle = roofCol;
  c.beginPath(); c.moveTo(x-4, y+h*0.37); c.lineTo(x+w/2, y); c.lineTo(x+w+4, y+h*0.37); c.closePath(); c.fill();
  c.fillStyle = shadeColor(roofCol,-25);
  c.beginPath(); c.moveTo(x+w*0.2, y+h*0.19); c.lineTo(x+w/2, y+2); c.lineTo(x+w*0.8, y+h*0.19); c.closePath(); c.fill();
  // окна
  [[x+w*0.08, y+h*0.45],[x+w*0.62, y+h*0.45]].forEach(([wx,wy]) => {
    c.fillStyle = 'rgba(200,230,255,0.88)'; c.fillRect(wx, wy, w*0.28, h*0.19);
    c.strokeStyle = '#999'; c.lineWidth = 1; c.strokeRect(wx, wy, w*0.28, h*0.19);
    c.beginPath(); c.moveTo(wx+w*0.14, wy); c.lineTo(wx+w*0.14, wy+h*0.19); c.stroke();
    c.fillStyle = 'rgba(255,200,90,0.28)'; c.fillRect(wx+1, wy+1, w*0.13-1, h*0.18-1);
  });
  // дверь
  c.fillStyle = doorCol; roundRect(c, x+w*0.36, y+h*0.65, w*0.28, h*0.35, 3); c.fill();
  c.strokeStyle = shadeColor(doorCol,-20); c.lineWidth = 1; c.strokeRect(x+w*0.36, y+h*0.65, w*0.28, h*0.35);
  c.fillStyle = '#f59e0b'; c.beginPath(); c.arc(x+w*0.36+w*0.22, y+h*0.65+h*0.18, 2.5, 0, Math.PI*2); c.fill();
}

// ─── draw: клиент ────────────────────────────────────────────────────────
function drawPerson(c, x, y, armRaised) {
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(x+2, y+3, 10, 4, 0, 0, Math.PI*2); c.fill();
  // ноги
  c.strokeStyle = '#1a1a2e'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x-3, y); c.lineTo(x-5, y+15); c.stroke();
  c.beginPath(); c.moveTo(x+3, y); c.lineTo(x+5, y+15); c.stroke();
  // тело
  c.fillStyle = '#3498db'; roundRect(c, x-8, y-21, 16, 22, 4); c.fill();
  // руки
  c.strokeStyle = '#3498db'; c.lineWidth = 4;
  if (armRaised) {
    c.beginPath(); c.moveTo(x+7, y-16); c.lineTo(x+18, y-27); c.stroke();
    c.beginPath(); c.moveTo(x-7, y-16); c.lineTo(x-15, y-8); c.stroke();
  } else {
    c.beginPath(); c.moveTo(x+7, y-16); c.lineTo(x+15, y-8); c.stroke();
    c.beginPath(); c.moveTo(x-7, y-16); c.lineTo(x-15, y-8); c.stroke();
  }
  // голова
  c.fillStyle = '#f4c5a0'; c.beginPath(); c.arc(x, y-28, 9, 0, Math.PI*2); c.fill();
  // волосы
  c.fillStyle = '#3d2b1f'; c.beginPath(); c.arc(x, y-31, 9, Math.PI, 0); c.fill();
  // улыбка
  if (armRaised) {
    c.strokeStyle = '#555'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(x, y-27, 4, 0.2, Math.PI-0.2); c.stroke();
  }
}

// ─── draw: концовка ──────────────────────────────────────────────────────
function drawEnding(c, endingT, trees) {
  const t = clamp(endingT / ENDING_DUR, 0, 1);

  // Фон — дорога замедляется и останавливается
  const slowOffset = endingT * 0.5 * Math.max(0, 1 - t * 3);
  drawRoad(c, slowOffset);
  for (const tr of trees) drawTree(c, tr.x, tr.y, tr.r);

  // ── Дома появляются сверху ──
  const houseT = easeOut(phaseOf(t, 0, 0.28));
  const houseSlide = -160 * (1 - houseT);

  // Левый дом (побольше)
  drawHouse(c, 3, houseSlide + 30, 62, 100, '#7a3030', '#d4a090', '#5c3a1e');
  // Правый дом
  drawHouse(c, ROAD_R + 3, houseSlide + 55, 55, 82, '#2d5080', '#a8c4d8', '#3a2718');
  // Забор между домами и дорогой
  if (houseT > 0.5) {
    const fa = clamp((houseT - 0.5) * 2, 0, 1);
    c.globalAlpha = fa;
    c.strokeStyle = '#9b8060'; c.lineWidth = 2;
    const fy0 = houseSlide + 105, fy1 = houseSlide + 170;
    for (let fy = fy0; fy < fy1; fy += 18) {
      c.beginPath(); c.moveTo(3, fy); c.lineTo(ROAD_L - 2, fy); c.stroke();
      c.beginPath(); c.moveTo(ROAD_R + 2, fy); c.lineTo(W - 3, fy); c.stroke();
    }
    // Вертикальные столбики
    for (let fx = 10; fx < ROAD_L; fx += 14) {
      c.beginPath(); c.moveTo(fx, fy0); c.lineTo(fx, fy1); c.stroke();
    }
    for (let fx = ROAD_R + 8; fx < W - 4; fx += 14) {
      c.beginPath(); c.moveTo(fx, fy0); c.lineTo(fx, fy1); c.stroke();
    }
    c.globalAlpha = 1;
  }

  // ── Клиент появляется ──
  const clientT  = easeOut(phaseOf(t, 0.18, 0.42));
  const clientX  = LANE_CENTERS[2] + 10;
  const clientBaseY = houseSlide + 185;
  const clientY  = clientBaseY - (1 - clientT) * 35;
  const armRaised = t > 0.55;

  if (clientT > 0) {
    c.globalAlpha = clientT;
    drawPerson(c, clientX, clientY, armRaised);
    c.globalAlpha = 1;
  }

  // Пузырь с текстом
  if (t > 0.57) {
    const ba = clamp((t - 0.57) / 0.08, 0, 1);
    c.globalAlpha = ba;
    c.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(c, clientX - 36, clientY - 70, 72, 26, 7); c.fill();
    c.beginPath(); c.moveTo(clientX-6, clientY-44); c.lineTo(clientX, clientY-36); c.lineTo(clientX+6, clientY-44); c.closePath(); c.fill();
    c.fillStyle = '#222'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center';
    c.fillText('Спасибо! 🙏', clientX, clientY - 57);
    c.globalAlpha = 1;
  }

  // ── Скутер едет к клиенту ──
  const rideT    = easeInOut(phaseOf(t, 0.22, 0.60));
  const courierTargetY = clientY + 36;
  const courierTargetX = LANE_CENTERS[1] + (clientX - 20 - LANE_CENTERS[1]) * Math.min(1, rideT * 1.4);
  const courierY = PLAYER_Y - (PLAYER_Y - courierTargetY) * rideT;
  drawScooter(c, courierTargetX, courierY, 0);

  // ── Передача посылки ──
  if (t > 0.59) {
    const packT  = easeOut(phaseOf(t, 0.59, 0.82));
    const packX  = courierTargetX + (clientX - courierTargetX + 5) * packT;
    const arcDip = Math.sin(packT * Math.PI) * -38;
    const packY  = courierY - 22 + (clientY - 18 - (courierY - 22)) * packT + arcDip;
    c.fillStyle = '#16213e'; roundRect(c, packX - 11, packY - 11, 22, 17, 3); c.fill();
    c.fillStyle = '#f59e0b';
    c.font = 'bold 6px sans-serif'; c.textAlign = 'center';
    c.fillText('LOOK', packX, packY + 2);
    c.strokeStyle = '#f59e0b'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(packX-11, packY-3); c.lineTo(packX+11, packY-3); c.stroke();
    c.beginPath(); c.moveTo(packX, packY-11); c.lineTo(packX, packY+6); c.stroke();
  }

  // ── Конфетти ──
  if (t > 0.80) {
    const ct = (t - 0.80) / 0.20;
    const cols = ['#f59e0b','#3b82f6','#ef4444','#10b981','#8b5cf6','#f472b6'];
    for (let i = 0; i < 28; i++) {
      const cx = ((Math.sin(i * 2.39 + ct * 7) + 1) / 2) * W;
      const cy = (ct * 1.6 - (i % 6) * 0.13 + Math.cos(i * 1.7) * 0.08) * H;
      if (cy < -10 || cy > H + 10) continue;
      c.save(); c.translate(cx, cy); c.rotate(ct * (i % 4 + 1) * 3.5);
      c.fillStyle = cols[i % cols.length]; c.fillRect(-4, -3, 8, 6); c.restore();
    }
  }

  // ── Финальный текст ──
  if (t > 0.88) {
    const ta = clamp((t - 0.88) / 0.08, 0, 1);
    c.globalAlpha = ta;
    c.fillStyle = 'rgba(0,0,0,0.55)'; roundRect(c, W/2-100, H/2+40, 200, 56, 14); c.fill();
    c.fillStyle = '#f59e0b'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center';
    c.fillText('🎉 Заказ доставлен!', W/2, H/2+67);
    c.fillStyle = '#aaa'; c.font = '11px sans-serif';
    c.fillText('Промокод LOOKRUN ждёт тебя', W/2, H/2+84);
    c.globalAlpha = 1;
  }
}

// ─── draw: основная сцена ────────────────────────────────────────────────
function drawScene(c, g, phase) {
  c.clearRect(0, 0, W, H);
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1a2e1a'); sky.addColorStop(1, '#0d1a0d');
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  drawRoad(c, g.roadOffset);
  for (const t of g.trees) drawTree(c, t.x, t.y, t.r);
  for (const p of g.pits) drawPit(c, p);
  for (const car of g.cars) drawCar(c, car);
  if (phase !== 'ready') drawScooter(c, g.playerX, PLAYER_Y, g.lean, g.crashAngle || 0);
  if (phase === 'ready') drawScooter(c, LANE_CENTERS[1], PLAYER_Y, 0, 0);
}

// ─── game state factory ──────────────────────────────────────────────────
const CAR_COLORS = [
  {color:'#c0392b',color2:'#922b21'},{color:'#2980b9',color2:'#1a5276'},
  {color:'#27ae60',color2:'#1e8449'},{color:'#8e44ad',color2:'#6c3483'},
  {color:'#d4ac0d',color2:'#9a7d0a'},{color:'#e67e22',color2:'#b9770e'},
  {color:'#bdc3c7',color2:'#95a5a6'},
];

function spawnTrees() {
  const t = [];
  for (let y = 0; y < H + 100; y += 80) {
    t.push({side:'left',  x:20+Math.random()*32, y:y+Math.random()*40, r:14+Math.random()*10});
    t.push({side:'right', x:ROAD_R+14+Math.random()*32, y:y+Math.random()*40, r:14+Math.random()*10});
  }
  return t;
}

function makeState() {
  return {
    playerX: LANE_CENTERS[1], targetX: LANE_CENTERS[1], currentLane: 1,
    lean: 0, health: 100, distance: 0, speed: 2.2, roadOffset: 0,
    cars: [], pits: [], trees: spawnTrees(),
    spawnCarTimer: 120, spawnPitTimer: 200,
    hitCooldown: 0, flashTimer: 0, endingT: 0,
    crashAngle: 0, crashTimer: 0, dying: false,
  };
}

// ─── component ───────────────────────────────────────────────────────────
export function RestaurantRunnerGame({ open, onOpenChange, userEmail, onRewardUnlocked }) {
  const canvasRef  = useRef(null);
  const rafRef     = useRef(0);
  const phaseRef   = useRef('ready');
  const gameRef    = useRef(makeState());
  const promoRef   = useRef(false);

  const [phase, setPhase]                 = useState('ready');
  const [distance, setDistance]           = useState(0);
  const [health, setHealth]               = useState(100);
  const [best, setBest]                   = useState(0);
  const [claiming, setClaiming]           = useState(false);
  const [claimError, setClaimError]       = useState(null);
  const [showPromoBanner, setShowPromoBanner] = useState(false);

  const syncPhase = p => { phaseRef.current = p; setPhase(p); };

  // ── рендер кадра ──────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const c = canvasRef.current?.getContext('2d');
    if (!c) return;
    const g = gameRef.current;
    const ph = phaseRef.current;

    if (ph === 'ending') {
      c.clearRect(0, 0, W, H);
      const sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#1a2e1a'); sky.addColorStop(1, '#0d1a0d');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      drawEnding(c, g.endingT, g.trees);
    } else {
      drawScene(c, g, ph);
    }

    // HUD
    if (ph !== 'ending') {
      c.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(c, 8, 8, 90, 38, 8); c.fill();
      c.fillStyle = '#f59e0b'; c.font = 'bold 11px monospace'; c.textAlign = 'left';
      c.fillText(`${Math.floor(g.speed * 18)} км/ч`, 16, 22);
      c.fillStyle = '#fff'; c.font = 'bold 13px monospace';
      c.fillText(`${Math.floor(g.distance)} / ${WIN_DIST} м`, 16, 38);
      if (best > 0) {
        c.fillStyle = 'rgba(0,0,0,0.4)'; roundRect(c, 8, 52, 90, 18, 5); c.fill();
        c.fillStyle = '#666'; c.font = '9px monospace'; c.fillText(`Рекорд: ${best} м`, 14, 64);
      }
      // Полоса здоровья
      const bx = W-22, by = 60, bh = 160, bw = 14;
      c.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(c, bx-2, by-2, bw+4, bh+4, 5); c.fill();
      c.fillStyle = '#1a1a1a'; roundRect(c, bx, by, bw, bh, 4); c.fill();
      const pct = g.health / 100, fillH = bh * pct;
      c.fillStyle = `hsl(${120*pct},${pct>0.5?80:90}%,${pct>0.5?45:40}%)`;
      roundRect(c, bx, by+bh-fillH, bw, fillH, 4); c.fill();
      c.font = '16px serif'; c.textAlign = 'center'; c.fillStyle = '#555';
      c.fillText('📦', W-15, by-8);
      // Прогресс до промокода
      if (g.distance < PROMO_DIST) {
        const pp = g.distance / PROMO_DIST;
        c.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(c, W/2-70, H-20, 140, 12, 4); c.fill();
        c.fillStyle = '#f59e0b'; roundRect(c, W/2-70, H-20, 140*pp, 12, 4); c.fill();
        c.fillStyle = '#fff'; c.font = '8px sans-serif'; c.textAlign = 'center';
        c.fillText(`Промокод через ${Math.ceil(PROMO_DIST - g.distance)} м`, W/2, H-11);
      }
      // Мигание при ударе
      if (g.flashTimer > 0 && Math.floor(g.flashTimer/4)%2 === 0) {
        c.fillStyle = 'rgba(255,50,50,0.22)'; c.fillRect(0,0,W,H);
      }
    }

    // Оверлей старта
    if (ph === 'ready') {
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0,0,W,H);
      // Зоны управления внизу
      const zoneY = H-64, zoneH = 48;
      [
        { x:0,       label:'[ Лево ]',  bg:'rgba(255,255,255,0.04)' },
        { x:W/3,     label:'[ Центр ]', bg:'rgba(245,158,11,0.09)'  },
        { x:2*W/3,   label:'[ Право ]', bg:'rgba(255,255,255,0.04)' },
      ].forEach(z => {
        c.fillStyle = z.bg; c.fillRect(z.x, zoneY, W/3, zoneH);
        c.strokeStyle='rgba(255,255,255,0.06)'; c.lineWidth=1; c.strokeRect(z.x,zoneY,W/3,zoneH);
        c.fillStyle='#777'; c.font='10px monospace'; c.textAlign='center';
        c.fillText(z.label, z.x+W/6, zoneY+28);
      });
      c.fillStyle = '#f59e0b'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center';
      c.fillText('Delivery Runner', W/2, H/2-22);
      c.fillStyle = '#aaa'; c.font = '12px sans-serif';
      c.fillText('Кликай по зонам или жми ← →', W/2, H/2+6);
      c.fillStyle = '#f59e0b'; c.font = '10px sans-serif';
      c.fillText(`Промокод на ${PROMO_DIST}м · Финал на ${WIN_DIST}м`, W/2, H/2+26);
    }
  }, [best]);

  const resetGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    promoRef.current = false;
    gameRef.current = makeState();
    setDistance(0); setHealth(100); setClaimError(null); setShowPromoBanner(false);
    syncPhase('ready');
  }, []);

  useEffect(() => { if (open) resetGame(); else cancelAnimationFrame(rafRef.current); }, [open, resetGame]);

  const moveLeft  = useCallback(() => {
    const g = gameRef.current;
    if (phaseRef.current !== 'playing') return;
    if (g.currentLane > 0) { g.currentLane--; g.targetX = LANE_CENTERS[g.currentLane]; g.lean = -1; }
  }, []);
  const moveRight = useCallback(() => {
    const g = gameRef.current;
    if (phaseRef.current !== 'playing') return;
    if (g.currentLane < 2) { g.currentLane++; g.targetX = LANE_CENTERS[g.currentLane]; g.lean = 1; }
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (!open) return;
      if (e.code === 'ArrowLeft'  || e.code === 'KeyA') { e.preventDefault(); moveLeft(); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); moveRight(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, moveLeft, moveRight]);

  const goToLane = useCallback((lane) => {
    const g = gameRef.current;
    if (phaseRef.current !== 'playing') return;
    const prev = g.currentLane;
    g.currentLane = lane;
    g.targetX = LANE_CENTERS[lane];
    g.lean = lane > prev ? 1 : lane < prev ? -1 : 0;
  }, []);

  const handleTap = e => {
    if (phase === 'ready') { startPlaying(); return; }
    if (phase === 'ending' || phase === 'won' || phase === 'dead') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = ((e.clientX ?? e.touches?.[0]?.clientX ?? 0) - rect.left) * (W / rect.width);
    // Делим канвас на 3 зоны — прямой выбор полосы
    if (cx < W / 3) goToLane(0);
    else if (cx < (2 * W) / 3) goToLane(1);
    else goToLane(2);
  };

  const startPlaying = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    promoRef.current = false;
    gameRef.current = makeState();
    setDistance(0); setHealth(100); setClaimError(null); setShowPromoBanner(false);
    syncPhase('playing');
    const g = gameRef.current;
    let last = performance.now();

    const tick = now => {
      const ph = phaseRef.current;
      if (ph !== 'playing' && ph !== 'ending') return;
      const dt = Math.min(now - last, 32); last = now;

      // ── Концовка ──
      if (ph === 'ending') {
        g.endingT += dt;
        if (g.endingT >= ENDING_DUR) { syncPhase('won'); draw(); return; }
        draw();
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // ── Игра ──
      g.speed = Math.min(6, g.speed + dt * 0.00007);
      g.distance += g.speed * dt * 0.05;
      g.roadOffset = (g.roadOffset + g.speed * dt * 0.15) % 60;

      // Промокод на 2500м
      if (!promoRef.current && g.distance >= PROMO_DIST) {
        promoRef.current = true;
        setShowPromoBanner(true);
        setTimeout(() => setShowPromoBanner(false), 3500);
      }

      // Переход к концовке
      if (g.distance >= WIN_DIST) {
        g.cars = []; g.pits = []; g.endingT = 0;
        setBest(b => Math.max(b, WIN_DIST));
        syncPhase('ending');
        draw();
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Движение игрока
      const dx = g.targetX - g.playerX;
      g.playerX += dx * 0.12;
      if (Math.abs(dx) < 1) { g.playerX = g.targetX; g.lean *= 0.7; }

      // Деревья
      for (const t of g.trees) {
        t.y += g.speed * dt * 0.05;
        if (t.y > H + 60) {
          t.y = -60;
          t.x = t.side === 'left' ? 20+Math.random()*32 : ROAD_R+14+Math.random()*32;
          t.r = 14 + Math.random()*10;
        }
      }

      // Спавн
      g.spawnCarTimer -= dt;
      if (g.spawnCarTimer <= 0) {
        const lane = Math.floor(Math.random()*3);
        const col  = CAR_COLORS[Math.floor(Math.random()*CAR_COLORS.length)];
        g.cars.push({x:LANE_CENTERS[lane],y:-60,w:36,h:64,lane,flash:false,...col});
        g.spawnCarTimer = Math.max(350, 820 - g.speed*45) + Math.random()*400;
      }
      g.spawnPitTimer -= dt;
      if (g.spawnPitTimer <= 0) {
        const lane = Math.floor(Math.random()*3);
        g.pits.push({x:LANE_CENTERS[lane],y:-30,rx:18+Math.random()*8,ry:11+Math.random()*5});
        g.spawnPitTimer = 550 + Math.random()*750;
      }

      for (const car of g.cars) car.y += g.speed * dt * 0.12;
      for (const pit of g.pits) pit.y += g.speed * dt * 0.12;
      g.cars = g.cars.filter(c => c.y < H + 80);
      g.pits = g.pits.filter(p => p.y < H + 40);

      if (g.hitCooldown > 0) g.hitCooldown -= dt;
      if (g.flashTimer  > 0) g.flashTimer  -= dt;

      // Анимация краша
      if (g.dying) {
        g.crashTimer -= dt;
        g.crashAngle += dt * 0.015;
        if (g.crashTimer <= 0) {
          cancelAnimationFrame(rafRef.current);
          setBest(b => Math.max(b, Math.floor(g.distance)));
          syncPhase('dead'); draw(); return;
        }
        draw(); rafRef.current = requestAnimationFrame(tick); return;
      }

      // Столкновения
      if (g.hitCooldown <= 0) {
        const px = g.playerX, py = PLAYER_Y;
        for (const car of g.cars) {
          if (Math.abs(px-car.x) < (PLAYER_W+car.w)*0.42 && Math.abs(py-car.y) < (PLAYER_H+car.h)*0.42) {
            g.health = Math.max(0, g.health-25); g.hitCooldown=800; g.flashTimer=50;
            car.flash=true; setTimeout(()=>{car.flash=false;},300); break;
          }
        }
        for (const pit of g.pits) {
          if (Math.abs(px-pit.x) < pit.rx*1.1 && Math.abs(py-pit.y) < pit.ry*2.0) {
            g.health=Math.max(0,g.health-15); g.hitCooldown=600; g.flashTimer=30; break;
          }
        }
      }

      setDistance(Math.floor(g.distance));
      setHealth(g.health);

      if (g.health <= 0 && !g.dying) {
        g.dying = true;
        g.crashTimer = 700;
        g.speed = 0;
        g.cars = []; g.pits = [];
      }

      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  useEffect(() => { draw(); }, [phase, draw]);

  const claimReward = async () => {
    if (!userEmail?.trim()) { setClaimError('Войдите в аккаунт.'); return; }
    setClaiming(true); setClaimError(null);
    try {
      await api.claimRunnerReward(userEmail, Math.max(MIN_SCORE_SERVER, Math.floor(gameRef.current.distance)));
      onRewardUnlocked();
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : 'Ошибка');
    } finally { setClaiming(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] border-amber-500/20 bg-[#0a0a0a] text-white p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight text-amber-500">
            <Bike className="h-5 w-5" /> Delivery Runner
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-xs">
            Доедь до <span className="text-amber-400 font-bold">{PROMO_DIST} м</span> — получи промокод{' '}
            <span className="text-amber-400 font-mono font-bold">LOOKRUN</span> (−10%) и продолжай до{' '}
            <span className="text-amber-400 font-bold">{WIN_DIST} м</span> чтобы увидеть финал.
          </DialogDescription>
        </DialogHeader>

        {!userEmail?.trim() && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-bold text-amber-200">
            Войдите в аккаунт, чтобы получить скидку
          </p>
        )}

        <div className="relative">
          <canvas
            ref={canvasRef} width={W} height={H}
            className="w-full rounded-2xl border border-white/10 cursor-pointer touch-manipulation"
            onClick={handleTap}
            onTouchStart={e => { e.preventDefault(); handleTap(e); }}
          />

          {/* Баннер промокода */}
          {showPromoBanner && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 animate-bounce">
              <div className="bg-amber-500 text-black font-black text-sm px-4 py-2 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.6)] whitespace-nowrap">
                Промокод LOOKRUN получен! Едем дальше!
              </div>
            </div>
          )}

          {phase === 'playing' && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              <div className="rounded-full bg-black/70 px-3 py-1 font-mono text-xs text-amber-400 font-bold">
                {distance} м
              </div>
              <div className="rounded-full bg-black/70 px-3 py-1 font-mono text-xs font-bold"
                style={{color:`hsl(${health*1.2},80%,55%)`}}>
                HP {health}%
              </div>
            </div>
          )}

          {/* Оверлей после проигрыша — поверх канваса */}
          {phase === 'dead' && (
            <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-end pb-6 px-4"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.3) 100%)' }}>
              <div className="w-full flex flex-col gap-3">
                <p className="text-center text-sm text-gray-300">
                  Доставлено: <span className="font-mono text-white font-bold">{distance} м</span>
                  {best > 0 && <span className="ml-2 text-gray-500 text-xs">рекорд: {best} м</span>}
                </p>
                {distance >= PROMO_DIST ? (
                  <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-3 space-y-2">
                    <p className="text-center text-xs text-amber-400 font-bold">
                      Ты проехал {distance} м — промокод LOOKRUN заработан! 🎉
                    </p>
                    <p className="text-xs text-gray-400 text-center">
                      <span className="font-mono text-lg font-black text-amber-400">LOOKRUN</span> — −10% на следующий заказ
                    </p>
                    {claimError && <p className="text-xs text-red-400 text-center">{claimError}</p>}
                    <button
                      type="button"
                      disabled={claiming}
                      onClick={claimReward}
                      className="h-11 w-full rounded-xl bg-amber-500 font-black uppercase text-sm tracking-widest text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
                    >
                      {claiming ? 'Сохраняем…' : 'Забрать промокод LOOKRUN'}
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2 border border-red-500/20">
                    Заказ разбит — доедь до {PROMO_DIST} м чтобы получить промокод
                  </p>
                )}
                <button
                  type="button"
                  onClick={startPlaying}
                  className="h-11 w-full rounded-xl border border-white/20 bg-white/5 font-black uppercase text-sm tracking-widest text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" /> Ещё раз
                </button>
              </div>
            </div>
          )}

          {/* Оверлей победы — поверх канваса */}
          {phase === 'won' && (
            <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-end pb-6 px-4"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.2) 100%)' }}>
              <div className="w-full space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <Trophy className="h-5 w-5" />
                  <span className="font-black uppercase tracking-wide text-sm">Заказ доставлен!</span>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Промокод <span className="font-mono text-xl font-black text-amber-400">LOOKRUN</span> — −10% на следующий заказ
                </p>
                {claimError && <p className="text-xs text-red-400 text-center">{claimError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={claiming}
                    onClick={claimReward}
                    className="h-11 flex-1 rounded-xl bg-green-600 font-black uppercase text-sm text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
                  >
                    {claiming ? 'Сохраняем…' : 'Забрать скидку'}
                  </button>
                  <button
                    type="button"
                    onClick={startPlaying}
                    className="h-11 px-4 rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 font-black text-xs uppercase"
                  >
                    <RotateCcw className="h-4 w-4" /> Ещё раз
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {phase === 'ready' && (
            <Button onClick={startPlaying} className="h-12 bg-amber-500 font-black uppercase tracking-widest text-black hover:bg-amber-400">
              Поехали!
            </Button>
          )}
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-600">
            ← → или A/D · тап по сторонам
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
