@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
cd /d C:\Users\marin\Downloads\TournamentMaster\mobile\android
echo JAVA_HOME = %JAVA_HOME%
java -version
echo.
echo Starting Gradle build...
call gradlew.bat assembleRelease
echo.
echo Build completed. Checking for APK...
dir /s /b *.apk 2>nul
