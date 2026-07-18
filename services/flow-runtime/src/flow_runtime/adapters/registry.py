from typing import List, Optional

from .base import Adapter
from .claude import ClaudeAdapter
from .codex import CodexAdapter

_ADAPTERS = {a.id: a for a in (ClaudeAdapter(), CodexAdapter())}


def all_adapters() -> List[Adapter]:
    return list(_ADAPTERS.values())


def get_adapter(adapter_id: str) -> Optional[Adapter]:
    return _ADAPTERS.get(adapter_id)
