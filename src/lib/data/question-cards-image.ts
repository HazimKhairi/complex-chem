export interface QuestionCardImage {
  id: string;
  imageFile: string; // e.g., "6.png"
  position: "top" | "bottom"; // which pair in the 2x2 grid
  difficulty: "easy" | "medium" | "hard";
  points: 3 | 4 | 5;
}

// 18 question cards from 6.png to 14.png (9 images × 2 cards each)
export const QUESTION_CARDS_IMAGE: QuestionCardImage[] = [
  // 6.png - Easy level
  {
    id: "q1",
    imageFile: "6.png",
    position: "top",
    difficulty: "easy",
    points: 3,
  },
  {
    id: "q2",
    imageFile: "6.png",
    position: "bottom",
    difficulty: "easy",
    points: 3,
  },
  // 7.png - Easy level
  {
    id: "q3",
    imageFile: "7.png",
    position: "top",
    difficulty: "easy",
    points: 3,
  },
  {
    id: "q4",
    imageFile: "7.png",
    position: "bottom",
    difficulty: "easy",
    points: 3,
  },
  // 8.png - Medium level
  {
    id: "q5",
    imageFile: "8.png",
    position: "top",
    difficulty: "medium",
    points: 4,
  },
  {
    id: "q6",
    imageFile: "8.png",
    position: "bottom",
    difficulty: "medium",
    points: 4,
  },
  // 9.png - Medium level
  {
    id: "q7",
    imageFile: "9.png",
    position: "top",
    difficulty: "medium",
    points: 4,
  },
  {
    id: "q8",
    imageFile: "9.png",
    position: "bottom",
    difficulty: "medium",
    points: 4,
  },
  // 10.png - Medium level
  {
    id: "q9",
    imageFile: "10.png",
    position: "top",
    difficulty: "medium",
    points: 4,
  },
  {
    id: "q10",
    imageFile: "10.png",
    position: "bottom",
    difficulty: "medium",
    points: 4,
  },
  // 11.png - Hard level
  {
    id: "q11",
    imageFile: "11.png",
    position: "top",
    difficulty: "hard",
    points: 5,
  },
  {
    id: "q12",
    imageFile: "11.png",
    position: "bottom",
    difficulty: "hard",
    points: 5,
  },
  // 12.png - Hard level
  {
    id: "q13",
    imageFile: "12.png",
    position: "top",
    difficulty: "hard",
    points: 5,
  },
  {
    id: "q14",
    imageFile: "12.png",
    position: "bottom",
    difficulty: "hard",
    points: 5,
  },
  // 13.png - Hard level
  {
    id: "q15",
    imageFile: "13.png",
    position: "top",
    difficulty: "hard",
    points: 5,
  },
  {
    id: "q16",
    imageFile: "13.png",
    position: "bottom",
    difficulty: "hard",
    points: 5,
  },
  // 14.png - Hard level
  {
    id: "q17",
    imageFile: "14.png",
    position: "top",
    difficulty: "hard",
    points: 5,
  },
  {
    id: "q18",
    imageFile: "14.png",
    position: "bottom",
    difficulty: "hard",
    points: 5,
  },
];
