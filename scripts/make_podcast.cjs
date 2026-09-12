const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const recordingsDir = path.join(__dirname, '..', 'recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

const dialogue = [
  {
    speaker: "Microsoft David Desktop",
    text: "Welcome back to the AI Deep Dive! Today we're looking at a project that tackles one of the biggest headaches in enterprise fintech: navigating compliance documentation."
  },
  {
    speaker: "Microsoft Zira Desktop",
    text: "Oh, tell me about it. If you have ever worked with NICE Actimize for anti-money laundering or fraud detection, you know the documentation is thousands of pages spread across separate PDF manuals."
  },
  {
    speaker: "Microsoft David Desktop",
    text: "Exactly. But for the Agents Everywhere Hackathon, Vinay built ActWise Live: an ambient voice intelligence layer that sits directly on top of the NICE Actimize DOCenter portal."
  },
  {
    speaker: "Microsoft Zira Desktop",
    text: "Look at the screen right now. He is asking: 'What are the setup and installation steps for ActOne 10.2?' Notice that glowing Voice Orb and the instant streaming response."
  },
  {
    speaker: "Microsoft David Desktop",
    text: "Wait, look at that widget that just rendered! That is not just plain text. It generated an interactive installation checklist!"
  },
  {
    speaker: "Microsoft Zira Desktop",
    text: "Yes! It pulled the exact verified procedure from DOCenter. And he is clicking each step: Step 1, Step 2, Step 3. The progress bar animates live, tracking completion from zero all the way to 100 percent."
  },
  {
    speaker: "Microsoft David Desktop",
    text: "That is so slick. Now check out this next question: comparing ActOne 10.2 and 10.1 capabilities."
  },
  {
    speaker: "Microsoft Zira Desktop",
    text: "Boom! A full side-by-side version comparison matrix. It highlights Kafka event streaming as NEW in green, DART SSE streaming as ENHANCED in cyan, and flags legacy SOAP as DEPRECATED in amber. Plus verified citations linking straight to official documentation."
  },
  {
    speaker: "Microsoft David Desktop",
    text: "And under the hood, this is not hallucinating. That top badge shows live Model Context Protocol telemetry, querying DOCenter tools with under 50 millisecond latency."
  },
  {
    speaker: "Microsoft Zira Desktop",
    text: "And for hackathon judges, look at that top header button: the Submission Package modal. One click gives you the live Google Cloud Run service URL, the complete video storyboard, and ready-to-share social posts."
  },
  {
    speaker: "Microsoft David Desktop",
    text: "Incredible engineering. Built with Gemini Multimodal Live, the Model Context Protocol, React 19, and running live on Google Cloud Run. Check out the live demo link in the description below!"
  }
];

console.log('🎙️ Synthesizing 2-Host Deep Dive Podcast Audio...');

const pcmChunks = [];
let sampleRate = 22050;
let numChannels = 1;
let bitsPerSample = 16;

for (let i = 0; i < dialogue.length; i++) {
  const item = dialogue[i];
  const wavPath = path.join(recordingsDir, `seg_${i}.wav`);
  const safeText = item.text.replace(/'/g, "''");

  console.log(`  [${item.speaker.includes('David') ? 'Alex' : 'Sam'}]: "${item.text.slice(0, 45)}..."`);

  const psScript = `
    Add-Type -AssemblyName System.Speech
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $s.SelectVoice('${item.speaker}')
    $s.Rate = 1
    $s.SetOutputToWaveFile('${wavPath.replace(/\\/g, '\\\\')}')
    $s.Speak('${safeText}')
    $s.Dispose()
  `;

  execSync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`);

  if (fs.existsSync(wavPath)) {
    const buf = fs.readFileSync(wavPath);
    sampleRate = buf.readUInt32LE(24);
    numChannels = buf.readUInt16LE(22);
    bitsPerSample = buf.readUInt16LE(34);

    const pcm = buf.subarray(44);
    pcmChunks.push(pcm);

    // 350ms natural conversational pause between hosts
    const pauseBytes = Math.floor(sampleRate * numChannels * (bitsPerSample / 8) * 0.35);
    pcmChunks.push(Buffer.alloc(pauseBytes));

    fs.unlinkSync(wavPath); // cleanup segment
  }
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
fs.writeFileSync(finalWavPath, Buffer.concat([header, totalPcm]));

const durationSec = totalPcm.length / byteRate;
console.log('\n🎉 Dual-Host Podcast Audio Track Created Successfully!');
console.log(`📁 File: ${finalWavPath}`);
console.log(`⏱️ Duration: ${durationSec.toFixed(1)} seconds (~${Math.floor(durationSec / 60)}m ${Math.round(durationSec % 60)}s)`);
console.log(`📊 Size: ${(fs.statSync(finalWavPath).size / (1024 * 1024)).toFixed(2)} MB`);
