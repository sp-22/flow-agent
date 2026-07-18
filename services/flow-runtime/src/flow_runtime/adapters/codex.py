from .base import Adapter


class CodexAdapter(Adapter):
    id = "codex"
    binary = "codex"
    run_args = ["exec"]
    config_paths = [".codex/auth.json"]
    env_keys = ["OPENAI_API_KEY"]
