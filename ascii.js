const fs = require('fs');

const filename = 'train-labels-idx1-ubyte';

buffer = fs.readFileSync('data/' + filename);

const headerLength = buffer.slice(3, 4).readUInt8();
const bodyOffset = 4 + (headerLength * 4);
const itemCount = buffer.slice(4, 8).readUInt32BE();

buffer.slice(bodyOffset, itemCount+1).map((byte, i) => {
  process.stdout.write(String(byte));
  process.stdout.write(" ");
});

