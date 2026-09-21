"use client";

import { useEffect, useRef, useState } from "react";
import type { DreamzState } from "./types";

const KEY = "dreamz-project-state";

const initial: DreamzState = { projects: [], cards: [] };

export function useDreamzStore() {
  const [state, setState] = useState<DreamzState>(initial);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try { setState(JSON.parse(raw) as DreamzState); } catch { /* Keep an empty board if saved data is corrupt. */ }
    }

    const channel = new BroadcastChannel("dreamz-sync");
    channelRef.current = channel;
    channel.onmessage = (event) => setState(event.data as DreamzState);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try { setState(JSON.parse(e.newValue) as DreamzState); } catch { /* Ignore corrupt storage events. */ }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      channel.close();
      channelRef.current = null;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const persist = (next: DreamzState) => {
    setState(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    channelRef.current?.postMessage(next);
  };

  return { state, persist };
}
