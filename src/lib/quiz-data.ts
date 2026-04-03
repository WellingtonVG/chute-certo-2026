// World Cup historical data for quiz generation
export interface WorldCupEdition {
  year: number;
  host: string;
  champion: string;
  runnerUp: string;
  bestPlayer: string;
  topScorer: string;
  topScorerCountry: string;
  topScorerGoals: number;
  finalScore: string;
  topScorerAlt?: string; // For years with shared golden boot
  trivia?: { question: string; answer: string; options: string[]; level: "easy" | "medium" | "hard" }[];
  skipTopScorer?: boolean;
  skipFinalScore?: boolean;
}

export const worldCupData: WorldCupEdition[] = [
  {
    year: 1930, host: "Uruguai", champion: "Uruguai", runnerUp: "Argentina",
    bestPlayer: "José Nasazzi", topScorer: "Guillermo Stábile", topScorerCountry: "Argentina",
    topScorerGoals: 8, finalScore: "Uruguai 4 x 2 Argentina",
    trivia: [
      { question: "Qual foi a primeira Copa do Mundo da história?", answer: "1930", options: ["1928", "1930", "1934", "1926"], level: "easy" },
    ],
  },
  {
    year: 1934, host: "Itália", champion: "Itália", runnerUp: "Tchecoslováquia",
    bestPlayer: "Giuseppe Meazza", topScorer: "Oldřich Nejedlý", topScorerCountry: "Tchecoslováquia",
    topScorerGoals: 5, finalScore: "Itália 2 x 1 Tchecoslováquia",
  },
  {
    year: 1938, host: "França", champion: "Itália", runnerUp: "Hungria",
    bestPlayer: "Leônidas da Silva", topScorer: "Leônidas da Silva", topScorerCountry: "Brasil",
    topScorerGoals: 7, finalScore: "Itália 4 x 2 Hungria",
    trivia: [
      { question: "Qual jogador brasileiro foi artilheiro da Copa de 1938?", answer: "Leônidas da Silva", options: ["Pelé", "Leônidas da Silva", "Garrincha", "Domingos da Guia"], level: "medium" },
    ],
  },
  {
    year: 1950, host: "Brasil", champion: "Uruguai", runnerUp: "Brasil",
    bestPlayer: "Zizinho", topScorer: "Ademir", topScorerCountry: "Brasil",
    topScorerGoals: 9, skipFinalScore: true,
    finalScore: "",
    trivia: [
      { question: "Como é conhecido o episódio da derrota do Brasil na final da Copa de 1950?", answer: "Maracanazo", options: ["Maracanazo", "Mineiraço", "Tragédia Verde", "Fatídico 50"], level: "easy" },
      { question: "A Copa de 1950 teve uma final tradicional (jogo único)?", answer: "Não, foi decidida por um quadrangular final", options: ["Sim, jogo único", "Não, foi decidida por um quadrangular final", "Sim, com prorrogação", "Não, foi melhor de três"], level: "hard" },
    ],
  },
  {
    year: 1954, host: "Suíça", champion: "Alemanha", runnerUp: "Hungria",
    bestPlayer: "Ferenc Puskás", topScorer: "Sándor Kocsis", topScorerCountry: "Hungria",
    topScorerGoals: 11, finalScore: "Alemanha 3 x 2 Hungria",
    trivia: [
      { question: "Como ficou conhecida a final da Copa de 1954?", answer: "O Milagre de Berna", options: ["O Milagre de Berna", "A Batalha de Zurique", "A Surpresa Húngara", "O Golpe Alemão"], level: "hard" },
    ],
  },
  {
    year: 1958, host: "Suécia", champion: "Brasil", runnerUp: "Suécia",
    bestPlayer: "Didi", topScorer: "Just Fontaine", topScorerCountry: "França",
    topScorerGoals: 13, finalScore: "Brasil 5 x 2 Suécia",
    trivia: [
      { question: "Quantos anos tinha Pelé quando jogou sua primeira Copa do Mundo?", answer: "17 anos", options: ["15 anos", "16 anos", "17 anos", "18 anos"], level: "medium" },
      { question: "Just Fontaine marcou 13 gols na Copa de 1958. Esse recorde foi quebrado?", answer: "Não, é o recorde até hoje", options: ["Sim, por Ronaldo em 2002", "Sim, por Klose em 2006", "Não, é o recorde até hoje", "Sim, por Müller em 1970"], level: "hard" },
    ],
  },
  {
    year: 1962, host: "Chile", champion: "Brasil", runnerUp: "Tchecoslováquia",
    bestPlayer: "Garrincha", skipTopScorer: true,
    topScorer: "Garrincha", topScorerCountry: "Brasil", topScorerGoals: 4,
    finalScore: "Brasil 3 x 1 Tchecoslováquia",
    trivia: [
      { question: "Quem substituiu Pelé como principal jogador do Brasil na Copa de 1962?", answer: "Garrincha", options: ["Didi", "Garrincha", "Vavá", "Zagallo"], level: "easy" },
    ],
  },
  {
    year: 1966, host: "Inglaterra", champion: "Inglaterra", runnerUp: "Alemanha",
    bestPlayer: "Bobby Charlton", topScorer: "Eusébio", topScorerCountry: "Portugal",
    topScorerGoals: 9, finalScore: "Inglaterra 4 x 2 Alemanha",
    trivia: [
      { question: "O gol fantasma da final de 1966 foi a favor de qual seleção?", answer: "Inglaterra", options: ["Alemanha", "Inglaterra", "Brasil", "Portugal"], level: "medium" },
    ],
  },
  {
    year: 1970, host: "México", champion: "Brasil", runnerUp: "Itália",
    bestPlayer: "Pelé", topScorer: "Gerd Müller", topScorerCountry: "Alemanha",
    topScorerGoals: 10, finalScore: "Brasil 4 x 1 Itália",
    trivia: [
      { question: "O Brasil de 1970 é frequentemente considerado a melhor seleção da história. Quem era o técnico?", answer: "Zagallo", options: ["Zagallo", "Telê Santana", "Vicente Feola", "Carlos Alberto Parreira"], level: "medium" },
      { question: "Quantas vezes o Brasil precisou ganhar a Copa para ficar com a Taça Jules Rimet definitivamente?", answer: "3 vezes", options: ["2 vezes", "3 vezes", "4 vezes", "5 vezes"], level: "hard" },
    ],
  },
  {
    year: 1974, host: "Alemanha", champion: "Alemanha", runnerUp: "Holanda",
    bestPlayer: "Johan Cruyff", topScorer: "Grzegorz Lato", topScorerCountry: "Polônia",
    topScorerGoals: 7, finalScore: "Alemanha 2 x 1 Holanda",
    trivia: [
      { question: "Qual conceito tático a Holanda de 1974 popularizou?", answer: "Futebol Total", options: ["Catenaccio", "Futebol Total", "Tiki-taka", "Pressing alto"], level: "medium" },
    ],
  },
  {
    year: 1978, host: "Argentina", champion: "Argentina", runnerUp: "Holanda",
    bestPlayer: "Mario Kempes", topScorer: "Mario Kempes", topScorerCountry: "Argentina",
    topScorerGoals: 6, skipFinalScore: true, finalScore: "",
    trivia: [
      { question: "A Copa de 1978 foi marcada por qual contexto político na Argentina?", answer: "Ditadura militar", options: ["Democracia recente", "Ditadura militar", "Guerra civil", "Revolução popular"], level: "hard" },
    ],
  },
  {
    year: 1982, host: "Espanha", champion: "Itália", runnerUp: "Alemanha",
    bestPlayer: "Paolo Rossi", topScorer: "Paolo Rossi", topScorerCountry: "Itália",
    topScorerGoals: 6, finalScore: "Itália 3 x 1 Alemanha",
    trivia: [
      { question: "Em qual fase a seleção brasileira de 1982 foi eliminada?", answer: "Segunda fase de grupos", options: ["Quartas de final", "Segunda fase de grupos", "Semifinal", "Oitavas de final"], level: "hard" },
    ],
  },
  {
    year: 1986, host: "México", champion: "Argentina", runnerUp: "Alemanha",
    bestPlayer: "Diego Maradona", topScorer: "Gary Lineker", topScorerCountry: "Inglaterra",
    topScorerGoals: 6, finalScore: "Argentina 3 x 2 Alemanha",
    trivia: [
      { question: "Qual gol de Maradona na Copa de 1986 ficou conhecido como 'A Mão de Deus'?", answer: "Contra a Inglaterra nas quartas", options: ["Contra a Alemanha na final", "Contra a Inglaterra nas quartas", "Contra a Bélgica na semi", "Contra o Uruguai nas oitavas"], level: "easy" },
      { question: "Maradona também marcou o 'Gol do Século' na mesma partida contra a Inglaterra. Quantos jogadores ele driblou?", answer: "6 jogadores", options: ["4 jogadores", "5 jogadores", "6 jogadores", "7 jogadores"], level: "hard" },
    ],
  },
  {
    year: 1990, host: "Itália", champion: "Alemanha", runnerUp: "Argentina",
    bestPlayer: "Salvatore Schillaci", topScorer: "Salvatore Schillaci", topScorerCountry: "Itália",
    topScorerGoals: 6, finalScore: "Alemanha 1 x 0 Argentina",
  },
  {
    year: 1994, host: "Estados Unidos", champion: "Brasil", runnerUp: "Itália",
    bestPlayer: "Romário", topScorer: "Hristo Stoichkov", topScorerCountry: "Bulgária",
    topScorerGoals: 6, topScorerAlt: "Oleg Salenko", finalScore: "Brasil 0 x 0 Itália (3-2 nos pênaltis)",
    trivia: [
      { question: "Como foi decidida a final da Copa de 1994?", answer: "Nos pênaltis", options: ["Gol de ouro", "Nos pênaltis", "Na prorrogação", "Placar normal"], level: "easy" },
      { question: "Quem perdeu o pênalti decisivo na final de 1994?", answer: "Roberto Baggio", options: ["Franco Baresi", "Roberto Baggio", "Daniele Massaro", "Paolo Maldini"], level: "medium" },
    ],
  },
  {
    year: 1998, host: "França", champion: "França", runnerUp: "Brasil",
    bestPlayer: "Ronaldo", topScorer: "Davor Šuker", topScorerCountry: "Croácia",
    topScorerGoals: 6, finalScore: "França 3 x 0 Brasil",
    trivia: [
      { question: "Quantos gols Zinedine Zidane marcou na final da Copa de 1998?", answer: "2 gols", options: ["1 gol", "2 gols", "3 gols", "Nenhum"], level: "medium" },
    ],
  },
  {
    year: 2002, host: "Coreia do Sul e Japão", champion: "Brasil", runnerUp: "Alemanha",
    bestPlayer: "Oliver Kahn", topScorer: "Ronaldo", topScorerCountry: "Brasil",
    topScorerGoals: 8, finalScore: "Brasil 2 x 0 Alemanha",
    trivia: [
      { question: "A Copa de 2002 foi a primeira realizada em quantos países?", answer: "2 países", options: ["1 país", "2 países", "3 países", "4 países"], level: "easy" },
      { question: "Qual goleiro foi eleito melhor jogador da Copa de 2002?", answer: "Oliver Kahn", options: ["Marcos", "Oliver Kahn", "Gianluigi Buffon", "Rüştü Reçber"], level: "medium" },
    ],
  },
  {
    year: 2006, host: "Alemanha", champion: "Itália", runnerUp: "França",
    bestPlayer: "Zinedine Zidane", topScorer: "Miroslav Klose", topScorerCountry: "Alemanha",
    topScorerGoals: 5, finalScore: "Itália 1 x 1 França (5-3 nos pênaltis)",
    trivia: [
      { question: "O que Zidane fez na final da Copa de 2006 que resultou em sua expulsão?", answer: "Deu uma cabeçada em Materazzi", options: ["Deu uma cabeçada em Materazzi", "Agrediu o árbitro", "Cometeu falta violenta", "Xingou o quarto árbitro"], level: "easy" },
    ],
  },
  {
    year: 2010, host: "África do Sul", champion: "Espanha", runnerUp: "Holanda",
    bestPlayer: "Diego Forlán", topScorer: "Thomas Müller", topScorerCountry: "Alemanha",
    topScorerGoals: 5, finalScore: "Espanha 1 x 0 Holanda",
    trivia: [
      { question: "A Copa de 2010 foi a primeira realizada em qual continente?", answer: "África", options: ["Ásia", "África", "Oceania", "América do Sul"], level: "easy" },
      { question: "Qual instrumento musical ficou famoso na Copa de 2010?", answer: "Vuvuzela", options: ["Corneta", "Vuvuzela", "Tambor", "Apito"], level: "easy" },
    ],
  },
  {
    year: 2014, host: "Brasil", champion: "Alemanha", runnerUp: "Argentina",
    bestPlayer: "Lionel Messi", topScorer: "James Rodríguez", topScorerCountry: "Colômbia",
    topScorerGoals: 6, finalScore: "Alemanha 1 x 0 Argentina",
    trivia: [
      { question: "Qual foi o placar da semifinal entre Brasil e Alemanha na Copa de 2014?", answer: "Alemanha 7 x 1 Brasil", options: ["Alemanha 5 x 0 Brasil", "Alemanha 7 x 1 Brasil", "Alemanha 4 x 0 Brasil", "Alemanha 6 x 1 Brasil"], level: "easy" },
      { question: "Quem marcou o gol da Alemanha na final da Copa de 2014?", answer: "Mario Götze", options: ["Thomas Müller", "Mario Götze", "Miroslav Klose", "André Schürrle"], level: "medium" },
    ],
  },
  {
    year: 2018, host: "Rússia", champion: "França", runnerUp: "Croácia",
    bestPlayer: "Luka Modrić", topScorer: "Harry Kane", topScorerCountry: "Inglaterra",
    topScorerGoals: 6, finalScore: "França 4 x 2 Croácia",
    trivia: [
      { question: "Qual foi o primeiro Mundial a usar o VAR (árbitro de vídeo)?", answer: "Copa de 2018", options: ["Copa de 2014", "Copa de 2018", "Copa de 2022", "Copa de 2010"], level: "medium" },
      { question: "Kylian Mbappé tinha quantos anos quando marcou na final da Copa de 2018?", answer: "19 anos", options: ["17 anos", "18 anos", "19 anos", "20 anos"], level: "hard" },
    ],
  },
  {
    year: 2022, host: "Catar", champion: "Argentina", runnerUp: "França",
    bestPlayer: "Lionel Messi", topScorer: "Kylian Mbappé", topScorerCountry: "França",
    topScorerGoals: 8, finalScore: "Argentina 3 x 3 França (4-2 nos pênaltis)",
    trivia: [
      { question: "A Copa de 2022 foi realizada em qual época do ano, diferente do habitual?", answer: "No final do ano (novembro-dezembro)", options: ["No início do ano (janeiro-fevereiro)", "No final do ano (novembro-dezembro)", "No meio do ano (junho-julho)", "Na primavera (março-abril)"], level: "easy" },
      { question: "Quantos gols Mbappé marcou na final da Copa de 2022?", answer: "3 gols (hat-trick)", options: ["1 gol", "2 gols", "3 gols (hat-trick)", "4 gols"], level: "medium" },
      { question: "Messi finalmente conquistou a Copa do Mundo em 2022. Quantas Copas ele disputou no total?", answer: "5 Copas", options: ["3 Copas", "4 Copas", "5 Copas", "6 Copas"], level: "medium" },
    ],
  },
];

export type QuizLevel = "easy" | "medium" | "hard";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  level: QuizLevel;
  category: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(correct: string, pool: string[], count = 3): string[] {
  const filtered = [...new Set(pool.filter((v) => v !== correct))];
  return shuffle(filtered).slice(0, count);
}

export function generateQuestions(level?: QuizLevel): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const allChampions = [...new Set(worldCupData.map((e) => e.champion))];
  const allHosts = [...new Set(worldCupData.map((e) => e.host))];
  const allRunnerUps = [...new Set(worldCupData.map((e) => e.runnerUp))];
  const allBestPlayers = [...new Set(worldCupData.map((e) => e.bestPlayer))];
  const allTopScorers = [...new Set(worldCupData.filter((e) => !e.skipTopScorer).map((e) => e.topScorer))];
  const allCountries = [...new Set(worldCupData.map((e) => e.topScorerCountry))];
  const allYears = worldCupData.map((e) => String(e.year));
  const allFinalScores = [...new Set(worldCupData.filter((e) => !e.skipFinalScore).map((e) => e.finalScore))];
  const allGoals = [...new Set(worldCupData.filter((e) => !e.skipTopScorer).map((e) => String(e.topScorerGoals)))];

  for (const edition of worldCupData) {
    // EASY: Champion by year
    questions.push({
      question: `Quem venceu a Copa do Mundo de ${edition.year}?`,
      correctAnswer: edition.champion,
      options: shuffle([edition.champion, ...pickDistractors(edition.champion, allChampions)]),
      level: "easy",
      category: "champion",
    });

    // EASY: Year champion won at host
    questions.push({
      question: `Em que ano ${edition.champion} venceu a Copa sediada em ${edition.host}?`,
      correctAnswer: String(edition.year),
      options: shuffle([String(edition.year), ...pickDistractors(String(edition.year), allYears)]),
      level: "easy",
      category: "champion",
    });

    // EASY: Host by year
    questions.push({
      question: `Em qual país foi realizada a Copa do Mundo de ${edition.year}?`,
      correctAnswer: edition.host,
      options: shuffle([edition.host, ...pickDistractors(edition.host, allHosts)]),
      level: "easy",
      category: "host",
    });

    // MEDIUM: Runner-up
    questions.push({
      question: `Qual país foi vice-campeão da Copa de ${edition.year}?`,
      correctAnswer: edition.runnerUp,
      options: shuffle([edition.runnerUp, ...pickDistractors(edition.runnerUp, allRunnerUps)]),
      level: "medium",
      category: "runner_up",
    });

    // MEDIUM: Best player
    questions.push({
      question: `Quem foi eleito o melhor jogador da Copa de ${edition.year}?`,
      correctAnswer: edition.bestPlayer,
      options: shuffle([edition.bestPlayer, ...pickDistractors(edition.bestPlayer, allBestPlayers)]),
      level: "medium",
      category: "best_player",
    });

    // MEDIUM: Top scorer name (skip 1962)
    if (!edition.skipTopScorer) {
      const acceptedAnswers = edition.topScorerAlt
        ? [edition.topScorer, edition.topScorerAlt]
        : [edition.topScorer];
      questions.push({
        question: `Quem foi o artilheiro da Copa de ${edition.year}?`,
        correctAnswer: acceptedAnswers[0],
        options: shuffle([acceptedAnswers[0], ...pickDistractors(acceptedAnswers[0], allTopScorers.filter((s) => !acceptedAnswers.includes(s)))]),
        level: "medium",
        category: "top_scorer",
        ...(edition.topScorerAlt ? { _altAnswers: acceptedAnswers } as any : {}),
      });
    }

    // HARD: Top scorer goals (skip 1962)
    if (!edition.skipTopScorer) {
      questions.push({
        question: `Quantos gols ${edition.topScorer} marcou na Copa de ${edition.year}?`,
        correctAnswer: `${edition.topScorerGoals} gols`,
        options: shuffle([`${edition.topScorerGoals} gols`, ...pickDistractors(`${edition.topScorerGoals} gols`, allGoals.map((g) => `${g} gols`))]),
        level: "hard",
        category: "top_scorer_goals",
      });
    }

    // HARD: Top scorer country
    if (!edition.skipTopScorer) {
      questions.push({
        question: `De qual país era o artilheiro da Copa de ${edition.year}?`,
        correctAnswer: edition.topScorerCountry,
        options: shuffle([edition.topScorerCountry, ...pickDistractors(edition.topScorerCountry, allCountries)]),
        level: "hard",
        category: "top_scorer_country",
      });
    }

    // HARD: Final score (skip 1950 and 1978)
    if (!edition.skipFinalScore) {
      questions.push({
        question: `Qual foi o placar da final da Copa de ${edition.year}?`,
        correctAnswer: edition.finalScore,
        options: shuffle([edition.finalScore, ...pickDistractors(edition.finalScore, allFinalScores)]),
        level: "hard",
        category: "final_score",
      });
    }

    // Trivia
    if (edition.trivia) {
      for (const t of edition.trivia) {
        questions.push({
          question: t.question,
          correctAnswer: t.answer,
          options: shuffle(t.options),
          level: t.level,
          category: "trivia",
        });
      }
    }
  }

  if (level) {
    return questions.filter((q) => q.level === level);
  }
  return questions;
}

export function pickQuestions(level: QuizLevel | "all", count: number): QuizQuestion[] {
  const pool = level === "all" ? generateQuestions() : generateQuestions(level);
  return shuffle(pool).slice(0, count);
}

export function checkAnswer(question: QuizQuestion, answer: string): boolean {
  if (answer === question.correctAnswer) return true;
  // Handle 1994 dual top scorer
  if ((question as any)._altAnswers) {
    return (question as any)._altAnswers.includes(answer);
  }
  return false;
}
