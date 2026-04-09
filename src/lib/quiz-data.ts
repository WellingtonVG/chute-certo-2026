// World Cup Quiz data engine — generated from quiz_banco_dados_v3.json

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
  third_place: string | null;
  final_score: string | null;
  top_scorer: TopScorer | TopScorer[] | null;
  best_player: string;
  best_player_country: string;
  goalkeeper: string | null;
  goalkeeper_country: string | null;
  best_young: string | null;
  best_young_country: string | null;
  coach: string;
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
  { year: 1930, host: "Uruguai", champion: "Uruguai", runner_up: "Argentina", third_place: null, final_score: "4x2", top_scorer: { name: "Guillermo Stábile", country: "Argentina", goals: 8 }, best_player: "José Nasazzi", best_player_country: "Uruguai", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Alberto Suppici", use_final_score: true },
  { year: 1934, host: "Itália", champion: "Itália", runner_up: "Tchecoslováquia", third_place: "Alemanha", final_score: "2x1", top_scorer: { name: "Oldřich Nejedlý", country: "Tchecoslováquia", goals: 5 }, best_player: "Giuseppe Meazza", best_player_country: "Itália", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Vittorio Pozzo", use_final_score: true },
  { year: 1938, host: "França", champion: "Itália", runner_up: "Hungria", third_place: "Brasil", final_score: "4x2", top_scorer: { name: "Leônidas da Silva", country: "Brasil", goals: 8 }, best_player: "Leônidas da Silva", best_player_country: "Brasil", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Vittorio Pozzo", use_final_score: true },
  { year: 1950, host: "Brasil", champion: "Uruguai", runner_up: "Brasil", third_place: "Suécia", final_score: null, top_scorer: { name: "Ademir de Menezes", country: "Brasil", goals: 9 }, best_player: "Zizinho", best_player_country: "Brasil", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Juan López Fontana", use_final_score: false },
  { year: 1954, host: "Suíça", champion: "Alemanha", runner_up: "Hungria", third_place: "Áustria", final_score: "3x2", top_scorer: { name: "Sándor Kocsis", country: "Hungria", goals: 11 }, best_player: "Ferenc Puskás", best_player_country: "Hungria", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Sepp Herberger", use_final_score: true },
  { year: 1958, host: "Suécia", champion: "Brasil", runner_up: "Suécia", third_place: "França", final_score: "5x2", top_scorer: { name: "Just Fontaine", country: "França", goals: 13 }, best_player: "Didi", best_player_country: "Brasil", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Vicente Feola", use_final_score: true },
  { year: 1962, host: "Chile", champion: "Brasil", runner_up: "Tchecoslováquia", third_place: "Chile", final_score: "3x1", top_scorer: null, best_player: "Garrincha", best_player_country: "Brasil", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Aymoré Moreira", use_final_score: true },
  { year: 1966, host: "Inglaterra", champion: "Inglaterra", runner_up: "Alemanha", third_place: "Portugal", final_score: "4x2", top_scorer: { name: "Eusébio", country: "Portugal", goals: 9 }, best_player: "Bobby Charlton", best_player_country: "Inglaterra", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Alf Ramsey", use_final_score: true },
  { year: 1970, host: "México", champion: "Brasil", runner_up: "Itália", third_place: "Alemanha", final_score: "4x1", top_scorer: { name: "Gerd Müller", country: "Alemanha", goals: 10 }, best_player: "Pelé", best_player_country: "Brasil", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Mário Zagallo", use_final_score: true },
  { year: 1974, host: "Alemanha", champion: "Alemanha", runner_up: "Holanda", third_place: "Polônia", final_score: "2x1", top_scorer: { name: "Grzegorz Lato", country: "Polônia", goals: 7 }, best_player: "Johan Cruyff", best_player_country: "Holanda", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Helmut Schön", use_final_score: true },
  { year: 1978, host: "Argentina", champion: "Argentina", runner_up: "Holanda", third_place: "Brasil", final_score: null, top_scorer: { name: "Mario Kempes", country: "Argentina", goals: 6 }, best_player: "Mario Kempes", best_player_country: "Argentina", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "César Luis Menotti", use_final_score: false },
  { year: 1982, host: "Espanha", champion: "Itália", runner_up: "Alemanha", third_place: "Polônia", final_score: "3x0", top_scorer: { name: "Paolo Rossi", country: "Itália", goals: 6 }, best_player: "Paolo Rossi", best_player_country: "Itália", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Enzo Bearzot", use_final_score: true },
  { year: 1986, host: "México", champion: "Argentina", runner_up: "Alemanha", third_place: "França", final_score: "3x2", top_scorer: { name: "Gary Lineker", country: "Inglaterra", goals: 6 }, best_player: "Diego Maradona", best_player_country: "Argentina", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Carlos Bilardo", use_final_score: true },
  { year: 1990, host: "Itália", champion: "Alemanha", runner_up: "Argentina", third_place: "Itália", final_score: "1x0", top_scorer: { name: "Salvatore Schillaci", country: "Itália", goals: 6 }, best_player: "Salvatore Schillaci", best_player_country: "Itália", goalkeeper: null, goalkeeper_country: null, best_young: null, best_young_country: null, coach: "Franz Beckenbauer", use_final_score: true },
  { year: 1994, host: "EUA", champion: "Brasil", runner_up: "Itália", third_place: "Suécia", final_score: "0x0 (pên. 3x2)", top_scorer: [{ name: "Hristo Stoichkov", country: "Bulgária", goals: 6 }, { name: "Oleg Salenko", country: "Rússia", goals: 6 }], best_player: "Romário", best_player_country: "Brasil", goalkeeper: "Michel Preud'homme", goalkeeper_country: "Bélgica", best_young: null, best_young_country: null, coach: "Carlos Alberto Parreira", use_final_score: true },
  { year: 1998, host: "França", champion: "França", runner_up: "Brasil", third_place: "Croácia", final_score: "3x0", top_scorer: { name: "Davor Šuker", country: "Croácia", goals: 6 }, best_player: "Ronaldo", best_player_country: "Brasil", goalkeeper: "Fabien Barthez", goalkeeper_country: "França", best_young: null, best_young_country: null, coach: "Aimé Jacquet", use_final_score: true },
  { year: 2002, host: "Coreia do Sul / Japão", champion: "Brasil", runner_up: "Alemanha", third_place: "Turquia", final_score: "2x0", top_scorer: { name: "Ronaldo", country: "Brasil", goals: 8 }, best_player: "Oliver Kahn", best_player_country: "Alemanha", goalkeeper: "Oliver Kahn", goalkeeper_country: "Alemanha", best_young: null, best_young_country: null, coach: "Luiz Felipe Scolari", use_final_score: true },
  { year: 2006, host: "Alemanha", champion: "Itália", runner_up: "França", third_place: "Alemanha", final_score: "1x1 (pên. 5x3)", top_scorer: { name: "Miroslav Klose", country: "Alemanha", goals: 5 }, best_player: "Zinedine Zidane", best_player_country: "França", goalkeeper: "Gianluigi Buffon", goalkeeper_country: "Itália", best_young: "Lukas Podolski", best_young_country: "Alemanha", coach: "Marcello Lippi", use_final_score: true },
  { year: 2010, host: "África do Sul", champion: "Espanha", runner_up: "Holanda", third_place: "Alemanha", final_score: "1x0", top_scorer: { name: "Thomas Müller", country: "Alemanha", goals: 5 }, best_player: "Diego Forlán", best_player_country: "Uruguai", goalkeeper: "Iker Casillas", goalkeeper_country: "Espanha", best_young: "Thomas Müller", best_young_country: "Alemanha", coach: "Vicente del Bosque", use_final_score: true },
  { year: 2014, host: "Brasil", champion: "Alemanha", runner_up: "Argentina", third_place: "Holanda", final_score: "1x0", top_scorer: { name: "James Rodríguez", country: "Colômbia", goals: 6 }, best_player: "Lionel Messi", best_player_country: "Argentina", goalkeeper: "Manuel Neuer", goalkeeper_country: "Alemanha", best_young: "Paul Pogba", best_young_country: "França", coach: "Joachim Löw", use_final_score: true },
  { year: 2018, host: "Rússia", champion: "França", runner_up: "Croácia", third_place: "Bélgica", final_score: "4x2", top_scorer: { name: "Harry Kane", country: "Inglaterra", goals: 6 }, best_player: "Luka Modric", best_player_country: "Croácia", goalkeeper: "Thibaut Courtois", goalkeeper_country: "Bélgica", best_young: "Kylian Mbappé", best_young_country: "França", coach: "Didier Deschamps", use_final_score: true },
  { year: 2022, host: "Qatar", champion: "Argentina", runner_up: "França", third_place: "Croácia", final_score: "3x3 (pên. 4x2)", top_scorer: { name: "Kylian Mbappé", country: "França", goals: 8 }, best_player: "Lionel Messi", best_player_country: "Argentina", goalkeeper: "Emiliano Martínez", goalkeeper_country: "Argentina", best_young: "Enzo Fernández", best_young_country: "Argentina", coach: "Lionel Scaloni", use_final_score: true },
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
  { id: "t_e_09", question: "Quantos títulos mundiais o Brasil possui?", answer: "5", options: ["3", "4", "5", "6"] },
  { id: "t_e_10", question: "Quantos títulos mundiais a Alemanha possui?", answer: "4", options: ["3", "4", "5", "6"] },
  { id: "t_e_11", question: "Quantos títulos mundiais a Itália possui?", answer: "4", options: ["2", "3", "4", "5"] },
  { id: "t_e_12", question: "Quantos títulos mundiais a Argentina possui?", answer: "3", options: ["1", "2", "3", "4"] },
  { id: "t_e_13", question: "Qual foi a última seleção a defender o título da Copa do Mundo?", answer: "Brasil (1962)", options: ["Brasil (1962)", "Itália (1938)", "França (2022)", "Alemanha (2018)"] },
  { id: "t_e_14", question: "Qual foi o único técnico a vencer duas Copas do Mundo como treinador?", answer: "Vittorio Pozzo", options: ["Vittorio Pozzo", "Mário Zagallo", "Franz Beckenbauer", "Didier Deschamps"] },
];

const triviaMedium: TriviaQ[] = [
  { id: "t_m_01", question: "Qual jogador marcou gols em todas as partidas da Copa do Mundo de 1970?", answer: "Jairzinho", options: ["Jairzinho", "Pelé", "Tostão", "Gerd Müller"] },
  { id: "t_m_02", question: "Qual é o recorde de gols em uma única edição da Copa do Mundo?", answer: "13 gols", options: ["11 gols", "12 gols", "13 gols", "14 gols"] },
  { id: "t_m_03", question: "Qual país disputou mais finais de Copa do Mundo sem vencer nenhuma?", answer: "Holanda", options: ["Holanda", "Hungria", "Croácia", "Tchecoslováquia"] },
  { id: "t_m_04", question: "Quais seleções foram campeãs em Copas consecutivas?", answer: "Itália (1934/1938) e Brasil (1958/1962)", options: ["Itália (1934/1938) e Brasil (1958/1962)", "Brasil (1958/1962) e Alemanha (1974/1978)", "Uruguai (1930/1950) e Brasil (1958/1962)", "Argentina (1978/1986) e Brasil (1994/2002)"] },
  { id: "t_m_05", question: "Quem foi o primeiro a ganhar a Copa do Mundo como jogador e como treinador?", answer: "Mário Zagallo", options: ["Mário Zagallo", "Franz Beckenbauer", "Didier Deschamps", "Johan Cruyff"] },
  { id: "t_m_06", question: "Quantos técnicos venceram a Copa do Mundo tanto como jogador quanto como treinador?", answer: "3", options: ["1", "2", "3", "4"] },
  { id: "t_m_07", question: "Em que ano a Copa do Mundo foi realizada pela primeira vez na África?", answer: "2010", options: ["2002", "2006", "2010", "2014"] },
  { id: "t_m_08", question: "Qual seleção ficou em terceiro lugar na Copa de 1998?", answer: "Croácia", options: ["Holanda", "Itália", "Croácia", "Dinamarca"] },
  { id: "t_m_09", question: "Qual foi o prêmio de melhor goleiro chamado antes de ser renomeado Luva de Ouro?", answer: "Troféu Lev Yashin", options: ["Troféu Lev Yashin", "Troféu Gordon Banks", "Troféu Dino Zoff", "Troféu Zamora"] },
  { id: "t_m_10", question: "Em que Copa do Mundo o prêmio de Melhor Jovem Jogador foi criado?", answer: "2006", options: ["1998", "2002", "2006", "2010"] },
  { id: "t_m_11", question: "Qual jogador ganhou o prêmio de Melhor Jovem Jogador na Copa de 2018?", answer: "Kylian Mbappé", options: ["Kylian Mbappé", "Paul Pogba", "Thomas Müller", "Enzo Fernández"] },
  { id: "t_m_12", question: "Qual seleção ficou em terceiro lugar na Copa de 2022?", answer: "Croácia", options: ["Marrocos", "Bélgica", "Croácia", "Holanda"] },
];

const triviaHard: TriviaQ[] = [
  { id: "t_h_01", question: "Quem marcou o primeiro gol da história das Copas do Mundo?", answer: "Lucien Laurent (França)", options: ["Lucien Laurent (França)", "Guillermo Stábile (Argentina)", "Pedro Cea (Uruguai)", "Bert Patenaude (EUA)"] },
  { id: "t_h_02", question: "Quem marcou 5 gols em uma única partida de Copa do Mundo?", answer: "Oleg Salenko", options: ["Oleg Salenko", "Just Fontaine", "Gerd Müller", "Eusébio"] },
  { id: "t_h_03", question: "Quais países foram campeões da Copa do Mundo jogando em casa?", answer: "Uruguai, Itália, Inglaterra, Alemanha, Argentina e França", options: ["Uruguai, Itália, Inglaterra, Alemanha, Argentina e França", "Brasil, Uruguai, Itália e França", "Uruguai, Itália, Brasil, Argentina e França", "Itália, Inglaterra, Alemanha e França"] },
  { id: "t_h_04", question: "Qual seleção ficou em terceiro lugar na Copa de 2002?", answer: "Turquia", options: ["Coreia do Sul", "Turquia", "Senegal", "EUA"] },
  { id: "t_h_06", question: "Quem ganhou o prêmio de Melhor Jovem Jogador na Copa de 2014?", answer: "Paul Pogba", options: ["Paul Pogba", "Thomas Müller", "Lukas Podolski", "Enzo Fernández"] },
  { id: "t_h_07", question: "Qual seleção ficou em terceiro lugar na Copa de 1966?", answer: "Portugal", options: ["Portugal", "Brasil", "URSS", "Hungria"] },
  { id: "t_h_08", question: "Qual seleção ficou em terceiro lugar na Copa de 1978?", answer: "Brasil", options: ["Brasil", "Itália", "Polônia", "Peru"] },
  { id: "t_h_09", question: "Qual foi o técnico da Alemanha campeã em 2014?", answer: "Joachim Löw", options: ["Joachim Löw", "Jürgen Klinsmann", "Ottmar Hitzfeld", "Berti Vogts"] },
  { id: "t_h_10", question: "Qual foi o técnico da França campeã em 2018?", answer: "Didier Deschamps", options: ["Didier Deschamps", "Aimé Jacquet", "Raymond Domenech", "Laurent Blanc"] },
  { id: "t_h_11", question: "Qual goleiro ganhou a Luva de Ouro na Copa de 2022?", answer: "Emiliano Martínez", options: ["Emiliano Martínez", "Hugo Lloris", "Dominik Livaković", "Yassine Bounou"] },
  { id: "t_h_12", question: "Qual goleiro ganhou a Luva de Ouro na Copa de 2018?", answer: "Thibaut Courtois", options: ["Thibaut Courtois", "Hugo Lloris", "Danijel Subašić", "Kasper Schmeichel"] },
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

// Category-specific distractor pools from ±2 editions window
type PoolCategory = "top_scorer" | "best_player" | "goalkeeper" | "best_young" | "coach";

const POOL_SOURCES: Record<PoolCategory, ((ed: Edition) => string[])[]> = {
  top_scorer: [
    (ed) => { const s = getFirstScorer(ed); return s ? [s.name] : []; },
    (ed) => [ed.best_player],
  ],
  best_player: [
    (ed) => [ed.best_player],
    (ed) => { const s = getFirstScorer(ed); return s ? [s.name] : []; },
  ],
  goalkeeper: [
    (ed) => ed.goalkeeper ? [ed.goalkeeper] : [],
  ],
  best_young: [
    (ed) => ed.best_young ? [ed.best_young] : [],
    (ed) => { const s = getFirstScorer(ed); return s ? [s.name] : []; },
    (ed) => [ed.best_player],
  ],
  coach: [
    (ed) => [ed.coach],
  ],
};

function categoryDistractorPool(editionIndex: number, category: PoolCategory, excludeNames: string[]): string[] {
  const windowSize = 2;
  const start = Math.max(0, editionIndex - windowSize);
  const end = Math.min(editions.length - 1, editionIndex + windowSize);
  const pool = new Set<string>();
  const extractors = POOL_SOURCES[category];

  for (let i = start; i <= end; i++) {
    for (const fn of extractors) {
      for (const name of fn(editions[i])) pool.add(name);
    }
  }
  for (const name of excludeNames) pool.delete(name);

  // If pool too small, expand to all editions
  if (pool.size < 3) {
    for (const ed of editions) {
      for (const fn of extractors) {
        for (const name of fn(ed)) pool.add(name);
      }
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
  easy: ["champion", "host", "runner_up", "trivia_easy"],
  medium: ["third_place", "best_player", "top_scorer_name", "goalkeeper", "best_young", "coach", "trivia_medium"],
  hard: ["top_scorer_goals", "top_scorer_country", "final_score", "trivia_hard"],
};

// ── Generate all questions ──
function generateAllQuestions(): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const allChampions = [...new Set(editions.map(e => e.champion))];
  const allHosts = [...new Set(editions.map(e => e.host))];
  const allRunnerUps = [...new Set(editions.map(e => e.runner_up))];
  const allThirdPlaces = [...new Set(editions.map(e => e.third_place).filter(Boolean) as string[])];
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
  const allCoaches = [...new Set(editions.map(e => e.coach))];

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

    // EASY: Runner-up (moved from medium to easy)
    questions.push({
      question: `Qual país foi vice-campeão da Copa de ${e.year}?`,
      correctAnswer: e.runner_up,
      options: shuffle([e.runner_up, ...pickDistractors(e.runner_up, allRunnerUps)]),
      level: "easy", category: "runner_up", editionYear: e.year,
    });

    // MEDIUM: Third place (skip 1930 which is null)
    if (e.third_place) {
      questions.push({
        question: `Qual país ficou em terceiro lugar na Copa de ${e.year}?`,
        correctAnswer: e.third_place,
        options: shuffle([e.third_place, ...pickDistractors(e.third_place, allThirdPlaces)]),
        level: "medium", category: "third_place", editionYear: e.year,
      });
    }

    // MEDIUM: Best player
    questions.push({
      question: `Quem foi eleito o melhor jogador da Copa de ${e.year}?`,
      correctAnswer: e.best_player,
      options: shuffle([e.best_player, ...pickDistractors(e.best_player, categoryDistractorPool(idx, "best_player", [e.best_player]))]),
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
        options: shuffle([primary, ...pickDistractors(primary, categoryDistractorPool(idx, "top_scorer", excludeFromPool))]),
        level: "medium", category: "top_scorer_name", editionYear: e.year,
        ...(names.length > 1 ? { _altAnswers: names } : {}),
      });
    }

    // MEDIUM: Goalkeeper (available from 1994)
    if (e.goalkeeper && e.year >= 1994) {
      questions.push({
        question: `Quem ganhou a Luva de Ouro na Copa de ${e.year}?`,
        correctAnswer: e.goalkeeper,
        options: shuffle([e.goalkeeper, ...pickDistractors(e.goalkeeper, categoryDistractorPool(idx, "goalkeeper", [e.goalkeeper]))]),
        level: "medium", category: "goalkeeper", editionYear: e.year,
      });
    }

    // MEDIUM: Best young player (available from 2006)
    if (e.best_young && e.year >= 2006) {
      questions.push({
        question: `Quem foi eleito o Melhor Jovem Jogador da Copa de ${e.year}?`,
        correctAnswer: e.best_young,
        options: shuffle([e.best_young, ...pickDistractors(e.best_young, categoryDistractorPool(idx, "best_young", [e.best_young]))]),
        level: "medium", category: "best_young", editionYear: e.year,
      });
    }

    // MEDIUM: Coach
    questions.push({
      question: `Quem era o técnico da seleção campeã na Copa de ${e.year}?`,
      correctAnswer: e.coach,
      options: shuffle([e.coach, ...pickDistractors(e.coach, allCoaches)]),
      level: "medium", category: "coach", editionYear: e.year,
    });

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
