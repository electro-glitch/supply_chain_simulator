export interface GraphEdge {
  origin: string;
  destination: string;
  cost: number;
  time: number;
  risk: number;
}

export interface Graph {
  nodes: string[];
  edges: GraphEdge[];
}
