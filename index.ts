import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // Supabase browser requests send apikey + Authorization and trigger a preflight.
  // Include all headers used by index.html so OPTIONS does not fail in the browser.
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept, accept-profile, content-profile, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing server secret: ${key}`);
  return value;
};
const clean = (v: unknown, max = 5000) => String(v ?? "").trim().slice(0, max);

function normalizeJob(input: Record<string, unknown>) {
  const job = {
    title: clean(input.title, 120),
    category: clean(input.category, 120),
    city: clean(input.city, 120),
    salary: clean(input.salary, 120),
    job_type: clean(input.job_type || "Full Time", 40),
    description: clean(input.description, 5000),
    contact_phone: clean(input.contact_phone, 30),
  };
  if (!job.title || !job.category || !job.city) throw new Error("Please enter job title, category and city.");
  return job;
}

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required." }, 405);

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const anonKey = requiredEnv("SUPABASE_ANON_KEY");
    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const razorpayKeyId = requiredEnv("RAZORPAY_KEY_ID");
    const razorpaySecret = requiredEnv("RAZORPAY_KEY_SECRET");
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Please login first." }, 401);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Your login session expired. Please login again." }, 401);
    const userId = userData.user.id;
    const body = await req.json();
    const action = clean(body.action, 30);
    const job = normalizeJob((body.job || {}) as Record<string, unknown>);

    if (action === "trial") {
      const { data, error } = await userClient.rpc("publish_free_trial_job", { p_job: job });
      if (error) {
        const message = error.message || "Could not use free trial.";
        if (/FREE_TRIAL_ALREADY_USED|duplicate key/i.test(message)) {
          return json({ code: "FREE_TRIAL_USED", error: "Your one free job post has already been used. The next post costs ₹299 for 30 days." }, 409);
        }
        if (/LOGIN_REQUIRED/i.test(message)) return json({ error: "Please login first." }, 401);
        return json({ error: message }, 400);
      }
      return json(data || { success: true, trial_used: true });
    }

    if (action === "create_order") {
      const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      const { data: trialRow, error: trialError } = await admin
        .from("job_posting_trials").select("user_id").eq("user_id", userId).maybeSingle();
      if (trialError) return json({ error: "Could not verify your free-trial status. Please try again." }, 500);
      if (!trialRow) return json({ code: "FREE_TRIAL_REQUIRED", error: "Use your one free job post first. After that, each additional post costs ₹299 for 30 days." }, 409);

      const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpaySecret}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 29900,
          currency: "INR",
          receipt: `km_${crypto.randomUUID().replaceAll("-", "").slice(0, 28)}`,
          notes: { product: "KaamMilega 30-day job post", user_id: userId },
        }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok || !order.id) return json({ error: order.error?.description || "Razorpay could not create an order." }, 502);

      const { error: insertError } = await admin.from("job_posting_payments").insert({
        user_id: userId,
        order_id: order.id,
        amount_paise: 29900,
        currency: "INR",
        status: "created",
        job_payload: job,
      });
      if (insertError) return json({ error: "Payment order was created but could not be saved. Please contact support before retrying." }, 500);
      return json({ key_id: razorpayKeyId, order_id: order.id, amount: 29900, currency: "INR", name: "KaamMilega", description: "Job post active for 30 days after approval" });
    }

    if (action === "verify") {
      const orderId = clean(body.razorpay_order_id, 100);
      const paymentId = clean(body.razorpay_payment_id, 100);
      const signature = clean(body.razorpay_signature, 200);
      if (!orderId || !paymentId || !signature) return json({ error: "Payment verification details are incomplete." }, 400);
      const expected = await hmacHex(razorpaySecret, `${orderId}|${paymentId}`);
      if (!safeEqual(expected, signature.toLowerCase())) return json({ error: "Payment signature could not be verified." }, 400);

      const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      const { data: row, error: rowError } = await admin.from("job_posting_payments")
        .select("id,user_id,order_id,status,amount_paise,currency")
        .eq("order_id", orderId).eq("user_id", userId).maybeSingle();
      if (rowError || !row) return json({ error: "This payment order was not found for your account." }, 404);
      if (row.amount_paise !== 29900 || row.currency !== "INR") return json({ error: "Payment amount does not match the job-posting plan." }, 400);

      // Verify the payment with Razorpay API as well as checking the signed checkout response.
      const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: { "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpaySecret}`)}` },
      });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok || payment.order_id !== orderId || payment.amount !== 29900 || payment.currency !== "INR" || !["captured", "authorized"].includes(payment.status)) {
        return json({ error: "Razorpay payment is not captured/authorized yet. Please wait and contact support if money was deducted." }, 400);
      }
      if (payment.status === "authorized") {
        const captureResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, {
          method: "POST",
          headers: { "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpaySecret}`)}`, "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 29900, currency: "INR" }),
        });
        const captured = await captureResponse.json();
        if (!captureResponse.ok || captured.status !== "captured") return json({ error: "Payment was authorized but could not be captured. Please contact support before paying again." }, 502);
      }

      const { data: result, error: finalizeError } = await admin.rpc("finalize_paid_job_post", {
        p_user_id: userId, p_order_id: orderId, p_payment_id: paymentId,
      });
      if (finalizeError) return json({ error: finalizeError.message || "Payment was received but the job could not be submitted. Contact support with payment ID " + paymentId }, 500);
      return json(result || { success: true, message: "Payment verified and job submitted for owner review." });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected server error." }, 500);
  }
});
