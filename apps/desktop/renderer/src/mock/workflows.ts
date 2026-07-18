import type { Workflow } from '../types';

const deployCheckSkillPy = `import os
import sys
import json
import requests

GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
GITHUB_REPO = os.environ["GITHUB_REPO"]
SENTRY_AUTH_TOKEN = os.environ["SENTRY_AUTH_TOKEN"]
SENTRY_ORG_SLUG = os.environ["SENTRY_ORG_SLUG"]
SLACK_WEBHOOK_URL = os.environ["SLACK_WEBHOOK_URL"]

def fetch_latest_run():
    url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs"
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
    resp = requests.get(url, headers=headers, params={"per_page": 1}, timeout=10)
    resp.raise_for_status()
    runs = resp.json().get("workflow_runs", [])
    return runs[0] if runs else None

def fetch_recent_sentry_errors(hours: int = 24):
    url = f"https://sentry.io/api/0/organizations/{SENTRY_ORG_SLUG}/issues/"
    headers = {"Authorization": f"Bearer {SENTRY_AUTH_TOKEN}"}
    resp = requests.get(url, headers=headers, params={"statsPeriod": f"{hours}h"}, timeout=10)
    resp.raise_for_status()
    return resp.json()

def post_to_slack(text: str):
    requests.post(SLACK_WEBHOOK_URL, json={"text": text}, timeout=10)

def main():
    run = fetch_latest_run()
    if run is None:
        print(json.dumps({"status": "no_runs"}))
        sys.exit(0)

    if run["conclusion"] == "failure":
        errors = fetch_recent_sentry_errors(24)
        summary = f"Deploy failed ({run['html_url']}). {len(errors)} Sentry issues in last 24h."
        post_to_slack(summary)
        print(json.dumps({"status": "failure", "posted": True}))
    else:
        print(json.dumps({"status": run["conclusion"] or run["status"]}))

if __name__ == "__main__":
    main()
`;

const deployCheckManifestYaml = `name: deploy-check
description: Checks the latest GitHub Actions run; on failure, cross-references Sentry and posts a summary to Slack.
inputs:
  - name: lookback_hours
    type: integer
    default: 24
    description: How far back to search for related Sentry errors.
secrets:
  - GITHUB_TOKEN
  - GITHUB_REPO
  - SENTRY_AUTH_TOKEN
  - SENTRY_ORG_SLUG
  - SLACK_WEBHOOK_URL
`;

const deployCheckMermaid = `%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#131316', 'primaryTextColor': '#ececef', 'primaryBorderColor': '#33333d', 'lineColor': '#5f5f70', 'secondaryColor': '#1c1c21', 'tertiaryColor': '#09090b', 'background': '#131316', 'mainBkg': '#1c1c21', 'nodeBorder': '#33333d', 'clusterBkg': '#131316', 'titleColor': '#ececef', 'edgeLabelBackground': '#131316', 'fontFamily': 'IBM Plex Mono' }}}%%
flowchart LR
    A["Fetch Latest\\nGitHub Actions Run"] --> B{"Failed?"}
    B -->|Yes| C["Query Sentry\\nErrors (24h)"]
    B -->|No| E["Done"]
    C --> D["Post Summary\\nto Slack #incidents"]
`;

const onboardClientSkillPy = `import os
import json
import requests

NOTION_TOKEN = os.environ["NOTION_TOKEN"]
NOTION_DATABASE_ID = os.environ["NOTION_DATABASE_ID"]
GMAIL_SENDER = os.environ["GMAIL_SENDER"]
GMAIL_APP_PASSWORD = os.environ["GMAIL_APP_PASSWORD"]

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

def fetch_new_clients():
    url = f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID}/query"
    body = {"filter": {"property": "Status", "select": {"equals": "New"}}}
    resp = requests.post(url, headers=NOTION_HEADERS, json=body, timeout=10)
    resp.raise_for_status()
    return resp.json().get("results", [])

def create_welcome_page(client_name: str) -> str:
    url = "https://api.notion.com/v1/pages"
    body = {
        "parent": {"database_id": NOTION_DATABASE_ID},
        "properties": {"Name": {"title": [{"text": {"content": f"Welcome — {client_name}"}}]}},
    }
    resp = requests.post(url, headers=NOTION_HEADERS, json=body, timeout=10)
    resp.raise_for_status()
    return resp.json()["url"]

def send_welcome_email(to_email: str, client_name: str, notion_url: str):
    import smtplib
    from email.mime.text import MIMEText

    msg = MIMEText(f"Hi {client_name},\\n\\nYour onboarding workspace is ready: {notion_url}")
    msg["Subject"] = "Welcome aboard!"
    msg["From"] = GMAIL_SENDER
    msg["To"] = to_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
        server.send_message(msg)

def main():
    clients = fetch_new_clients()
    results = []
    for client in clients:
        name = client["properties"]["Name"]["title"][0]["plain_text"]
        email = client["properties"]["Email"]["email"]
        notion_url = create_welcome_page(name)
        send_welcome_email(email, name, notion_url)
        results.append({"client": name, "notion_url": notion_url})
    print(json.dumps({"status": "ok", "onboarded": results}))

if __name__ == "__main__":
    main()
`;

const onboardClientManifestYaml = `name: onboard-client
description: Finds new client rows in Notion, creates a welcome page, and emails the client via Gmail.
inputs:
  - name: status_filter
    type: string
    default: New
    description: Notion "Status" select value that marks a client as ready to onboard.
secrets:
  - NOTION_TOKEN
  - NOTION_DATABASE_ID
  - GMAIL_SENDER
  - GMAIL_APP_PASSWORD
`;

const onboardClientMermaid = `%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#131316', 'primaryTextColor': '#ececef', 'primaryBorderColor': '#33333d', 'lineColor': '#5f5f70', 'secondaryColor': '#1c1c21', 'tertiaryColor': '#09090b', 'background': '#131316', 'mainBkg': '#1c1c21', 'nodeBorder': '#33333d', 'clusterBkg': '#131316', 'titleColor': '#ececef', 'edgeLabelBackground': '#131316', 'fontFamily': 'IBM Plex Mono' }}}%%
flowchart LR
    A["Query Notion\\nfor New Clients"] --> B{"Any Found?"}
    B -->|No| E["Done"]
    B -->|Yes| C["Create Welcome\\nNotion Page"]
    C --> D["Send Welcome\\nEmail via Gmail"]
    D --> E
`;

const priceMonitorSkillPy = `import os
import json
import re
import smtplib
from email.mime.text import MIMEText

import requests

PRODUCT_URL = os.environ["PRODUCT_URL"]
PRICE_THRESHOLD = float(os.environ.get("PRICE_THRESHOLD", "0"))
GMAIL_SENDER = os.environ["GMAIL_SENDER"]
GMAIL_APP_PASSWORD = os.environ["GMAIL_APP_PASSWORD"]
ALERT_RECIPIENT = os.environ["ALERT_RECIPIENT"]

PRICE_RE = re.compile(r"\\$([0-9]+(?:\\.[0-9]{2})?)")

def fetch_current_price() -> float:
    resp = requests.get(PRODUCT_URL, timeout=10)
    resp.raise_for_status()
    match = PRICE_RE.search(resp.text)
    if not match:
        raise ValueError("Could not locate a price on the page")
    return float(match.group(1))

def send_alert(price: float):
    msg = MIMEText(f"Price dropped to \${price:.2f} (threshold \${PRICE_THRESHOLD:.2f})\\n{PRODUCT_URL}")
    msg["Subject"] = "Price alert triggered"
    msg["From"] = GMAIL_SENDER
    msg["To"] = ALERT_RECIPIENT

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
        server.send_message(msg)

def main():
    price = fetch_current_price()
    if price <= PRICE_THRESHOLD:
        send_alert(price)
        print(json.dumps({"status": "alert_sent", "price": price}))
    else:
        print(json.dumps({"status": "ok", "price": price}))

if __name__ == "__main__":
    main()
`;

const priceMonitorManifestYaml = `name: price-monitor
description: Scrapes a product page for its current price and emails an alert when it drops below a threshold.
inputs:
  - name: product_url
    type: string
    description: Product page to monitor.
  - name: price_threshold
    type: number
    description: Trigger an alert when the price is at or below this value.
secrets:
  - GMAIL_SENDER
  - GMAIL_APP_PASSWORD
  - ALERT_RECIPIENT
`;

const priceMonitorMermaid = `%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#131316', 'primaryTextColor': '#ececef', 'primaryBorderColor': '#33333d', 'lineColor': '#5f5f70', 'secondaryColor': '#1c1c21', 'tertiaryColor': '#09090b', 'background': '#131316', 'mainBkg': '#1c1c21', 'nodeBorder': '#33333d', 'clusterBkg': '#131316', 'titleColor': '#ececef', 'edgeLabelBackground': '#131316', 'fontFamily': 'IBM Plex Mono' }}}%%
flowchart LR
    A["Fetch Product\\nPage (Web)"] --> B["Parse Current\\nPrice"]
    B --> C{"Below\\nThreshold?"}
    C -->|No| F["Done"]
    C -->|Yes| D["Send Alert\\nEmail (Gmail)"]
    D --> F
`;

export const SEED_WORKFLOWS: Workflow[] = [
  {
    id: 'deploy-check',
    name: 'Deploy Check',
    icon: '🚀',
    description: 'Checks the latest GitHub Actions run and cross-references Sentry on failure, alerting Slack.',
    services: ['GitHub', 'Sentry', 'Slack'],
    health: 'go',
    lastRunRelative: '9 minutes ago',
    runSparkline: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
    skillPy: deployCheckSkillPy,
    manifestYaml: deployCheckManifestYaml,
    mermaid: deployCheckMermaid,
    summary: 'all healthy · 4 steps · 1.2s',
    draft: false,
  },
  {
    id: 'onboard-client',
    name: 'Onboard Client',
    icon: '📋',
    description: 'Finds new client rows in Notion, spins up a welcome page, and emails the client via Gmail.',
    services: ['Notion', 'Gmail'],
    health: 'go',
    lastRunRelative: '2 hours ago',
    runSparkline: ['ok', 'ok', 'ok', 'fail', 'ok', 'ok', 'ok'],
    skillPy: onboardClientSkillPy,
    manifestYaml: onboardClientManifestYaml,
    mermaid: onboardClientMermaid,
    summary: '1 client onboarded · 3 steps · 2.4s',
    draft: false,
  },
  {
    id: 'price-monitor',
    name: 'Price Monitor',
    icon: '💰',
    description: 'Scrapes a competitor product page and emails an alert whenever the price dips below threshold.',
    services: ['Web', 'Gmail'],
    health: 'signal',
    lastRunRelative: '35 minutes ago',
    runSparkline: ['ok', 'ok', 'ok', 'ok', 'fail', 'fail'],
    skillPy: priceMonitorSkillPy,
    manifestYaml: priceMonitorManifestYaml,
    mermaid: priceMonitorMermaid,
    summary: 'page structure changed · price parse failed · 2 steps · 0.8s',
    draft: false,
  },
];
