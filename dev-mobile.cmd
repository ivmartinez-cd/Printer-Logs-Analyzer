@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;C:\Program Files\nodejs;%PATH%
cd mobile
echo Building and running native Android app (requires a connected device or emulator)...
call npm.cmd run android

