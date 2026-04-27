@echo off
echo ========================================
echo   货柜空间规划系统 - 项目启动脚本
echo ========================================
echo.

echo [1/3] 检查 Node.js 和 npm 是否安装...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js 已安装

npm --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 npm
    pause
    exit /b 1
)
echo [OK] npm 已安装
echo.

echo [2/3] 安装前端依赖...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo 正在安装依赖，这可能需要几分钟...
    npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [OK] 前端依赖安装完成
) else (
    echo [跳过] 依赖已存在，如需更新请运行 npm install
)
echo.

echo [3/3] 启动前端开发服务器...
echo ========================================
echo   前端服务将在 http://localhost:3000 启动
echo.
echo   说明:
echo   - 点击"加载测试数据"可直接使用内置测试数据
echo   - 点击"开始规划"需要后端 Java 服务运行在 http://localhost:8080
echo   - 如需启动后端，请在另一个终端运行 start-backend.bat
echo ========================================
echo.

npm run dev

pause
