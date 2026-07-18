import json
import subprocess
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src"


def _run(args, stdin=""):
    env = {"PYTHONPATH": str(SRC)}
    import os

    env = {**os.environ, **env}
    proc = subprocess.run(
        [sys.executable, "-m", "flow_runtime", *args],
        input=stdin,
        capture_output=True,
        text=True,
        env=env,
    )
    return proc


def _events(stdout):
    return [json.loads(line) for line in stdout.splitlines() if line.strip()]


def test_detect_emits_single_detect_event():
    proc = _run(["detect"])
    assert proc.returncode == 0
    events = _events(proc.stdout)
    assert len(events) == 1
    assert events[0]["type"] == "detect"
    ids = sorted(a["id"] for a in events[0]["adapters"])
    assert ids == ["claude", "codex"]


def test_run_reads_prompt_from_stdin(fake_cli):
    fake_cli("claude", lines=("ok",))
    proc = _run(["run", "--adapter", "claude"], stdin="hello there")
    assert proc.returncode == 0
    events = _events(proc.stdout)
    assert events[-1]["type"] == "result"
    assert events[-1]["ok"] is True


def test_test_command_fails_when_not_installed(monkeypatch):
    # Isolate PATH so a real claude/codex CLI on the host machine can't leak in.
    monkeypatch.setenv("PATH", "")
    proc = _run(["test", "--adapter", "claude"])
    # No fake CLI on PATH → not installed → error + nonzero exit.
    events = _events(proc.stdout)
    assert events[-1]["type"] == "error"
    assert events[-1]["code"] == "NOT_INSTALLED"
    assert proc.returncode != 0
