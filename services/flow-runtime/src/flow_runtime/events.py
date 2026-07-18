import json
import sys
from typing import Any, Dict


def emit(event: Dict[str, Any]) -> None:
    """Write one JSON object per line to stdout and flush immediately."""
    sys.stdout.write(json.dumps(event) + "\n")
    sys.stdout.flush()
