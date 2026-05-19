import { Card, CardDescription, CardTitle } from "@socialbd/ui";

type MetaPermissionCardProps = {
  usesLoginConfig: boolean;
};

export function MetaPermissionCard({ usesLoginConfig }: MetaPermissionCardProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/80">
      <CardTitle className="text-base">Reconnect for analytics</CardTitle>
      <CardDescription className="space-y-2 text-sm">
        <p>
          This Page was connected <strong>before</strong> <code className="text-xs">pages_read_engagement</code>{" "}
          was granted, or the permission is missing from your login flow.
        </p>
        {usesLoginConfig ? (
          <p>
            You use <code className="text-xs">META_LOGIN_CONFIG_ID</code>: open Meta → Facebook Login for
            Business → <strong>Configurations</strong> → edit your config → add{" "}
            <strong>pages_read_engagement</strong> (not only the app permissions list).
          </p>
        ) : (
          <p>
            Set <code className="text-xs">META_OAUTH_EXTENDED_SCOPES=true</code> in <code className="text-xs">.env</code>{" "}
            and ensure the permission is enabled on your app use case.
          </p>
        )}
        <p>
          Then go to Accounts → <strong>Disconnect</strong> → <strong>Connect Facebook</strong> again so a
          new Page token is issued.
        </p>
      </CardDescription>
    </Card>
  );
}
