import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPngBuffer(width, height) {
    // CRC32 calculation
    const crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[n] = c;
    }

    function crc32(buf) {
        let crc = 0xffffffff;
        for (let i = 0; i < buf.length; i++) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
        }
        return (crc ^ 0xffffffff) >>> 0;
    }

    function chunk(type, data) {
        const typeBuf = Buffer.from(type, 'binary');
        const lenBuf = Buffer.alloc(4);
        lenBuf.writeUInt32BE(data.length, 0);
        const crcBuf = Buffer.alloc(4);
        crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
        return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
    }

    const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // 8 bits per channel
    ihdrData[9] = 2; // Truecolor (RGB)
    ihdrData[10] = 0;
    ihdrData[11] = 0;
    ihdrData[12] = 0;
    const ihdr = chunk('IHDR', ihdrData);

    const rawData = Buffer.alloc(height * (1 + width * 3));
    let offset = 0;

    for (let y = 0; y < height; y++) {
        rawData[offset++] = 0; // Filter: None
        for (let x = 0; x < width; x++) {
            // Dark elegant background #121214 with primary gold accent #f59e0b border
            const isBorder = x < 12 || x >= width - 12 || y < 12 || y >= height - 12;
            const r = isBorder ? 245 : 18;
            const g = isBorder ? 158 : 18;
            const b = isBorder ? 11 : 20;

            rawData[offset++] = r;
            rawData[offset++] = g;
            rawData[offset++] = b;
        }
    }

    const compressedData = zlib.deflateSync(rawData);
    const idat = chunk('IDAT', compressedData);
    const iend = chunk('IEND', Buffer.alloc(0));

    return Buffer.concat([header, ihdr, idat, iend]);
}

const pngBuffer = createPngBuffer(1200, 630);
const targetPath = path.resolve(process.cwd(), 'public/og-image.png');
fs.writeFileSync(targetPath, pngBuffer);
console.log(`[og-image] Generada imagen Open Graph en ${targetPath} (${pngBuffer.length} bytes)`);
