@echo off
echo Starting MathTrack...
:: Go into the engine folder and run node
powershell -WindowStyle Hidden -Command "Start-Process -FilePath '.\node.exe' -ArgumentList 'server.js' -WorkingDirectory '%~dp0' -WindowStyle Hidden"
start "" "index.html"
.\node.exe server.js