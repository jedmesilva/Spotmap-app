import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Spot, SpotBadge, SpotType } from "@/context/GameContext";

interface SupabaseSpot {
  id: string;
  type: SpotType;
  latitude: number;
  longitude: number;
  title: string;
  value: string;
  radius: number;
  image_url: string | null;
  expires_at: string | null;
  owner_id: string | null;
  manipulated: boolean | null;
}

function buildBadges(raw: SupabaseSpot): SpotBadge[] {
  const badges: SpotBadge[] = [];
  if (raw.manipulated) badges.push("manipulated");
  return badges;
}

function mapSpot(raw: SupabaseSpot): Spot {
  const badges = buildBadges(raw);
  return {
    id: raw.id,
    type: raw.type,
    latitude: raw.latitude,
    longitude: raw.longitude,
    title: raw.title,
    value: raw.value,
    radius: raw.radius,
    imageUrl: raw.image_url ?? undefined,
    expiresAt: raw.expires_at ? new Date(raw.expires_at).getTime() : undefined,
    badges: badges.length > 0 ? badges : undefined,
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
      let { data, error } = await supabase
        .from("spots")
        .select("id, type, latitude, longitude, title, value, radius, image_url, expires_at, owner_id, manipulated")
        .eq("owner_id", userId);

      if (error?.code === "42703") {
        ({ data, error } = await supabase
          .from("spots")
          .select("id, type, latitude, longitude, title, value, radius, expires_at, owner_id")
          .eq("owner_id", userId));
      }

      if (!cancelled && !error && data) {
        setSpots((data as SupabaseSpot[]).map(mapSpot));
      }
    };

    fetchCollected();

    const channel = supabase
      .channel(`collected-spots-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "spots" },
        (payload) => {
          const raw = payload.new as SupabaseSpot;
          if (raw.owner_id === userId) {
            setSpots((prev) => {
              if (prev.some((s) => s.id === raw.id)) return prev;
              return [...prev, mapSpot(raw)];
            });
          }
        }
      )
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
