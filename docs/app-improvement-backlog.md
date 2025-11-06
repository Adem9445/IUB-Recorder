# 2025 Product Backlog Highlights

Below is a curated set of five high-impact initiatives that span the full IUB Recorder experience. Each task is framed so cross-functional teams can pick it up independently while keeping user experience consistent across pages and modules.

1. **Unified Accessibility & Internationalization Review**  
   Conduct a holistic audit across popup, options, editor, and side panel UIs to ensure WCAG 2.2 AA compliance, improved keyboard navigation, and consistent locale coverage beyond EN/NO. Deliver updated locale JSON bundles and regression tests that cover the new languages.

2. **AI Session Workspace Synchronization**  
   Extend the session exporter and workspace modules with background sync support (Chrome storage + optional cloud providers) so users can seamlessly resume edits across devices. Include offline queueing, conflict resolution UI, and analytics to monitor synchronization health.

3. **Next-Gen Capture & Annotation Pipeline**  
   Modernize the capture stack with Manifest V3-friendly recording APIs, integrate GPU-accelerated encoding fallbacks, and streamline the editor canvas with reusable annotation components. Ensure performance budgets are documented and monitored via automated Lighthouse runs.

4. **Conversational Intelligence & Export Enhancements**  
   Build on the chat exporter by adding multi-platform AI model detection, semantic summarization, and customizable export templates (Markdown, PDF, HTML). Provide extensibility hooks so partners can register new exporters without modifying core scripts.

5. **Chrome Ecosystem Integrations & QA Automation**  
   Validate compatibility with current Chrome 2025 features (tab groups, side panel APIs, recording permission prompts) and automate regression coverage via Playwright-driven extension harnesses. Publish CI dashboards with pass/fail trends and actionable failure triage.
