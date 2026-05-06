"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { v4 as uuid } from "uuid";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, DragEndEvent, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useDreamzStore } from "@/lib/store";
import { STATUSES, StoryCard, CardStatus } from "@/lib/types";

function SortableCard({ card, onEdit, onDelete }: { card: StoryCard; onEdit: (c: StoryCard) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });
  return (
    <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="rounded-xl bg-dreamz-card p-3 border border-purple-300/20 space-y-2">
      <button className="text-left w-full" onClick={() => onEdit(card)}>
        <h3 className="text-lg font-semibold">{card.title}</h3>
        <p className="text-sm text-dreamz-muted line-clamp-3">{card.description || "No description yet."}</p>
        {card.imageUrl && <Image src={card.imageUrl} alt={card.title} width={300} height={180} className="mt-2 rounded-lg w-full h-28 object-cover" unoptimized />}
      </button>
      <div className="flex justify-between">
        <button className="text-xs text-purple-200" {...attributes} {...listeners}>Drag</button>
        <button className="text-xs text-red-300" onClick={() => onDelete(card.id)}><Trash2 className="inline h-3 w-3"/> Delete</button>
      </div>
    </article>
  );
}

function StatusColumn({ status, cards, onEdit, onDelete }: { status: CardStatus; cards: StoryCard[]; onEdit: (c: StoryCard) => void; onDelete: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={`rounded-xl p-3 min-h-64 transition ${isOver ? "bg-purple-700/30 ring-2 ring-dreamz-accent" : "bg-black/20"}`}>
      <h3 className="font-semibold text-lg mb-2">{status}</h3>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">{cards.length === 0 ? <p className="text-sm text-dreamz-muted">Drop cards here</p> : cards.map((card) => <SortableCard key={card.id} card={card} onEdit={onEdit} onDelete={onDelete} />)}</div>
      </SortableContext>
    </div>
  );
}

export default function Page() {
  const { state, persist } = useDreamzStore();
  const [projectName, setProjectName] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [username, setUsername] = useState("DemoUser");
  const [editing, setEditing] = useState<StoryCard | null>(null);
  const [pastedImage, setPastedImage] = useState<string>("");
  const sensors = useSensors(useSensor(PointerSensor));

  const activeProject = state.projects.find((p) => p.id === activeProjectId) ?? null;
  const activeCards = useMemo(() => state.cards.filter((c) => c.projectId === activeProjectId), [state.cards, activeProjectId]);

  const addProject = () => {
    if (!projectName.trim()) return;
    const id = uuid();
    persist({ ...state, projects: [...state.projects, { id, name: projectName.trim(), createdAt: new Date().toISOString() }] });
    setProjectName("");
    setActiveProjectId(id);
  };

  const onPasteImage: React.ClipboardEventHandler<HTMLTextAreaElement> = (e) => {
    const file = e.clipboardData.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = () => setPastedImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const saveCard = (form: FormData) => {
    if (!activeProjectId) return;
    const title = String(form.get("title") || "");
    const description = String(form.get("description") || "");
    const tags = String(form.get("tags") || "").split(",").map((v) => v.trim()).filter(Boolean);
    const status = String(form.get("status") || "Ideas") as CardStatus;
    const imageUrl = pastedImage || String(form.get("imageUrl") || "");

    const card: StoryCard = editing
      ? { ...editing, title, description, tags, status, imageUrl, updatedBy: username, updatedAt: new Date().toISOString() }
      : { id: uuid(), projectId: activeProjectId, title, description, tags, status, imageUrl, comments: [], updatedBy: username, updatedAt: new Date().toISOString() };

    const nextCards = editing ? state.cards.map((c) => (c.id === card.id ? card : c)) : [...state.cards, card];
    persist({ ...state, cards: nextCards });
    setEditing(null);
    setPastedImage("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const target = String(over.id);
    if (!STATUSES.includes(target as CardStatus)) return;
    persist({ ...state, cards: state.cards.map((c) => (c.id === active.id ? { ...c, status: target as CardStatus } : c)) });
  };

  if (!activeProjectId) {
    return (
      <main className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Dreamz Project</h1>
        <section className="bg-dreamz-panel p-5 rounded-2xl border border-purple-300/20 space-y-4">
          <h2 className="text-2xl">Create or open a project</h2>
          <div className="flex gap-3">
            <input className="flex-1" placeholder="New project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            <button className="px-4 py-2 bg-dreamz-accent text-black font-semibold" onClick={addProject}><Plus className="inline h-4 w-4"/> Create</button>
          </div>
          <div className="space-y-2">
            {state.projects.length === 0 ? <p className="text-dreamz-muted">No projects yet. Create one to start.</p> : state.projects.map((p) => (
              <button key={p.id} className="w-full text-left p-3 rounded-lg border border-purple-300/20 hover:border-dreamz-accent" onClick={() => setActiveProjectId(p.id)}>{p.name}</button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button className="px-3 py-2 bg-purple-900/40" onClick={() => setActiveProjectId(null)}><ArrowLeft className="inline h-4 w-4"/> Projects</button>
        <h1 className="text-3xl font-bold">{activeProject?.name}</h1>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" className="ml-auto"/>
      </div>

      <section className="bg-dreamz-panel p-4 rounded-2xl border border-purple-300/20 space-y-3">
        <h2 className="text-xl">Add card (you can paste an image into Notes)</h2>
        <form action={saveCard} className="grid md:grid-cols-2 gap-3">
          <input name="title" required placeholder="Card title" defaultValue={editing?.title} />
          <select name="status" defaultValue={editing?.status ?? "Ideas"}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <textarea name="description" placeholder="Description" defaultValue={editing?.description} />
          <input name="tags" placeholder="tags, comma, separated" defaultValue={editing?.tags?.join(",")} />
          <input name="imageUrl" placeholder="Reference image URL (optional)" defaultValue={editing?.imageUrl} />
          <textarea onPaste={onPasteImage} placeholder="Paste image here (Ctrl+V) or write notes" />
          {pastedImage && <Image src={pastedImage} alt="Pasted preview" width={320} height={180} className="rounded-lg h-28 w-full object-cover" unoptimized />}
          <button className="px-4 py-2 bg-dreamz-accent text-black font-semibold">{editing ? "Update" : "Add"} card</button>
        </form>
      </section>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-5 gap-3">
          {STATUSES.map((status) => <StatusColumn key={status} status={status} cards={activeCards.filter((c) => c.status === status)} onEdit={setEditing} onDelete={(id) => persist({ ...state, cards: state.cards.filter((c) => c.id !== id) })} />)}
        </div>
      </DndContext>
    </main>
  );
}
