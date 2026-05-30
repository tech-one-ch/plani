import { createAuthClient as _createAuthClient } from "better-auth/react";
import { adminClient, magicLinkClient, organizationClient } from "better-auth/client/plugins";

export type AuthClient = ReturnType<typeof createAuthClient>;

export function createAuthClient(baseURL?: string) {
  return _createAuthClient({
    baseURL,
    plugins: [organizationClient(), adminClient(), magicLinkClient()],
  });
}
