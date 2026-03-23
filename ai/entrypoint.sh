#!/bin/bash
set -e

echo "Starting gRPC server..."
python server.py &
GRPC_PID=$!

echo "Starting Redis consumer..."
python redis_consumer.py &
REDIS_PID=$!

# If either process exits, kill the other and exit non-zero
trap 'kill $GRPC_PID $REDIS_PID 2>/dev/null; exit 1' SIGTERM SIGINT

wait -n
echo "A process exited unexpectedly, shutting down..."
kill $GRPC_PID $REDIS_PID 2>/dev/null
exit 1
