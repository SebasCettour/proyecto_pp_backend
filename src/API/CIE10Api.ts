export const buscarCIE10BioPortal = async (query: string, apikey: string) => {
  const url = `https://data.bioontology.org/search?q=${encodeURIComponent(
    query
  )}&ontologies=ICD10CM&include=prefLabel,synonym,notation&pagesize=10`;
  const response = await fetch(url, {
    headers: {
      Authorization: `apikey token=${apikey}`,
      Accept: "application/json",
      "Accept-Language": "es", //no funciona
    },
  });

  if (!response.ok) throw new Error("Error al consultar CIE-10 BioPortal");

  const data = await response.json();
  return data;
};
