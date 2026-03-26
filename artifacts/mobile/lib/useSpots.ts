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

function isOnMap(raw: SupabaseSpot): boolean {
  if (raw.owner_id !== null) return false;
  if (!raw.expires_at) return true;
  return new Date(raw.expires_at).getTime() > Date.now();
}

export function useSpots(): Spot[] {
  const [spots, setSpots] = useState<Spot[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchSpots = async () => {
      const { data, error } = await supabase
        .from("spots")
        .select("id, type, latitude, longitude, title, value, radius, expires_at, owner_id")
        .is("owner_id", null)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (!cancelled && !error && data) {
        setSpots((data as SupabaseSpot[]).map(mapSpot));
      }
    };

    fetchSpots();

    const channel = supabase
      .channel("spots-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "spots" },
        (payload) => {
          const raw = payload.new as SupabaseSpot;
          if (!isOnMap(raw)) return;
          setSpots((prev) => {
            if (prev.some((s) => s.id === raw.id)) return prev;
            return [...prev, mapSpot(raw)];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "spots" },
        (payload) => {
          const raw = payload.new as SupabaseSpot;
          if (!isOnMap(raw)) {
            // Spot foi coletado (owner_id preenchido) ou expirou → sai do mapa
            setSpots((prev) => prev.filter((s) => s.id !== raw.id));
          } else {
            // Spot voltou ao mapa (owner_id = null, ex: jogador morreu)
            setSpots((prev) => {
              const exists = prev.some((s) => s.id === raw.id);
              if (exists) {
                return prev.map((s) =>
                  s.id === raw.id ? { ...mapSpot(raw), isCollecting: s.isCollecting } : s
                );
              }
              return [...prev, mapSpot(raw)];
            });
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
  }, []);

  return spots;
}
