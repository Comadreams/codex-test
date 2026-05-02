"use client";

import { useEffect, useState } from "react";
import type { DreamzState } from "./types";

const KEY = "dreamz-project-state";

const initial: DreamzState = { projects: [], cards: [] };

export function useDreamzStore() {
  const [state, setState] = useState<DreamzState>(initial);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) setState(JSON.parse(raw) as DreamzState);

    const channel = new BroadcastChannel("dreamz-sync");
    channel.onmessage = (event) => setState(event.data as DreamzState);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) setState(JSON.parse(e.newValue) as DreamzState);
    };

    window.addEventListener("storage", onStorage);
    return () => {
      channel.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const persist = (next: DreamzState) => {
    setState(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    new BroadcastChannel("dreamz-sync").postMessage(next);
  };

  return { state, persist };
}
