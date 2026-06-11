@echo off
echo Starting MathTrack...

::Start the Node Server 
start "" .\node.exe server.js

::Waits 2 seconds for the server to initialize and bind to port 3000
timeout /t 2 /nobreak >nul

::Opens the browser
start "" "http://localhost:3000"