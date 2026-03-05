 export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = req.body;
    console.log(JSON.stringify(body, null, 2));

    const eventType = body?.event;
    const order = body?.resource;

    if (!order) {
      return res.status(200).json({ received: true });
    }

    const orderId = order?.id || Date.now();
    const value = order?.total || order?.amount || 0;

    const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
    const GA4_API_SECRET = process.env.GA4_API_SECRET;
    const META_PIXEL_ID = process.env.META_PIXEL_ID;
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    // =====================================================
    // INITIATE CHECKOUT (Pedido Criado)
    // =====================================================
    if (eventType === "order.created") {

      // GA4 - begin_checkout
      await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
        {
          method: "POST",
          body: JSON.stringify({
            client_id: `${orderId}.yampi`,
            events: [
              {
                name: "begin_checkout",
                params: {
                  currency: "BRL",
                  value: Number(value)
                }
              }
            ]
          })
        }
      );

      // META - InitiateCheckout
      await fetch(
        `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: [
              {
                event_name: "InitiateCheckout",
                event_time: Math.floor(Date.now() / 1000),
                event_id: `init-${orderId}`,
                action_source: "website",
                custom_data: {
                  currency: "BRL",
                  value: Number(value)
                }
              }
            ]
          })
        }
      );
    }

    // =====================================================
    // PURCHASE (Pedido Aprovado)
    // =====================================================
    if (eventType === "order.approved") {

      // GA4 - purchase
      await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
        {
          method: "POST",
          body: JSON.stringify({
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
          })
        }
      );

      // META - Purchase
      await fetch(
        `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: [
              {
                event_name: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                event_id: `purchase-${orderId}`,
                action_source: "website",
                custom_data: {
                  currency: "BRL",
                  value: Number(value)
                }
              }
            ]
          })
        }
      );
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
