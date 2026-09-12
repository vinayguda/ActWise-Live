const fs = require('fs');
const path = require('path');

const recordingsDir = path.join(__dirname, '..', 'recordings');
const pcmChunks = [];
let sampleRate = 22050;
let numChannels = 1;
let bitsPerSample = 16;

let count = 0;
for (let i = 0; i < 20; i++) {
  const filePath = path.join(recordingsDir, `podcast_segment_${i}.wav`);
  if (fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    sampleRate = buf.readUInt32LE(24);
    numChannels = buf.readUInt16LE(22);
    bitsPerSample = buf.readUInt16LE(34);

    const pcm = buf.subarray(44);
    pcmChunks.push(pcm);

    // Add 350ms of natural silence between hosts
    const pauseBytes = Math.floor(sampleRate * numChannels * (bitsPerSample / 8) * 0.35);
    pcmChunks.push(Buffer.alloc(pauseBytes));
    count++;
  }
}

if (count === 0) {
  console.error('No podcast segments found to merge.');
  process.exit(1);
}

const totalPcm = Buffer.concat(pcmChunks);
const header = Buffer.alloc(44);
const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
const blockAlign = (numChannels * bitsPerSample) / 8;

header.write('RIFF', 0);
header.writeUInt32LE(36 + totalPcm.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(numChannels, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(byteRate, 28);
header.writeUInt16LE(blockAlign, 32);
header.writeUInt16LE(bitsPerSample, 34);
header.write('data', 36);
header.writeUInt32LE(totalPcm.length, 40);

const finalWavPath = path.join(recordingsDir, 'ActWise_Podcast_Audio.wav');
const finalWav = Buffer.concat([header, totalPcm]);
fs.writeFileSync(finalWavPath, finalWav);

const duration = (totalPcm.length / byteRate).toFixed(1);
const sizeMb = (finalWav.length / (1024 * 1024)).toFixed(2);

console.log(`🎉 Successfully merged ${count} podcast host dialogue segments!`);
console.log(`📁 File: ${finalWavPath}`);
console.log(`⏱️ Duration: ${duration} seconds (~${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s)`);
console.log(`📊 Size: ${sizeMb} MB`);
