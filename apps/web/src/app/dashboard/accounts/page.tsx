import { Suspense } from "react";

import { AccountsLoadingFallback } from "@/components/connected-accounts/accounts-loading-fallback";
import { ConnectedAccountsPanel } from "@/components/connected-accounts/connected-accounts-panel";
<<<<<<< HEAD
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
=======
import { PlanUsageCard } from "@/components/connected-accounts/plan-usage-card";
import { listConnectedAccounts } from "@/lib/connected-accounts";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { isLinkedInFeatureEnabled, withoutLinkedInAccounts } from "@/lib/features/linkedin";
import { isLinkedInConfigured } from "@/lib/linkedin/config";
import { isMetaConfigured, usesMetaLoginConfig } from "@/lib/meta/config";
import { getPlanUsageSnapshot } from "@socialbd/db";

export default async function AccountsPage() {
  const { organizationId } = await requireActiveOrganization();
  const [accounts, planUsage] = await Promise.all([
    listConnectedAccounts(organizationId),
    getPlanUsageSnapshot(organizationId),
  ]);

  return (
    <Suspense fallback={<AccountsLoadingFallback />}>
      <div className="space-y-6">
        <PlanUsageCard usage={planUsage} />
        <ConnectedAccountsPanel
          accounts={withoutLinkedInAccounts(accounts)}
          metaConfigured={isMetaConfigured()}
          linkedInEnabled={isLinkedInFeatureEnabled()}
          linkedInConfigured={isLinkedInConfigured()}
          usesLoginConfig={usesMetaLoginConfig()}
          atChannelLimit={planUsage.atLimit}
        />
      </div>
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
    </Suspense>
  );
}
