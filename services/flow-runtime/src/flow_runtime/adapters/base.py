import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator, List, Optional


@dataclass
class AdapterInfo:
    id: str
    installed: bool
    authenticated: bool
    version: Optional[str]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "installed": self.installed,
            "authenticated": self.authenticated,
            "version": self.version,
        }


class Adapter:
    """Base adapter that shells out to an agentic CLI and normalizes output.

    Subclasses set class attributes only.
    """

    id: str = ""
    binary: str = ""
    run_args: List[str] = []
    test_prompt: str = "Reply with the single word READY"
    config_paths: List[str] = []
    env_keys: List[str] = []

    def _resolve_binary(self) -> Optional[str]:
        return shutil.which(self.binary)

    def _version(self, path: str) -> Optional[str]:
        try:
            out = subprocess.run(
                [path, "--version"], capture_output=True, text=True, timeout=10
            )
        except Exception:
            return None
        text = (out.stdout or out.stderr or "").strip()
        return text.splitlines()[0] if text else None

    def _authenticated(self) -> bool:
        if any(os.environ.get(k) for k in self.env_keys):
            return True
        return any((Path.home() / p).exists() for p in self.config_paths)

    def detect(self) -> AdapterInfo:
        path = self._resolve_binary()
        if path is None:
            return AdapterInfo(self.id, False, False, None)
        return AdapterInfo(self.id, True, self._authenticated(), self._version(path))

    def _stream(self, prompt: str, cwd: Optional[str]) -> Iterator[dict]:
        path = self._resolve_binary()
        if path is None:
            yield {
                "type": "error",
                "message": f"{self.binary} CLI not found on PATH",
                "code": "NOT_INSTALLED",
            }
            return
        argv = [path, *self.run_args, prompt]
        try:
            proc = subprocess.Popen(
                argv,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=cwd,
                bufsize=1,
            )
        except Exception as exc:  # spawn failure
            yield {"type": "error", "message": str(exc), "code": "SPAWN_FAILED"}
            return

        last = ""
        assert proc.stdout is not None
        for line in proc.stdout:
            text = line.rstrip("\n")
            if text.strip():
                last = text.strip()
                yield {"type": "output", "text": text}
        code = proc.wait()
        if code == 0:
            yield {"type": "result", "ok": True, "summary": last or "Completed"}
        else:
            err = (proc.stderr.read() if proc.stderr else "").strip()
            yield {
                "type": "error",
                "message": err or f"{self.binary} exited with code {code}",
                "code": "RUNTIME_ERROR",
            }

    def run(self, prompt: str, cwd: Optional[str]) -> Iterator[dict]:
        yield from self._stream(prompt, cwd)

    def test(self) -> Iterator[dict]:
        yield {"type": "status", "label": "Probing adapter"}
        yield from self._stream(self.test_prompt, None)
