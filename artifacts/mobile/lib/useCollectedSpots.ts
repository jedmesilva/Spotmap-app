import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Spot, SpotType } from "@/context/GameContext";

interface SupabaseSpot {
  id: string;
  type: SpotType;
  latitude: number;
  longitude: number;
  title: string;
  value: string;
  radius: number;
  expires_at: string | null;
  owner_id: string | null;
}

function mapSpot(raw: SupabaseSpot): Spot {
  return {
    id: raw.id,
    type: raw.type,
    latitude: raw.latitude,
    longitude: raw.longitude,
    title: raw.title,
    value: raw.value,
    radius: raw.radius,
    expiresAt: raw.expires_at ? new Date(raw.expires_at).getTime() : undefined,
  };
}

export function useCollectedSpots(userId: string | null): Spot[] {
  const [spots, setSpots] = useState<Spot[]>([]);

  useEffect(() => {
    if (!userId) {
      setSpots([]);
      return;
    }

    let cancelled = false;

    const fetchCollected = async () => {
      const { data, error } = await supabase
        .from("spots")
        .select("id, type, latitude, longitude, title, value, radius, expires_at, owner_id")
        .eq("owner_id", userId);

      if (!cancelled && !error && data) {
        setSpots((data as SupabaseSpot[]).map(mapSpot));
      }
    };

    fetchCollected();

    const channel = supabase
      .channel(`collected-spots-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "spots" },
        (payload) => {
          const raw = payload.new as SupabaseSpot;
          if (raw.owner_id === userId) {
            setSpots((prev) => {
              if (prev.some((s) => s.id === raw.id)) return prev;
              return [...prev, mapSpot(raw)];
            });
          } else if (payload.old && (payload.old as SupabaseSpot).owner_id === userId) {
            setSpots((prev) => prev.filter((s) => s.id !== raw.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "spots" },
        (payload) => {
          const id = (payload.old as { id: string }).id;
          setSpots((prev) => prev.filter((s) => s.id !== id));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return spots;
}
