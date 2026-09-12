@echo off
set GCLOUD_BIN="C:\Users\vguda\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

if exist %GCLOUD_BIN% (
    set GCLOUD=%GCLOUD_BIN%
) else (
    set GCLOUD=gcloud
)

echo 🚀 Deploying ActWise-Live to Google Cloud Run...

%GCLOUD% run deploy actwise-live ^
  --source . ^
  --region us-central1 ^
  --platform managed ^
  --allow-unauthenticated ^
  --set-env-vars GEMINI_API_KEY="%GEMINI_API_KEY%"

echo ✅ Cloud Run deployment command complete!
