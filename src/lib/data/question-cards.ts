export interface QuestionCard {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  points: 3 | 4 | 5;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  category: "naming" | "coordination-number" | "geometry" | "concept" | "structure";
  didYouKnow?: {
    title: string;
    description: string;
  };
}

export const QUESTION_CARDS: QuestionCard[] = [
  // Easy Questions (Green) - 3 points
  {
    id: "q-easy-1",
    difficulty: "easy",
    points: 3,
    question: "What is the coordination number of a metal in a square planar complex?",
    options: ["2", "4", "6", "8"],
    correctAnswer: 1,
    category: "coordination-number",
  },
  {
    id: "q-easy-2",
    difficulty: "easy",
    points: 3,
    question: "What does it mean by 'monodentate'?",
    options: [
      "Have one point of attachment",
      "Occupy only one coordination site",
      "Can bond through a metal center",
      "I, II, and III",
    ],
    correctAnswer: 3,
    category: "concept",
    didYouKnow: {
      title: "Zinc Protoporphyrin IX is used in diagnosing blood disorders?",
      description:
        "Zinc Protoporphyrin (ZnPP) levels in red blood cells can indicate iron deficiency anemia or lead poisoning.",
    },
  },

  // Medium Questions (Yellow) - 4 points
  {
    id: "q-medium-1",
    difficulty: "medium",
    points: 4,
    question: "What is the coordination number in the complex [Ni(CN)₄]²⁻?",
    options: ["2", "4", "6", "8"],
    correctAnswer: 1,
    category: "coordination-number",
  },

  // Hard Questions (Red) - 5 points
  {
    id: "q-hard-1",
    difficulty: "hard",
    points: 5,
    question:
      "Which of the following is the correct naming for this complex? [Cr(NH₃)₄(H₂O)₂]³⁺?",
    options: [
      "Tetraammoniadiaquatechromium (III) ion",
      "Tetraammoniadiaquadichromium (III) ion",
      "Tetraamminediaquachromium (III) ion",
      "Tetraamminediaquachromate (III) ion",
    ],
    correctAnswer: 2,
    category: "naming",
    didYouKnow: {
      title: "Fireworks have complex ions?",
      description:
        "Fireworks contain special ingredients like dextrin and metal salts. When mixed together, these create complex compounds. For example, strontium salts produce red colors while copper salts produce blue or green colors.",
    },
  },
  {
    id: "q-hard-2",
    difficulty: "hard",
    points: 5,
    question: "What is the coordination number in the complex [Ni(CN)₄]²⁻?",
    options: ["2", "4", "6", "8"],
    correctAnswer: 1,
    category: "coordination-number",
    didYouKnow: {
      title: "Antimalarial drug Ferroquine contains complex ions?",
      description:
        "These complex ions are formed when iron atoms combine with other molecules in the drug. These ions are crucial for Ferroquine's effectiveness in treating malaria because they help target and destroy the malaria parasites in the body.",
    },
  },
];
