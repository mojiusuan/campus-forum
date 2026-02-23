/**
 * 生成PWA图标占位符
 * 使用Node.js和Canvas API生成简单的占位图标
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 简单的SVG转PNG占位符生成
function generateIconSVG(size, text = '论') {
  const radius = size * 0.15; // 圆角半径
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <style>
      .bg { fill: #3b82f6; }
      .text { fill: white; font-family: Arial, sans-serif; font-weight: bold; }
    </style>
  </defs>
  <rect class="bg" width="${size}" height="${size}" rx="${radius}" ry="${radius}"/>
  <text class="text" x="50%" y="50%" font-size="${size * 0.4}" text-anchor="middle" dominant-baseline="central">${text}</text>
</svg>`;
}

// 生成图标文件
const publicDir = path.join(__dirname, '../public');

// 生成192x192图标
const icon192 = generateIconSVG(192);
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), icon192);

// 生成512x512图标
const icon512 = generateIconSVG(512);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), icon512);

console.log('✅ SVG图标已生成');
console.log('📝 请使用在线工具将SVG转换为PNG：');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - 或使用设计工具打开SVG并导出为PNG');
