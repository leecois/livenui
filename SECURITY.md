# Security reporting

Report vulnerabilities privately through the repository's **Security → Report a vulnerability** action when private vulnerability reporting is enabled. Include the affected commit, component, reproduction, impact and a minimal example without real credentials or personal data. Do not post secrets or exploit details in a public issue.

If that action is unavailable, ask the maintainer to enable private reporting without sharing vulnerability details publicly. Enabling this repository setting is a release prerequisite; it cannot be verified or enabled by the local audit.

Security fixes target the current `main` source. There is no promised support window for older snapshots or separately published npm releases. Installed source is copied into the consumer application; consumers must apply fixes to their own copies.

The local avatar conversation is a scripted demo, presets stay in browser storage, and microphone capture requires an explicit user action. These features do not provide hosted authentication, agent execution or cloud storage. Never place credentials in browser-visible configuration or shared playground links.
