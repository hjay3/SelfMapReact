
import { SelfMapData } from '../types/selfmap';

export const DEFAULT_DATA: SelfMapData = {
  entries: [
    { label: "Partner", category: "People", power: 0.96, valence: 0.90 },
    { label: "Child A", category: "People", power: 0.98, valence: 0.95 },
    { label: "Best Friend", category: "People", power: 0.85, valence: 0.88 },
    { label: "Parent", category: "People", power: 0.92, valence: 0.75 },
    { label: "Career: Staff Engineer", category: "Accomplishments", power: 0.88, valence: 0.65 },
    { label: "Financial Independence", category: "Accomplishments", power: 0.82, valence: 0.78 },
    { label: "Published Research", category: "Accomplishments", power: 0.68, valence: 0.55 },
    { label: "Childhood Trauma", category: "Life Story", power: 0.72, valence: -0.85 },
    { label: "Recovery (5 yrs)", category: "Life Story", power: 0.76, valence: 0.82 },
    { label: "College Years", category: "Life Story", power: 0.55, valence: 0.45 },
    { label: "Environmentalism", category: "Ideas/Likes", power: 0.74, valence: 0.85 },
    { label: "Philosophy", category: "Ideas/Likes", power: 0.62, valence: 0.72 },
    { label: "Music", category: "Ideas/Likes", power: 0.58, valence: 0.90 },
    { label: "Past Relationship", category: "Other", power: 0.45, valence: -0.55 },
  ],
  associations: [
    { src: "Career: Staff Engineer", dst: "Financial Independence", relation: "affirms", weight: 0.8 },
    { src: "Childhood Trauma", dst: "Recovery (5 yrs)", relation: "threatens", weight: 0.6 },
    { src: "Partner", dst: "Child A", relation: "affirms", weight: 0.95 },
    { src: "Environmentalism", dst: "Philosophy", relation: "associates_with", weight: 0.7 },
    { src: "Best Friend", dst: "Music", relation: "affirms", weight: 0.65 },
    { src: "Childhood Trauma", dst: "Past Relationship", relation: "associates_with", weight: 0.4 },
    { src: "Recovery (5 yrs)", dst: "Partner", relation: "affirms", weight: 0.8 }
  ]
};
