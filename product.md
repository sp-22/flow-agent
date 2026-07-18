# WorkflowPilot — Product Description & Vision
WorkflowPilot is a premium, desktop-native developer utility that bridges the gap between manual actions and automated API scripts. It watches your traffic, generates clean code, and exposes it to an interactive Copilot agent.
---
## 1. Core Concept & Value Proposition
Developers spend hours writing custom scripts, configuring auth tokens, and dealing with brittle browser automation (Puppeteer/Playwright) just to automate basic tasks. 
WorkflowPilot introduces a **"Record once, automate forever"** paradigm:
1.  **Record**: You perform the action once in your browser or desktop app. WorkflowPilot intercepts the underlying API traffic behind the scenes.
2.  **Generate**: Claude reads the captured endpoints, headers, and payloads, then automatically generates a clean, self-contained skill.
3.  **Execute & Orchestrate**: The workflow becomes a reusable "skill." You can run it instantly, schedule it, or talk to an agent that chains multiple skills together to perform complex tasks.
---
## 2. Target Audience
-   **Developers & Technical Founders** who want to automate repetitive workflows (deploy health checks, database status digests, competitor price monitors) without writing boilerplate integrations.
-   **Hackathon Teams** who need to spin up impressive multi-app integrations in minutes.
-   **Power Users** who want local, secure, and fully editable automation scripts instead of closed-source, expensive cloud platforms.
---
## 3. Product User Experience (UX) Architecture
WorkflowPilot is built with a high-contrast, dark-mode-first macOS design system. The app window consists of a top header bar with a segmented controller divided into three main tabs:
### A. Tab 1: Workflows
This is the workspace folder of your automations. It contains a grid of all saved workflows. Clicking **"View/Edit"** opens a split-pane layout:
-   **Left Column (Specifications)**:
    -   **Mermaid.js Flowchart**: A visual representation of the logic flow (conditions, api requests, email notifications).
    -   **Code Panel**: A tabbed monospaced editor displaying `skill.py` and `manifest.yaml` so you always have direct access to the code.
    -   **Recent Runs**: Detailed execution logs and durations.
-   **Right Column (Refactor Chat)**:
    -   A chat panel dedicated to modifying the workflow.
    -   Instead of manual coding, you converse with the AI: *"Make the GitHub actions check search back 2 days instead of 1."*
    -   The agent generates a diff patch and automatically updates the code and Mermaid flowchart in the left pane.
### B. Tab 2: Executions (The Agent Console)
An interactive chat console styled after modern AI code editors (like Cursor or Codex):
-   **Left Sidebar (Task History)**:
    -   `+ New Task` button at the top to reset the session.
    -   A chronological list of past task runs (`Today`, `Yesterday`, `Older`).
-   **Right Pane (Active Conversation)**:
    -   When starting a new task, a row of **Quick-Use Workflow Chips** (e.g. `[🚀 Deploy Check]`, `[📋 Onboard Client]`) is displayed for instant execution.
    -   A prompt input that supports autocomplete `/` commands (e.g. typing `/` brings up a dropdown to choose a workflow).
    -   Allows custom natural language prompts: *"Is the staging server healthy? If not, alert the Slack channel."*
    -   Shows **step progress loaders** (`✓ Fetch Actions` → `✓ Query Sentry` → `⚡ Format`) updating in real-time *inside* the chat bubbles.
### C. Tab 3: Record Workflow
The network capture engine:
-   A clean terminal window that displays a live, scrolling feed of intercepted HTTP/HTTPS requests (Methods, Statuses, and URLs).
-   Shows a live call counter.
-   Clicking **"Stop Recording"** triggers an AI compilation screen: *"Claude is writing your Python skill & manifest..."*
-   Once compilation is done, it redirects you straight to the details editor (Tab 1) to test and run the new skill.
---
## 4. Technical Stack
-   **Frontend**: React (Vite) styled with Inter and Space Grotesk, utilizing CSS custom properties for seamless Dark & Light theme switching.
-   **Native Wrapper**: Electron. Allows zero compile time, instant hot-reloading during development, and easy system process management (`child_process`).
-   **Network Interception**: `mitmproxy` spawned locally as a background process.
-   **AI Engine**: Anthropic Claude API for analyzing HTTP payloads, writing Python skills, and refactoring scripts via chat.
