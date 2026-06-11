/** Palpites especiais travam em 15/06/2026 às 20h (horário de Brasília). */
export const SEASON_PREDICTIONS_DEADLINE = new Date("2026-06-15T20:00:00-03:00");

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

export function isSeasonPredictionOpen(now = new Date()) {
  return now < SEASON_PREDICTIONS_DEADLINE;
}

export function getSeasonPredictionsDeadlineLabel() {
  return formatDeadline(SEASON_PREDICTIONS_DEADLINE);
}
