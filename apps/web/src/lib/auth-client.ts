import { createAuthClient } from "better-auth/react";

// Same-origin: works whether dev runs on 3000, 3001, etc.
export const authClient = createAuthClient();
