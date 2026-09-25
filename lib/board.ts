import type { CardStatus, DreamzState, StoryCard } from "./types";

export function moveCard(cards: StoryCard[], id: string, status: CardStatus, beforeId?: string): StoryCard[] {
  const card = cards.find((item) => item.id === id);
  if (!card || beforeId === id) return cards;
  const remaining = cards.filter((item) => item.id !== id);
  const updated = { ...card, status };
  const index = beforeId ? remaining.findIndex((item) => item.id === beforeId && item.status === status) : -1;
  remaining.splice(index < 0 ? remaining.length : index, 0, updated);
  return remaining;
}

export function upsertCard(state: DreamzState, card: StoryCard): DreamzState {
  return { ...state, cards: state.cards.some((item) => item.id === card.id)
    ? state.cards.map((item) => item.id === card.id ? card : item)
    : [...state.cards, card] };
}

export function deleteCard(state: DreamzState, id: string): DreamzState {
  return { ...state, cards: state.cards.filter((item) => item.id !== id) };
}
