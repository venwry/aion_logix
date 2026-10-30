# Current authorization workflow

Open the [data browser](../../code/browser.html) or [Changes confirm](../../code/changes-confirm.html), connect to the authenticated Render saving service and review the complete record or proposed group.

In the browser, select pending records in the left list, then press **Authorize and save** above Reset filters. All selected records are authorized in one Git commit. Changes confirm applies the reviewed before/after group and authorizes its resulting records. Stale content rejects the whole request. No downloaded report is required.

Authorization covers the entire record, including nested structures; references do not authorize their targets. Decompose a complex record if it cannot be reviewed as a whole. See [editing instructions](../EDITING_GUIDE.md), [the model guide](../data-model/MODEL_GUIDE.md) and [Render setup](../RENDER_SETUP.md).

John Walker is already authorized. His earlier pending proposal and the original approval files remain [historical evidence](../../archived_no_longer_valid/docs/review/history/2026-10-27/APPLICATION_REPORT.md). Their labels describe the earlier snapshot.
