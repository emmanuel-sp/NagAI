import os
import uuid
import logging
from dotenv import load_dotenv
from confluent_kafka import Consumer, KafkaException

load_dotenv()

from logging_config import setup_logging, correlation_id_var

setup_logging()
logger = logging.getLogger(__name__)

import digest_handler
import agent_message_handler

TOPICS = ["digest-delivery", "agent-messages"]


def _extract_correlation_id(msg) -> str:
    """Extract correlation ID from Kafka message headers, or generate one."""
    headers = msg.headers() or []
    for key, value in headers:
        if key == "x-correlation-id":
            try:
                return value.decode("utf-8")
            except (UnicodeDecodeError, AttributeError):
                break
    return uuid.uuid4().hex[:8]


def dispatch(topic: str, key: str, value: str):
    """Route a Kafka message to the appropriate handler."""
    if topic == "digest-delivery":
        logger.info(f"[digest-delivery] key={key} | {value[:120]}")
        digest_handler.handle_digest_delivery(value)
    elif topic == "agent-messages":
        logger.info(f"[agent-messages] key={key} | {value[:120]}")
        agent_message_handler.handle_agent_message(value)


def consume():
    bootstrap = os.environ.get("KAFKA_BOOTSTRAP", "localhost:9092")
    logger.info(f"Connecting to Kafka at {bootstrap}...")
    consumer = Consumer({
        "bootstrap.servers": bootstrap,
        "group.id": "nagai-ai-consumer",
        "auto.offset.reset": "earliest",
    })
    consumer.subscribe(TOPICS)
    logger.info(f"Kafka consumer subscribed to: {TOPICS} — waiting for messages...")
    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                logger.error(f"Kafka error: {msg.error()}")
                raise KafkaException(msg.error())

            cid = _extract_correlation_id(msg)
            correlation_id_var.set(cid)

            logger.info(f"Received message on topic={msg.topic()} partition={msg.partition()} offset={msg.offset()}")
            dispatch(
                msg.topic(),
                msg.key().decode("utf-8") if msg.key() else "",
                msg.value().decode("utf-8") if msg.value() else "",
            )
    except KeyboardInterrupt:
        logger.info("Consumer shutting down...")
    finally:
        consumer.close()


if __name__ == "__main__":
    consume()
