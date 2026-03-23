import os
import uuid
import logging
from dotenv import load_dotenv
import redis

load_dotenv()

from logging_config import setup_logging, correlation_id_var

setup_logging()
logger = logging.getLogger(__name__)

import digest_handler
import agent_message_handler

STREAMS = ["digest-delivery", "agent-messages"]
GROUP = "nagai-ai-consumer"
CONSUMER = "worker-1"


def dispatch(stream: str, key: str, value: str):
    """Route a Redis stream message to the appropriate handler."""
    if stream == "digest-delivery":
        logger.info(f"[digest-delivery] key={key} | {value[:120]}")
        digest_handler.handle_digest_delivery(value)
    elif stream == "agent-messages":
        logger.info(f"[agent-messages] key={key} | {value[:120]}")
        agent_message_handler.handle_agent_message(value)


def consume():
    redis_host = os.environ.get("REDIS_HOST", "localhost")
    redis_port = int(os.environ.get("REDIS_PORT", "6379"))
    logger.info(f"Connecting to Redis at {redis_host}:{redis_port}...")

    r = redis.Redis(host=redis_host, port=redis_port, decode_responses=False)
    r.ping()
    logger.info("Redis connection established")

    # Create consumer groups (idempotent — ignores BUSYGROUP if already exists)
    for stream in STREAMS:
        try:
            r.xgroup_create(stream, GROUP, id="0", mkstream=True)
            logger.info(f"Created consumer group '{GROUP}' on stream '{stream}'")
        except redis.exceptions.ResponseError as e:
            if "BUSYGROUP" in str(e):
                logger.debug(f"Consumer group '{GROUP}' already exists on '{stream}'")
            else:
                raise

    logger.info(f"Redis consumer listening on streams: {STREAMS} — waiting for messages...")
    try:
        while True:
            results = r.xreadgroup(
                groupname=GROUP,
                consumername=CONSUMER,
                streams={s: ">" for s in STREAMS},
                count=1,
                block=1000,
            )

            for stream_name, messages in results:
                for msg_id, fields in messages:
                    cid = (fields.get(b"correlationId", b"") or b"").decode("utf-8")
                    if not cid:
                        cid = uuid.uuid4().hex[:8]
                    correlation_id_var.set(cid)

                    key = (fields.get(b"key", b"") or b"").decode("utf-8")
                    payload = (fields.get(b"payload", b"") or b"").decode("utf-8")
                    stream = stream_name.decode("utf-8") if isinstance(stream_name, bytes) else stream_name

                    logger.info(f"Received message on stream={stream} id={msg_id.decode('utf-8') if isinstance(msg_id, bytes) else msg_id}")
                    dispatch(stream, key, payload)

                    r.xack(stream_name, GROUP, msg_id)
    except KeyboardInterrupt:
        logger.info("Consumer shutting down...")
    finally:
        r.close()


if __name__ == "__main__":
    consume()
