const REFACTOR_DELAY_MS = 1200;

export interface DiffPatch {
  additions: string[];
  deletions: string[];
  newSkillPy: string;
  newMermaid: string;
  explanation: string;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const CANNED_SKILL_PY = `import os
import json
import requests

WEBHOOK_URL = os.environ["WEBHOOK_URL"]

def notify(text: str):
    requests.post(WEBHOOK_URL, json={"text": text}, timeout=10)

def main():
    notify("Refactored automation ran successfully")
    print(json.dumps({"status": "ok"}))

if __name__ == "__main__":
    main()
`;

const CANNED_MERMAID = `flowchart LR
    A["Trigger"] --> B["Apply Refactored Step"]
    B --> C["Notify"]
`;

/**
 * Requests a mock refactor of the current automation based on `instruction`.
 * Resolves a canned DiffPatch after a short delay. Pure timer-based stub —
 * no real IO.
 */
export function requestRefactor(instruction: string): Promise<DiffPatch> {
  return delay(REFACTOR_DELAY_MS).then(() => ({
    additions: ['+ Added retry with backoff around the network call', '+ Added a notify() step for failures'],
    deletions: ['- Removed the unused legacy timeout constant'],
    newSkillPy: CANNED_SKILL_PY,
    newMermaid: CANNED_MERMAID,
    explanation: `Applied your instruction ("${instruction}") by adding a resilient notify step and tidying up unused code.`,
  }));
}
