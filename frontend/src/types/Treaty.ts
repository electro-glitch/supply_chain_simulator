export interface Treaty {
  name: string;
  parties: string[];
  stability: number;
  enforcement: number;
  breach_history: {
    breaches: number;
    years_active: number;
  };
}
