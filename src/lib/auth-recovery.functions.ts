import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const confirmExistingEmailAccount = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return { recovered: false };
    }

    const email = data.email.trim().toLowerCase();

    const makeHeaders = (apiKey: string, includeJson = false) => {
      const headers: Record<string, string> = { apikey: apiKey };
      if (!apiKey.startsWith("sb_")) headers.Authorization = `Bearer ${apiKey}`;
      if (includeJson) headers["content-type"] = "application/json;charset=UTF-8";
      return headers;
    };

    const readJson = async (response: Response) =>
      (await response.json().catch(() => null)) as Record<string, unknown> | null;

    const passwordCheck = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: makeHeaders(SUPABASE_PUBLISHABLE_KEY, true),
      body: JSON.stringify({
        email,
        password: data.password,
        gotrue_meta_security: {},
      }),
    });

    if (passwordCheck.ok) {
      return { recovered: true };
    }

    const authResponse = await readJson(passwordCheck);
    const authCode = authResponse?.code ?? authResponse?.error_code ?? authResponse?.error;
    if (authCode !== "email_not_confirmed") {
      return { recovered: false };
    }

    try {
      let userId: string | undefined;
      const adminHeaders = makeHeaders(SUPABASE_SERVICE_ROLE_KEY);

      const filteredUsers = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&page=1&per_page=50`,
        { headers: adminHeaders },
      );

      if (filteredUsers.ok) {
        const body = await readJson(filteredUsers);
        const users = Array.isArray(body?.users) ? body.users : [];
        userId = users.find((candidate) => {
          if (!candidate || typeof candidate !== "object") return false;
          return "email" in candidate && String(candidate.email).toLowerCase() === email;
        })?.id as string | undefined;
      }

      for (let page = 1; !userId && page <= 10; page += 1) {
        const usersPage = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`,
          { headers: adminHeaders },
        );
        if (!usersPage.ok) break;

        const body = await readJson(usersPage);
        const users = Array.isArray(body?.users) ? body.users : [];
        userId = users.find((candidate) => {
          if (!candidate || typeof candidate !== "object") return false;
          return "email" in candidate && String(candidate.email).toLowerCase() === email;
        })?.id as string | undefined;

        if (users.length < 1000) break;
      }

      if (!userId) return { recovered: false };

      const updateUser = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: "PUT",
        headers: makeHeaders(SUPABASE_SERVICE_ROLE_KEY, true),
        body: JSON.stringify({ email_confirm: true }),
      });

      if (!updateUser.ok) return { recovered: false };

      const retryPasswordCheck = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: makeHeaders(SUPABASE_PUBLISHABLE_KEY, true),
        body: JSON.stringify({
          email,
          password: data.password,
          gotrue_meta_security: {},
        }),
      });

      return { recovered: retryPasswordCheck.ok };
    } catch {
      return { recovered: false };
    }
  });