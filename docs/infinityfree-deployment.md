# Automatic InfinityFree deployment

Every push to `main` can build and publish the site to InfinityFree. GitHub Pages keeps using its existing workflow.

## One-time setup

Open the GitHub repository, then go to **Settings**, **Secrets and variables**, **Actions**.

Add these repository secrets:

| Secret | Value |
| --- | --- |
| `INFINITYFREE_FTP_SERVER` | The FTP hostname shown in the InfinityFree account |
| `INFINITYFREE_FTP_USERNAME` | The InfinityFree FTP username |
| `INFINITYFREE_FTP_PASSWORD` | The InfinityFree FTP password |

Add these repository variables:

| Variable | Value |
| --- | --- |
| `INFINITYFREE_SITE_URL` | The full public origin, such as `https://example.free.nf` |
| `INFINITYFREE_REMOTE_DIR` | `/htdocs`, unless the account shows a domain-specific `htdocs` path |
| `INFINITYFREE_ENABLED` | `true`, added last when every other value is ready |

Do not put the FTP password in a source file, commit, issue, or chat message.

## What happens after setup

The workflow tests the app, creates a host-specific production build, then mirrors the generated `out` folder to the configured `htdocs` folder. Stale generated files are removed from that folder so old JavaScript bundles cannot conflict with the current release.

If a required value is missing or the remote directory is not an `htdocs` folder, the deployment stops before uploading anything.
