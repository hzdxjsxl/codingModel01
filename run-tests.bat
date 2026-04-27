@echo off
echo ========================================
echo   货柜空间规划系统 - 自动测试脚本
echo ========================================
echo.

echo [1/3] 检查 Node.js 和 npm 是否安装...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
echo [OK] Node.js 已安装
echo.

echo [2/3] 进入前端目录并检查依赖...
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo 正在安装依赖...
    npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [OK] 依赖安装完成
) else (
    echo [OK] 依赖已存在
)
echo.

echo [3/3] 运行单元测试...
echo ========================================
echo   测试内容:
echo   - 3D装箱算法基本功能
echo   - 货物旋转功能
echo   - Best-Fit算法优化
echo   - 边界条件处理
echo   - 实际场景模拟
echo ========================================
echo.

npm run test -- --run

if errorlevel 1 (
    echo.
    echo [错误] 测试失败
    pause
    exit /b 1
) else (
    echo.
    echo [成功] 所有测试通过!
)

pause
