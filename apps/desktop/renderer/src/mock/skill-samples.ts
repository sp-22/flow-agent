/**
 * Reference samples for the "generic" skill shown in empty/placeholder states
 * (e.g. the Record Workflow compile screen before a real skill exists yet).
 * Real seeded workflows in `workflows.ts` each carry their own distinct
 * skillPy / manifestYaml / mermaid.
 */

export const SAMPLE_SKILL_PY = `import os
import sys
import json
import requests

GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
GITHUB_REPO = os.environ["GITHUB_REPO"]

def fetch_latest_run():
    url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs"
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
    resp = requests.get(url, headers=headers, params={"per_page": 1}, timeout=10)
    resp.raise_for_status()
    runs = resp.json().get("workflow_runs", [])
    if not runs:
        return None
    return runs[0]

def main():
    run = fetch_latest_run()
    if run is None:
        print(json.dumps({"status": "no_runs"}))
        sys.exit(0)

    result = {
        "status": run["conclusion"] or run["status"],
        "run_id": run["id"],
        "html_url": run["html_url"],
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
`;

export const SAMPLE_MANIFEST_YAML = `name: deploy-check
description: Checks the latest GitHub Actions run and cross-references Sentry on failure.
inputs:
  - name: lookback_hours
    type: integer
    default: 24
    description: How far back to search for related Sentry errors.
secrets:
  - GITHUB_TOKEN
  - GITHUB_REPO
  - SENTRY_AUTH_TOKEN
  - SLACK_WEBHOOK_URL
`;

export const SAMPLE_MERMAID = `%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#131316', 'primaryTextColor': '#ececef', 'primaryBorderColor': '#33333d', 'lineColor': '#5f5f70', 'secondaryColor': '#1c1c21', 'tertiaryColor': '#09090b', 'background': '#131316', 'mainBkg': '#1c1c21', 'nodeBorder': '#33333d', 'clusterBkg': '#131316', 'titleColor': '#ececef', 'edgeLabelBackground': '#131316', 'fontFamily': 'IBM Plex Mono' }}}%%
flowchart LR
    A["Fetch Latest\\nGitHub Actions Run"] --> B{"Failed?"}
    B -->|Yes| C["Query Sentry\\nErrors (24h)"]
    B -->|No| E["Done"]
    C --> D["Post Summary\\nto Slack #incidents"]
`;
