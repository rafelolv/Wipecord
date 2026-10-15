# Releases

1. Review changes and working-tree status. Choose an unused semantic version; align package.json, lockfile and generated userscript. Never reuse or move a published tag.
2. Run `npm ci` and `npm run check`. Check the generated diff and perform the relevant browser checks from MAINTENANCE.md, or record that they were unavailable.
3. Update CHANGELOG.md and write `docs/releases/v<version>.md` from RELEASE-TEMPLATE.md. Replace all placeholders. Describe user-visible changes, exact version, installation and actual validation limits in English. Write change summaries as concise bullet points (`- ...`), one user-visible change per item, and record validation and limitations as separate bullets.
4. Commit the prepared files under the maintainer identity. When publication is authorized, push main and create an annotated `v<version>` tag at that exact commit, then push it.
5. The Release workflow checks source/artifact consistency, version and notes, and attaches `wipecord.user.js`, both versioned browser ZIPs, `LICENSE` and `SHA256SUMS`. Inspect the workflow result and the published release; verify notes, tag, files and hashes. A pushed tag alone is not a verified release. These ZIPs remain unsigned local packages.
6. Verify the dependent Firefox AMO submission job and Mozilla's Developer Hub. Configure its two repository secrets once using [FIREFOX-PUBLISHING.md](FIREFOX-PUBLISHING.md). Requested releases authorize this Firefox submission; other stores remain separate. Report submission failures or pending review accurately; a successful API submission is not proof of public store availability. If the Firefox job fails, inspect AMO before re-running only failed jobs; never recreate the completed GitHub release.
7. Report the release URL, Firefox submission/review state and actual validation. Publishing a GitHub release does not prove live Discord compatibility. Do not silently replace assets; corrections require a new version.

The main-branch install link follows ongoing development; attached release files are fixed snapshots. No release is published merely by adding this workflow.
