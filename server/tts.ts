import { GoogleGenAI, Modality } from '@google/genai';

// Cache generated audio in memory to make repeated phrases instant
const audioCache = new Map<string, string>();

// Cooldown tracking for Gemini TTS quota limits (e.g. free tier 10 req/day limit)
let ttsQuotaCooldownUntil: number = 0;

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

export interface SpeechResult {
  audioBase64: string | null;
  mimeType: string;
  quotaExhausted?: boolean;
}

/**
 * Generate natural, studio-quality speech using Gemini Flash TTS.
 * Gracefully handles 429 quota exhaustion by returning quotaExhausted flag for smooth client fallback.
 */
export async function generateGeminiSpeech(
  text: string,
  voiceName: string = 'Aoede'
): Promise<SpeechResult | null> {
  const cleanText = text.trim();
  if (!cleanText) return null;

  // Check cache first
  const cacheKey = `${voiceName}:${cleanText}`;
  if (audioCache.has(cacheKey)) {
    return { audioBase64: audioCache.get(cacheKey)!, mimeType: 'audio/wav' };
  }

  // Check if we are currently in quota exhaustion cooldown
  const now = Date.now();
  if (now < ttsQuotaCooldownUntil) {
    return { audioBase64: null, mimeType: 'audio/wav', quotaExhausted: true };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Valid voice names for Gemini TTS: 'Aoede', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const validVoices = ['Aoede', 'Zephyr', 'Puck', 'Kore', 'Charon', 'Fenrir'];
    const chosenVoice = validVoices.includes(voiceName) ? voiceName : 'Aoede';

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: cleanText.slice(0, 800) }] }],
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
      quotaExhausted: false,
    };
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota');
    if (isQuota) {
      // Set cooldown for 60 seconds to avoid repeating failed network calls
      ttsQuotaCooldownUntil = Date.now() + 60000;
      console.warn('Gemini TTS daily quota limit reached on free tier. Gracefully falling back to client audio.');
      return { audioBase64: null, mimeType: 'audio/wav', quotaExhausted: true };
    }
    console.warn('Gemini TTS generation error, falling back:', err.message);
    return null;
  }
}

