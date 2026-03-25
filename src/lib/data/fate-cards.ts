export interface FateCard {
  id: string;
  title: string;
  description: string;
  effect:
    | "point-booster"
    | "minus"
    | "ligand-gain"
    | "move-forward"
    | "extra-turn"
    | "destiny-dance"
    | "swap-card"
    | "karma-kickback"
    | "twist-fate"
    | "generous-gesture";
  value?: number;
}

export const FATE_CARDS: FateCard[] = [
  {
    id: "point-booster",
    title: "Point Booster",
    description:
      "You've earned an Extra Points card. Hold onto it until the end of the game for an extra three points.",
    effect: "point-booster",
    value: 3,
  },
  {
    id: "eureka-moment",
    title: "Eureka Moment",
    description:
      "Congratulations! Fate smiles upon you, granting you an extra Ligand card.",
    effect: "ligand-gain",
    value: 1,
  },
  {
    id: "minus-card",
    title: "Minus Card",
    description:
      "You've been dealt a Minus Card, deducting three points from your score. Hold until the end of the game.",
    effect: "minus",
    value: -3,
  },
  {
    id: "ligand-square",
    title: "Ligand Square",
    description: "Move ahead 3 spaces. Fate pushes you forward",
    effect: "move-forward",
    value: 3,
  },
  {
    id: "second-chance",
    title: "Second Chance",
    description: "Fate grants you an extra turn.",
    effect: "extra-turn",
    value: 1,
  },
  {
    id: "destiny-dance",
    title: "Destiny Dance",
    description:
      "Roll the dice and let fate decide your direction. You might move backward on the board.",
    effect: "destiny-dance",
  },
  {
    id: "swap-card",
    title: "Swap Card",
    description: "Swap one card with another player of your choice.",
    effect: "swap-card",
  },
  {
    id: "karma-kickback",
    title: "Karma Kickback",
    description: "You must return any one of your Ligand cards back.",
    effect: "karma-kickback",
    value: -1,
  },
  {
    id: "twist-fate",
    title: "Twist of Fate",
    description: "You must exchange one of your Ligand cards with the previous player.",
    effect: "twist-fate",
  },
  {
    id: "generous-gesture",
    title: "Generous Gesture",
    description: "Spread the joy by donating one of your Ligand cards to another player.",
    effect: "generous-gesture",
    value: -1,
  },
];
