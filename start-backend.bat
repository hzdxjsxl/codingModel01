@echo off
echo ========================================
echo   货柜空间规划系统 - 后端启动脚本
echo ========================================
echo.

echo [1/3] 检查 Java 和 Maven 是否安装...
java -version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Java，请先安装 JDK 8 或更高版本
    echo 下载地址: https://www.oracle.com/java/technologies/downloads/
    pause
    exit /b 1
)
echo [OK] Java 已安装

mvn --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Maven，请先安装 Maven
    echo 下载地址: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)
echo [OK] Maven 已安装
echo.

echo [2/3] 进入后端目录...
cd /d "%~dp0backend"
echo [OK] 当前目录: %cd%
echo.

echo [3/3] 启动 Spring Boot 应用...
echo ========================================
echo   后端服务将在 http://localhost:8080 启动
echo   API 地址: http://localhost:8080/api/planning-data
echo ========================================
echo.

mvn spring-boot:run

pause
