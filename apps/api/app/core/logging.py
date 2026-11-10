import os
import logging
import json
import re
import sys
from typing import Any, Dict

# Redaction patterns for sensitive PII (Aadhaar, PAN, phone numbers, auth tokens)
SENSITIVE_PATTERNS = [
    (re.compile(r'\b\d{4}\s?\d{4}\s?\d{4}\b'), "[REDACTED_AADHAAR]"),
    (re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b'), "[REDACTED_PAN]"),
    (re.compile(r'\b\+91[6-9]\d{9}\b'), "[REDACTED_PHONE]"),
    (re.compile(r'(Bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*', re.IGNORECASE), r"\1[REDACTED_TOKEN]"),
]

def redact_pii(text: str) -> str:
    if not isinstance(text, str):
        return text
    for pattern, replacement in SENSITIVE_PATTERNS:
        text = pattern.sub(replacement, text)
    return text

class StructuredJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": redact_pii(record.getMessage()),
        }
        if hasattr(record, "request_id"):
            log_obj["request_id"] = getattr(record, "request_id")
        if hasattr(record, "user_id"):
            log_obj["user_id"] = getattr(record, "user_id")
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredJsonFormatter())
        logger.addHandler(handler)
        log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
        logger.setLevel(getattr(logging, log_level_str, logging.INFO))
    return logger
