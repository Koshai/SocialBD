import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const items = [
  ["festival", "eid-gold", "Eid Mubarak", "#1a472a", "#c9a227"],
  ["festival", "puja-lights", "Shubho Puja", "#8b1538", "#ffb347"],
  ["festival", "pohela-red", "Pohela Boishakh", "#e63946", "#ffd166"],
  ["promo", "flash-red", "Flash Sale", "#dc2626", "#1e293b"],
  ["promo", "weekend-blue", "Weekend Deal", "#2563eb", "#93c5fd"],
  ["promo", "new-drop", "New Arrival", "#7c3aed", "#ddd6fe"],
  ["ecommerce", "cod-delivery", "Cash on Delivery", "#0d9488", "#ccfbf1"],
  ["ecommerce", "bkash-wallet", "Mobile Payment", "#ec4899", "#fce7f3"],
  ["engagement", "giveaway", "Giveaway", "#f59e0b", "#fef3c7"],
  ["engagement", "poll", "Vote / Poll", "#06b6d4", "#cffafe"],
  ["general", "open-hours", "Open Hours", "#64748b", "#e2e8f0"],
  ["general", "visit-us", "Visit Us", "#475569", "#f1f5f9"],
  ["bangla", "bn-eid", "Eid Mubarak", "#006a4e", "#f42a41"],
  ["bangla", "bn-nobo", "Noboborsho", "#f42a41", "#006a4e"],
];

for (const [category, id, label, color1, color2] of items) {
  const dir = join("public", "gallery", category);
  mkdirSync(dir, { recursive: true });
  const safe = label.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="180" cy="180" r="120" fill="rgba(255,255,255,0.12)"/>
  <circle cx="920" cy="860" r="160" fill="rgba(255,255,255,0.1)"/>
  <text x="540" y="500" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="52" font-weight="700">${safe}</text>
  <text x="540" y="570" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="system-ui,sans-serif" font-size="26">SocialBD</text>
</svg>`;
  writeFileSync(join(dir, `${id}.svg`), svg);
}

console.log(`Created ${items.length} gallery SVGs.`);
