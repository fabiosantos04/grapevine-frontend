import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Solo el administrador puede crear cuentas" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { email, nombres, apellidos, role, cargo, telefono } = await req.json();
    if (!email || !nombres || !apellidos || !role) {
      return new Response(JSON.stringify({ error: "Faltan datos" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate random password
    const password = Array.from(crypto.getRandomValues(new Uint8Array(9)))
      .map((b) => "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$"[b % 60])
      .join("");

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombres, apellidos, cargo: cargo ?? "", telefono: telefono ?? "", role },
    });
    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? "No se pudo crear" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Ensure role (trigger sets default; override if needed)
    await admin.from("user_roles").delete().eq("user_id", created.user.id);
    await admin.from("user_roles").insert({ user_id: created.user.id, role });

    // Send credentials email via Lovable AI Gateway? No — use simple email through Supabase invite alternative.
    // We'll use the resend-like approach via an external email if available; otherwise rely on Supabase's email templates.
    // For now, return the credentials so the admin can share them, AND attempt to send via SMTP if configured.
    const emailBody = `Hola ${nombres},\n\nSe ha creado una cuenta para ti en Vitivinícolas Perú ERP.\n\nCorreo: ${email}\nContraseña temporal: ${password}\n\nIngresa en: ${new URL(req.url).origin.replace("functions", "app")}\n\nSe recomienda cambiar tu contraseña después del primer ingreso.`;

    let emailSent = false;
    try {
      // Best-effort send via Lovable email if available
      const r = await fetch("https://ai.gateway.lovable.dev/v1/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({ to: email, subject: "Tu cuenta en Vitivinícolas ERP", text: emailBody }),
      });
      emailSent = r.ok;
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({ ok: true, email, password, emailSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});