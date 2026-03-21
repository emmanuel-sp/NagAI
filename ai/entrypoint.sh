#!/bin/bash
set -e

echo "Starting gRPC server..."
python server.py &
GRPC_PID=$!

echo "Starting Kafka consumer..."
python kafka_consumer.py &
KAFKA_PID=$!

# If either process exits, kill the other and exit non-zero
trap 'kill $GRPC_PID $KAFKA_PID 2>/dev/null; exit 1' SIGTERM SIGINT

wait -n
echo "A process exited unexpectedly, shutting down..."
kill $GRPC_PID $KAFKA_PID 2>/dev/null
exit 1
