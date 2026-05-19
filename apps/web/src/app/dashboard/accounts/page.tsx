import { Suspense } from "react";

import { ConnectedAccountsPanel } from "@/components/connected-accounts/connected-accounts-panel";
import { listConnectedAccounts } from "@/lib/connected-accounts";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { isMetaConfigured, usesMetaLoginConfig } from "@/lib/meta/config";

export default async function AccountsPage() {
  const { organizationId } = await requireActiveOrganization();
  const accounts = await listConnectedAccounts(organizationId);

  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading accounts...</p>}>
      <ConnectedAccountsPanel
        accounts={accounts}
        metaConfigured={isMetaConfigured()}
        usesLoginConfig={usesMetaLoginConfig()}
      />
    </Suspense>
  );
}
