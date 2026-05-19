import type { TMatchStatus } from "./match.constants.js";

export interface IPosition {
  abbreviation: string;
  abbreviationEn: string;
  description: string;
  descriptionEn: string;
  id: number;
}
export interface IFifaInfo {
  id: number;
  pictureId: string;
}

export interface ICountry {
  abbreviation: string;
  abbreviationEn: string;
  id: number;
  isoCode: string;
  name: string;
  nameEn: string;
}

export interface IClub {
  country: ICountry;
  id: number;
  name: string;
}

export interface IConfederation {
  abbreviation: string;
  id: number;
  name: string;
  nameEn: string;
}

export interface IPlayer {
  club: IClub;
  dateOfBirth: string;
  fifa: IFifaInfo;
  height: number;
  id: number;
  name: string;
  number: number;
  position: IPosition;
  team: ITeam;
}

export interface ITeam {
  abbreviation: string;
  abbreviationEn: string;
  colors: string[];
  colorsRaw: string;
  //   confederation: IConfederation;
  group: string;
  id: number;
  idConfederation: number;
  idFifa: number;
  isoCode: string;
  name: string;
  nameEn: string;
  players: IPlayer[];
}

export interface IStadium {
  capacity: number;
  city: string;
  country: string;
  countryEn: string;
  geoLatitude: string;
  geoLongitude: string;
  id: number;
  idCountry: number;
  name: string;
}

export interface IReferee {
  country: string;
  countryEn: string;
  dateOfBirth: string;
  id: number;
  idFifa: number;
  name: string;
}

export interface IEvent {
  description: string;
  descriptionEn: string;
  gametime: string;
  id: number;
}

export interface IMatchEvent {
  event: IEvent;
  id: number;
  matchId: number;
  player: IPlayer;
  playerAssist: IPlayer | null;
}

export interface IScore {
  away: number;
  awayPenalties: number;
  home: number;
  homePenalties: number;
}

export interface IUser {
  admin: boolean;
  email?: string;
  favorites: number[];
  id: number;
  isActive: boolean;
  isOnline: boolean;
  name: string;
  nickname: string;
  timestamp: number;
}

export interface IBet {
  id: number;
  matchId: number;
  scoreAway: null | number;
  scoreHome: null | number;
  timestamp: string;
  user: Pick<IUser, "id" | "nickname">;
}

export interface IMatch {
  awayTeam: ITeam;
  bets: IBet[];
  events: IMatchEvent[];
  group: null | string;
  homeTeam: ITeam;
  id: number;
  idFifa: number;
  loggedUserBets: IBet | null;
  referee: IReferee;
  round: number;
  score: IScore;
  stadium: IStadium;
  status: TMatchStatus;
  timestamp: string;
}
