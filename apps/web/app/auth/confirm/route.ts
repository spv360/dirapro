import { accountsDisabled } from "../../lib/platform/session";
import { createSupabaseServerClient } from "../../lib/platform/supabase/server";
import { createConfirmationHandlers } from "../../lib/platform/supabase/confirmation";

const handlers = createConfirmationHandlers({
  accountsDisabled,
  createClient: async (requireWritableCookies) =>
    createSupabaseServerClient({ requireWritableCookies }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
