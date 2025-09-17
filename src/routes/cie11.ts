import { Router, Request, Response } from "express";

const router = Router();

const CLIENT_ID = process.env.CIE10_CLIENT_ID!;
const CLIENT_SECRET = process.env.CIE10_CLIENT_SECRET!;

interface Diagnostico {
  codigo: string;
  descripcion: string;
}

// Obtener token de acceso desde la OMS
async function getAccessToken(): Promise<string> {
  const url = "https://icdaccessmanagement.who.int/connect/token";
  const body = `grant_type=client_credentials&client_id=${encodeURIComponent(
    CLIENT_ID
  )}&client_secret=${encodeURIComponent(CLIENT_SECRET)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error obteniendo token CIE-10: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Ruta de búsqueda de diagnósticos ICD-11 por código o descripción
router.get(
  "/search",
  async (req: Request, res: Response) => {
    const query = (req.query.query as string | undefined)?.trim();

    if (!query) {
      return res.status(400).json({ error: "query required" });
    }

    try {
      const token = await getAccessToken();
      // Detecta si la consulta parece un código ICD (ej: 1A00, MG30.0, etc)
      const isCodeLike = /^[A-Z0-9][A-Z0-9.]{2,}$/i.test(query);

      // OMS: Para ICD-11 MMS, el endpoint de búsqueda es:
      // https://id.who.int/icd/release/11/2024-01/mms/search?q=QUERY
      const baseUrl =
        "https://id.who.int/icd/release/11/2024-01/mms/search";

      const fetchWithAuth = async (url: string) =>
        fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "API-Version": "v2",
            Accept: "application/json",
            "Accept-Language": "en",
          },
        });

      let aggregated: Diagnostico[] = [];

      // 1) Buscar por código si parece código
      if (isCodeLike) {
        const byCodeUrl = `${baseUrl}?q=${encodeURIComponent(query)}&useFlexisearch=false`;
        const byCodeResp = await fetchWithAuth(byCodeUrl);
        console.log("byCodeUrl:", byCodeUrl, "status:", byCodeResp.status);
        const byCodeText = await byCodeResp.clone().text();
        console.log("byCodeResp body:", byCodeText);
        if (byCodeResp.ok) {
          const data = JSON.parse(byCodeText);
          if (Array.isArray(data.destinationEntities)) {
            aggregated = aggregated.concat(
              data.destinationEntities.map((item: any) => ({
                codigo: item.theCode,
                descripcion: item.title?.["@value"] || item.title || "",
              }))
            );
          }
        }
      }

      // 2) Buscar por descripción (siempre)
      const byDescUrl = `${baseUrl}?q=${encodeURIComponent(query)}&useFlexisearch=true`;
      const byDescResp = await fetchWithAuth(byDescUrl);
      console.log("byDescUrl:", byDescUrl, "status:", byDescResp.status);
      const byDescText = await byDescResp.clone().text();
      console.log("byDescResp body:", byDescText);
      if (byDescResp.ok) {
        const data = JSON.parse(byDescText);
        if (Array.isArray(data.destinationEntities)) {
          aggregated = aggregated.concat(
            data.destinationEntities.map((item: any) => ({
              codigo: item.theCode,
              descripcion: item.title?.["@value"] || item.title || "",
            }))
          );
        }
      }

      // Devolvemos únicos por código conservando orden
      const seenCodes = new Set<string>();
      const unique = aggregated.filter((item) => {
        const upper = item.codigo?.toUpperCase();
        if (!upper || seenCodes.has(upper)) return false;
        seenCodes.add(upper);
        return true;
      });

      return res.json(unique);
    } catch (err: any) {
      console.error("CIE-11 search failed", err?.message || err);

      // Fallback temporal: si falla el token/consulta externa y la query parece código, devolver mocks
      const isCodeLike = query && /^[A-Z0-9][A-Z0-9.]{2,}$/i.test(query);
      if (isCodeLike) {
        const q = query!.toUpperCase();
        const mocks: Diagnostico[] = [
          { codigo: q, descripcion: "Diagnóstico ICD-11 (mock)" },
        ];
        return res.json(mocks);
      }

      // Para consultas por descripción, devolver lista vacía sin romper el flujo
      return res.json([]);
    }
  }
);

export default router;
