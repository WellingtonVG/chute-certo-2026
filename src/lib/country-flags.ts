// ISO 3166-1 alpha-2 codes for FlagsAPI (https://flagsapi.com/)
const countryCodeMap: Record<string, string> = {
  "México": "MX",
  "África do Sul": "ZA",
  "Africa do Sul": "ZA",
  "Coreia do Sul": "KR",
  "Tchéquia": "CZ",
  "Canadá": "CA",
  "Bósnia e Herzegovina": "BA",
  "Catar": "QA",
  "Suíça": "CH",
  "Brasil": "BR",
  "Marrocos": "MA",
  "Haiti": "HT",
  "Escócia": "GB",
  "EUA": "US",
  "Estados Unidos": "US",
  "Paraguai": "PY",
  "Austrália": "AU",
  "Turquia": "TR",
  "Alemanha": "DE",
  "Curaçau": "CW",
  "Curaçao": "CW",
  "Costa do Marfim": "CI",
  "Equador": "EC",
  "Holanda": "NL",
  "Países Baixos": "NL",
  "Japão": "JP",
  "Suécia": "SE",
  "Tunísia": "TN",
  "Bélgica": "BE",
  "Egito": "EG",
  "Irã": "IR",
  "Nova Zelândia": "NZ",
  "Espanha": "ES",
  "Cabo Verde": "CV",
  "Arábia Saudita": "SA",
  "Uruguai": "UY",
  "França": "FR",
  "Senegal": "SN",
  "Iraque": "IQ",
  "Noruega": "NO",
  "Argentina": "AR",
  "Argélia": "DZ",
  "Áustria": "AT",
  "Jordânia": "JO",
  "Portugal": "PT",
  "RD do Congo": "CD",
  "RD Congo": "CD",
  "Rep. Dem. do Congo": "CD",
  "Uzbequistão": "UZ",
  "Colômbia": "CO",
  "Inglaterra": "GB",
  "Croácia": "HR",
  "Gana": "GH",
  "Panamá": "PA",
};

export type FlagSize = 16 | 24 | 32 | 48 | 64;
export type FlagStyle = "flat" | "shiny";

export const getCountryCode = (teamName: string): string | null =>
  countryCodeMap[teamName] ?? null;

export const getFlagUrl = (
  teamName: string,
  size: FlagSize = 24,
  style: FlagStyle = "flat"
): string | null => {
  const code = getCountryCode(teamName);
  if (!code) return null;
  return `https://flagsapi.com/${code}/${style}/${size}.png`;
};

// All 48 teams — names aligned with sync-fixtures / database
export const allTeams = [
  "México", "África do Sul", "Coreia do Sul", "Tchéquia",
  "Canadá", "Bósnia e Herzegovina", "Catar", "Suíça",
  "Brasil", "Marrocos", "Haiti", "Escócia",
  "EUA", "Paraguai", "Austrália", "Turquia",
  "Alemanha", "Curaçau", "Costa do Marfim", "Equador",
  "Holanda", "Japão", "Suécia", "Tunísia",
  "Bélgica", "Egito", "Irã", "Nova Zelândia",
  "Espanha", "Cabo Verde", "Arábia Saudita", "Uruguai",
  "França", "Senegal", "Iraque", "Noruega",
  "Argentina", "Argélia", "Áustria", "Jordânia",
  "Portugal", "RD do Congo", "Uzbequistão", "Colômbia",
  "Inglaterra", "Croácia", "Gana", "Panamá",
];
