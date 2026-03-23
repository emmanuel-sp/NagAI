import logging
import os
import contextvars

# Shared context var for correlation ID — used by gRPC interceptor and Redis consumer
correlation_id_var = contextvars.ContextVar("correlation_id", default="-")


class CorrelationIdFilter(logging.Filter):
    """Injects the current correlation ID into every log record."""

    def filter(self, record):
        record.correlation_id = correlation_id_var.get("-")
        return True


def setup_logging():
    level = os.environ.get("LOG_LEVEL", "INFO")
    handler = logging.StreamHandler()
    handler.addFilter(CorrelationIdFilter())

    if os.environ.get("LOG_FORMAT", "text") == "json":
        from pythonjsonlogger.json import JsonFormatter

        formatter = JsonFormatter(
            fmt="%(asctime)s %(name)s %(levelname)s %(correlation_id)s %(message)s",
            rename_fields={"asctime": "timestamp", "levelname": "level"},
        )
    else:
        formatter = logging.Formatter(
            "%(asctime)s [%(name)s] %(levelname)s [%(correlation_id)s] %(message)s",
            datefmt="%H:%M:%S",
        )

    handler.setFormatter(formatter)
    logging.basicConfig(level=level, handlers=[handler], force=True)
