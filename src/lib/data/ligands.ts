export interface Ligand {
  id: string;
  name: string;
  fullName: string;
  classification: "Neutral Ligand" | "Anionic Ligand";
  coordinationType: "Monodentate" | "Bidentate";
  donorAtom: string;
  nomenclature: string;
  charge: number;
  color: string; // Hex color for card header
  imageFile: string; // e.g., "1.png" - each image has logo on left, description on right
}

export const LIGANDS: Ligand[] = [
  {
    id: "h2o",
    name: "H₂O",
    fullName: "Water (H₂O)",
    classification: "Neutral Ligand",
    coordinationType: "Monodentate",
    donorAtom: "Oxygen (O)",
    nomenclature: "Aqua",
    charge: 0,
    color: "#3b82f6", // blue-500
    imageFile: "1.png",
  },
  {
    id: "nh3",
    name: "NH₃",
    fullName: "Ammonia",
    classification: "Neutral Ligand",
    coordinationType: "Monodentate",
    donorAtom: "Nitrogen (N)",
    nomenclature: "Ammine",
    charge: 0,
    color: "#a855f7", // purple-500
    imageFile: "2.png",
  },
  {
    id: "py",
    name: "py",
    fullName: "Pyridine",
    classification: "Neutral Ligand",
    coordinationType: "Monodentate",
    donorAtom: "Nitrogen (N)",
    nomenclature: "Pyridine",
    charge: 0,
    color: "#6366f1", // indigo-500
    imageFile: "3.png",
  },
  {
    id: "pph3",
    name: "PPh₃",
    fullName: "Triphenylphosphine",
    classification: "Neutral Ligand",
    coordinationType: "Monodentate",
    donorAtom: "Phosphorus (P)",
    nomenclature: "Triphenylphosphine",
    charge: 0,
    color: "#f97316", // orange-500
    imageFile: "4.png",
  },
  {
    id: "cn",
    name: "CN⁻",
    fullName: "Cyanide",
    classification: "Anionic Ligand",
    coordinationType: "Monodentate",
    donorAtom: "Carbon (C)",
    nomenclature: "Cyanido/cyanide",
    charge: -1,
    color: "#06b6d4", // cyan-500
    imageFile: "5.png",
  },
  {
    id: "o2",
    name: "O²⁻",
    fullName: "Oxide",
    classification: "Anionic Ligand",
    coordinationType: "Monodentate",
    donorAtom: "Oxygen (O)",
    nomenclature: "Oxido/oxide",
    charge: -2,
    color: "#ef4444", // red-500
    imageFile: "6.png",
  },
  {
    id: "cl",
    name: "Cl⁻",
    fullName: "Chloride",
    classification: "Anionic Ligand",
    coordinationType: "Monodentate",
    donorAtom: "Chlorine (Cl)",
    nomenclature: "Chlorido/chloride",
    charge: -1,
    color: "#22c55e", // green-500
    imageFile: "7.png",
  },
  {
    id: "ox",
    name: "ox",
    fullName: "Oxalate",
    classification: "Anionic Ligand",
    coordinationType: "Bidentate",
    donorAtom: "Oxygen (O)",
    nomenclature: "Oxalato",
    charge: -2,
    color: "#dc2626", // red-600
    imageFile: "8.png",
  },
  {
    id: "acac",
    name: "acac",
    fullName: "Acetylacetonate",
    classification: "Anionic Ligand",
    coordinationType: "Bidentate",
    donorAtom: "Oxygen (O)",
    nomenclature: "Acetylacetonato",
    charge: -1,
    color: "#f43f5e", // rose-500
    imageFile: "9.png",
  },
  {
    id: "co3",
    name: "CO₃²⁻",
    fullName: "Carbonate",
    classification: "Anionic Ligand",
    coordinationType: "Bidentate",
    donorAtom: "Oxygen (O)",
    nomenclature: "Carbonato",
    charge: -2,
    color: "#b91c1c", // red-700
    imageFile: "10.png",
  },
  {
    id: "phen",
    name: "phen",
    fullName: "1,10-Phenanthroline",
    classification: "Neutral Ligand",
    coordinationType: "Bidentate",
    donorAtom: "Nitrogen (N)",
    nomenclature: "Phenanthroline",
    charge: 0,
    color: "#2563eb", // blue-600
    imageFile: "11.png",
  },
  {
    id: "bipy",
    name: "bipy",
    fullName: "2,2'-Bipyridine",
    classification: "Neutral Ligand",
    coordinationType: "Bidentate",
    donorAtom: "Nitrogen (N)",
    nomenclature: "Bipyridine",
    charge: 0,
    color: "#8b5cf6", // violet-500
    imageFile: "12.png",
  },
  {
    id: "en",
    name: "en",
    fullName: "Ethylenediamine",
    classification: "Neutral Ligand",
    coordinationType: "Bidentate",
    donorAtom: "Nitrogen (N)",
    nomenclature: "Ethylenediamine",
    charge: 0,
    color: "#60a5fa", // blue-400
    imageFile: "13.png",
  },
];
