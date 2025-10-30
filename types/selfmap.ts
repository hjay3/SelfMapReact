
export interface Entry {
  label: string;
  category: 'People' | 'Accomplishments' | 'Life Story' | 'Ideas/Likes' | 'Other';
  power: number;
  valence: number;
}

export interface Association {
  src: string;
  dst: string;
  relation: 'affirms' | 'threatens' | 'associates_with';
  weight: number;
}

export interface SelfMapData {
  entries: Entry[];
  associations: Association[];
}

export interface Position {
  x: number;
  y: number;
}

export type SizeMetric = 'power_x_val' | 'power' | 'valence_abs' | 'weighted_degree';
export type RadiusMode = 'valence' | 'power';
