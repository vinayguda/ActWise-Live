@echo off
set GCLOUD_BIN="C:\Users\vguda\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

if exist %GCLOUD_BIN% (
    set GCLOUD=%GCLOUD_BIN%
) else (
    set GCLOUD=gcloud
)

REM Read GEMINI_API_KEY from .env file dynamically
set GEMINI_KEY=
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if "%%a"=="GEMINI_API_KEY" set GEMINI_KEY=%%~b
    )
)

echo 🚀 Deploying ActWise-Live to Google Cloud Run...

%GCLOUD% run deploy actwise-live ^
  --source . ^
  --region us-central1 ^
  --platform managed ^
  --allow-unauthenticated ^
  --set-env-vars GEMINI_API_KEY="%GEMINI_KEY%",ACTWISE_MCP_URL="https://actwise-dev-mcp.ps.actimize.services/mcp",ACTWISE_MCP_API_KEY="poc-actwise-key-7f3a91"

echo ✅ Cloud Run deployment command complete!
