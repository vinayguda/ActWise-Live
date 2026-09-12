import { GoogleGenAI, Modality } from '@google/genai';

// Cache generated audio in memory to make repeated phrases instant
const audioCache = new Map<string, string>();

/**
 * Converts 24kHz 16-bit Mono Linear PCM into a standard WAV buffer.
 */
export function pcmToWav(
  pcmData: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = pcmData.length;
  const fileLength = 36 + dataLength;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(fileLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // audioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmData]);
}

/**
 * Generate natural, studio-quality speech using Gemini Flash TTS.
 */
export async function generateGeminiSpeech(
  text: string,
  voiceName: string = 'Aoede'
): Promise<{ audioBase64: string; mimeType: string } | null> {
  // Check cache first
  const cacheKey = `${voiceName}:${text.trim()}`;
  if (audioCache.has(cacheKey)) {
    return { audioBase64: audioCache.get(cacheKey)!, mimeType: 'audio/wav' };
  }

  try {
    const ai = new GoogleGenAI();
    // Valid voice names for Gemini TTS: 'Aoede', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const validVoices = ['Aoede', 'Zephyr', 'Puck', 'Kore', 'Charon', 'Fenrir'];
    const chosenVoice = validVoices.includes(voiceName) ? voiceName : 'Aoede';

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const rawBase64 = part?.inlineData?.data;

    if (!rawBase64) {
      return null;
    }

    // Convert raw 24kHz PCM to playable WAV
    const pcmBuffer = Buffer.from(rawBase64, 'base64');
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
    const wavBase64 = wavBuffer.toString('base64');

    // Cache up to 100 clips
    if (audioCache.size > 100) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, wavBase64);

    return {
      audioBase64: wavBase64,
      mimeType: 'audio/wav',
    };
  } catch (err: any) {
    console.warn('Gemini TTS generation error, falling back:', err.message);
    return null;
  }
}
