from .base import Adapter


class ClaudeAdapter(Adapter):
    id = "claude"
    binary = "claude"
    run_args = ["-p"]
    config_paths = [".claude.json", ".claude/.credentials.json"]
    env_keys = ["ANTHROPIC_API_KEY"]
