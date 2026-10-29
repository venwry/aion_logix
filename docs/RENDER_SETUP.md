# Direct saving with GitHub Pages and Render

The static application lives on GitHub Pages. A separate Render Docker service authenticates review actions and commits JSON changes to `venwry/aion_logix`, branch `main`.

## Deploy the backend

1. Open [Deploy to Render](https://render.com/deploy?repo=https://github.com/venwry/aion_logix), connect the repository and review the Blueprint. `render.yaml` selects a free Docker web service; Render may pause it while idle.
2. Create a **fine-grained GitHub personal access token**, restricted to `venwry/aion_logix`, with repository **Contents: Read and write** permission. Configure it as `AION_GITHUB_TOKEN` in Render. Do not put it in frontend code, a URL, Git, or chat. Branch rules must allow this credential to create commits on the configured branch.
3. Render generates `AION_REVIEW_TOKEN`, a separate backend access key. Copy it from Render's environment settings for your own use in the app. Anyone holding this key can authorize changes; this deployment is intended for the single author.
4. Keep `AION_ALLOWED_ORIGINS=https://venwry.github.io`, or replace it with the exact origin of your Pages/custom domain. Comma-separated origins are supported; no wildcard is used. Leave `AION_REPOSITORY` and `AION_BRANCH` as configured unless deliberately changing the target.
5. Deploy, then copy the service's HTTPS URL. `/health` checks the running process. Connecting from the application additionally verifies GitHub access and the repository schema.
6. In the application, enter the service URL and **backend access key** in the Saving service bar, then click **Connect**. This is not the GitHub token. The connection is retained for that browser session; **Disconnect** clears it.

No Render account or credentials are bundled with the repository. Deployment and setting the GitHub secret must be completed in your Render account. No persistent Render disk is needed: GitHub holds all records and decisions. Data-only authorization commits do not trigger backend rebuilds under the Blueprint's build filter.

## Use the app

- The browser shows Authorized / Unauthorized by combining foundation content with external authorization. In the browser list, check the records marked **Pending authorization**, then use **Authorize and save** above **Reset filters**. Selections survive filtering and pagination; all selected records are saved in one commit. If any selected version is stale, the entire batch is rejected.
- Changes confirm shows a visible **Subject / Before / After** table. Check the proposal and choose **Authorize and save**. This applies the group and authorizes its resulting records in one commit.
- A successful save displays the GitHub commit. A failed or stale save displays an error and does not report authorization as saved.
- While connected, the app reads current repository data through the backend, avoiding GitHub Pages publication lag. Disconnected browsing uses the latest published static data and cannot save.

## Development and checks

`npm run preview` serves the static site locally for read-only inspection. To run the backend, supply `AION_GITHUB_TOKEN`, `AION_REVIEW_TOKEN` (at least 24 characters) and `AION_ALLOWED_ORIGINS` through the process environment, then `npm start`. The default local bind is 127.0.0.1; the Docker image binds to 0.0.0.0 on Render's PORT.

Run `npm run validate:data`, `npm run test:server` and `CHROMIUM_PATH=/usr/bin/chromium npm test`. Tests use an in-memory store or mocked GitHub calls and do not authorize the live John Walker proposal.
