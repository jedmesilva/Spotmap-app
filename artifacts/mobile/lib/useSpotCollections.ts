import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface CollectionProgress {
  id: string;
  userId: string;
  spotId: string;
  clicks: number;
  clicksRequired: number;
  progress: number;
  startedAt: string;
}

type CollectionsMap = Map<string, CollectionProgress[]>;

function buildEntry(row: Record<string, unknown>): CollectionProgress {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    spotId: row.spot_id as string,
    clicks: (row.clicks as number) ?? 0,
    clicksRequired: (row.clicks_required as number) ?? 0,
    progress: (row.progress as number) ?? 0,
    startedAt: row.started_at as string,
  };
}

function addToMap(map: CollectionsMap, entry: CollectionProgress): CollectionsMap {
  const next = new Map(map);
  const existing = next.get(entry.spotId) ?? [];
  if (!existing.some((e) => e.id === entry.id)) {
    next.set(entry.spotId, [...existing, entry]);
  }
  return next;
}

function updateInMap(map: CollectionsMap, entry: CollectionProgress): CollectionsMap {
  const next = new Map(map);
  const existing = next.get(entry.spotId) ?? [];
  const updated = existing.map((e) => (e.id === entry.id ? entry : e));
  next.set(entry.spotId, updated);
  return next;
}

function removeFromMap(map: CollectionsMap, spotId: string, id: string): CollectionsMap {
  const next = new Map(map);
  const existing = (next.get(spotId) ?? []).filter((e) => e.id !== id);
  if (existing.length === 0) {
    next.delete(spotId);
  } else {
    next.set(spotId, existing);
  }
  return next;
}

export function useSpotCollections(): CollectionsMap {
  const [collections, setCollections] = useState<CollectionsMap>(new Map());

  useEffect(() => {
    let cancelled = false;

    const fetchActive = async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, user_id, spot_id, clicks, clicks_required, progress, started_at")
        .eq("status", "in_progress");

      if (cancelled || error || !data) return;

      const map = new Map<string, CollectionProgress[]>();
      for (const row of data as Record<string, unknown>[]) {
        const entry = buildEntry(row);
        const existing = map.get(entry.spotId) ?? [];
        map.set(entry.spotId, [...existing, entry]);
      }
      setCollections(map);
    };

    fetchActive();

    const channel = supabase
      .channel("collections-progress")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "collections" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.status !== "in_progress") return;
          const entry = buildEntry(row);
          setCollections((prev) => addToMap(prev, entry));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "collections" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const entry = buildEntry(row);
          if (row.status !== "in_progress") {
            setCollections((prev) =>
              removeFromMap(prev, row.spot_id as string, row.id as string)
            );
          } else {
            setCollections((prev) => updateInMap(prev, entry));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return collections;
}
