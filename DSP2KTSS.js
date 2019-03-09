const fs = require("fs");
const path = require("path");

const samplesPerFrame = 14;
const nibblesPerFrame = 16;

function getSampleForNibble(nibble) {
    let frames = Math.floor(nibble / nibblesPerFrame);
    let extraNibbles = nibble % nibblesPerFrame;
    let samples = samplesPerFrame * frames;
    return samples + extraNibbles - 2;
}

function getNibbleAddress(samples) {
    let frames = Math.floor(samples / samplesPerFrame);
    let extraSamples = samples % samplesPerFrame;
    return nibblesPerFrame * frames + extraSamples + 2;
}

let arguments = process.argv.slice(2);
if (arguments.length < 2)
    throw "Usage: DSP2KTSS.exe leftChannel.dsp rightChannel.dsp PTSS\G1L"

const leftChannelName = arguments[0];
const rightChannelName = arguments[1];
let format = 'ptss';
if (arguments[2] == 'g1l') format = 'g1l';

const leftChannel = fs.readFileSync(leftChannelName);
const rightChannel = fs.readFileSync(rightChannelName);


const interleaveBlockSize = 8;
const chunkAmountPerFile = Math.ceil((leftChannel.length - 112) / interleaveBlockSize);
let loopStartSample = 0;
let loopEndSample = 0;
let loopStartNibble;
let loopEndNibble;

const loopFlag = leftChannel.readInt16LE(0xc);

if (loopFlag == 1) {
    loopStartNibble = leftChannel.readInt32LE(0x10);
    loopEndNibble = leftChannel.readInt32LE(0x14);
    loopStartSample = getSampleForNibble(loopStartNibble);
    loopEndSample = getSampleForNibble(loopEndNibble);
}

sampleCount = leftChannel.readInt32LE(0);
sampleRate = leftChannel.readInt32LE(8);

loopLength = loopEndSample - loopStartSample;

let ktssFile = Buffer.alloc(leftChannel.length + rightChannel.length + 64);

ktssFile.write("KTSS", 0);
ktssFile.writeInt32LE(leftChannel.length + rightChannel.length + 64, 4);
ktssFile.write('02000303E000000001020000', 0x20, 'hex')
ktssFile.writeInt32LE(sampleRate, 0x2c);
ktssFile.writeInt32LE(sampleCount, 0x30);
ktssFile.writeInt32LE(loopStartSample, 0x34);
ktssFile.writeInt32LE(loopLength, 0x38);
leftChannel.copy(ktssFile, 0x40, 0, 0x60);
rightChannel.copy(ktssFile, 0xa0, 0, 0x60);

for (let i = 0; i < chunkAmountPerFile; i++) {
    let currentAudioPosition = 112 + i * interleaveBlockSize;
    let currentKTSSPosition = 256 + i * interleaveBlockSize * 2;
    leftChannel.copy(ktssFile, currentKTSSPosition, currentAudioPosition, currentAudioPosition + interleaveBlockSize);
    rightChannel.copy(ktssFile, currentKTSSPosition + interleaveBlockSize, currentAudioPosition, currentAudioPosition + interleaveBlockSize);
}
const fileName = path.join(path.parse(leftChannelName).dir, path.parse(leftChannelName).name);
console.log(fileName);

if (format == 'g1l') {
    let g1lHeader = Buffer.from('5F4C314730303030000000001C00000010000000010000001C000000', 'hex');
    g1lHeader.writeInt32LE(ktssFile.length + 28, 8);
    fs.writeFileSync(fileName + ".g1l.nx", g1lHeader);
    fs.writeFileSync(fileName + ".g1l.nx", ktssFile, { flag: "a" });
}
else fs.writeFileSync(fileName + ".ktss", ktssFile);