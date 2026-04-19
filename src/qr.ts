// Minimal QR Code generator - Alphanumeric mode, ECC Level L, Version 1-10
// Designed for Cloudflare Workers (no external deps)

const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);
(function initGf() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP_TABLE[i] = EXP_TABLE[i - 255];
})();

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function rsGenPoly(nsym: number): Uint8Array {
  let gen = new Uint8Array([1]);
  for (let i = 0; i < nsym; i++) {
    const next = new Uint8Array(gen.length + 1);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gfMul(gen[j], EXP_TABLE[i]);
      next[j + 1] ^= gen[j];
    }
    gen = next;
  }
  return gen;
}

function rsEncode(msg: Uint8Array, nsym: number): Uint8Array {
  const gen = rsGenPoly(nsym);
  const result = new Uint8Array(msg.length + nsym);
  result.set(msg);
  for (let i = 0; i < msg.length; i++) {
    const coef = result[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        result[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return result.slice(msg.length);
}

// QR parameters: [totalCodewords, dataCodewords, ecPerBlock, blocks]
// for ECC level L, versions 1-10
const QR_PARAMS: number[][] = [
  [], // v0 unused
  [26, 19, 7, 1], [44, 34, 10, 1], [70, 55, 15, 1], [100, 80, 20, 1], [134, 108, 26, 1],
  [172, 136, 18, 2], [196, 156, 20, 2], [242, 194, 24, 2], [292, 232, 30, 2], [346, 274, 18, 4],
];

function getAlnumCode(c: string): number {
  const s = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
  const i = s.indexOf(c);
  return i >= 0 ? i : -1;
}

function isAlnum(s: string): boolean {
  for (const c of s) if (getAlnumCode(c) < 0) return false;
  return true;
}

export function generateQR(text: string, scale: number = 4): Uint8Array {
  // Determine version
  let version = 0;
  let isAlphanumeric = isAlnum(text);

  if (isAlphanumeric) {
    const charCounts = [0, 25, 47, 77, 111, 149, 187, 221, 261, 305, 341];
    for (let v = 1; v <= 10; v++) {
      if (text.length <= charCounts[v]) { version = v; break; }
    }
  } else {
    const byteCounts = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271];
    for (let v = 1; v <= 10; v++) {
      if (text.length <= byteCounts[v]) { version = v; break; }
    }
  }

  if (version === 0) throw new Error("Text too long for QR code");

  const param = QR_PARAMS[version];
  const totalCW = param[0];
  const dataCW = param[1];
  const ecPerBlock = param[2];
  const numBlocks = param[3];

  // Encode data
  const dataBits: number[] = [];

  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) dataBits.push((val >> i) & 1);
  }

  if (isAlphanumeric) {
    // Alphanumeric mode
    pushBits(2, 4); // mode indicator
    const ccBits = version <= 9 ? 9 : 11;
    pushBits(text.length, ccBits);
    for (let i = 0; i < text.length; i += 2) {
      if (i + 1 < text.length) {
        pushBits(getAlnumCode(text[i]) * 45 + getAlnumCode(text[i + 1]), 11);
      } else {
        pushBits(getAlnumCode(text[i]), 6);
      }
    }
  } else {
    // Byte mode
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    pushBits(4, 4); // mode indicator
    const ccBits = version <= 9 ? 8 : 16;
    pushBits(bytes.length, ccBits);
    for (const b of bytes) pushBits(b, 8);
  }

  // Terminator + padding
  const maxBits = dataCW * 8;
  const termLen = Math.min(4, maxBits - dataBits.length);
  for (let i = 0; i < termLen; i++) dataBits.push(0);
  while (dataBits.length % 8 !== 0) dataBits.push(0);
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (dataBits.length < maxBits) {
    const byte = padBytes[padIdx++ % 2];
    for (let i = 7; i >= 0; i--) dataBits.push((byte >> i) & 1);
  }

  // Convert to codewords
  const dataCodewords = new Uint8Array(dataCW);
  for (let i = 0; i < dataCW; i++) {
    let val = 0;
    for (let j = 0; j < 8; j++) val = (val << 1) | dataBits[i * 8 + j];
    dataCodewords[i] = val;
  }

  // Error correction
  const shortBlockDataLen = Math.floor(dataCW / numBlocks);
  const remainder = dataCW % numBlocks;

  const blocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;
  for (let i = 0; i < numBlocks; i++) {
    const blockLen = shortBlockDataLen + (i < remainder ? 1 : 0);
    const block = dataCodewords.slice(offset, offset + blockLen);
    offset += blockLen;
    blocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
  }

  // Interleave
  const result = new Uint8Array(totalCW);
  let ri = 0;
  const maxDataLen = shortBlockDataLen + 1;
  for (let i = 0; i < maxDataLen; i++) {
    for (let j = 0; j < numBlocks; j++) {
      if (i < blocks[j].length) result[ri++] = blocks[j][i];
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let j = 0; j < numBlocks; j++) {
      result[ri++] = ecBlocks[j][i];
    }
  }

  // Build modules
  const size = version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const isFunc: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  function setFunc(x: number, y: number, dark: boolean) {
    modules[y][x] = dark;
    isFunc[y][x] = true;
  }

  // Finder patterns
  function drawFinder(ox: number, oy: number) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const px = ox + dx, py = oy + dy;
        if (px < 0 || px >= size || py < 0 || py >= size) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        setFunc(px, py, d !== 2 && d !== 4);
      }
    }
  }

  drawFinder(3, 3);
  drawFinder(size - 4, 3);
  drawFinder(3, size - 4);

  // Alignment patterns
  const alignPos: number[] = [6];
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    const step = Math.floor((version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
    for (let pos = size - 7; alignPos.length < numAlign; pos -= step) {
      alignPos.splice(1, 0, pos);
    }
  }

  for (let i = 0; i < alignPos.length; i++) {
    for (let j = 0; j < alignPos.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === alignPos.length - 1) || (i === alignPos.length - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFunc(alignPos[i] + dx, alignPos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }

  // Timing
  for (let i = 8; i < size - 8; i++) {
    setFunc(i, 6, i % 2 === 0);
    setFunc(6, i, i % 2 === 0);
  }

  // Dark module
  setFunc(8, size - 8, true);

  // Reserve format info areas (specific cells only, not entire rows/cols)
  for (let i = 0; i < 8; i++) {
    setFunc(i, 8, false);  // vertical format info left side
    setFunc(8, i, false);  // horizontal format info top side
  }
  for (let i = 0; i < 7; i++) {
    setFunc(8, size - 1 - i, false);  // horizontal format info right side
  }
  for (let i = 0; i < 6; i++) {
    setFunc(size - 1 - i, 8, false);  // vertical format info bottom side
  }

  // Version info areas (v7+): 3×6 rectangles only
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        setFunc(size - 11 + j, i, false);
        setFunc(i, size - 11 + j, false);
      }
    }
  }

  // Place data bits
  const bitLen = result.length * 8;
  let bitIdx = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunc[y][x] && bitIdx < bitLen) {
          modules[y][x] = ((result[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1) === 1;
          bitIdx++;
        }
      }
    }
  }

  // Mask evaluation
  let bestMask = 0;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(modules, isFunc, size, mask);
    const pen = evaluatePenalty(modules, size);
    if (pen < bestPenalty) { bestPenalty = pen; bestMask = mask; }
    applyMask(modules, isFunc, size, mask); // undo
  }
  applyMask(modules, isFunc, size, bestMask);

  // Format info
  const formatData = (1 << 3) | bestMask; // ECC level L = 01, so 1<<3
  let fb = formatData << 10;
  for (let i = 4; i >= 0; i--) {
    if ((fb >> (i + 10)) & 1) fb ^= 0x537 << i;
  }
  const formatBits = ((formatData << 10) | fb) ^ 0x5412;

  for (let i = 0; i <= 5; i++) modules[8][i] = ((formatBits >> i) & 1) === 1;
  modules[8][7] = ((formatBits >> 6) & 1) === 1;
  modules[8][8] = ((formatBits >> 7) & 1) === 1;
  modules[7][8] = ((formatBits >> 8) & 1) === 1;
  for (let i = 9; i < 15; i++) modules[14 - i][8] = ((formatBits >> i) & 1) === 1;
  for (let i = 0; i < 8; i++) modules[size - 1 - i][8] = ((formatBits >> i) & 1) === 1;
  for (let i = 8; i < 15; i++) modules[8][size - 15 + i] = ((formatBits >> i) & 1) === 1;
  modules[size - 8][8] = true;

  // Version info
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
    const vb = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = ((vb >> i) & 1) === 1;
      modules[Math.floor(i / 3)][size - 11 + (i % 3)] = bit;
      modules[size - 11 + (i % 3)][Math.floor(i / 3)] = bit;
    }
  }

  // Render to PNG
  return renderPNG(modules, size, scale);
}

function applyMask(mods: boolean[][], func: boolean[][], size: number, mask: number) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (func[y][x]) continue;
      let inv = false;
      switch (mask) {
        case 0: inv = (x + y) % 2 === 0; break;
        case 1: inv = y % 2 === 0; break;
        case 2: inv = x % 3 === 0; break;
        case 3: inv = (x + y) % 3 === 0; break;
        case 4: inv = (~~(x / 3) + ~~(y / 2)) % 2 === 0; break;
        case 5: inv = ((x * y) % 2 + (x * y) % 3) === 0; break;
        case 6: inv = (((x * y) % 2 + (x * y) % 3) % 2) === 0; break;
        case 7: inv = (((x + y) % 2 + (x * y) % 3) % 2) === 0; break;
      }
      if (inv) mods[y][x] = !mods[y][x];
    }
  }
}

function evaluatePenalty(mods: boolean[][], size: number): number {
  let pen = 0;
  // N1: adjacent same color
  for (let y = 0; y < size; y++) {
    let rc = false, rl = 0;
    for (let x = 0; x < size; x++) {
      if (mods[y][x] === rc) { rl++; if (rl === 5) pen += 3; else if (rl > 5) pen++; }
      else { rc = mods[y][x]; rl = 1; }
    }
  }
  for (let x = 0; x < size; x++) {
    let rc = false, rl = 0;
    for (let y = 0; y < size; y++) {
      if (mods[y][x] === rc) { rl++; if (rl === 5) pen += 3; else if (rl > 5) pen++; }
      else { rc = mods[y][x]; rl = 1; }
    }
  }
  // N2: 2x2 blocks
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = mods[y][x];
      if (c === mods[y][x + 1] && c === mods[y + 1][x] && c === mods[y + 1][x + 1]) pen += 3;
    }
  }
  // N4: dark proportion
  let dark = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (mods[y][x]) dark++;
  const pct = dark * 100 / (size * size);
  pen += (Math.abs(Math.round(pct / 5) - 10)) * 10;
  return pen;
}

// Minimal PNG encoder - uses zlib stored (uncompressed) blocks
function renderPNG(modules: boolean[][], size: number, scale: number): Uint8Array {
  const imgSize = size * scale;
  const rowBytes = imgSize + 1;
  const rawData = new Uint8Array(imgSize * rowBytes);

  for (let y = 0; y < imgSize; y++) {
    rawData[y * rowBytes] = 0; // filter: none
    for (let x = 0; x < imgSize; x++) {
      rawData[y * rowBytes + 1 + x] = modules[~~(y / scale)][~~(x / scale)] ? 0 : 255;
    }
  }

  // Build IDAT with zlib stored blocks
  const maxStored = 65535;
  const zlibSize = 2 + rawData.length + Math.ceil(rawData.length / maxStored) * 5 + 4;
  const idatData = new Uint8Array(zlibSize);
  idatData[0] = 0x78; // CMF: deflate method, 32K window
  idatData[1] = 0x01; // FLG: FCHECK that makes (0x7801 % 31 == 0)

  let off = 2;
  for (let i = 0; i < rawData.length; i += maxStored) {
    const blockLen = Math.min(maxStored, rawData.length - i);
    const isLast = i + blockLen >= rawData.length;
    idatData[off++] = isLast ? 1 : 0; // BFINAL=1 if last, BTYPE=00 (stored)
    const dv = new DataView(idatData.buffer, off);
    dv.setUint16(0, blockLen, true); // LEN
    dv.setUint16(2, (~blockLen) & 0xFFFF, true); // NLEN
    off += 4;
    idatData.set(rawData.subarray(i, i + blockLen), off);
    off += blockLen;
  }

  // Adler-32
  let s1 = 1, s2 = 0;
  for (let i = 0; i < rawData.length; i++) {
    s1 = (s1 + rawData[i]) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  idatData[off] = (s2 >> 8) & 0xff;
  idatData[off + 1] = s2 & 0xff;
  idatData[off + 2] = (s1 >> 8) & 0xff;
  idatData[off + 3] = s1 & 0xff;

  // Build PNG chunks
  const parts: number[][] = [];

  function addChunk(type: string, data: Uint8Array) {
    const enc = new TextEncoder();
    const typeBytes = enc.encode(type);
    const chunk = new Uint8Array(4 + typeBytes.length + data.length + 4);
    const dv = new DataView(chunk.buffer);
    dv.setUint32(0, data.length);
    chunk.set(typeBytes, 4);
    chunk.set(data, 4 + typeBytes.length);
    dv.setUint32(4 + typeBytes.length + data.length, crc32(chunk.subarray(4, 4 + typeBytes.length + data.length)));
    parts.push(Array.from(chunk));
  }

  // IHDR
  const ihdr = new Uint8Array(13);
  new DataView(ihdr.buffer).setUint32(0, imgSize);
  new DataView(ihdr.buffer).setUint32(4, imgSize);
  ihdr[8] = 8; ihdr[9] = 0; // bit depth 8, grayscale
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  addChunk("IHDR", ihdr);
  addChunk("IDAT", idatData.subarray(0, off + 4));
  addChunk("IEND", new Uint8Array(0));

  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  return new Uint8Array([...sig, ...parts.flat()]);
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  const table = getCrcTable();
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let crcTable: Uint32Array | null = null;
function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    crcTable[i] = c >>> 0;
  }
  return crcTable;
}
