import { Suspense } from "react";

import { AccountsLoadingFallback } from "@/components/connected-accounts/accounts-loading-fallback";
import { ConnectedAccountsPanel } from "@/components/connected-accounts/connected-accounts-panel";
import { listConnectedAccounts } from "@/lib/connected-accounts";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { isLinkedInConfigured } from "@/lib/linkedin/config";
import { isMetaConfigured, usesMetaLoginConfig } from "@/lib/meta/config";

export default async function AccountsPage() {
  const { organizationId } = await requireActiveOrganization();
  const accounts = await listConnectedAccounts(organizationId);

  return (
    <Suspense fallback={<AccountsLoadingFallback />}>
      <ConnectedAccountsPanel
        accounts={accounts}
        metaConfigured={isMetaConfigured()}
        linkedInConfigured={isLinkedInConfigured()}
        usesLoginConfig={usesMetaLoginConfig()}
      />
    </Suspense>
  );
}
