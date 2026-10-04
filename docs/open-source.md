# Open-source readiness

The local checkout has been audited for publication hygiene. Publication remains a separate authorized action. See [development](development.md), [architecture](architecture.md), [testing](testing.md) and the [source-distribution decision](decisions/002-source-registry-distribution.md).

## Sanitation boundaries

Local environment files, private keys, logs, operating-system metadata, temporary dumps, local editor integrations and generated build/browser artifacts are excluded by the root `.gitignore`. Keep the credential-free `.env.example` and portable shared `.vscode` formatting settings. Dependencies remain installed locally and ignored; builds regenerate SDK distributions, MDX output, installer payloads and production output.

The local editor integration configuration was removed from tracked source and all reachable history. Personal CLI package author metadata was removed. Commit author and committer identities were replaced with `Liven UI Maintainers <maintainers@livenui.invalid>` without changing chronological commit boundaries. Commit messages remain one-line Conventional Commit subjects. Reflogs and unreachable old objects are removed after rewriting. No remote publication is part of this process.

The optional remote search integration no longer embeds a hosted index identifier. Operators supply `ORAMA_INDEX_ID` alongside credentials and explicit synchronization opt-in. Ordinary builds and local search remain independent of remote credentials. Tests use synthetic credentials and mocked remote calls.

## Audit evidence and limits

The audit inspected 37 initial local revisions, their complete commit patches, 377 historical blob objects including unreachable objects, and the workspace structure. Nine public raster assets were also inspected for embedded metadata. No private environment file, OS metadata file or dump directory was present outside excluded dependency trees. Thirty generated build/browser paths were removed, and regenerated outputs were removed again after validation. Targeted patterns covered private-key material, common credential formats, credential-bearing URLs, credential assignments, private endpoints, email addresses and personal workstation paths. Generic matches were classified against implementation intent: UI keys, design tokens, environment-variable names, test fixtures and authentication documentation are not evidence of leaked credentials. No actual secret or private endpoint was identified by these checks. A hosted resource identifier and personal package/history metadata were sanitized.

Public dependency/documentation domains and upstream source attribution remain. Existing LICENSE and NOTICE content is retained unchanged, including legally required copyright identities. Public team-profile recommendations remain skipped. This audit does not prove the absence of every possible secret, establish whether another repository copy is sanitized, or validate remote publication.

## Verification

`bun run check` passed with the pinned toolchain: 20 typecheck/dependency tasks, lint, documentation checks, architecture checks across 12 workspaces, 48 tests and 11 build targets. The new search probe verifies disabled/missing-credential behavior, rejects missing or whitespace-only index identifiers before reading output, and checks configured synchronization with mocked remote calls. Ignore rules were checked against 13 private/artifact paths and six source/example/legal paths.

The sanitation rewrite retained 38 incremental Conventional Commits, including sanitation, with neutral author/committer metadata. Its final tree was compared to the verified pre-rewrite tree; source, legal content and infrastructure were retained. No old refs or unreachable objects remained after sanitation. That change did not alter UI rendering; no new browser run, physical-device acceptance or deployed-system test was claimed.

## Licensing

The owner approved MIT licensing on 2026-10-05. The [root LICENSE](../LICENSE) covers first-party application code, tooling, tests and documentation, with copyright attributed to Liven UI contributors. The root package manifest declares `MIT`. Existing package-specific LICENSE and NOTICE files, including third-party copyright and attribution, remain unchanged and authoritative for their respective source. The root license does not replace third-party terms or claim ownership of upstream code. Preserve the appropriate license and notices when copying or distributing components; independently packaged workspaces must also include their applicable legal files.

Run `bun run check` after source/config changes. Before publishing, inspect `git status --porcelain`, confirm `main`, repeat the content/history scan and review ignored files before staging. Never include local environment values or secret matches in terminal output or reports.
