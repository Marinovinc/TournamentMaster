@echo off
echo Setting JAVA_HOME...
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
echo JAVA_HOME=%JAVA_HOME%

echo.
echo Verifying Java...
java -version

echo.
echo Changing to android directory...
cd /d "C:\Users\marin\Downloads\TournamentMaster\mobile\android"

echo.
echo Starting Gradle build (this may take several minutes)...
call gradlew.bat assembleRelease

echo.
echo Build complete!
echo Looking for APK...
dir /s /b *.apk 2>nul
pause
