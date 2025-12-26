export type RouteMode = "land" | "sea" | "air";

export interface RouteBaseline {
  cost: number;
  time: number;
  risk: number;
}

export interface RouteDetails {
  cost: number;
  time: number;
  risk: number;
  mode?: RouteMode;
  base?: RouteBaseline;
}

export interface Route extends RouteDetails {
  origin: string;
  destination: string;
}
