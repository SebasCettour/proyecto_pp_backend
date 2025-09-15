import { Router, Request, Response } from "express";

const router = Router();

const CLIENT_ID = process.env.CIE10_CLIENT_ID!;
const CLIENT_SECRET = process.env.CIE10_CLIENT_SECRET!;

interface Diagnostico {
  codigo: string;
  descripcion: string;
}

// Obtener token de acceso
async function getAccessToken(): Promise<string> {
  const res = await fetch(
    "https://icdapihome2-eme0b9bdf4fafkbg.northeurope-01.azurewebsites.net/icdapi/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
    }
  );

  if (!res.ok) {
    throw new Error(`Error obteniendo token CIE-10: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// Ruta de búsqueda de diagnósticos
router.get(
  "/search",
  async (req: any, res: any) => {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ error: "query required" });
    }

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `https://icdapihome2-eme0b9bdf4fafkbg.northeurope-01.azurewebsites.net/icdapi/icd10cm/codes?description=${encodeURIComponent(
          query
        )}&$top=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: "Error fetching CIE-10 codes" });
      }

      const results = (await response.json()) as Diagnostico[];
      return res.json(results);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error fetching CIE-10" });
    }
  }
);

export default router;
