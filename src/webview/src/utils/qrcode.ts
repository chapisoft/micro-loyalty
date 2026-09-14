/**
 * Trình sinh mã QR Code dạng Vector SVG độ nét cao thuần TypeScript (Zero External Dependencies)
 * Hỗ trợ tạo mã QR offline cho Mã Ưu Đãi Voucher, Mã QR Ví Phần Thưởng POS và Deep Links.
 */

// Bảng số mũ Galois Field GF(256) cho mã sửa lỗi Reed-Solomon
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d; // Polynomial x^8 + x^4 + x^3 + x^2 + 1
    }
  }
  for (let i = 255; i < 512; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const nextPoly = new Uint8Array(poly.length + 1);
    const factor = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMul(poly[j], factor);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

function rsEncode(data: Uint8Array, eccBytes: number): Uint8Array {
  const genPoly = rsGeneratorPoly(eccBytes);
  const res = new Uint8Array(eccBytes);

  for (let i = 0; i < data.length; i++) {
    const feedback = data[i] ^ res[0];
    for (let j = 0; j < eccBytes - 1; j++) {
      res[j] = res[j + 1] ^ gfMul(genPoly[eccBytes - j], feedback);
    }
    res[eccBytes - 1] = gfMul(genPoly[1], feedback);
  }
  return res;
}

// Cấu hình bảng phiên bản QR Code (Version 1..5, Error Correction Level M)
interface QRVersionConfig {
  version: number;
  size: number;
  totalBytes: number;
  dataBytes: number;
  eccBytes: number;
  alignmentPatterns: number[];
}

const QR_CONFIGS: QRVersionConfig[] = [
  { version: 1, size: 21, totalBytes: 26, dataBytes: 16, eccBytes: 10, alignmentPatterns: [] },
  { version: 2, size: 25, totalBytes: 44, dataBytes: 28, eccBytes: 16, alignmentPatterns: [6, 18] },
  { version: 3, size: 29, totalBytes: 70, dataBytes: 44, eccBytes: 26, alignmentPatterns: [6, 22] },
  { version: 4, size: 33, totalBytes: 100, dataBytes: 64, eccBytes: 36, alignmentPatterns: [6, 26] },
  { version: 5, size: 37, totalBytes: 134, dataBytes: 86, eccBytes: 48, alignmentPatterns: [6, 30] },
];

/**
 * Sinh ma trận QR Code 2D (boolean[][]) từ chuỗi văn bản UTF-8
 */
export function generateQrMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);

  let targetConfig = QR_CONFIGS[0];
  for (const cfg of QR_CONFIGS) {
    if (textBytes.length + 3 <= cfg.dataBytes) {
      targetConfig = cfg;
      break;
    }
    targetConfig = cfg;
  }

  const size = targetConfig.size;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  // 1. Finder Patterns (3 góc)
  function drawFinderPattern(startX: number, startY: number) {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const x = startX + dx;
        const y = startY + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) {
          if (
            (dx >= 0 && dx <= 6 && (dy === 0 || dy === 6)) ||
            (dy >= 0 && dy <= 6 && (dx === 0 || dx === 6)) ||
            (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
          ) {
            matrix[y][x] = true;
          } else {
            matrix[y][x] = false;
          }
        }
      }
    }
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(size - 7, 0);
  drawFinderPattern(0, size - 7);

  // 2. Alignment Patterns
  const alignPos = targetConfig.alignmentPatterns;
  for (const row of alignPos) {
    for (const col of alignPos) {
      if (matrix[row][col] === null) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const isBorder = Math.abs(dx) === 2 || Math.abs(dy) === 2;
            const isCenter = dx === 0 && dy === 0;
            matrix[row + dy][col + dx] = isBorder || isCenter;
          }
        }
      }
    }
  }

  // 3. Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // 4. Dark Module
  matrix[size - 8][8] = true;

  // 5. Build Bitstream (Byte Mode: 0100 + Length + Data + Terminator + Padding)
  const bitArray: number[] = [0, 1, 0, 0]; // 4-bit mode: Byte
  const len = textBytes.length;
  for (let i = 7; i >= 0; i--) {
    bitArray.push((len >> i) & 1);
  }
  for (const b of textBytes) {
    for (let i = 7; i >= 0; i--) {
      bitArray.push((b >> i) & 1);
    }
  }

  // Terminator
  while (bitArray.length < targetConfig.dataBytes * 8 && bitArray.length % 8 !== 0) {
    bitArray.push(0);
  }

  const rawBytes: number[] = [];
  for (let i = 0; i < bitArray.length; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | (bitArray[i + j] || 0);
    }
    rawBytes.push(byteVal);
  }

  // Pad bytes: 0xEC, 0x11
  let padIdx = 0;
  const padBytes = [0xec, 0x11];
  while (rawBytes.length < targetConfig.dataBytes) {
    rawBytes.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // Reed-Solomon Error Correction
  const ecc = rsEncode(new Uint8Array(rawBytes), targetConfig.eccBytes);
  const finalCodewords = [...rawBytes, ...Array.from(ecc)];

  // Convert codewords to bits
  const finalBits: number[] = [];
  for (const byte of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      finalBits.push((byte >> i) & 1);
    }
  }

  // 6. Placement Matrix Zigzag (Right to Left, Bottom to Top)
  let bitIdx = 0;
  let upwards = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing pattern
    const rows = upwards ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);

    for (const y of rows) {
      for (const x of [right, right - 1]) {
        if (matrix[y][x] === null) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] === 1 : false;
          // Apply Mask Pattern 0: (x + y) % 2 === 0
          const mask = (x + y) % 2 === 0;
          matrix[y][x] = bit !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // 7. Format Information (Level M, Mask 0: 101010000010010)
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  matrix[7][8] = formatBits[8] === 1;
  for (let i = 0; i < 6; i++) matrix[5 - i][8] = formatBits[9 + i] === 1;

  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = formatBits[i] === 1;
  for (let i = 0; i < 8; i++) matrix[8][size - 8 + i] = formatBits[7 + i] === 1;

  return matrix.map((row) => row.map((cell) => cell === true));
}

/**
 * Tạo mã SVG Vector chuẩn từ chuỗi văn bản
 */
export function generateQrCodeSvg(text: string, sizePx: number = 180, fgColor: string = '#0f172a', bgColor: string = '#ffffff'): string {
  if (!text) return '';
  const matrix = generateQrMatrix(text);
  const moduleCount = matrix.length;
  const margin = 2;
  const totalGrid = moduleCount + margin * 2;
  const cellSize = sizePx / totalGrid;

  const rects: string[] = [];
  for (let y = 0; y < moduleCount; y++) {
    for (let x = 0; x < moduleCount; x++) {
      if (matrix[y][x]) {
        const px = (x + margin) * cellSize;
        const py = (y + margin) * cellSize;
        rects.push(`<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${fgColor}" />`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sizePx} ${sizePx}" width="${sizePx}" height="${sizePx}" class="w-full h-full max-w-full">
    <rect width="${sizePx}" height="${sizePx}" fill="${bgColor}" rx="12" />
    ${rects.join('')}
  </svg>`;
}
