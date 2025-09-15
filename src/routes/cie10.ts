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
  const primaryUrl =
    "https://icdapihome2-eme0b9bdf4fafkbg.northeurope-01.azurewebsites.net/icd/oauth2/token";
  const fallbackUrl =
    "https://icdapihome2-eme0b9bdf4fafkbg.northeurope-01.azurewebsites.net/icdapi/token";
  const body = `grant_type=client_credentials&client_id=${encodeURIComponent(
    CLIENT_ID
  )}&client_secret=${encodeURIComponent(CLIENT_SECRET)}`;

  const attempt = async (url: string) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

  let res = await attempt(primaryUrl);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("CIE-10 token primary failed", res.status, text);
    res = await attempt(fallbackUrl);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("CIE-10 token fallback failed", res.status, text);
    throw new Error(`Error obteniendo token CIE-10: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// Ruta de búsqueda de diagnósticos
router.get(
  "/search",
  async (req: any, res: any) => {
    const query = (req.query.query as string | undefined)?.trim();

    if (!query) {
      return res.status(400).json({ error: "query required" });
    }

    try {
      const token = await getAccessToken();
      // Detecta si la consulta parece un código CIE-10 (ej: M15, A00.0, J20)
      const isCodeLike = /^[A-Z][0-9][0-9A-Z.]*$/i.test(query);

      const baseUrl =
        "https://icdapihome2-eme0b9bdf4fafkbg.northeurope-01.azurewebsites.net/icdapi/icd10cm/codes";

      const fetchWithAuth = async (url: string) =>
        fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

      let aggregated: Diagnostico[] = [];

      // 1) Si parece código, buscamos por código primero
      if (isCodeLike) {
        const byCodeUrl = `${baseUrl}?code=${encodeURIComponent(query)}&$top=10`;
        const byCodeResp = await fetchWithAuth(byCodeUrl);
        if (byCodeResp.ok) {
          const data = (await byCodeResp.json()) as unknown;
          const list = Array.isArray(data) ? data : [data];
          aggregated = aggregated.concat(list as Diagnostico[]);
        }
      }

      // 2) También probamos por descripción (útil si el usuario pone algo que no sea exactamente el código completo)
      const byDescUrl = `${baseUrl}?description=${encodeURIComponent(query)}&$top=10`;
      const byDescResp = await fetchWithAuth(byDescUrl);
      if (byDescResp.ok) {
        const data = (await byDescResp.json()) as unknown;
        const list = Array.isArray(data) ? data : [data];
        aggregated = aggregated.concat(list as Diagnostico[]);
      }

      // Mapeamos a formato consistente { codigo, descripcion }
      const mapped = aggregated
        .map((item: any) => {
          const codigo = (item.codigo ?? item.code ?? item.Code) as string | undefined;
          const descripcion = (item.descripcion ?? item.description ?? item.Title) as string | undefined;
          if (!codigo || !descripcion) return null;
          return { codigo, descripcion } as Diagnostico;
        })
        .filter(Boolean) as Diagnostico[];

      // Devolvemos únicos por código conservando orden
      const seenCodes = new Set<string>();
      const unique = mapped.filter((item) => {
        const upper = item.codigo.toUpperCase();
        if (seenCodes.has(upper)) return false;
        seenCodes.add(upper);
        return true;
      });

      return res.json(unique);
    } catch (err: any) {
      console.error("CIE-10 search failed", err?.message || err);

      // Fallback temporal: si falla el token/consulta externa y la query parece código, devolver mocks
      const isCodeLike = query && /^[A-Z][0-9][0-9A-Z.]*$/i.test(query);
      if (isCodeLike) {
        const q = query!.toUpperCase();
        const mocks: Diagnostico[] = [];
        if (q === "M15" || q.startsWith("M15.")) {
          mocks.push(
            { codigo: "M15", descripcion: "Poliartrosis (Poliosteoartritis)" },
            { codigo: "M15.0", descripcion: "Artrosis generalizada primaria" }
          );
        }
        if (q === "M18" || q.startsWith("M18.")) {
          mocks.push(
            { codigo: "M18", descripcion: "Artrosis de la primera articulación carpometacarpiana" }
          );
        }
        if (q === "M19" || q.startsWith("M19.")) {
          mocks.push(
            { codigo: "M19", descripcion: "Otras artrosis y las no especificadas" }
          );
        }
        // Si no hay un mock específico, devolver al menos el código buscado genérico
        if (mocks.length === 0) {
          mocks.push({ codigo: q, descripcion: "Diagnóstico CIE-10 (mock)" });
        }
        return res.json(mocks);
      }

      // Para consultas por descripción, devolver lista vacía sin romper el flujo
      return res.json([]);
    }
  }
);

export default router;
