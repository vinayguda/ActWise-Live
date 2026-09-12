const fs = require('fs');
const path = require('path');

const apiKey = process.env.ELEVENLABS_API_KEY || 'sk_e8f7076edd2e3fea57ba3f1025d25e7b9d89fdfa5c0a5406';

const dialogue = [
  {
    speaker: "Charlie",
    voiceId: "IKne3meq5aSn9XLyUdCD",
    text: "Welcome to the AI Deep Dive! Today we're checking out ActWise Live, built by Vinay Guda for the Agents, Everywhere Global Hackathon."
  },
  {
    speaker: "Sarah",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "And this takes on a massive enterprise fintech challenge: navigating thousands of pages of NICE Actimize compliance manuals."
  },
  {
    speaker: "Charlie",
    voiceId: "IKne3meq5aSn9XLyUdCD",
    text: "Exactly! Instead of static chat, ActWise bridges Google Gemini 2.0 with the Model Context Protocol for real-time ambient voice guidance."
  },
  {
    speaker: "Sarah",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "Watch the screen right now! When he asks for ActOne 10.2 setup, it renders an interactive step-by-step checklist. He's clicking each step, and the progress bar animates live all the way to 100 percent!"
  },
  {
    speaker: "Charlie",
    voiceId: "IKne3meq5aSn9XLyUdCD",
    text: "And check out this next question: comparing ActOne 10.1 and 10.2. It generates a full side-by-side matrix, highlighting Kafka streaming as new, and flagging deprecated SOAP APIs."
  },
  {
    speaker: "Sarah",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "And it's strictly grounded with verified DOCenter documentation citations. Plus, that top telemetry badge proves live Model Context Protocol health under 50 milliseconds!"
  },
  {
    speaker: "Charlie",
    voiceId: "IKne3meq5aSn9XLyUdCD",
    text: "Look at that top header button: the 1-Click Submission Package modal gives judges the live Google Cloud Run URL, the video storyboard, and the GitHub repo."
  },
  {
    speaker: "Sarah",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "It's live in production on Google Cloud Run right now. Try out the live demo link in the description below!"
  }
];

function createWavHeader(dataLength, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  header.writeUInt32LE(byteRate, 28);
  const blockAlign = numChannels * (bitsPerSample / 8);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

async function run() {
  console.log('🎙️ Generating Master ElevenLabs Studio Podcast Audio (Charlie & Sarah)...');
  const recordingsDir = path.join(__dirname, '..', 'recordings');
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const pauseDurationSeconds = 0.35; // 350ms natural conversational pause
  const pauseBytes = Math.floor(sampleRate * numChannels * (bitsPerSample / 8) * pauseDurationSeconds);
  const pauseBuffer = Buffer.alloc(pauseBytes);

  const pcmChunks = [];
  const mp3Chunks = [];

  for (let i = 0; i < dialogue.length; i++) {
    const item = dialogue[i];
    console.log(`\n[Segment ${i + 1}/${dialogue.length}] 🎙️ ${item.speaker}: "${item.text.slice(0, 50)}..."`);

    // Fetch PCM 24k
    const pcmRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${item.voiceId}?output_format=pcm_24000`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: item.text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.52,
          similarity_boost: 0.82,
          style: 0.25,
          use_speaker_boost: true
        }
      })
    });

    if (!pcmRes.ok) {
      const err = await pcmRes.text();
      throw new Error(`Failed to synthesize PCM for ${item.speaker}: ${err}`);
    }

    const pcmBuf = Buffer.from(await pcmRes.arrayBuffer());
    pcmChunks.push(pcmBuf);
    pcmChunks.push(pauseBuffer);

    // Also fetch MP3 format
    const mp3Res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${item.voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: item.text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.52,
          similarity_boost: 0.82,
          style: 0.25,
          use_speaker_boost: true
        }
      })
    });

    if (mp3Res.ok) {
      const mp3Buf = Buffer.from(await mp3Res.arrayBuffer());
      mp3Chunks.push(mp3Buf);
    }

    console.log(`  -> Synthesized ${pcmBuf.length} PCM bytes (~${(pcmBuf.length / (sampleRate * 2)).toFixed(1)}s)`);
  }

  // Combine PCM chunks into master WAV
  const totalPcmData = Buffer.concat(pcmChunks);
  const wavHeader = createWavHeader(totalPcmData.length, sampleRate, numChannels, bitsPerSample);
  const finalWavBuffer = Buffer.concat([wavHeader, totalPcmData]);

  const wavPath = path.join(recordingsDir, 'ActWise_Podcast_Audio.wav');
  fs.writeFileSync(wavPath, finalWavBuffer);

  const totalSeconds = totalPcmData.length / (sampleRate * numChannels * (bitsPerSample / 8));
  console.log(`\n🎉 ElevenLabs Studio WAV Audio Created Successfully!`);
  console.log(`📁 File: ${wavPath}`);
  console.log(`⏱️ Duration: ${totalSeconds.toFixed(2)} seconds`);
  console.log(`📊 Size: ${(finalWavBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

  // Also write MP3
  if (mp3Chunks.length > 0) {
    const totalMp3 = Buffer.concat(mp3Chunks);
    const mp3Path = path.join(recordingsDir, 'ActWise_Podcast_Audio.mp3');
    fs.writeFileSync(mp3Path, totalMp3);
    console.log(`📁 MP3 File: ${mp3Path} (${(totalMp3.length / (1024 * 1024)).toFixed(2)} MB)`);
  }
}

run().catch(console.error);
