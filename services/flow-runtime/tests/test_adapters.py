from flow_runtime.adapters.registry import get_adapter, all_adapters


def test_registry_exposes_both_adapters():
    ids = sorted(a.id for a in all_adapters())
    assert ids == ["claude", "codex"]


def test_detect_reports_not_installed_when_missing(monkeypatch):
    monkeypatch.setenv("PATH", "")
    info = get_adapter("claude").detect()
    assert info.installed is False
    assert info.authenticated is False
    assert info.version is None
    assert info.id == "claude"


def test_detect_reports_installed_when_present(fake_cli):
    fake_cli("claude", lines=("claude 1.2.3",))
    info = get_adapter("claude").detect()
    assert info.installed is True
    assert info.version is not None


def test_run_streams_output_then_result(fake_cli):
    fake_cli("codex", lines=("working", "done"))
    events = list(get_adapter("codex").run("do a thing", None))
    assert events[0] == {"type": "output", "text": "working"}
    assert events[-1]["type"] == "result"
    assert events[-1]["ok"] is True


def test_run_reports_error_on_nonzero_exit(fake_cli):
    fake_cli("codex", lines=("boom",), exit_code=3)
    events = list(get_adapter("codex").run("x", None))
    assert events[-1]["type"] == "error"
    assert events[-1]["code"] == "RUNTIME_ERROR"
