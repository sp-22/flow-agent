import os
import stat
import sys
from pathlib import Path

import pytest

SRC = Path(__file__).resolve().parents[1] / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))


def _write_fake_cli(dir_path: Path, name: str, body: str) -> None:
    script = dir_path / name
    script.write_text("#!/usr/bin/env python3\n" + body)
    script.chmod(script.stat().st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)


@pytest.fixture
def fake_cli(tmp_path, monkeypatch):
    """Put a fake `claude`/`codex` on PATH that echoes stdout and exits 0."""
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()

    def install(name: str, *, lines=("hello", "READY"), exit_code=0):
        body = (
            "import sys\n"
            f"for line in {list(lines)!r}:\n"
            "    print(line)\n"
            f"sys.exit({exit_code})\n"
        )
        _write_fake_cli(bin_dir, name, body)

    monkeypatch.setenv("PATH", str(bin_dir) + os.pathsep + os.environ["PATH"])
    return install
