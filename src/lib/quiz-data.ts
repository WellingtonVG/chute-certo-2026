// World Cup Quiz data engine — generated from quiz_banco_dados_v2.json

export type QuizLevel = "easy" | "medium" | "hard";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  level: QuizLevel;
  category: string;
  editionYear?: number;
  _altAnswers?: string[];
}

interface TopScorer {
  name: string;
  country: string;
  goals: number;
}

interface Edition {
  year: number;
  host: string;
  champion: string;
  runner_up: string;
  final_score: string | null;
  top_scorer: TopScorer | TopScorer[] | null;
  best_player: string;
  best_player_country: string;
  use_final_score: boolean;
}

interface TriviaQ {
  id: string;
  question: string;
  answer: string;
  options: string[];
}

// ── Preposition helper for PT-BR ("na Alemanha", "no Brasil", "nos EUA") ──
const PREPOSITION_MAP: Record<string, string> = {
  "Uruguai": "no Uruguai",
  "Itália": "na Itália",
  "França": "na França",
  "Brasil": "no Brasil",
  "Suíça": "na Suíça",
  "Suécia": "na Suécia",
  "Chile": "no Chile",
  "Inglaterra": "na Inglaterra",
  "México": "no México",
  "Alemanha Ocidental": "na Alemanha Ocidental",
  "Alemanha": "na Alemanha",
  "Argentina": "na Argentina",
  "Espanha": "na Espanha",
  "EUA": "nos EUA",
  "Estados Unidos": "nos Estados Unidos",
  "Coreia do Sul / Japão": "na Coreia do Sul / Japão",
  "Coreia do Sul e Japão": "na Coreia do Sul e Japão",
  "África do Sul": "na África do Sul",
  "Rússia": "na Rússia",
  "Qatar": "no Qatar",
  "Catar": "no Catar",
};

function withPreposition(country: string): string {
  return PREPOSITION_MAP[country] || `em ${country}`;
}

// ── Raw data ──
const editions: Edition[] = [
  { year: 1930, host: "Uruguai", champion: "Uruguai", runner_up: "Argentina", final_score: "4x2", top_scorer: { name: "Guillermo Stábile", country: "Argentina", goals: 8 }, best_player: "José Nasazzi", best_player_country: "Uruguai", use_final_score: true },
  { year: 1934, host: "Itália", champion: "Itália", runner_up: "Tchecoslováquia", final_score: "2x1", top_scorer: { name: "Oldřich Nejedlý", country: "Tchecoslováquia", goals: 5 }, best_player: "Giuseppe Meazza", best_player_country: "Itália", use_final_score: true },
  { year: 1938, host: "França", champion: "Itália", runner_up: "Hungria", final_score: "4x2", top_scorer: { name: "Leônidas da Silva", country: "Brasil", goals: 8 }, best_player: "Leônidas da Silva", best_player_country: "Brasil", use_final_score: true },
  { year: 1950, host: "Brasil", champion: "Uruguai", runner_up: "Brasil", final_score: null, top_scorer: { name: "Ademir de Menezes", country: "Brasil", goals: 9 }, best_player: "Zizinho", best_player_country: "Brasil", use_final_score: false },
  { year: 1954, host: "Suíça", champion: "Alemanha Ocidental", runner_up: "Hungria", final_score: "3x2", top_scorer: { name: "Sándor Kocsis", country: "Hungria", goals: 11 }, best_player: "Ferenc Puskás", best_player_country: "Hungria", use_final_score: true },
  { year: 1958, host: "Suécia", champion: "Brasil", runner_up: "Suécia", final_score: "5x2", top_scorer: { name: "Just Fontaine", country: "França", goals: 13 }, best_player: "Didi", best_player_country: "Brasil", use_final_score: true },
  { year: 1962, host: "Chile", champion: "Brasil", runner_up: "Tchecoslováquia", final_score: "3x1", top_scorer: null, best_player: "Garrincha", best_player_country: "Brasil", use_final_score: true },
  { year: 1966, host: "Inglaterra", champion: "Inglaterra", runner_up: "Alemanha Ocidental", final_score: "4x2", top_scorer: { name: "Eusébio", country: "Portugal", goals: 9 }, best_player: "Bobby Charlton", best_player_country: "Inglaterra", use_final_score: true },
  { year: 1970, host: "México", champion: "Brasil", runner_up: "Itália", final_score: "4x1", top_scorer: { name: "Gerd Müller", country: "Alemanha Ocidental", goals: 10 }, best_player: "Pelé", best_player_country: "Brasil", use_final_score: true },
  { year: 1974, host: "Alemanha Ocidental", champion: "Alemanha Ocidental", runner_up: "Holanda", final_score: "2x1", top_scorer: { name: "Grzegorz Lato", country: "Polônia", goals: 7 }, best_player: "Johan Cruyff", best_player_country: "Holanda", use_final_score: true },
  { year: 1978, host: "Argentina", champion: "Argentina", runner_up: "Holanda", final_score: null, top_scorer: { name: "Mario Kempes", country: "Argentina", goals: 6 }, best_player: "Mario Kempes", best_player_country: "Argentina", use_final_score: false },
  { year: 1982, host: "Espanha", champion: "Itália", runner_up: "Alemanha Ocidental", final_score: "3x0", top_scorer: { name: "Paolo Rossi", country: "Itália", goals: 6 }, best_player: "Paolo Rossi", best_player_country: "Itália", use_final_score: true },
  { year: 1986, host: "México", champion: "Argentina", runner_up: "Alemanha Ocidental", final_score: "3x2", top_scorer: { name: "Gary Lineker", country: "Inglaterra", goals: 6 }, best_player: "Diego Maradona", best_player_country: "Argentina", use_final_score: true },
  { year: 1990, host: "Itália", champion: "Alemanha Ocidental", runner_up: "Argentina", final_score: "1x0", top_scorer: { name: "Salvatore Schillaci", country: "Itália", goals: 6 }, best_player: "Salvatore Schillaci", best_player_country: "Itália", use_final_score: true },
  { year: 1994, host: "EUA", champion: "Brasil", runner_up: "Itália", final_score: "0x0 (pên. 3x2)", top_scorer: [{ name: "Hristo Stoichkov", country: "Bulgária", goals: 6 }, { name: "Oleg Salenko", country: "Rússia", goals: 6 }], best_player: "Romário", best_player_country: "Brasil", use_final_score: true },
  { year: 1998, host: "França", champion: "França", runner_up: "Brasil", final_score: "3x0", top_scorer: { name: "Davor Šuker", country: "Croácia", goals: 6 }, best_player: "Ronaldo", best_player_country: "Brasil", use_final_score: true },
  { year: 2002, host: "Coreia do Sul / Japão", champion: "Brasil", runner_up: "Alemanha", final_score: "2x0", top_scorer: { name: "Ronaldo", country: "Brasil", goals: 8 }, best_player: "Oliver Kahn", best_player_country: "Alemanha", use_final_score: true },
  { year: 2006, host: "Alemanha", champion: "Itália", runner_up: "França", final_score: "1x1 (pên. 5x3)", top_scorer: { name: "Miroslav Klose", country: "Alemanha", goals: 5 }, best_player: "Zinedine Zidane", best_player_country: "França", use_final_score: true },
  { year: 2010, host: "África do Sul", champion: "Espanha", runner_up: "Holanda", final_score: "1x0", top_scorer: { name: "Thomas Müller", country: "Alemanha", goals: 5 }, best_player: "Diego Forlán", best_player_country: "Uruguai", use_final_score: true },
  { year: 2014, host: "Brasil", champion: "Alemanha", runner_up: "Argentina", final_score: "1x0", top_scorer: { name: "James Rodríguez", country: "Colômbia", goals: 6 }, best_player: "Lionel Messi", best_player_country: "Argentina", use_final_score: true },
  { year: 2018, host: "Rússia", champion: "França", runner_up: "Croácia", final_score: "4x2", top_scorer: { name: "Harry Kane", country: "Inglaterra", goals: 6 }, best_player: "Luka Modric", best_player_country: "Croácia", use_final_score: true },
  { year: 2022, host: "Qatar", champion: "Argentina", runner_up: "França", final_score: "3x3 (pên. 4x2)", top_scorer: { name: "Kylian Mbappé", country: "França", goals: 8 }, best_player: "Lionel Messi", best_player_country: "Argentina", use_final_score: true },
];

const triviaEasy: TriviaQ[] = [
  { id: "t_e_01", question: "Qual é o único país a ter participado de todas as edições da Copa do Mundo?", answer: "Brasil", options: ["Alemanha", "Argentina", "Brasil", "Itália"] },
  { id: "t_e_02", question: "Quem é o único jogador tricampeão mundial como jogador?", answer: "Pelé", options: ["Pelé", "Garrincha", "Ronaldo", "Cafu"] },
  { id: "t_e_03", question: "Em que Copa do Mundo Zidane foi expulso na final após uma cabeçada?", answer: "2006", options: ["2002", "2006", "2010", "1998"] },
  { id: "t_e_04", question: "Quem perdeu o pênalti decisivo na final da Copa de 1994?", answer: "Roberto Baggio", options: ["Roberto Baggio", "Maldini", "Baresi", "Albertini"] },
  { id: "t_e_05", question: "A Copa do Mundo de 2022 foi a primeira realizada em qual região do mundo?", answer: "Oriente Médio", options: ["Oriente Médio", "África", "Ásia Oriental", "Oceania"] },
  { id: "t_e_06", question: "Qual é o único goleiro a ser eleito melhor jogador de uma Copa do Mundo?", answer: "Oliver Kahn", options: ["Oliver Kahn", "Buffon", "Casillas", "Neuer"] },
  { id: "t_e_07", question: "Qual foi o placar da goleada da Alemanha sobre o Brasil na semifinal de 2014?", answer: "7x1", options: ["5x0", "6x0", "7x1", "7x0"] },
  { id: "t_e_08", question: "Em que edição a Copa do Mundo não teve uma final clássica, sendo decidida em rodada de grupos?", answer: "1950", options: ["1930", "1950", "1954", "1962"] },
];

const triviaMedium: TriviaQ[] = [
  { id: "t_m_01", question: "Qual jogador marcou gols em todas as partidas da Copa do Mundo de 1970?", answer: "Jairzinho", options: ["Jairzinho", "Pelé", "Tostão", "Gerd Müller"] },
  { id: "t_m_02", question: "Qual é o recorde de gols em uma única edição da Copa do Mundo?", answer: "13 gols", options: ["11 gols", "12 gols", "13 gols", "14 gols"] },
  { id: "t_m_03", question: "Qual país disputou mais finais de Copa do Mundo sem vencer nenhuma?", answer: "Holanda", options: ["Holanda", "Hungria", "Croácia", "Tchecoslováquia"] },
];

const triviaHard: TriviaQ[] = [
  { id: "t_h_01", question: "Quem marcou o primeiro gol da história das Copas do Mundo?", answer: "Lucien Laurent (França)", options: ["Lucien Laurent (França)", "Guillermo Stábile (Argentina)", "Pedro Cea (Uruguai)", "Bert Patenaude (EUA)"] },
  { id: "t_h_02", question: "Quem marcou 5 gols em uma única partida de Copa do Mundo?", answer: "Oleg Salenko", options: ["Oleg Salenko", "Just Fontaine", "Gerd Müller", "Eusébio"] },
  { id: "t_h_03", question: "Quais países foram campeões da Copa do Mundo jogando em casa?", answer: "Uruguai, Itália, Inglaterra, Alemanha, Argentina e França", options: ["Uruguai, Itália, Inglaterra, Alemanha, Argentina e França", "Brasil, Uruguai, Itália e França", "Uruguai, Itália, Brasil, Argentina e França", "Itália, Inglaterra, Alemanha e França"] },
];

// ── Helpers ──
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getFirstScorer(e: Edition): TopScorer | null {
  if (!e.top_scorer) return null;
  return Array.isArray(e.top_scorer) ? e.top_scorer[0] : e.top_scorer;
}

function getAllScorerNames(e: Edition): string[] {
  if (!e.top_scorer) return [];
  if (Array.isArray(e.top_scorer)) return e.top_scorer.map(s => s.name);
  return [e.top_scorer.name];
}

// Player distractor pool: scorers + best players from ±2 editions window
function playerDistractorPool(editionIndex: number, excludeNames: string[]): string[] {
  const window = 2;
  const start = Math.max(0, editionIndex - window);
  const end = Math.min(editions.length - 1, editionIndex + window);
  const pool = new Set<string>();
  for (let i = start; i <= end; i++) {
    pool.add(editions[i].best_player);
    const scorer = getFirstScorer(editions[i]);
    if (scorer) pool.add(scorer.name);
  }
  // Also add best_player of own edition if asking about scorer, and vice versa
  pool.add(editions[editionIndex].best_player);
  const ownScorer = getFirstScorer(editions[editionIndex]);
  if (ownScorer) pool.add(ownScorer.name);

  for (const name of excludeNames) pool.delete(name);
  
  // If pool too small, expand to all editions
  if (pool.size < 3) {
    for (const e of editions) {
      pool.add(e.best_player);
      const s = getFirstScorer(e);
      if (s) pool.add(s.name);
    }
    for (const name of excludeNames) pool.delete(name);
  }
  return [...pool];
}

function pickDistractors(correct: string, pool: string[], count = 3): string[] {
  const filtered = [...new Set(pool.filter(v => v !== correct))];
  return shuffle(filtered).slice(0, count);
}

// Difficulty map
const DIFFICULTY_MAP: Record<QuizLevel, string[]> = {
  easy: ["champion", "host", "trivia_easy"],
  medium: ["runner_up", "best_player", "top_scorer_name", "trivia_medium"],
  hard: ["top_scorer_goals", "top_scorer_country", "final_score", "trivia_hard"],
};

// ── Generate all questions ──
function generateAllQuestions(): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const allChampions = [...new Set(editions.map(e => e.champion))];
  const allHosts = [...new Set(editions.map(e => e.host))];
  const allRunnerUps = [...new Set(editions.map(e => e.runner_up))];
  const allYears = editions.map(e => String(e.year));
  const allCountries = [...new Set(editions.filter(e => e.top_scorer).map(e => {
    const s = getFirstScorer(e);
    return s ? s.country : "";
  }).filter(Boolean))];
  const allFinalScores = [...new Set(editions.filter(e => e.use_final_score && e.final_score).map(e => e.final_score!))];
  const allGoals = [...new Set(editions.filter(e => e.top_scorer).map(e => {
    const s = getFirstScorer(e);
    return s ? `${s.goals} gols` : "";
  }).filter(Boolean))];

  for (let idx = 0; idx < editions.length; idx++) {
    const e = editions[idx];

    // EASY: Champion by year
    questions.push({
      question: `Quem venceu a Copa do Mundo de ${e.year}?`,
      correctAnswer: e.champion,
      options: shuffle([e.champion, ...pickDistractors(e.champion, allChampions)]),
      level: "easy", category: "champion", editionYear: e.year,
    });

    // EASY: Year champion won at host
    questions.push({
      question: `Em que ano ${e.champion} venceu a Copa realizada ${withPreposition(e.host)}?`,
      correctAnswer: String(e.year),
      options: shuffle([String(e.year), ...pickDistractors(String(e.year), allYears)]),
      level: "easy", category: "champion", editionYear: e.year,
    });

    // EASY: Host by year
    questions.push({
      question: `Em qual país foi realizada a Copa do Mundo de ${e.year}?`,
      correctAnswer: e.host,
      options: shuffle([e.host, ...pickDistractors(e.host, allHosts)]),
      level: "easy", category: "host", editionYear: e.year,
    });

    // MEDIUM: Runner-up
    questions.push({
      question: `Qual país foi vice-campeão da Copa de ${e.year}?`,
      correctAnswer: e.runner_up,
      options: shuffle([e.runner_up, ...pickDistractors(e.runner_up, allRunnerUps)]),
      level: "medium", category: "runner_up", editionYear: e.year,
    });

    // MEDIUM: Best player
    questions.push({
      question: `Quem foi eleito o melhor jogador da Copa de ${e.year}?`,
      correctAnswer: e.best_player,
      options: shuffle([e.best_player, ...pickDistractors(e.best_player, playerDistractorPool(idx, [e.best_player]))]),
      level: "medium", category: "best_player", editionYear: e.year,
    });

    // MEDIUM: Top scorer name (skip 1962)
    if (e.top_scorer) {
      const names = getAllScorerNames(e);
      const primary = names[0];
      const excludeFromPool = [...names];
      questions.push({
        question: `Quem foi o artilheiro da Copa de ${e.year}?`,
        correctAnswer: primary,
        options: shuffle([primary, ...pickDistractors(primary, playerDistractorPool(idx, excludeFromPool))]),
        level: "medium", category: "top_scorer_name", editionYear: e.year,
        ...(names.length > 1 ? { _altAnswers: names } : {}),
      });
    }

    // HARD: Top scorer goals (skip 1962)
    if (e.top_scorer) {
      const scorer = getFirstScorer(e)!;
      const goalStr = `${scorer.goals} gols`;
      questions.push({
        question: `Quantos gols ${scorer.name} marcou na Copa de ${e.year}?`,
        correctAnswer: goalStr,
        options: shuffle([goalStr, ...pickDistractors(goalStr, allGoals)]),
        level: "hard", category: "top_scorer_goals", editionYear: e.year,
      });
    }

    // HARD: Top scorer country (skip 1962)
    if (e.top_scorer) {
      const scorer = getFirstScorer(e)!;
      questions.push({
        question: `De qual país era o artilheiro da Copa de ${e.year}?`,
        correctAnswer: scorer.country,
        options: shuffle([scorer.country, ...pickDistractors(scorer.country, allCountries)]),
        level: "hard", category: "top_scorer_country", editionYear: e.year,
      });
    }

    // HARD: Final score (skip 1950 and 1978)
    if (e.use_final_score && e.final_score) {
      questions.push({
        question: `Qual foi o placar da final da Copa de ${e.year}?`,
        correctAnswer: e.final_score,
        options: shuffle([e.final_score, ...pickDistractors(e.final_score, allFinalScores)]),
        level: "hard", category: "final_score", editionYear: e.year,
      });
    }
  }

  // Trivia
  for (const t of triviaEasy) {
    questions.push({ question: t.question, correctAnswer: t.answer, options: shuffle(t.options), level: "easy", category: "trivia_easy" });
  }
  for (const t of triviaMedium) {
    questions.push({ question: t.question, correctAnswer: t.answer, options: shuffle(t.options), level: "medium", category: "trivia_medium" });
  }
  for (const t of triviaHard) {
    questions.push({ question: t.question, correctAnswer: t.answer, options: shuffle(t.options), level: "hard", category: "trivia_hard" });
  }

  return questions;
}

// ── Anti-spoiler: ensure same-edition questions are ≥3 apart ──
function antiSpoiler(questions: QuizQuestion[]): QuizQuestion[] {
  const result: QuizQuestion[] = [];
  const recent: (number | undefined)[] = [];

  const remaining = [...questions];
  const maxAttempts = remaining.length * 3;
  let attempts = 0;

  while (remaining.length > 0 && attempts < maxAttempts) {
    attempts++;
    let placed = false;
    for (let i = 0; i < remaining.length; i++) {
      const q = remaining[i];
      const year = q.editionYear;
      if (year && recent.slice(-3).includes(year)) continue;
      result.push(q);
      recent.push(year);
      remaining.splice(i, 1);
      placed = true;
      break;
    }
    if (!placed) {
      result.push(remaining.shift()!);
      recent.push(result[result.length - 1].editionYear);
    }
  }
  result.push(...remaining);
  return result;
}

// ── Pick questions with variety + fallback to always reach count ──
export function pickQuestions(level: QuizLevel | "all", count: number): QuizQuestion[] {
  const all = generateAllQuestions();
  const pool = level === "all" ? all : all.filter(q => q.level === level);
  const shuffled = shuffle(pool);

  const maxPerCategory = Math.max(2, Math.ceil(count * 0.4));
  const categoryCounts: Record<string, number> = {};
  const selected: QuizQuestion[] = [];
  const usedIndices = new Set<number>();

  // Pass 1: respect 40% variety cap
  for (let i = 0; i < shuffled.length && selected.length < count; i++) {
    const q = shuffled[i];
    const cat = q.category;
    const currentCount = categoryCounts[cat] || 0;
    if (currentCount >= maxPerCategory) continue;
    categoryCounts[cat] = currentCount + 1;
    selected.push(q);
    usedIndices.add(i);
  }

  // Pass 2: fallback — fill remaining slots ignoring category limits
  if (selected.length < count) {
    const usedEditions = new Set(selected.map(q => q.editionYear).filter(Boolean));
    const remaining = shuffled
      .map((q, i) => ({ q, i }))
      .filter(({ i }) => !usedIndices.has(i));
    remaining.sort((a, b) => {
      const aUsed = a.q.editionYear && usedEditions.has(a.q.editionYear) ? 1 : 0;
      const bUsed = b.q.editionYear && usedEditions.has(b.q.editionYear) ? 1 : 0;
      return aUsed - bUsed;
    });
    for (const { q } of remaining) {
      if (selected.length >= count) break;
      selected.push(q);
    }
  }

  return antiSpoiler(selected);
}

export function checkAnswer(question: QuizQuestion, answer: string): boolean {
  if (answer === question.correctAnswer) return true;
  if (question._altAnswers) return question._altAnswers.includes(answer);
  return false;
}
