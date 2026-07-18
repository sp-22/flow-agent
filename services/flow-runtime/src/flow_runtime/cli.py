import argparse
import sys
from typing import List, Optional

from .adapters.registry import all_adapters, get_adapter
from .events import emit


def _cmd_detect(_args: argparse.Namespace) -> int:
    emit({"type": "detect", "adapters": [a.detect().to_dict() for a in all_adapters()]})
    return 0


def _drive(adapter_id: str, events) -> int:
    adapter = get_adapter(adapter_id)
    if adapter is None:
        emit({"type": "error", "message": f"Unknown adapter {adapter_id}", "code": "RUNTIME_ERROR"})
        return 1
    info = adapter.detect()
    if not info.installed:
        emit({"type": "error", "message": f"{adapter.id} CLI not installed", "code": "NOT_INSTALLED"})
        return 1
    ok = False
    for event in events(adapter):
        emit(event)
        if event.get("type") == "result":
            ok = bool(event.get("ok"))
        elif event.get("type") == "error":
            ok = False
    return 0 if ok else 1


def _cmd_test(args: argparse.Namespace) -> int:
    return _drive(args.adapter, lambda a: a.test())


def _cmd_run(args: argparse.Namespace) -> int:
    prompt = sys.stdin.read().strip()
    return _drive(args.adapter, lambda a: a.run(prompt, args.cwd))


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="flow_runtime")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("detect").set_defaults(func=_cmd_detect)

    p_test = sub.add_parser("test")
    p_test.add_argument("--adapter", required=True, choices=["claude", "codex"])
    p_test.set_defaults(func=_cmd_test)

    p_run = sub.add_parser("run")
    p_run.add_argument("--adapter", required=True, choices=["claude", "codex"])
    p_run.add_argument("--cwd", default=None)
    p_run.set_defaults(func=_cmd_run)

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    args = _build_parser().parse_args(argv)
    return int(args.func(args))
