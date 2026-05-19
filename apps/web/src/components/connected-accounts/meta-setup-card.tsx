import { Card, CardDescription, CardTitle } from "@socialbd/ui";

export function MetaSetupCard() {
  return (
    <Card className="border-amber-200 bg-amber-50/80">
      <CardTitle>Meta app not configured</CardTitle>
      <CardDescription className="space-y-2">
        <p>
          Add <code className="text-xs">META_APP_ID</code> and{" "}
          <code className="text-xs">META_APP_SECRET</code> to your root <code className="text-xs">.env</code>{" "}
          (see <code className="text-xs">.env.example</code>), then restart the dev server.
        </p>
        <p>
          Create an app at{" "}
          <a
            href="https://developers.facebook.com/"
            className="font-medium text-primary underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Meta for Developers
          </a>
          , use case <strong>Manage everything on your Page</strong>, create a{" "}
          <strong>Facebook Login for Business</strong> configuration (copy{" "}
          <code className="text-xs">META_LOGIN_CONFIG_ID</code>), and set the redirect URI to your
          callback URL.
        </p>
      </CardDescription>
    </Card>
  );
}
