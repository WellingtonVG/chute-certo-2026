// Mapping of country names (as stored in DB) to emoji flags
const flagMap: Record<string, string> = {
  // Group A
  "México": "🇲🇽",
  "Africa do Sul": "🇿🇦",
  "África do Sul": "🇿🇦",
  "Coreia do Sul": "🇰🇷",
  "Tchéquia": "🇨🇿",
  // Group B
  "Canadá": "🇨🇦",
  "Bósnia e Herzegovina": "🇧🇦",
  "Catar": "🇶🇦",
  "Suíça": "🇨🇭",
  // Group C
  "Brasil": "🇧🇷",
  "Marrocos": "🇲🇦",
  "Haiti": "🇭🇹",
  "Escócia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  // Group D
  "Estados Unidos": "🇺🇸",
  "Paraguai": "🇵🇾",
  "Austrália": "🇦🇺",
  "Turquia": "🇹🇷",
  // Group E
  "Alemanha": "🇩🇪",
  "Curaçao": "🇨🇼",
  "Costa do Marfim": "🇨🇮",
  "Equador": "🇪🇨",
  // Group F
  "Holanda": "🇳🇱",
  "Países Baixos": "🇳🇱",
  "Japão": "🇯🇵",
  "Suécia": "🇸🇪",
  "Tunísia": "🇹🇳",
  // Group G
  "Bélgica": "🇧🇪",
  "Egito": "🇪🇬",
  "Irã": "🇮🇷",
  "Nova Zelândia": "🇳🇿",
  // Group H
  "Espanha": "🇪🇸",
  "Cabo Verde": "🇨🇻",
  "Arábia Saudita": "🇸🇦",
  "Uruguai": "🇺🇾",
  // Group I
  "França": "🇫🇷",
  "Senegal": "🇸🇳",
  "Iraque": "🇮🇶",
  "Noruega": "🇳🇴",
  // Group J
  "Argentina": "🇦🇷",
  "Argélia": "🇩🇿",
  "Áustria": "🇦🇹",
  "Jordânia": "🇯🇴",
  // Group K
  "Portugal": "🇵🇹",
  "RD Congo": "🇨🇩",
  "Rep. Dem. do Congo": "🇨🇩",
  "Uzbequistão": "🇺🇿",
  "Colômbia": "🇨🇴",
  // Group L
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Croácia": "🇭🇷",
  "Gana": "🇬🇭",
  "Panamá": "🇵🇦",
};

export const getFlag = (teamName: string): string => {
  return flagMap[teamName] || "🏳️";
};

// All 48 teams for the champion selector
export const allTeams = [
  "México", "África do Sul", "Coreia do Sul", "Tchéquia",
  "Canadá", "Bósnia e Herzegovina", "Catar", "Suíça",
  "Brasil", "Marrocos", "Haiti", "Escócia",
  "Estados Unidos", "Paraguai", "Austrália", "Turquia",
  "Alemanha", "Curaçao", "Costa do Marfim", "Equador",
  "Holanda", "Japão", "Suécia", "Tunísia",
  "Bélgica", "Egito", "Irã", "Nova Zelândia",
  "Espanha", "Cabo Verde", "Arábia Saudita", "Uruguai",
  "França", "Senegal", "Iraque", "Noruega",
  "Argentina", "Argélia", "Áustria", "Jordânia",
  "Portugal", "RD Congo", "Uzbequistão", "Colômbia",
  "Inglaterra", "Croácia", "Gana", "Panamá",
];
