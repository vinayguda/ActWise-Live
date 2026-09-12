Add-Type -AssemblyName System.Speech

Write-Host "🎙️ Synthesizing 2-Host Deep Dive Podcast Audio for ActWise Live..."

$outputDir = "C:\apps\AI-Projects\ActWise-Live\recordings"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$finalWavPath = Join-Path $outputDir "ActWise_Podcast_Audio.wav"

$dialogue = @(
    @{
        Speaker = "David"
        Rate = 1
        Text = "Welcome back to the AI Deep Dive! Today we're looking at a hackathon project that tackles one of the biggest headaches in enterprise fintech: navigating compliance documentation."
    },
    @{
        Speaker = "Zira"
        Rate = 1
        Text = "Oh, tell me about it. If you've ever worked with NICE Actimize for anti-money laundering or fraud detection, you know the documentation is thousands of pages spread across separate PDF manuals."
    },
    @{
        Speaker = "David"
        Rate = 1
        Text = "Exactly. But for the Agents Everywhere Hackathon, Vinay built ActWise Live: an ambient voice intelligence layer that sits directly on top of the NICE Actimize DOCenter portal."
    },
    @{
        Speaker = "Zira"
        Rate = 1
        Text = "Look at the screen right now. He's asking: 'What are the setup and installation steps for ActOne 10.2?' Notice that glowing Voice Orb and the instant streaming response."
    },
    @{
        Speaker = "David"
        Rate = 1
        Text = "Wait, look at that widget that just rendered! That's not just plain text. It generated an interactive installation checklist!"
    },
    @{
        Speaker = "Zira"
        Rate = 1
        Text = "Yes! It pulled the exact procedure from DOCenter. And he's clicking each step: Step 1, Step 2, Step 3. The progress bar animates live, tracking completion from zero all the way to 100 percent."
    },
    @{
        Speaker = "David"
        Rate = 1
        Text = "That is so slick. Now check out this next question: comparing ActOne 10.2 and 10.1 capabilities."
    },
    @{
        Speaker = "Zira"
        Rate = 1
        Text = "Boom! A full side-by-side version comparison matrix. It highlights Kafka event streaming as NEW in green, DART SSE streaming as ENHANCED in cyan, and flags legacy SOAP as DEPRECATED in amber. Plus verified citations linking straight to official documentation."
    },
    @{
        Speaker = "David"
        Rate = 1
        Text = "And under the hood, this isn't hallucinating. That top badge shows live Model Context Protocol telemetry, querying DOCenter tools with under 50 millisecond latency."
    },
    @{
        Speaker = "Zira"
        Rate = 1
        Text = "And for hackathon judges, look at that top header button: the Submission Package modal. One click gives you the live Google Cloud Run service URL, the complete video storyboard, and ready-to-share social posts."
    },
    @{
        Speaker = "David"
        Rate = 1
        Text = "Incredible engineering. Built with Gemini Multimodal Live, the Model Context Protocol, React 19, and running live on Google Cloud Run. Test out the live URL in the description below!"
    }
)

# Create synthesizer instances
$synthDavid = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synthDavid.SelectVoice("Microsoft David Desktop")

$synthZira = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synthZira.SelectVoice("Microsoft Zira Desktop")

$tempFiles = @()

for ($i = 0; $i -lt $dialogue.Length; $i++) {
    $item = $dialogue[$i]
    $tempFile = Join-Path $outputDir "podcast_segment_$i.wav"
    $tempFiles += $tempFile

    Write-Host "  -> Synthesizing [$($item.Speaker)]: $($item.Text.Substring(0, [Math]::Min(40, $item.Text.Length)))..."

    if ($item.Speaker -eq "David") {
        $synthDavid.Rate = $item.Rate
        $synthDavid.SetOutputToWaveFile($tempFile)
        $synthDavid.Speak($item.Text)
    } else {
        $synthZira.Rate = $item.Rate
        $synthZira.SetOutputToWaveFile($tempFile)
        $synthZira.Speak($item.Text)
    }
}

$synthDavid.Dispose()
$synthZira.Dispose()

Write-Host "Merging all segments using Node.js..."
node scripts/merge_podcast_wavs.cjs
