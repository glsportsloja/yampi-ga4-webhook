export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = req.body;
    console.log(JSON.stringify(body, null, 2));

    const orderId = body?.id || body?.order_id || Date.now();
    const value = body?.total || body?.amount || 0;

    // =========================
    // GA4
    // =========================
    const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
    const GA4_API_SECRET = process.env.GA4_API_SECRET;

    const ga4Payload = {
      client_id: `${orderId}.yampi`,
      events: [
        {
          name: "purchase",
          params: {
            transaction_id: String(orderId),
            value: Number(value),
            currency: "BRL"
          }
        }
      ]
    };

    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
      {
        method: "POST",
        body: JSON.stringify(ga4Payload)
      }
    );

    // =========================
    // META CAPI
    // =========================
    const META_PIXEL_ID = process.env.META_PIXEL_ID;
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    const metaPayload = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: String(orderId),
          action_source: "website",
          event_source_url: body?.checkout_url || "",
          user_data: {
            em: body?.customer?.email || undefined,
            ph: body?.customer?.phone || undefined,
            fn: body?.customer?.first_name || undefined,
            ln: body?.customer?.last_name || undefined,
            ct: body?.customer?.city || undefined,
            st: body?.customer?.state || undefined,
            zp: body?.customer?.zip || undefined,
            country: "br"
          },
          custom_data: {
            currency: "BRL",
            value: Number(value)
          }
        }
      ]
    };

    await fetch(
      `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(metaPayload)
      }
    );

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
