import type {
  Fighter,
  FightHistory,
} from "@/components/providers/data-provider";

export interface RadarMetric {
  metric: string;
  fighterA: number;
  fighterB: number;
}

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function radarValues(fighter: Fighter) {
  const striking = clamp(
    (fighter.slpm / 8) * 55 + fighter.str_acc * 45,
  );
  const grappling = clamp(
    (fighter.td_avg / 6) * 65 + fighter.td_acc * 35,
  );
  const submission = clamp(
    (fighter.sub_avg / 1.8) * 70 +
      (fighter.submission_wins / Math.max(1, fighter.wins)) * 30,
  );

  return {
    striking: Math.round(striking),
    defense: Math.round(fighter.str_def * 100),
    grappling: Math.round(grappling),
    tdDefense: Math.round(fighter.td_def * 100),
    submission: Math.round(submission),
  };
}

export function createRadarData(a: Fighter, b: Fighter): RadarMetric[] {
  const first = radarValues(a);
  const second = radarValues(b);

  return [
    { metric: "Vuruş", fighterA: first.striking, fighterB: second.striking },
    { metric: "Savunma", fighterA: first.defense, fighterB: second.defense },
    { metric: "Güreş", fighterA: first.grappling, fighterB: second.grappling },
    {
      metric: "TD Savunma",
      fighterA: first.tdDefense,
      fighterB: second.tdDefense,
    },
    {
      metric: "Submission",
      fighterA: first.submission,
      fighterB: second.submission,
    },
  ];
}

function recentFormScore(fights: FightHistory[]) {
  const recent = fights.slice(0, 5);
  if (recent.length === 0) return 0;
  let weightedScore = 0;
  let totalWeight = 0;
  recent.forEach((fight, index) => {
    const weight = recent.length - index;
    const resultValue = fight.result === "W" ? 1 : fight.result === "L" ? -1 : 0;
    weightedScore += resultValue * weight;
    totalWeight += weight;
  });
  return weightedScore / Math.max(1, totalWeight);
}

function matchupScore(
  fighter: Fighter,
  opponent: Fighter,
  recentFights: FightHistory[],
) {
  const striking =
    fighter.slpm * fighter.str_acc * (1 - opponent.str_def) * 2.2;
  const grappling =
    fighter.td_avg * fighter.td_acc * (1 - opponent.td_def) * 2.8 +
    fighter.sub_avg * 0.8;
  const durability = Math.max(0, 2 - fighter.sapm * (1 - fighter.str_def));
  const record = fighter.wins / Math.max(1, fighter.wins + fighter.losses);
  const physical = Math.max(-1, Math.min(1, (fighter.reach - opponent.reach) / 5));

  const form = recentFormScore(recentFights);

  return striking + grappling + durability + record * 2 + physical * 0.3 + form * 0.8;
}

export function calculateMatchup(
  a: Fighter,
  b: Fighter,
  recentA: FightHistory[] = [],
  recentB: FightHistory[] = [],
) {
  const scoreA = matchupScore(a, b, recentA);
  const scoreB = matchupScore(b, a, recentB);
  const rawA = scoreA / Math.max(0.01, scoreA + scoreB);
  const probabilityA = Math.round(clamp(rawA * 100, 15, 85));

  return {
    probabilityA,
    probabilityB: 100 - probabilityA,
    insights: createInsights(a, b, recentA, recentB),
  };
}

function createInsights(
  a: Fighter,
  b: Fighter,
  recentA: FightHistory[],
  recentB: FightHistory[],
) {
  const insights: string[] = [];
  const reachDiff = Math.abs(a.reach - b.reach);
  const longer = a.reach >= b.reach ? a : b;
  if (reachDiff >= 2) {
    insights.push(
      `${longer.name}, ${reachDiff.toFixed(1)} inç uzanma avantajıyla mesafe kontrolünde öne çıkıyor.`,
    );
  }

  const pressure = a.slpm >= b.slpm ? a : b;
  insights.push(
    `${pressure.name}, dakikada ${pressure.slpm.toFixed(2)} isabetli vuruşla daha yüksek tempo üretiyor.`,
  );

  const wrestler = a.td_avg >= b.td_avg ? a : b;
  const defender = wrestler.id === a.id ? b : a;
  if (wrestler.td_avg >= 1.5) {
    insights.push(
      `${wrestler.name} 15 dakikada ${wrestler.td_avg.toFixed(2)} takedown ortalamasına sahip; ${defender.name} tarafındaki %${Math.round(defender.td_def * 100)} savunma maçın zemin dengesini belirleyebilir.`,
    );
  }

  const finisher =
    a.ko_wins + a.submission_wins >= b.ko_wins + b.submission_wins ? a : b;
  insights.push(
    `${finisher.name}, kariyerindeki ${finisher.ko_wins + finisher.submission_wins} bitirişle sonuç arama tarafında daha güçlü profile sahip.`,
  );

  if (recentA.length > 0 || recentB.length > 0) {
    const formA = recentFormScore(recentA);
    const formB = recentFormScore(recentB);
    const strongerForm = formA >= formB ? a : b;
    const strongerHistory = formA >= formB ? recentA : recentB;
    const sample = strongerHistory.slice(0, 5);
    const wins = sample.filter((fight) => fight.result === "W").length;
    insights.unshift(
      `${strongerForm.name}, son ${sample.length} resmî maçındaki ${wins} galibiyetle güncel form açısından önde.`,
    );
  }

  return insights.slice(0, 4);
}
