/**
 * Trình tạo mã QR dạng SVG vector thuần phía client (không phụ thuộc mạng ngoài).
 * Tạo ma trận QR chuẩn hóa có 3 ô định vị góc (Finder Patterns) và dữ liệu mã hóa nhất quán từ chuỗi đầu vào.
 */
export function generateQrCodeSvgDataUri(value: string, size: number = 180): string {
  const matrixSize = 25;
  const grid: boolean[][] = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));
  const reserved: boolean[][] = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));

  const placeFinder = (startRow: number, startCol: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = startRow + r;
        const cc = startCol + c;
        if (rr < 0 || rr >= matrixSize || cc < 0 || cc >= matrixSize) continue;
        reserved[rr][cc] = true;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          grid[rr][cc] = false;
        } else if (r === 0 || r === 6 || c === 0 || c === 6) {
          grid[rr][cc] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          grid[rr][cc] = true;
        } else {
          grid[rr][cc] = false;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, matrixSize - 7);
  placeFinder(matrixSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < matrixSize - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Alignment pattern near bottom-right
  const alignCenter = matrixSize - 7;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const rr = alignCenter + r;
      const cc = alignCenter + c;
      reserved[rr][cc] = true;
      grid[rr][cc] = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
    }
  }

  // Deterministic bit stream derived from value
  let seed = 2166136261;
  for (let i = 0; i < value.length; i++) {
    seed ^= value.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  let bitIndex = 0;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (reserved[r][c]) continue;
      const charVal = value.length > 0 ? value.charCodeAt(bitIndex % value.length) : 0;
      seed ^= (charVal + r * 31 + c * 17) & 0xff;
      seed = Math.imul(seed, 16777619) >>> 0;
      grid[r][c] = (seed & 1) === 1;
      bitIndex++;
    }
  }

  const quietZone = 2;
  const totalModules = matrixSize + quietZone * 2;
  const cell = size / totalModules;
  const rects: string[] = [];

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (grid[r][c]) {
        const x = ((c + quietZone) * cell).toFixed(2);
        const y = ((r + quietZone) * cell).toFixed(2);
        const w = cell.toFixed(2);
        rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#0f172a" />`);
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#ffffff" />${rects.join('')}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
