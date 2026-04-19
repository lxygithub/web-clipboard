// QR Code generation using qrcode-generator library
// PNG rendering is done manually for Cloudflare Workers compatibility
import qrcode from "qrcode-generator";

export function generateQR(text: string, scale: number = 4): Uint8Array {
  const qr = qrcode(0, "L");
  qr.addData(text);
  qr.make();

  const size = qr.getModuleCount();
  const modules: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      row.push(qr.isDark(y, x));
    }
    modules.push(row);
  }

  return renderPNG(modules, size, scale);
}

// Minimal PNG encoder - grayscale, stored (uncompressed) zlib blocks
function renderPNG(modules: boolean[][], size: number, scale: number): Uint8Array {
  const imgSize = size * scale;
  const rowBytes = imgSize + 1;
  const rawData = new Uint8Array(imgSize * rowBytes);

  for (let y = 0; y < imgSize; y++) {
    rawData[y * rowBytes] = 0;
    for (let x = 0; x < imgSize; x++) {
      rawData[y * rowBytes + 1 + x] = modules[~~(y / scale)][~~(x / scale)] ? 0 : 255;
    }
  }

  const maxStored = 65535;
  const zlibSize = 2 + rawData.length + Math.ceil(rawData.length / maxStored) * 5 + 4;
  const idatData = new Uint8Array(zlibSize);
  idatData[0] = 0x78;
  idatData[1] = 0x01;

  let off = 2;
  for (let i = 0; i < rawData.length; i += maxStored) {
    const blockLen = Math.min(maxStored, rawData.length - i);
    const isLast = i + blockLen >= rawData.length;
    idatData[off++] = isLast ? 1 : 0;
    const dv = new DataView(idatData.buffer, off);
    dv.setUint16(0, blockLen, true);
    dv.setUint16(2, (~blockLen) & 0xFFFF, true);
    off += 4;
    idatData.set(rawData.subarray(i, i + blockLen), off);
    off += blockLen;
  }

  let s1 = 1, s2 = 0;
  for (let i = 0; i < rawData.length; i++) {
    s1 = (s1 + rawData[i]) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  idatData[off] = (s2 >> 8) & 0xff;
  idatData[off + 1] = s2 & 0xff;
  idatData[off + 2] = (s1 >> 8) & 0xff;
  idatData[off + 3] = s1 & 0xff;

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

  const ihdr = new Uint8Array(13);
  new DataView(ihdr.buffer).setUint32(0, imgSize);
  new DataView(ihdr.buffer).setUint32(4, imgSize);
  ihdr[8] = 8; ihdr[9] = 0;
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
