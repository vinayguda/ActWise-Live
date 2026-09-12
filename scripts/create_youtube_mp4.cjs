const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ffmpegPath = require('ffmpeg-static');
console.log('Using ffmpeg binary at:', ffmpegPath);

const recordingsDir = path.join(__dirname, '..', 'recordings');
const videoInput = path.join(recordingsDir, 'ActWise_Live_Demo_Submission.webm');
const audioInput = path.join(recordingsDir, 'ActWise_Podcast_Audio.mp3');
const outputMp4 = path.join(recordingsDir, 'ActWise_Live_Demo_Submission.mp4');

console.log('Input Video:', videoInput, `(${fs.statSync(videoInput).size} bytes)`);
console.log('Input Audio:', audioInput, `(${fs.statSync(audioInput).size} bytes)`);

// Command to multiplex video and audio:
// - Video input 0
// - Audio input 1
// - Pad video last frame using tpad so the outro screen stays visible until the audio finishes
// - Encode video to H.264 (libx264) with yuv420p for 100% YouTube compatibility
// - Encode audio to high quality AAC (192kbps)
console.log('🎬 Rendering YouTube-Optimized Master MP4 (1080p H.264 + AAC)...');

const cmd = `"${ffmpegPath}" -y -i "${videoInput}" -i "${audioInput}" -filter_complex "[0:v]tpad=stop_mode=clone:stop_duration=18[v]" -map "[v]" -map 1:a -c:v libx264 -pix_fmt yuv420p -preset fast -crf 22 -c:a aac -b:a 192k -shortest "${outputMp4}"`;

console.log('Running ffmpeg command...');
try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('\n🎉 Master YouTube MP4 Created Successfully!');
  console.log('📁 Output File:', outputMp4);
  const stat = fs.statSync(outputMp4);
  console.log('📊 Size:', (stat.size / (1024 * 1024)).toFixed(2), 'MB');
} catch (err) {
  console.error('Error running ffmpeg:', err.message);
  process.exit(1);
}
