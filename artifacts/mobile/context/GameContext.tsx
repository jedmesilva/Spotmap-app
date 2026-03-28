import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { useSpots } from "@/lib/useSpots";
import { useSpotCollections, CollectionProgress } from "@/lib/useSpotCollections";
import { useCollectedSpots } from "@/lib/useCollectedSpots";
import { useAuth } from "@/context/AuthContext";

export type SpotType = "coupon" | "money" | "product" | "rare";
export type ArtifactType = "fire" | "ice" | "lightning" | "poison" | "shield";
export type SubstanceType = "flame_shield" | "cryo_armor" | "volt_ward" | "antidote" | "barrier";
export type MedalRarity = "common" | "rare" | "epic" | "legendary";

export type SpotBadge = "manipulated" | (string & {});

export interface SpotBadgeConfig {
  icon: string;
  color: string;
  label: string;
}

export const SPOT_BADGE_CONFIGS: Record<string, SpotBadgeConfig> = {
  manipulated: { icon: "flask", color: "#A78BFA", label: "Manipulado" },
};

export interface Medal {
  id: string;
  icon: string;
  name: string;
  description: string;
  rarity: MedalRarity;
  holderCount: number;
  unlockedAt?: number;
}

export interface Spot {
  id: string;
  type: SpotType;
  latitude: number;
  longitude: number;
  title: string;
  value: string;
  radius: number;
  imageUrl?: string;
  expiresAt?: number;
  isCollecting?: boolean;
  badges?: SpotBadge[];
}

export interface InventoryItem {
  id: string;
  type: SpotType | ArtifactType | SubstanceType;
  name: string;
  quantity: number;
  icon: string;
}

export interface NearbyUser {
  id: string;
  name: string;
  avatar: string;
  latitude: number;
  longitude: number;
  collectingSpotId?: string;
  collectProgress: number;
  health: number;
  maxHealth: number;
  strength: number;
  immunities: SubstanceType[];
  medals?: Medal[];
  bag?: InventoryItem[];
  coins?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  health: number;
  maxHealth: number;
  strength: number;
  immunities: SubstanceType[];
  bag: InventoryItem[];
  coins: number;
  medals: Medal[];
}

interface AttackEvent {
  targetUserId: string;
  artifactType: ArtifactType;
  damage: number;
  blocked: boolean;
}

interface ActiveCollection {
  spotId: string;
  collectionId: string | null;
  progress: number;
  clicks: number;
  startedAt: number;
}

interface GameState {
  userProfile: UserProfile;
  spots: Spot[];
  collectedSpots: Spot[];
  nearbyUsers: NearbyUser[];
  activeCollection: ActiveCollection | null;
  selectedSpot: Spot | null;
  selectedUser: NearbyUser | null;
  selectedInventorySpot: Spot | null;
  attackEvents: AttackEvent[];
  userLocation: { latitude: number; longitude: number; accuracy?: number } | null;
  spotCollections: Map<string, CollectionProgress[]>;
}

interface GameActions {
  setUserLocation: (loc: { latitude: number; longitude: number; accuracy?: number }) => void;
  startCollecting: (spotId: string) => void;
  stopCollecting: () => void;
  updateCollectProgress: (progress: number) => void;
  mineSpot: (spotId: string) => void;
  selectSpot: (spot: Spot | null) => void;
  selectUser: (user: NearbyUser | null) => void;
  selectInventorySpot: (spot: Spot | null) => void;
  fireInventorySpot: (mineableSpotId?: string | null) => void;
  attackUser: (targetUserId: string, artifactType: ArtifactType) => AttackEvent;
  useSubstance: (substance: SubstanceType) => void;
  addToInventory: (item: InventoryItem) => void;
  completeCollection: (spotId: string) => void;
  abandonSpot: (spotId: string) => Promise<void>;
  useSpot: (spotId: string) => Promise<void>;
  updateProfile: (fields: Partial<Pick<UserProfile, "name" | "nickname" | "email" | "avatar">>) => void;
  restoreStrength: (amount: number) => void;
}

export const SPOT_HITS: Record<SpotType, number> = {
  coupon: 5,
  money: 8,
  product: 12,
  rare: 20,
};

export const STRENGTH_BASE = 100;
export const STRENGTH_DRAIN_PER_HIT = 5;
export const STRENGTH_MONSTER_THRESHOLD = 200;
const STRENGTH_DECAY_INTERVAL_MS = 30_000;
const STRENGTH_ATTACK_DRAIN = 15;

export function getStrengthMultiplier(strength: number): number {
  return Math.max(0.25, strength / STRENGTH_BASE);
}

export function isMonsterMode(strength: number): boolean {
  return strength >= STRENGTH_MONSTER_THRESHOLD;
}

const ARTIFACT_DAMAGE: Record<ArtifactType, number> = {
  fire: 25,
  ice: 15,
  lightning: 35,
  poison: 20,
  shield: 0,
};

const ARTIFACT_IMMUNITY: Record<ArtifactType, SubstanceType> = {
  fire: "flame_shield",
  ice: "cryo_armor",
  lightning: "volt_ward",
  poison: "antidote",
  shield: "barrier",
};

export const SPOT_DAMAGE: Record<SpotType, number> = {
  coupon: 10,
  money: 20,
  product: 30,
  rare: 50,
};

const NEARBY_RADIUS_KM = 5;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DEFAULT_PROFILE: UserProfile = {
  id: "user1",
  name: "Você",
  nickname: "você",
  email: "voce@exemplo.com",
  avatar: "V",
  level: 0,
  xp: 0,
  health: 0,
  maxHealth: 0,
  strength: 0,
  immunities: [],
  coins: 0,
  bag: [],
  medals: [],
};

const LOCATION_HISTORY_MIN_INTERVAL_MS = 10_000;
const LOCATION_HISTORY_MIN_DISTANCE_M  = 8;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const GameContext = createContext<(GameState & GameActions) | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { session, userProfile: authUserProfile } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const supabaseSpots = useSpots();
  const spotCollections = useSpotCollections();
  const [collectingIds, setCollectingIds] = useState<Record<string, boolean>>({});
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const spots = useMemo<Spot[]>(
    () =>
      supabaseSpots
        .filter((s) => !removedIds.has(s.id))
        .map((s) => ({ ...s, isCollecting: collectingIds[s.id] ?? false })),
    [supabaseSpots, collectingIds, removedIds]
  );
  const collectedSpots = useCollectedSpots(session?.user?.id ?? null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [activeCollection, setActiveCollection] = useState<ActiveCollection | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [selectedInventorySpot, setSelectedInventorySpot] = useState<Spot | null>(null);
  const [attackEvents, setAttackEvents] = useState<AttackEvent[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);

  const activeCollectionRef = useRef<ActiveCollection | null>(null);
  const userLocationRef = useRef<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const sessionRef = useRef(session);
  const userProfileRef = useRef<UserProfile>(DEFAULT_PROFILE);
  const selectedUserRef = useRef<NearbyUser | null>(null);
  const selectedInventorySpotRef = useRef<Spot | null>(null);
  const lastLocationHistoryRef = useRef<{
    id: string;
    latitude: number;
    longitude: number;
    recordedAt: number;
  } | null>(null);

  useEffect(() => { activeCollectionRef.current = activeCollection; }, [activeCollection]);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { userProfileRef.current = userProfile; }, [userProfile]);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { selectedInventorySpotRef.current = selectedInventorySpot; }, [selectedInventorySpot]);

  useEffect(() => {
    if (selectedUser) {
      const updated = nearbyUsers.find((u) => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
      else setSelectedUser(null);
    }
  }, [nearbyUsers]);

  useEffect(() => {
    if (!authUserProfile) return;
    setUserProfile((prev) => ({
      ...prev,
      id: authUserProfile.id,
      name: authUserProfile.name,
      nickname: authUserProfile.nickname,
      email: authUserProfile.email,
      avatar: authUserProfile.avatar,
    }));
  }, [authUserProfile?.avatar, authUserProfile?.name, authUserProfile?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    supabase
      .from("users")
      .select("strength, health, max_health, coins, xp, level")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setUserProfile((prev) => ({
            ...prev,
            strength: data.strength ?? STRENGTH_BASE,
            health: data.health ?? prev.health,
            maxHealth: data.max_health ?? prev.maxHealth,
            coins: data.coins ?? prev.coins,
            xp: data.xp ?? prev.xp,
            level: data.level ?? prev.level,
          }));
        }
      });
  }, [session]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUserProfile((prev) => {
        const s = prev.strength;
        if (s <= 0) return prev;
        const decay = s >= STRENGTH_MONSTER_THRESHOLD ? 3 : s > STRENGTH_BASE ? 2 : 1;
        const newStrength = Math.max(0, s - decay);
        const userId = sessionRef.current?.user?.id;
        if (userId) {
          supabase.from("users").update({ strength: newStrength }).eq("id", userId);
        }
        return { ...prev, strength: newStrength };
      });
    }, STRENGTH_DECAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Publica localização do jogador na tabela user_locations (throttle 4s)
  const locationPublishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !userLocation) return;

    if (locationPublishTimer.current) return;

    locationPublishTimer.current = setTimeout(async () => {
      locationPublishTimer.current = null;
      await supabase.from("user_locations").upsert(
        {
          user_id: userId,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }, 4000);

    return () => {
      if (locationPublishTimer.current) {
        clearTimeout(locationPublishTimer.current);
        locationPublishTimer.current = null;
      }
    };
  }, [userLocation, session]);

  // Grava pontos de rastro em location_history (a cada 30s ou >50m de movimento)
  useEffect(() => {
    const userId = sessionRef.current?.user?.id;
    const loc = userLocation;
    if (!userId || !loc) return;

    const last = lastLocationHistoryRef.current;
    const elapsed = last ? Date.now() - last.recordedAt : Infinity;
    const distance = last
      ? haversineDistance(last.latitude, last.longitude, loc.latitude, loc.longitude)
      : Infinity;

    if (elapsed < LOCATION_HISTORY_MIN_INTERVAL_MS && distance < LOCATION_HISTORY_MIN_DISTANCE_M) return;

    supabase
      .from("location_history")
      .insert({
        user_id: userId,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy ?? null,
        recorded_at: new Date().toISOString(),
      })
      .select("id")
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          lastLocationHistoryRef.current = {
            id: data.id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            recordedAt: Date.now(),
          };
        }
      });
  }, [userLocation]);

  // Garante que existe um ponto de localização recente e retorna seu id (para vincular a eventos)
  const ensureLocationRecorded = useCallback(async (): Promise<string | null> => {
    const userId = sessionRef.current?.user?.id;
    const loc = userLocationRef.current;
    if (!userId || !loc) return null;

    const last = lastLocationHistoryRef.current;
    if (last && Date.now() - last.recordedAt < 60_000) return last.id;

    const { data, error } = await supabase
      .from("location_history")
      .insert({
        user_id: userId,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy ?? null,
        recorded_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) return null;

    lastLocationHistoryRef.current = {
      id: data.id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      recordedAt: Date.now(),
    };
    return data.id;
  }, []);

  // Carrega perfil de um usuário e o insere/atualiza em nearbyUsers
  const upsertNearbyUser = useCallback(async (
    userId: string,
    lat: number,
    lon: number,
  ) => {
    const { data: p } = await supabase
      .from("users")
      .select("id, name, nickname, avatar, health, max_health, strength")
      .eq("id", userId)
      .single();
    if (!p) return;

    // Busca coleta ativa desse jogador
    const { data: col } = await supabase
      .from("collections")
      .select("spot_id, progress")
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setNearbyUsers((prev) => {
      const existing = prev.find((u) => u.id === userId);
      const updated: NearbyUser = {
        id: p.id,
        name: p.nickname || p.name,
        avatar: p.avatar ?? p.name?.[0] ?? "?",
        latitude: lat,
        longitude: lon,
        collectingSpotId: col?.spot_id ?? undefined,
        collectProgress: col?.progress ?? 0,
        health: p.health ?? 100,
        maxHealth: p.max_health ?? 100,
        strength: p.strength ?? 100,
        immunities: existing?.immunities ?? [],
        medals: existing?.medals ?? [],
        bag: existing?.bag ?? [],
        coins: existing?.coins,
      };
      if (existing) {
        return prev.map((u) => (u.id === userId ? updated : u));
      }
      return [...prev, updated];
    });
  }, []);

  // Carga inicial de todos os jogadores com localização registrada
  const loadAllLocations = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    const { data: locations } = await supabase
      .from("user_locations")
      .select("user_id, latitude, longitude")
      .neq("user_id", userId);

    if (!locations || locations.length === 0) {
      setNearbyUsers([]);
      return;
    }

    const ids = locations.map((l) => l.user_id);
    const { data: profiles } = await supabase
      .from("users")
      .select("id, name, nickname, avatar, health, max_health, strength")
      .in("id", ids);

    const { data: activeCols } = await supabase
      .from("collections")
      .select("user_id, spot_id, progress")
      .in("user_id", ids)
      .eq("status", "in_progress");

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const colMap = new Map((activeCols ?? []).map((c) => [c.user_id, c]));

    const users: NearbyUser[] = locations.map((loc) => {
      const p = profileMap.get(loc.user_id);
      if (!p) return null;
      const col = colMap.get(loc.user_id);
      return {
        id: p.id,
        name: p.nickname || p.name,
        avatar: p.avatar ?? p.name?.[0] ?? "?",
        latitude: loc.latitude,
        longitude: loc.longitude,
        collectingSpotId: col?.spot_id ?? undefined,
        collectProgress: col?.progress ?? 0,
        health: p.health ?? 100,
        maxHealth: p.max_health ?? 100,
        strength: p.strength ?? 100,
        immunities: [],
        medals: [],
        bag: [],
      } as NearbyUser;
    }).filter(Boolean) as NearbyUser[];

    setNearbyUsers(users);
  }, [session]);

  // Assina user_locations e collections em realtime
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    loadAllLocations();

    const channel = supabase
      .channel("presence_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_locations" },
        (payload) => {
          const r = payload.new as { user_id: string; latitude: number; longitude: number };
          if (r.user_id !== userId) upsertNearbyUser(r.user_id, r.latitude, r.longitude);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_locations" },
        (payload) => {
          const r = payload.new as { user_id: string; latitude: number; longitude: number };
          if (r.user_id !== userId) upsertNearbyUser(r.user_id, r.latitude, r.longitude);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "user_locations" },
        (payload) => {
          const r = payload.old as { user_id: string };
          if (r.user_id) {
            setNearbyUsers((prev) => prev.filter((u) => u.id !== r.user_id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collections" },
        (payload) => {
          const r = (payload.new ?? payload.old) as {
            user_id: string; spot_id: string; progress: number; status: string;
          };
          if (!r.user_id || r.user_id === userId) return;
          setNearbyUsers((prev) =>
            prev.map((u) => {
              if (u.id !== r.user_id) return u;
              if (r.status === "in_progress") {
                return { ...u, collectingSpotId: r.spot_id, collectProgress: r.progress ?? 0 };
              }
              return { ...u, collectingSpotId: undefined, collectProgress: 0 };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, loadAllLocations, upsertNearbyUser]);

  // Detecta quando um spot que estávamos minerando foi coletado por outro jogador
  useEffect(() => {
    const current = activeCollectionRef.current;
    if (!current) return;
    const stillAvailable = spots.find((s) => s.id === current.spotId);
    if (!stillAvailable) {
      // Outro jogador coletou primeiro — marcar nossa tentativa como falha
      const failUserId = sessionRef.current?.user?.id;
      if (current.collectionId && failUserId) {
        supabase
          .from("collections")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", current.collectionId)
          .eq("status", "in_progress");

        ensureLocationRecorded().then((locationId) => {
          if (locationId) {
            supabase.from("location_events").insert({
              user_id: failUserId,
              location_id: locationId,
              event_type: "collect_fail",
              event_ref_id: current.collectionId,
              metadata: { spot_id: current.spotId, reason: "stolen" },
            });
          }
        });
      }
      setCollectingIds((prev) => {
        const next = { ...prev };
        delete next[current.spotId];
        return next;
      });
      setActiveCollection(null);
    }
  }, [spots, ensureLocationRecorded]);

  const setUserLocationCb = useCallback((loc: { latitude: number; longitude: number }) => {
    setUserLocation(loc);
  }, []);

  const startCollecting = useCallback((spotId: string) => {
    setActiveCollection({ spotId, collectionId: null, progress: 0, clicks: 0, startedAt: Date.now() });
    setCollectingIds((prev) => ({ ...prev, [spotId]: true }));
  }, []);

  const stopCollecting = useCallback(() => {
    const current = activeCollectionRef.current;
    if (!current) return;

    if (current.collectionId && sessionRef.current?.user?.id) {
      supabase
        .from("collections")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", current.collectionId)
        .eq("status", "in_progress");
    }

    setCollectingIds((prev) => {
      const next = { ...prev };
      delete next[current.spotId];
      return next;
    });
    setActiveCollection(null);
  }, []);

  const updateCollectProgress = useCallback((progress: number) => {
    setActiveCollection((prev) => (prev ? { ...prev, progress } : null));
  }, []);

  const mineSpot = useCallback(async (spotId: string) => {
    const spot = spots.find((s) => s.id === spotId);
    if (!spot) return;

    const userId = sessionRef.current?.user?.id ?? null;
    const hitsRequired = SPOT_HITS[spot.type];

    const currentStrength = userProfileRef.current.strength;
    const strengthMultiplier = getStrengthMultiplier(currentStrength);
    const progressPerHit = (100 / hitsRequired) * strengthMultiplier;

    const newStrength = Math.max(0, currentStrength - STRENGTH_DRAIN_PER_HIT);
    setUserProfile((prev) => ({ ...prev, strength: newStrength }));
    if (userId) {
      supabase.from("users").update({ strength: newStrength }).eq("id", userId);
    }

    const prev = activeCollectionRef.current;
    const isNewCollection = !prev || prev.spotId !== spotId;
    const currentProgress = isNewCollection ? 0 : prev!.progress;
    const currentClicks = isNewCollection ? 0 : prev!.clicks;
    const newClicks = currentClicks + 1;
    const newProgress = Math.min(100, currentProgress + progressPerHit);
    const isComplete = newProgress >= 100;
    const now = new Date().toISOString();
    const loc = userLocationRef.current;

    if (isNewCollection) {
      // Primeiro clique: atualiza UI imediatamente (otimista)
      const startedAt = Date.now();
      setActiveCollection({
        spotId,
        collectionId: null,
        progress: newProgress,
        clicks: newClicks,
        startedAt,
      });
      setCollectingIds((prev) => ({ ...prev, [spotId]: true }));

      if (userId) {
        const locationId = await ensureLocationRecorded();

        const { data, error } = await supabase
          .from("collections")
          .insert({
            user_id: userId,
            spot_id: spotId,
            clicks: newClicks,
            clicks_required: hitsRequired,
            progress: Math.round(newProgress),
            user_lat: loc?.latitude ?? null,
            user_lng: loc?.longitude ?? null,
            started_at: new Date(startedAt).toISOString(),
            status: isComplete ? "completed" : "in_progress",
            succeeded: isComplete,
            completed_at: isComplete ? now : null,
          })
          .select("id")
          .single();

        if (!error && data) {
          setActiveCollection((cur) =>
            cur?.spotId === spotId ? { ...cur, collectionId: data.id } : cur
          );

          if (locationId) {
            supabase.from("location_events").insert({
              user_id: userId,
              location_id: locationId,
              event_type: isComplete ? "collect_complete" : "collect_start",
              event_ref_id: data.id,
              metadata: { spot_id: spotId, spot_type: spot.type },
            });
          }
        }
      }
    } else {
      // Clique subsequente: atualizar state e DB
      const collectionId = prev!.collectionId;
      setActiveCollection({
        ...prev!,
        progress: newProgress,
        clicks: newClicks,
      });

      if (userId && collectionId) {
        await supabase
          .from("collections")
          .update({
            clicks: newClicks,
            progress: Math.round(newProgress),
            ...(isComplete
              ? { status: "completed", succeeded: true, completed_at: now }
              : {}),
          })
          .eq("id", collectionId);

        if (isComplete) {
          ensureLocationRecorded().then((locationId) => {
            if (locationId && userId) {
              supabase.from("location_events").insert({
                user_id: userId,
                location_id: locationId,
                event_type: "collect_complete",
                event_ref_id: collectionId,
                metadata: { spot_id: spotId, spot_type: spot.type },
              });
            }
          });
        }
      }
    }

    if (isComplete) {
      const collectionId = isNewCollection ? null : prev!.collectionId;

      setRemovedIds((prev) => new Set([...prev, spotId]));
      setCollectingIds((prev) => {
        const next = { ...prev };
        delete next[spotId];
        return next;
      });
      setActiveCollection(null);
      setSelectedSpot(null);
      setUserProfile((prevProfile) => ({
        ...prevProfile,
        xp: prevProfile.xp + 100,
        coins: prevProfile.coins + (spot.type === "money" ? 50 : 10),
      }));

      if (userId) {
        // Tomar posse do spot
        await supabase
          .from("spots")
          .update({ owner_id: userId })
          .eq("id", spotId);

        // Marcar tentativas dos outros jogadores como falha
        await supabase
          .from("collections")
          .update({ status: "failed", completed_at: now })
          .eq("spot_id", spotId)
          .eq("status", "in_progress")
          .neq("user_id", userId);
      }
    }
  }, [spots, ensureLocationRecorded]);

  const selectSpot = useCallback((spot: Spot | null) => {
    setSelectedSpot(spot);
    if (spot) setSelectedUser(null);
  }, []);

  const selectUser = useCallback((user: NearbyUser | null) => {
    setSelectedUser(user);
    if (user) setSelectedSpot(null);
  }, []);

  const selectInventorySpot = useCallback((spot: Spot | null) => {
    setSelectedInventorySpot(spot);
  }, []);

  const fireInventorySpot = useCallback((mineableSpotId?: string | null) => {
    const invSpot = selectedInventorySpotRef.current;
    if (!invSpot) return;

    const userId = sessionRef.current?.user?.id ?? null;

    supabase.from("spots").update({ owner_id: null }).eq("id", invSpot.id);
    setSelectedInventorySpot(null);

    const targetUser = selectedUserRef.current;
    if (targetUser) {
      const damage = SPOT_DAMAGE[invSpot.type];
      setNearbyUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? {
                ...u,
                health: Math.max(0, u.health - damage),
                strength: Math.max(0, u.strength - STRENGTH_ATTACK_DRAIN),
                collectProgress: Math.max(0, u.collectProgress - 20),
              }
            : u
        )
      );

      const event: AttackEvent = {
        targetUserId: targetUser.id,
        artifactType: "fire",
        damage,
        blocked: false,
      };
      setAttackEvents((prev) => [...prev.slice(-10), event]);

      if (userId) {
        ensureLocationRecorded().then((locationId) => {
          if (locationId) {
            supabase.from("location_events").insert({
              user_id: userId,
              location_id: locationId,
              event_type: "attack",
              event_ref_id: targetUser.id,
              metadata: { spot_type: invSpot.type, damage },
            });
          }
        });
      }
    } else if (mineableSpotId) {
      mineSpot(mineableSpotId);
    }
  }, [mineSpot, ensureLocationRecorded]);

  const attackUser = useCallback(
    (targetUserId: string, artifactType: ArtifactType): AttackEvent => {
      const baseDamage = ARTIFACT_DAMAGE[artifactType];
      const immunity = ARTIFACT_IMMUNITY[artifactType];

      const target = nearbyUsers.find((u) => u.id === targetUserId);
      const isImmune = target?.immunities.includes(immunity) ?? false;
      const actualDamage = isImmune ? Math.floor(baseDamage * 0.1) : baseDamage;

      setNearbyUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId
            ? {
                ...u,
                health: Math.max(0, u.health - actualDamage),
                strength: isImmune
                  ? u.strength
                  : Math.max(0, u.strength - STRENGTH_ATTACK_DRAIN),
                collectProgress: isImmune
                  ? u.collectProgress
                  : Math.max(0, u.collectProgress - 20),
              }
            : u
        )
      );

      const event: AttackEvent = {
        targetUserId,
        artifactType,
        damage: actualDamage,
        blocked: isImmune,
      };

      setAttackEvents((prev) => [...prev.slice(-10), event]);

      setUserProfile((prev) => ({
        ...prev,
        bag: prev.bag.map((item) =>
          item.type === artifactType
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        ),
      }));

      const attackerId = sessionRef.current?.user?.id;
      if (attackerId) {
        ensureLocationRecorded().then((locationId) => {
          if (locationId) {
            supabase.from("location_events").insert({
              user_id: attackerId,
              location_id: locationId,
              event_type: "attack",
              event_ref_id: targetUserId,
              metadata: {
                artifact_type: artifactType,
                damage: actualDamage,
                blocked: isImmune,
              },
            });
          }
        });
      }

      return event;
    },
    [nearbyUsers, ensureLocationRecorded]
  );

  const useSubstance = useCallback((substance: SubstanceType) => {
    setUserProfile((prev) => ({
      ...prev,
      immunities: prev.immunities.includes(substance)
        ? prev.immunities
        : [...prev.immunities, substance],
      bag: prev.bag.map((item) =>
        item.type === substance
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      ),
    }));
  }, []);

  const addToInventory = useCallback((item: InventoryItem) => {
    setUserProfile((prev) => {
      const existing = prev.bag.find((b) => b.type === item.type);
      if (existing) {
        return {
          ...prev,
          bag: prev.bag.map((b) =>
            b.type === item.type ? { ...b, quantity: b.quantity + item.quantity } : b
          ),
        };
      }
      return { ...prev, bag: [...prev.bag, item] };
    });
  }, []);

  const updateProfile = useCallback((fields: Partial<Pick<UserProfile, "name" | "nickname" | "email" | "avatar">>) => {
    setUserProfile((prev) => ({ ...prev, ...fields }));
  }, []);

  const restoreStrength = useCallback((amount: number) => {
    setUserProfile((prev) => {
      const newStrength = prev.strength + amount;
      const userId = sessionRef.current?.user?.id;
      if (userId) {
        supabase.from("users").update({ strength: newStrength }).eq("id", userId);
      }
      return { ...prev, strength: newStrength };
    });
  }, []);

  const completeCollection = useCallback(async (spotId: string) => {
    const spot = spots.find((s) => s.id === spotId);
    if (!spot) return;

    const userId = sessionRef.current?.user?.id ?? null;
    const current = activeCollectionRef.current;
    const now = new Date().toISOString();

    setRemovedIds((prev) => new Set([...prev, spotId]));
    setCollectingIds((prev) => {
      const next = { ...prev };
      delete next[spotId];
      return next;
    });
    setActiveCollection(null);
    setSelectedSpot(null);

    setUserProfile((prev) => ({
      ...prev,
      xp: prev.xp + 100,
      coins: prev.coins + (spot.type === "money" ? 50 : 10),
    }));

    if (userId) {
      if (current?.collectionId) {
        await supabase
          .from("collections")
          .update({ status: "completed", succeeded: true, completed_at: now })
          .eq("id", current.collectionId);
      }

      await supabase
        .from("spots")
        .update({ owner_id: userId })
        .eq("id", spotId);

      await supabase
        .from("collections")
        .update({ status: "failed", completed_at: now })
        .eq("spot_id", spotId)
        .eq("status", "in_progress")
        .neq("user_id", userId);
    }
  }, [spots]);

  const abandonSpot = useCallback(async (spotId: string) => {
    await supabase
      .from("spots")
      .update({ owner_id: null })
      .eq("id", spotId);
  }, []);

  const useSpot = useCallback(async (spotId: string) => {
    await supabase
      .from("spots")
      .update({ is_active: false })
      .eq("id", spotId);
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    async function loadMedals() {
      const [{ data: userMedals }, { data: allHolders }, { count: usersTotal }] = await Promise.all([
        supabase
          .from("user_medals")
          .select("medal_id, unlocked_at, medal_definitions(id, key, name, description, image_url)")
          .eq("user_id", userId),
        supabase.from("user_medals").select("medal_id"),
        supabase.from("users").select("*", { count: "exact", head: true }),
      ]);

      if (usersTotal !== null) setTotalUsers(usersTotal);

      if (!userMedals || !allHolders) return;

      const holderMap = new Map<string, number>();
      for (const row of allHolders) {
        holderMap.set(row.medal_id, (holderMap.get(row.medal_id) ?? 0) + 1);
      }

      const medals: Medal[] = userMedals
        .filter((um) => um.medal_definitions)
        .map((um) => {
          const def = um.medal_definitions as any;
          return {
            id: def.id,
            icon: def.image_url ?? "🏅",
            name: def.name,
            description: def.description,
            holderCount: holderMap.get(def.id) ?? 0,
            unlockedAt: new Date(um.unlocked_at).getTime(),
          };
        });

      setUserProfile((prev) => ({ ...prev, medals }));
    }

    loadMedals();
  }, [session]);

  const value: GameState & GameActions = {
    userProfile,
    totalUsers,
    spots,
    collectedSpots,
    nearbyUsers,
    activeCollection,
    selectedSpot,
    selectedUser,
    selectedInventorySpot,
    attackEvents,
    userLocation,
    spotCollections,
    setUserLocation: setUserLocationCb,
    startCollecting,
    stopCollecting,
    updateCollectProgress,
    mineSpot,
    selectSpot,
    selectUser,
    selectInventorySpot,
    fireInventorySpot,
    attackUser,
    useSubstance,
    addToInventory,
    completeCollection,
    abandonSpot,
    useSpot,
    updateProfile,
    restoreStrength,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
