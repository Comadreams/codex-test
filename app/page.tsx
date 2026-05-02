"use client";

import { useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2 } from "lucide-react";
import { useDreamzStore } from "@/lib/store";
import { STATUSES, StoryCard, CardStatus } from "@/lib/types";

function SortableCard({ card, onEdit, onDelete }: { card: StoryCard; onEdit: (c: StoryCard) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="rounded-xl bg-dreamz-card p-3 border border-purple-300/20 space-y-2"
    >
      <button className="text-left w-full" onClick={() => onEdit(card)}>
        <h3 className="text-lg font-semibold">{card.title}</h3>
        <p className="text-sm text-dreamz-muted line-clamp-3">{card.description || "No description yet."}</p>
      </button>
      <div className="flex flex-wrap gap-2">{card.tags.map((tag) => <span key={tag} className="text-xs bg-purple-900/50 px-2 py-1 rounded-full">#{tag}</span>)}</div>
      <div className="flex justify-between">
        <button className="text-xs text-purple-200" {...attributes} {...listeners}>Drag</button>
        <button className="text-xs text-red-300" onClick={() => onDelete(card.id)}><Trash2 className="inline h-3 w-3"/> Delete</button>
      </div>
    </article>
  );
}

export default function Page() {
  const { state, persist } = useDreamzStore();
  const [projectName, setProjectName] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [username, setUsername] = useState("DemoUser");
  const [editing, setEditing] = useState<StoryCard | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const activeCards = useMemo(() => state.cards.filter((c) => c.projectId === activeProjectId), [state.cards, activeProjectId]);

  const addProject = () => {
    if (!projectName.trim()) return;
    const id = uuid();
    persist({ ...state, projects: [...state.projects, { id, name: projectName.trim(), createdAt: new Date().toISOString() }] });
    setProjectName("");
    setActiveProjectId(id);
  };

  const saveCard = (form: FormData) => {
    if (!activeProjectId) return;
    const title = String(form.get("title") || "");
    const description = String(form.get("description") || "");
    const tags = String(form.get("tags") || "").split(",").map((v) => v.trim()).filter(Boolean);
    const status = String(form.get("status") || "Ideas") as CardStatus;
    const imageUrl = String(form.get("imageUrl") || "");
    const attachmentUrl = String(form.get("attachmentUrl") || "");
    const notes = String(form.get("notes") || "");

    const card: StoryCard = editing
      ? { ...editing, title, description, tags, status, imageUrl, attachmentUrl, updatedBy: username, updatedAt: new Date().toISOString() }
      : { id: uuid(), projectId: activeProjectId, title, description, tags, status, imageUrl, attachmentUrl, comments: [], updatedBy: username, updatedAt: new Date().toISOString() };

    const withComment = notes ? { ...card, comments: [...card.comments, { id: uuid(), author: username, text: notes, createdAt: new Date().toISOString() }] } : card;
    const nextCards = editing ? state.cards.map((c) => (c.id === withComment.id ? withComment : c)) : [...state.cards, withComment];
    persist({ ...state, cards: nextCards });
    setEditing(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activeCards.findIndex((c) => c.id === active.id);
    const overCard = activeCards.find((c) => c.id === over.id);
    const dragged = activeCards.find((c) => c.id === active.id);
    if (!dragged) return;

    let next = [...activeCards];
    if (overCard) {
      const newIndex = activeCards.findIndex((c) => c.id === over.id);
      if (dragged.status === overCard.status) {
        next = arrayMove(activeCards, oldIndex, newIndex);
      } else {
        next[oldIndex] = { ...dragged, status: overCard.status };
      }
    } else if (STATUSES.includes(String(over.id) as CardStatus)) {
      next[oldIndex] = { ...dragged, status: String(over.id) as CardStatus };
    }

    const remaining = state.cards.filter((c) => c.projectId !== activeProjectId);
    persist({ ...state, cards: [...remaining, ...next] });
  };

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-4xl font-bold">Dreamz Project</h1>
      <section className="bg-dreamz-panel p-4 rounded-2xl space-y-3 border border-purple-300/20">
        <h2 className="text-2xl">Project Dashboard</h2>
        <div className="flex gap-3">
          <input className="flex-1" placeholder="New project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          <button className="px-4 py-2 bg-dreamz-accent text-black font-semibold" onClick={addProject}><Plus className="inline h-4 w-4"/> Create</button>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {state.projects.map((p) => (
            <div key={p.id} className={`p-3 rounded-xl border ${activeProjectId === p.id ? "border-dreamz-accent" : "border-purple-300/20"}`}>
              <button className="text-left w-full font-semibold" onClick={() => setActiveProjectId(p.id)}>{p.name}</button>
              <div className="mt-2 flex gap-2">
                <button className="text-xs px-2 py-1 bg-purple-900/40" onClick={() => {
                  const name = prompt("Rename project", p.name);
                  if (!name) return;
                  persist({ ...state, projects: state.projects.map((x) => (x.id === p.id ? { ...x, name } : x)) });
                }}>Rename</button>
                <button className="text-xs px-2 py-1 bg-red-900/40" onClick={() => persist({ projects: state.projects.filter((x) => x.id !== p.id), cards: state.cards.filter((c) => c.projectId !== p.id) })}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-dreamz-panel p-4 rounded-2xl space-y-4 border border-purple-300/20">
        <div className="flex flex-wrap gap-3 items-center"><h2 className="text-2xl">Storyboard Board</h2><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your display name"/></div>
        <form action={saveCard} className="grid md:grid-cols-2 gap-3">
          <input name="title" required placeholder="Card title" defaultValue={editing?.title} />
          <select name="status" defaultValue={editing?.status ?? "Ideas"}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <textarea name="description" placeholder="Description" defaultValue={editing?.description} />
          <input name="tags" placeholder="tags, comma, separated" defaultValue={editing?.tags?.join(",")} />
          <input name="imageUrl" placeholder="Reference image URL" defaultValue={editing?.imageUrl} />
          <input name="attachmentUrl" placeholder="Attachment URL (demo MVP)" defaultValue={editing?.attachmentUrl} />
          <textarea name="notes" placeholder="Comment / note" />
          <button className="px-4 py-2 bg-dreamz-accent text-black font-semibold">{editing ? "Update" : "Add"} card</button>
        </form>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid lg:grid-cols-5 gap-3">
            {STATUSES.map((status) => {
              const cards = activeCards.filter((c) => c.status === status);
              return (
                <div key={status} id={status} className="bg-black/20 rounded-xl p-3 min-h-64">
                  <h3 className="font-semibold text-lg mb-2">{status}</h3>
                  <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {cards.map((card) => <SortableCard key={card.id} card={card} onEdit={setEditing} onDelete={(id) => persist({ ...state, cards: state.cards.filter((c) => c.id !== id) })} />)}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </DndContext>
      </section>
    </main>
  );
}
