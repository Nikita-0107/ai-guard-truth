import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const confirmExistingEmailAccount = createServerFn({ method: "POST" })
  .inputValidator((data) =>
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

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      return { recovered: false };
    }

    const email = data.email.trim().toLowerCase();

    const passwordCheck = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({
        email,
        password: data.password,
        gotrue_meta_security: {},
      }),
    });

    if (passwordCheck.ok) {
      return { recovered: true };
    }

    const authResponse = (await passwordCheck.json().catch(() => null)) as { code?: string } | null;
    if (authResponse?.code !== "email_not_confirmed") {
      return { recovered: false };
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (listError) return { recovered: false };

      const user = usersPage.users.find((candidate) => candidate.email?.toLowerCase() === email);
      if (!user) return { recovered: false };

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      return { recovered: !updateError };
    } catch {
      return { recovered: false };
    }
  });