export interface QuestionCardImage {
  id: string;
  imageFile: string; // e.g., "6.png" - each image has "Did you know?" on left, question on right
  difficulty: "easy" | "medium" | "hard";
  points: 3 | 4 | 5;
}

// 18 question cards from 6.png to 23.png (each image is one card pair)
export const QUESTION_CARDS_IMAGE: QuestionCardImage[] = [
  // Easy level (6-9) - 4 cards
  { id: "q1", imageFile: "6.png", difficulty: "easy", points: 3 },
  { id: "q2", imageFile: "7.png", difficulty: "easy", points: 3 },
  { id: "q3", imageFile: "8.png", difficulty: "easy", points: 3 },
  { id: "q4", imageFile: "9.png", difficulty: "easy", points: 3 },

  // Medium level (10-15) - 6 cards
  { id: "q5", imageFile: "10.png", difficulty: "medium", points: 4 },
  { id: "q6", imageFile: "11.png", difficulty: "medium", points: 4 },
  { id: "q7", imageFile: "12.png", difficulty: "medium", points: 4 },
  { id: "q8", imageFile: "13.png", difficulty: "medium", points: 4 },
  { id: "q9", imageFile: "14.png", difficulty: "medium", points: 4 },
  { id: "q10", imageFile: "15.png", difficulty: "medium", points: 4 },

  // Hard level (16-23) - 8 cards
  { id: "q11", imageFile: "16.png", difficulty: "hard", points: 5 },
  { id: "q12", imageFile: "17.png", difficulty: "hard", points: 5 },
  { id: "q13", imageFile: "18.png", difficulty: "hard", points: 5 },
  { id: "q14", imageFile: "19.png", difficulty: "hard", points: 5 },
  { id: "q15", imageFile: "20.png", difficulty: "hard", points: 5 },
  { id: "q16", imageFile: "21.png", difficulty: "hard", points: 5 },
  { id: "q17", imageFile: "22.png", difficulty: "hard", points: 5 },
  { id: "q18", imageFile: "23.png", difficulty: "hard", points: 5 },
];
