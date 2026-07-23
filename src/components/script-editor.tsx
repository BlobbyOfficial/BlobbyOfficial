"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as Y from "yjs";
import { createClient } from "@/lib/supabase/client";
import { base64ToBytes, bytesToBase64 } from "@/lib/base64";
import { saveScriptContent, renameScript, deleteScript } from "@/app/scripts/actions";
import type { RealtimeChannel } from "@supabase/supabase-js";

const SAVE_DEBOUNCE_MS = 800;

const CURSOR_COLORS = ["#f97316", "#38bdf8", "#a78bfa", "#4ade80", "#f472b6", "#facc15"];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

/** Diff two strings and replay the change onto a Y.Text so concurrent edits
 * from other clients merge instead of one plain-text write clobbering
 * another (the CRDT property that makes this collaborative). */
function applyTextDiff(ytext: Y.Text, oldValue: string, newValue: string) {
  if (oldValue === newValue) return;

  let start = 0;
  const maxStart = Math.min(oldValue.length, newValue.length);
  while (start < maxStart && oldValue[start] === newValue[start]) start++;

  let oldEnd = oldValue.length;
  let newEnd = newValue.length;
  while (oldEnd > start && newEnd > start && oldValue[oldEnd - 1] === newValue[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }

  const deleteCount = oldEnd - start;
  const insertText = newValue.slice(start, newEnd);

  if (deleteCount > 0) ytext.delete(start, deleteCount);
  if (insertText.length > 0) ytext.insert(start, insertText);
}

type PresenceUser = { clientId: string; email: string };

export function ScriptEditor({
  scriptId,
  initialTitle,
  initialContentBase64,
  isOwner,
  currentUserEmail,
}: {
  scriptId: string;
  initialTitle: string;
  initialContentBase64: string;
  isOwner: boolean;
  currentUserEmail: string;
}) {
  const clientId = useMemo(() => crypto.randomUUID(), []);
  const [doc] = useState(() => new Y.Doc());
  const ytext = useMemo(() => doc.getText("content"), [doc]);

  // Seed the doc from the last-persisted snapshot exactly once, synchronously
  // at first render — Yjs updates are idempotent so React Strict Mode's
  // double-invoke of state initializers is harmless here.
  const [value, setValue] = useState(() => {
    if (initialContentBase64) {
      try {
        Y.applyUpdate(doc, base64ToBytes(initialContentBase64));
      } catch {
        // Corrupt/empty snapshot — start from a blank doc rather than crash.
      }
    }
    return doc.getText("content").toString();
  });
  const [title, setTitle] = useState(initialTitle);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<PresenceUser[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Subscribe to live updates from other collaborators.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`script:${scriptId}`, {
      config: { broadcast: { self: false }, presence: { key: clientId } },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "update" }, ({ payload }) => {
      Y.applyUpdate(doc, base64ToBytes(payload.update), "remote");
    });

    channel.on("broadcast", { event: "sync-request" }, ({ payload }) => {
      if (payload.from === clientId) return;
      channel.send({
        type: "broadcast",
        event: "sync-response",
        payload: { to: payload.from, update: bytesToBase64(Y.encodeStateAsUpdate(doc)) },
      });
    });

    channel.on("broadcast", { event: "sync-response" }, ({ payload }) => {
      if (payload.to !== clientId) return;
      Y.applyUpdate(doc, base64ToBytes(payload.update), "remote");
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ email: string }>();
      const users = Object.entries(state).map(([key, entries]) => ({
        clientId: key,
        email: entries[0]?.email ?? "someone",
      }));
      setPeers(users);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setConnected(true);
        await channel.track({ email: currentUserEmail });
        channel.send({ type: "broadcast", event: "sync-request", payload: { from: clientId } });
      }
    });

    const onUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin !== "local") return;
      channel.send({ type: "broadcast", event: "update", payload: { update: bytesToBase64(update) } });

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveScriptContent(scriptId, bytesToBase64(Y.encodeStateAsUpdate(doc)));
      }, SAVE_DEBOUNCE_MS);
    };
    doc.on("update", onUpdate);

    const onRemoteTextChange = () => setValue(ytext.toString());
    ytext.observe(onRemoteTextChange);

    return () => {
      doc.off("update", onUpdate);
      ytext.unobserve(onRemoteTextChange);
      supabase.removeChannel(channel);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    doc.transact(() => applyTextDiff(ytext, value, newValue), "local");
  };

  const handleTitleBlur = () => {
    if (title.trim() !== initialTitle) renameScript(scriptId, title);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href="/scripts" className="text-[11px] text-mid uppercase tracking-[0.14em] no-underline hover:text-fg">
          ← My scripts
        </Link>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] uppercase tracking-[0.1em] ${connected ? "text-mid" : "text-dim"}`}>
            {connected ? "Live" : "Connecting…"}
          </span>
          <div className="flex -space-x-2">
            {peers.map((p) => (
              <div
                key={p.clientId}
                title={p.email}
                className="w-6 h-6 rounded-full border-2 border-bg flex items-center justify-center text-[9px] font-medium text-black"
                style={{ backgroundColor: colorFor(p.email) }}
              >
                {p.email[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          {isOwner && (
            <form action={deleteScript.bind(null, scriptId)}>
              <button type="submit" className="text-[11px] text-red-400 uppercase tracking-[0.1em]">
                Delete
              </button>
            </form>
          )}
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        className="font-display text-3xl tracking-[0.04em] bg-transparent outline-none border-b border-transparent focus:border-border-hover pb-1"
      />

      <textarea
        value={value}
        onChange={handleChange}
        rows={24}
        placeholder="Start writing — anyone with this link and an account can edit live alongside you."
        className="bg-transparent border border-border px-5 py-4 text-[14px] leading-[1.8] text-fg outline-none transition-colors focus:border-border-hover resize-y font-mono"
      />

      <p className="text-[11px] text-dim">
        Anyone signed in with this link can view and edit this script, like a shared doc. Changes save
        automatically.
      </p>
    </div>
  );
}
