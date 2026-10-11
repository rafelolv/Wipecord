# Initial baseline

Imported on 2026-10-11 from https://github.com/feelmypain/purgecord, branch `main`, commit `50885a2981b6cbd9f7d558a41779d4bd26d2fb4a` (2026-09-04), public version `1.1.1`.

The source retains code from https://github.com/victornpb/undiscord. No comparison of both complete histories was performed; the selected maintenance snapshot is the requested Purgecord baseline, rather than a claim that every original-project fix is included.

## Imported behavior

The snapshot includes direct DM/group-DM history pagination, local filters, server-search pagination, batch target planning, confirmation, privacy defaults, stop controls, adaptive rate-limit handling and archived-thread handling. Imported tests bundle the actual source modules and mock browser/API objects.

## Wipecord changes

- Name, internal identifiers, panel labels, namespace, installation/update and support links now belong to Wipecord.
- Original Wipecord icon; public version starts at `1.0.0`.
- Source snapshot imported without upstream Git history into the existing Wipecord history.
- Original copyright and attribution retained in LICENSE, source comments, README and the generated userscript. The license includes an additional attribution sentence beyond standard MIT.
- General AdBonk maintenance practices adapted: English project text, source/artifact consistency, semantic versions, validation limits, release preparation and immutable published tags.
- Development update URL now follows the configured artifact filename.
- Compatible build dependencies updated; inactive inherited commit-hook tooling removed.

Initial automated validation is recorded in CHANGELOG.md. No live Discord deletion or userscript-manager validation has been performed.
