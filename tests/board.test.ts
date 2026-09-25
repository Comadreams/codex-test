import test from "node:test";
import assert from "node:assert/strict";
import { deleteCard, moveCard, upsertCard } from "../lib/board.ts";
import type { DreamzState, StoryCard } from "../lib/types.ts";

const card = (id: string, status: StoryCard["status"] = "Ideas", projectId = "one"): StoryCard => ({
  id, projectId, title: id, description: `Details for ${id}`, status, tags: [], comments: [], updatedBy: "Dreamz", updatedAt: "today"
});

test("drop onto a card in a populated column moves before it", () => {
  const cards = [card("a"), card("b", "Drafting"), card("c", "Drafting")];
  const moved = moveCard(cards, "a", "Drafting", "c");
  assert.deepEqual(moved.filter((item) => item.status === "Drafting").map((item) => item.id), ["b", "a", "c"]);
  assert.equal(moved.find((item) => item.id === "a")?.description, "Details for a");
  assert.equal(cards[0].status, "Ideas");
});

test("drop on a column and reorder within a column", () => {
  const cards = [card("a"), card("b"), card("c", "Done")];
  assert.deepEqual(moveCard(cards, "a", "Ideas", "b").map((item) => item.id), ["a", "b", "c"]);
  assert.deepEqual(moveCard(cards, "b", "Ideas", "a").map((item) => item.id), ["b", "a", "c"]);
  assert.equal(moveCard(cards, "a", "Done").at(-1)?.id, "a");
});

test("editing distinct cards preserves their identities and other projects", () => {
  const state: DreamzState = { projects: [], cards: [card("a"), card("b"), card("other", "Ideas", "two")] };
  const first = upsertCard(state, { ...state.cards[0], title: "First edited" });
  const second = upsertCard(first, { ...state.cards[1], title: "Second edited", description: "New detail" });
  assert.deepEqual(second.cards.map((item) => item.title), ["First edited", "Second edited", "other"]);
  assert.equal(second.cards[1].description, "New detail");
  assert.deepEqual(deleteCard(second, "a").cards.map((item) => item.id), ["b", "other"]);
});
