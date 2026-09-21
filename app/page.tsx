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
import { deleteCard, moveCard, upsertCard } from "@/lib/board";

function SortableCard({ card, onEdit, onDelete, onMove }: { card: StoryCard; onEdit: (c: StoryCard) => void; onDelete: (id: string) => void; onMove: (id: string, status: CardStatus) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });
  return (
    <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="rounded-xl bg-dreamz-card p-3 border border-purple-300/20 space-y-2">
      <button className="text-left w-full" onClick={() => onEdit(card)} aria-label={`Edit ${card.title}`}>
        <h3 className="text-lg font-semibold">{card.title}</h3>
        <p className="text-sm text-dreamz-muted line-clamp-3">{card.description || "No description yet."}</p>
        {card.notes && <p className="text-sm text-dreamz-muted line-clamp-2">Notes: {card.notes}</p>}
        {card.imageUrl && <Image src={card.imageUrl} alt={card.title} width={300} height={180} className="mt-2 rounded-lg w-full h-28 object-cover" unoptimized />}
      </button>
      {card.attachmentUrl && <a className="text-xs text-purple-200 underline" href={card.attachmentUrl} target="_blank" rel="noopener noreferrer">Open attachment</a>}
      <div className="flex justify-between">
        <button type="button" className="text-xs text-purple-200 touch-none cursor-grab" {...attributes} {...listeners} aria-label={`Drag ${card.title}`}>Drag</button>
        <label className="text-xs text-purple-200">Move to <select aria-label={`Move ${card.title} to`} value={card.status} onChange={(e) => onMove(card.id, e.target.value as CardStatus)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
        <button type="button" className="text-xs text-red-300" onClick={() => onDelete(card.id)} aria-label={`Delete ${card.title}`}><Trash2 className="inline h-3 w-3"/> Delete</button>
      </div>
    </article>
  );
}

function StatusColumn({ status, cards, onEdit, onDelete, onMove }: { status: CardStatus; cards: StoryCard[]; onEdit: (c: StoryCard) => void; onDelete: (id: string) => void; onMove: (id: string, status: CardStatus) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={`rounded-xl p-3 min-h-64 transition ${isOver ? "bg-purple-700/30 ring-2 ring-dreamz-accent" : "bg-black/20"}`}>
      <h3 className="font-semibold text-lg mb-2">{status}</h3>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">{cards.length === 0 ? <p className="text-sm text-dreamz-muted">Drop cards here</p> : cards.map((card) => <SortableCard key={card.id} card={card} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />)}</div>
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
  const [notice, setNotice] = useState("");
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
    const title = String(form.get("title") || "").trim();
    if (!title) return;
    const description = String(form.get("description") || "");
    const tags = String(form.get("tags") || "").split(",").map((v) => v.trim()).filter(Boolean);
    const status = String(form.get("status") || "Ideas") as CardStatus;
    const imageUrl = pastedImage || String(form.get("imageUrl") || "");
    const notes = String(form.get("notes") || "");
    const attachmentInput = String(form.get("attachmentUrl") || "").trim();
    const attachmentUrl = /^https?:\/\//i.test(attachmentInput) ? attachmentInput : "";

    const card: StoryCard = editing
      ? { ...editing, title, description, tags, status, imageUrl, notes, attachmentUrl, updatedBy: username, updatedAt: new Date().toISOString() }
      : { id: uuid(), projectId: activeProjectId, title, description, tags, status, imageUrl, notes, attachmentUrl, comments: [], updatedBy: username, updatedAt: new Date().toISOString() };

    persist(upsertCard(state, card));
    setNotice(editing ? `Updated ${title}` : `Added ${title}`);
    setEditing(null);
    setPastedImage("");
  };

  const removeCard = (id: string) => {
    const card = activeCards.find((item) => item.id === id);
    if (!card || !window.confirm(`Delete “${card.title}”? This cannot be undone.`)) return;
    persist(deleteCard(state, id));
    if (editing?.id === id) { setEditing(null); setPastedImage(""); }
    setNotice(`Deleted ${card.title}`);
  };

  const relocateCard = (id: string, status: CardStatus, beforeId?: string) => {
    persist({ ...state, cards: moveCard(state.cards, id, status, beforeId) });
    setNotice(`Moved card to ${status}`);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const target = String(over.id);
    const targetStatus = STATUSES.includes(target as CardStatus)
      ? (target as CardStatus)
      : activeCards.find((card) => card.id === target)?.status;
    if (!targetStatus) return;
    relocateCard(String(active.id), targetStatus, STATUSES.includes(target as CardStatus) ? undefined : target);
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
        <h2 className="text-xl">{editing ? `Edit ${editing.title}` : "Add card"}</h2>
        {notice && <p role="status" className="text-sm text-purple-200">{notice}</p>}
        <form key={editing?.id ?? "new"} action={saveCard} className="grid md:grid-cols-2 gap-3">
          <input name="title" aria-label="Card title" required placeholder="Card title" defaultValue={editing?.title ?? ""} />
          <select name="status" aria-label="Card status" defaultValue={editing?.status ?? "Ideas"}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <textarea name="description" aria-label="Description" placeholder="Description" defaultValue={editing?.description ?? ""} />
          <input name="tags" aria-label="Tags" placeholder="tags, comma, separated" defaultValue={editing?.tags?.join(",") ?? ""} />
          <input name="imageUrl" aria-label="Reference image URL" placeholder="Reference image URL (optional)" defaultValue={editing?.imageUrl ?? ""} />
          <input name="attachmentUrl" type="url" aria-label="Attachment URL" placeholder="Attachment URL (optional)" defaultValue={editing?.attachmentUrl ?? ""} />
          <textarea name="notes" aria-label="Notes" onPaste={onPasteImage} placeholder="Notes (you can paste an image here too)" defaultValue={editing?.notes ?? ""} />
          {pastedImage && <Image src={pastedImage} alt="Pasted preview" width={320} height={180} className="rounded-lg h-28 w-full object-cover" unoptimized />}
          <button className="px-4 py-2 bg-dreamz-accent text-black font-semibold">{editing ? "Update" : "Add"} card</button>
          {editing && <button type="button" className="px-4 py-2 bg-purple-900/40" onClick={() => { setEditing(null); setPastedImage(""); }}>Cancel edit</button>}
        </form>
      </section>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-5 gap-3">
          {STATUSES.map((status) => <StatusColumn key={status} status={status} cards={activeCards.filter((c) => c.status === status)} onEdit={(card) => { setEditing(card); setPastedImage(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} onDelete={removeCard} onMove={relocateCard} />)}
        </div>
      </DndContext>
    </main>
  );
}
