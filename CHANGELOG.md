# Changelog

## 1.1.0 — 2026-10-11

- Redesign the panel with Wipecord branding, clearer target fields and a dedicated activity area.
- Collapse optional filters, ranges and advanced settings; add compact layouts and light-theme colors.
- Keep Stop visible, show disabled action states, and improve labels, focus indicators and keyboard-operable buttons.
- Link field help directly to the user guide; restore the activity placeholder when clearing an idle log.

Validation: lint, all 15 core tests, production build and artifact checks passed. Local Chrome fixtures passed 21 interaction checks, native keyboard controls, dragging/resizing and four viewport/theme checks. All API calls were mocked; live Discord validation has not been performed.

## 1.0.0 — 2026-10-11

- Establish Wipecord branding, maintainer links, original icon and independent versioning.
- Redesign the icon as a chat bubble being erased to represent message cleanup.
- Include the deletion engine and regression suite.
- Add source/artifact verification, CI, release automation and maintenance instructions.
- Update compatible build dependencies and remove inactive commit-hook tooling.

Validation: lint, all 15 tests, production build, artifact metadata/license/syntax checks and deterministic rebuild passed. Dependency audit reports zero vulnerabilities. Live Discord and userscript-manager checks have not been performed.
