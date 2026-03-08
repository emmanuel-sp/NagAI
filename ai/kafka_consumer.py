import os
import logging
from dotenv import load_dotenv
from confluent_kafka import Consumer, KafkaException

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TOPICS = ["digest-delivery", "agent-messages"]


def dispatch(topic: str, key: str, value: str):
    """Route a Kafka message to the appropriate handler.
    Payload shape and handler logic are defined in Steps 9 and 10.
    """
    if topic == "digest-delivery":
        logger.info(f"[digest-delivery] key={key} | {value[:120]}")
        # TODO Step 9: generate digest content with Claude, send via email/SMS
    elif topic == "agent-messages":
        logger.info(f"[agent-messages] key={key} | {value[:120]}")
        # TODO Step 10: generate agent message with Claude, send via email/SMS


def consume():
    consumer = Consumer({
        "bootstrap.servers": os.environ.get("KAFKA_BOOTSTRAP", "localhost:9092"),
        "group.id": "nagai-ai-consumer",
        "auto.offset.reset": "earliest",
    })
    consumer.subscribe(TOPICS)
    logger.info(f"Kafka consumer subscribed to: {TOPICS}")
    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                raise KafkaException(msg.error())
            dispatch(
                msg.topic(),
                msg.key().decode("utf-8") if msg.key() else "",
                msg.value().decode("utf-8") if msg.value() else "",
            )
    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()


if __name__ == "__main__":
    consume()
