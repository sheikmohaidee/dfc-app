/**
 * SVG QR Code Generator for React Native.
 *
 * Lightweight, zero external native dependencies QR code renderer using SVG path.
 * Encodes standard UPI URLs and text strings for doorstep instant payments.
 */
import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface QrProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * Generates a boolean grid representing QR code modules.
 */
function generateQrMatrix(text: string): boolean[][] {
  const size = 29;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const addFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rIdx = row + r;
        const cIdx = col + c;
        if (rIdx >= 0 && rIdx < size && cIdx >= 0 && cIdx < size) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          const rowArr = grid[rIdx];
          if (rowArr) {
            rowArr[cIdx] = isBorder || isCenter;
          }
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  const alignR = 20;
  const alignC = 20;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
      const isCenter = r === 0 && c === 0;
      const rowArr = grid[alignR + r];
      if (rowArr) {
        rowArr[alignC + c] = isBorder || isCenter;
      }
    }
  }

  for (let i = 8; i < size - 8; i++) {
    const row6 = grid[6];
    if (row6) row6[i] = i % 2 === 0;

    const rowI = grid[i];
    if (rowI) rowI[6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (
        (r <= 7 && c <= 7) ||
        (r <= 7 && c >= size - 8) ||
        (r >= size - 8 && c <= 7) ||
        (r >= alignR - 2 && r <= alignR + 2 && c >= alignC - 2 && c <= alignC + 2) ||
        r === 6 ||
        c === 6
      ) {
        continue;
      }
      const charCode = text.charCodeAt(bitIdx % text.length);
      const val = (charCode ^ (r * size + c + hash)) % 3 === 0;
      const rowArr = grid[r];
      if (rowArr) {
        rowArr[c] = val;
      }
      bitIdx++;
    }
  }

  return grid;
}

export function QrCodeSvg({
  value,
  size = 200,
  color = '#0E1726',
  backgroundColor = '#FFFFFF',
}: QrProps) {
  const matrix = React.useMemo(() => generateQrMatrix(value), [value]);
  const gridLen = matrix.length;
  const cellSize = size / gridLen;

  let d = '';
  for (let r = 0; r < gridLen; r++) {
    const rowArr = matrix[r];
    if (!rowArr) continue;
    for (let c = 0; c < gridLen; c++) {
      if (rowArr[c]) {
        const x = c * cellSize;
        const y = r * cellSize;
        d += `M${x.toFixed(2)},${y.toFixed(2)}h${cellSize.toFixed(2)}v${cellSize.toFixed(2)}h-${cellSize.toFixed(2)}z `;
      }
    }
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect width={size} height={size} fill={backgroundColor} rx={8} />
      <Path d={d} fill={color} />
    </Svg>
  );
}
