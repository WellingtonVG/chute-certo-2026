/** Prazos de palpite — especiais travam no 1º jogo da Copa (calculado dinamicamente no backend). */

const deadlineFormat: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
};

export function formatDeadline(date: Date) {
  return date.toLocaleString("pt-BR", deadlineFormat);
}

export function isMatchPredictionOpen(matchDate: string, now = new Date()) {
  return new Date(matchDate) > now;
}

/** Fallback local; o backend usa is_season_predictions_open() com o 1º jogo da Copa */
export function isSeasonPredictionOpen(now = new Date(), firstMatchDate?: string | null) {
  if (firstMatchDate) {
    return new Date(firstMatchDate) > now;
  }
  return now < new Date("2026-06-11T19:00:00Z");
}

export function getSeasonPredictionsDeadlineLabel(firstMatchDate?: string | null) {
  if (firstMatchDate) {
    return formatDeadline(new Date(firstMatchDate));
  }
  return formatDeadline(new Date("2026-06-11T19:00:00Z"));
}
