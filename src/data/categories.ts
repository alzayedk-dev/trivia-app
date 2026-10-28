// The Open Trivia Database categories, with short names for the setup chips.
export type Category = { id: number; name: string };

export const CATEGORIES: Category[] = [
  { id: 9, name: 'General Knowledge' },
  { id: 22, name: 'Geography' },
  { id: 23, name: 'History' },
  { id: 17, name: 'Science & Nature' },
  { id: 18, name: 'Computers' },
  { id: 19, name: 'Mathematics' },
  { id: 30, name: 'Gadgets' },
  { id: 27, name: 'Animals' },
  { id: 21, name: 'Sports' },
  { id: 28, name: 'Vehicles' },
  { id: 24, name: 'Politics' },
  { id: 20, name: 'Mythology' },
  { id: 25, name: 'Art' },
  { id: 26, name: 'Celebrities' },
  { id: 10, name: 'Books' },
  { id: 11, name: 'Film' },
  { id: 12, name: 'Music' },
  { id: 13, name: 'Musicals & Theatre' },
  { id: 14, name: 'Television' },
  { id: 15, name: 'Video Games' },
  { id: 16, name: 'Board Games' },
  { id: 29, name: 'Comics' },
  { id: 31, name: 'Anime & Manga' },
  { id: 32, name: 'Cartoons & Animation' },
];

export function categoryName(id: number): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? 'Trivia';
}
