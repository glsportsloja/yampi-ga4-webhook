export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const body = req.body;

    const orderId = body?.id || body?.order_id || Date.now();
    const value = body?.total || body?.amount || 0;

    const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
    const GA4_API_SECRET = process.env.GA4_API_SECRET;

    const payload = {
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
        body: JSON.stringify(payload),
      }
    );

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
