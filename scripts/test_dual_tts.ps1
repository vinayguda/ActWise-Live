Add-Type -AssemblyName System.Speech

$synth1 = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth1.SelectVoice("Microsoft David Desktop")
$synth1.Rate = 1
$synth1.SetOutputToWaveFile("C:\apps\AI-Projects\ActWise-Live\recordings\host1_test.wav")
$synth1.Speak("Welcome back to the Deep Dive podcast! Today we are looking at ActWise Live.")
$synth1.Dispose()

$synth2 = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth2.SelectVoice("Microsoft Zira Desktop")
$synth2.Rate = 1
$synth2.SetOutputToWaveFile("C:\apps\AI-Projects\ActWise-Live\recordings\host2_test.wav")
$synth2.Speak("That is right, David. It is an ambient voice AI built for NICE Actimize enterprise documentation.")
$synth2.Dispose()

Write-Output "DUAL_TTS_SUCCESS"
