/**
 * Character catalogue — pulled from Kenney Animal Pack Redux (CC0).
 * https://kenney.nl/assets/animal-pack-redux
 *
 * All 30 "Square" style blooks live under /public/characters/blook/.
 * Add new rows to CHARACTERS and the picker / game board pick them
 * up automatically — no hardcoded cases elsewhere.
 */

export interface Character {
  id: string;
  name: string;
  /** Public path to the PNG under /characters/blook/. */
  image: string;
  /** Tailwind-safe background tint shown behind the sprite in pickers. */
  tint: string;
  /** Whimsical tag used in tooltips; purely cosmetic. */
  tag?: string;
}

export const CHARACTERS: Character[] = [
  { id: "panda",     name: "Panda",     image: "/characters/blook/panda.png",     tint: "bg-slate-100",   tag: "Chill" },
  { id: "frog",      name: "Frog",      image: "/characters/blook/frog.png",      tint: "bg-emerald-100", tag: "Bouncy" },
  { id: "dog",       name: "Dog",       image: "/characters/blook/dog.png",       tint: "bg-amber-100",   tag: "Loyal" },
  { id: "cat",       name: "Owl",       image: "/characters/blook/owl.png",       tint: "bg-indigo-100",  tag: "Wise" },
  { id: "rabbit",    name: "Rabbit",    image: "/characters/blook/rabbit.png",    tint: "bg-pink-100",    tag: "Quick" },
  { id: "penguin",   name: "Penguin",   image: "/characters/blook/penguin.png",   tint: "bg-sky-100",     tag: "Cool" },
  { id: "elephant",  name: "Elephant",  image: "/characters/blook/elephant.png",  tint: "bg-gray-200",    tag: "Mighty" },
  { id: "monkey",    name: "Monkey",    image: "/characters/blook/monkey.png",    tint: "bg-orange-100",  tag: "Playful" },
  { id: "pig",       name: "Pig",       image: "/characters/blook/pig.png",       tint: "bg-rose-100",    tag: "Happy" },
  { id: "chick",     name: "Chick",     image: "/characters/blook/chick.png",     tint: "bg-yellow-100",  tag: "Cute" },
  { id: "giraffe",   name: "Giraffe",   image: "/characters/blook/giraffe.png",   tint: "bg-yellow-200",  tag: "Tall" },
  { id: "hippo",     name: "Hippo",     image: "/characters/blook/hippo.png",     tint: "bg-purple-100",  tag: "Chunky" },
  { id: "cow",       name: "Cow",       image: "/characters/blook/cow.png",       tint: "bg-stone-100",   tag: "Moody" },
  { id: "gorilla",   name: "Gorilla",   image: "/characters/blook/gorilla.png",   tint: "bg-neutral-200", tag: "Strong" },
  { id: "parrot",    name: "Parrot",    image: "/characters/blook/parrot.png",    tint: "bg-lime-100",    tag: "Loud" },
  { id: "sloth",     name: "Sloth",     image: "/characters/blook/sloth.png",     tint: "bg-amber-200",   tag: "Sleepy" },
  { id: "narwhal",   name: "Narwhal",   image: "/characters/blook/narwhal.png",   tint: "bg-cyan-100",    tag: "Mythic" },
  { id: "crocodile", name: "Crocodile", image: "/characters/blook/crocodile.png", tint: "bg-green-100",   tag: "Toothy" },
  { id: "bear",      name: "Bear",      image: "/characters/blook/bear.png",      tint: "bg-amber-100",   tag: "Cuddly" },
  { id: "buffalo",   name: "Buffalo",   image: "/characters/blook/buffalo.png",   tint: "bg-stone-200",   tag: "Stoic" },
  { id: "chicken",   name: "Chicken",   image: "/characters/blook/chicken.png",   tint: "bg-red-100",     tag: "Feisty" },
  { id: "duck",      name: "Duck",      image: "/characters/blook/duck.png",      tint: "bg-yellow-100",  tag: "Waddly" },
  { id: "goat",      name: "Goat",      image: "/characters/blook/goat.png",      tint: "bg-stone-100",   tag: "Climbing" },
  { id: "horse",     name: "Horse",     image: "/characters/blook/horse.png",     tint: "bg-amber-100",   tag: "Classic" },
  { id: "moose",     name: "Moose",     image: "/characters/blook/moose.png",     tint: "bg-orange-100",  tag: "Majestic" },
  { id: "rhino",     name: "Rhino",     image: "/characters/blook/rhino.png",     tint: "bg-gray-200",    tag: "Armored" },
  { id: "snake",     name: "Snake",     image: "/characters/blook/snake.png",     tint: "bg-green-100",   tag: "Sneaky" },
  { id: "walrus",    name: "Walrus",    image: "/characters/blook/walrus.png",    tint: "bg-blue-100",    tag: "Whiskery" },
  { id: "whale",     name: "Whale",     image: "/characters/blook/whale.png",     tint: "bg-blue-100",    tag: "Gentle" },
  { id: "zebra",     name: "Zebra",     image: "/characters/blook/zebra.png",     tint: "bg-gray-200",    tag: "Striped" },
];

/**
 * Default fallback when a player hasn't chosen a character yet.
 * Picks from the top of the list cycling by slot index.
 */
export const DEFAULT_ORDER: string[] = ["panda", "frog", "dog", "cat"];

export function getCharacter(id: string | null | undefined): Character | null {
  if (!id) return null;
  return CHARACTERS.find((c) => c.id === id) || null;
}
