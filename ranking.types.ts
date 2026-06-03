import type { IUser } from "./match.types.js";

export interface IRankingLine {
  accumulatedScore: IRankingScore;
  isFinished: boolean;
  round: number;
  score: IRankingScore;
  user: Pick<IUser, "id" | "isActive" | "name" | "nickname">;
}

export interface IRankingResponse {
  round: IRoundRanking[];
  edition: IRankingLine[];
  editionWithoutExtras: IRankingLine[];
}

export interface IRankingScore {
  betCount: number;
  exacts: number;
  gameCount: number;
  misses: number;
  oneScores: number;
  percentage: number;
  points: number;
  position: number;
  positionVariation: number;
  winnersOnly: number;
}

export interface IRoundRanking {
  ranking: IRankingLine[];
  round: number;
}
