const fs = require('fs');
const crc = require('node-crc');
const zlib = require('zlib');

const filename = 'train-images-idx3-ubyte';

buffer = fs.readFileSync('data/' + filename);

const headerLength = buffer.slice(3, 4).readUInt8();
const bodyOffset = 4 + (headerLength * 4);
const itemCount = buffer.slice(4, 8).readUInt32BE();
const rowSize = buffer.slice(8, 12).readUInt32BE();
const columnSize = buffer.slice(12, 16).readUInt32BE();
const matrixSize = rowSize * columnSize;

const imgIndex = 2;
const start = bodyOffset + matrixSize * imgIndex;
const end = matrixSize + matrixSize * imgIndex + bodyOffset;
const img = buffer.slice(start, end);
console.log(img.length)

console.log({
  headerLength,
  bodyOffset,
  itemCount,
  rowSize,
  columnSize,
  matrixSize,
  sliceEnd: matrixSize + bodyOffset,
});

const header = new Buffer.from('89504e470d0a1a0a', 'hex');

const ihdr = new Buffer.alloc(21)
ihdr.writeUInt32BE(13, 0); // length
ihdr.write('IHDR', 4);
ihdr.writeUInt32BE(rowSize, 8);
ihdr.writeUInt32BE(columnSize, 12);
ihdr.writeUInt8(8, 16); // bitdepth
ihdr.writeUInt8(0, 17); // color
ihdr.writeUInt8(0, 18); // compression
ihdr.writeUInt8(0, 19); // filter
ihdr.writeUInt8(0, 20); // interlace (no Adam7)

// add a zero byte to the start of each row indicating no filter
const filteredImg = Buffer.alloc(img.length + rowSize + 1);
for (var i = 0; i < rowSize; i++) {
  sourceStart = i * rowSize;
  sourceEnd = sourceStart + rowSize;
  filterIndex = (i * rowSize) + i;
  targetStart = filterIndex + 1;
  console.log({
    sourceStart,
    sourceEnd,
    filterIndex,
    targetStart,
  });
  img.copy(filteredImg, targetStart, sourceStart, sourceEnd);
  filteredImg.writeUInt8(0, filterIndex);
}

const compressed = zlib.deflateSync(filteredImg);
const idatHeader = new Buffer.alloc(8)
idatHeader.writeUInt32BE(compressed.length);
idatHeader.write('IDAT', 4);
const idat = Buffer.concat([idatHeader, compressed]);

const iend = new Buffer.alloc(8);
iend.writeUInt32BE(0);
iend.write('IEND', 4);

const buffers = [
  header,
  ihdr,
  crc.crc32(ihdr.slice(4)),
  idat,
  crc.crc32(idat.slice(4)),
  iend,
  crc.crc32(iend.slice(4)),
];

const png = Buffer.concat(buffers);

fs.writeFileSync('./data/test.png', png, {flag: 'w', encoding: 'binary'});
