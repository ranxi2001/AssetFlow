#!/bin/bash

# AssetFlow 启动脚本
# 自动清理端口占用并启动前后端服务

FRONTEND_PORT=1456
BACKEND_PORT=1457

echo "=== AssetFlow 启动脚本 ==="

# 清理端口占用
cleanup_port() {
    local port=$1
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "端口 $port 被占用 (PID: $pid)，正在清理..."
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

echo "检查端口占用..."
cleanup_port $FRONTEND_PORT
cleanup_port $BACKEND_PORT

echo "启动后端服务 (端口 $BACKEND_PORT)..."
node server/index.js &
BACKEND_PID=$!
sleep 2

# 检查后端是否启动成功
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "后端启动失败！"
    exit 1
fi
echo "后端启动成功 (PID: $BACKEND_PID)"

echo "启动前端服务 (端口 $FRONTEND_PORT)..."
npm run dev &
FRONTEND_PID=$!
sleep 3

echo ""
echo "=== 服务已启动 ==="
echo "前端: http://0.0.0.0:$FRONTEND_PORT"
echo "后端: http://0.0.0.0:$BACKEND_PORT"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号，清理进程
cleanup() {
    echo ""
    echo "正在停止服务..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# 等待子进程
wait
