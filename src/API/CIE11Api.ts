export const clientId =
  "a5077ffc-a40f-4412-a85e-05e9a7f6886f_07e7976b-d016-44e3-8ea3-4572e55387fa";
export const clientSecret = "ZQxR6UEHRjb0degv95SR10JdmQNsWJn/t29GMFi345Q=";

export const obtenerToken = async (): Promise<string> => {
  const url =
    "https://icdapihome2-eme0b9bdf4fafkbg.northeurope-01.azurewebsites.net/icd/oauth2/token";
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) throw new Error("Error al obtener token de CIE-10");

  const data = await response.json();
  return data.access_token;
};
