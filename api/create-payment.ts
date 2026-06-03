import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { clientId, amount, description, ownerId, clientName } = req.body;
    if (!amount || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return res.status(500).json({ error: "Mercado Pago token not configured" });
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            id: clientId || "monthly-fee",
            title: description,
            quantity: 1,
            unit_price: Number(amount)
          }
        ],
        external_reference: JSON.stringify({ clientId, ownerId, clientName }),
        notification_url: "https://anima-system.vercel.app/api/webhook/mercadopago",
      }
    });

    return res.status(200).json({ id: response.id, init_point: response.init_point });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
