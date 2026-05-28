"use client";

import { createAuthClient } from "@plani/auth/client";

export const authClient = createAuthClient();

export const { signIn, signOut, signUp, useSession, organization, admin, magicLink } = authClient;
