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
import { useAuth } from "@/context/AuthContext";

export type SpotType = "coupon" | "money" | "product" | "rare";
export type ArtifactType = "fire" | "ice" | "lightning" | "poison" | "shield";
export type SubstanceType = "flame_shield" | "cryo_armor" | "volt_ward" | "antidote" | "barrier";
export type MedalRarity = "common" | "rare" | "epic" | "legendary";

export interface Medal {
  id: string;
  icon: string;
  name: string;
  description: string;
  rarity: MedalRarity;
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
  expiresAt?: number;
  isCollecting?: boolean;
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
  nearbyUsers: NearbyUser[];
  activeCollection: ActiveCollection | null;
  selectedSpot: Spot | null;
  selectedUser: NearbyUser | null;
  attackEvents: AttackEvent[];
  userLocation: { latitude: number; longitude: number } | null;
  spotCollections: Map<string, CollectionProgress[]>;
}

interface GameActions {
  setUserLocation: (loc: { latitude: number; longitude: number }) => void;
  startCollecting: (spotId: string) => void;
  stopCollecting: () => void;
  updateCollectProgress: (progress: number) => void;
  mineSpot: (spotId: string) => void;
  selectSpot: (spot: Spot | null) => void;
  selectUser: (user: NearbyUser | null) => void;
  attackUser: (targetUserId: string, artifactType: ArtifactType) => AttackEvent;
  useSubstance: (substance: SubstanceType) => void;
  addToInventory: (item: InventoryItem) => void;
  completeCollection: (spotId: string) => void;
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

const MOCK_SPOTS: Spot[] = [
  {
    id: "spot1",
    type: "coupon",
    latitude: -19.9491216,
    longitude: -43.9892233,
    title: "Cupom Especial",
    value: "20% OFF em tudo",
    radius: 100,
    expiresAt: Date.now() + 3600000,
  },
  {
    id: "spot2",
    type: "money",
    latitude: -19.9489,
    longitude: -43.9896,
    title: "Bônus de Moedas",
    value: "R$ 30,00",
    radius: 80,
    expiresAt: Date.now() + 7200000,
  },
  {
    id: "spot3",
    type: "product",
    latitude: -19.9494,
    longitude: -43.9887,
    title: "Item Exclusivo",
    value: "Produto Edição Limitada",
    radius: 90,
  },
  {
    id: "spot4",
    type: "rare",
    latitude: -19.9486,
    longitude: -43.9900,
    title: "Tesouro Raro",
    value: "Item Lendário",
    radius: 120,
    expiresAt: Date.now() + 1800000,
  },
  {
    id: "spot5",
    type: "money",
    latitude: -19.9497,
    longitude: -43.9883,
    title: "Jackpot",
    value: "R$ 150,00",
    radius: 80,
  },
  {
    id: "spot6",
    type: "coupon",
    latitude: -19.9482,
    longitude: -43.9906,
    title: "Desconto Relâmpago",
    value: "50% OFF",
    radius: 100,
    expiresAt: Date.now() + 900000,
  },
  {
    id: "spot7",
    type: "product",
    latitude: -19.9502,
    longitude: -43.9878,
    title: "Caixa Misteriosa",
    value: "Surpresa Garantida",
    radius: 70,
    expiresAt: Date.now() + 5400000,
  },
  {
    id: "spot8",
    type: "coupon",
    latitude: -19.9551152,
    longitude: -43.9873407,
    title: "Cupom de Teste",
    value: "30% OFF",
    radius: 80,
    expiresAt: Date.now() + 3600000,
  },
  {
    id: "spot9",
    type: "money",
    latitude: -19.9549,
    longitude: -43.9876,
    title: "Bônus de Teste",
    value: "R$ 20,00",
    radius: 60,
  },
  {
    id: "spot10",
    type: "rare",
    latitude: -19.9553,
    longitude: -43.9870,
    title: "Item Raro de Teste",
    value: "Item Lendário",
    radius: 100,
    expiresAt: Date.now() + 1800000,
  },
];

const MOCK_USERS: NearbyUser[] = [
  {
    id: "user2",
    name: "FoxHunter",
    avatar: "F",
    latitude: -19.9490,
    longitude: -43.9894,
    collectingSpotId: "spot1",
    collectProgress: 65,
    health: 75,
    maxHealth: 100,
    strength: 130,
    immunities: ["flame_shield"],
    coins: 840,
    bag: [
      { id: "f1", type: "fire", name: "Bola de Fogo", quantity: 2, icon: "fire" },
      { id: "f2", type: "cryo_armor", name: "Armadura de Gelo", quantity: 1, icon: "shield" },
      { id: "f3", type: "coupon", name: "Cupom 15%", quantity: 3, icon: "tag" },
    ],
    medals: [
      { id: "fm1", icon: "🎯", name: "Primeiro Passo", description: "Realizou sua primeira coleta.", rarity: "common", unlockedAt: Date.now() - 86400000 * 15 },
      { id: "fm2", icon: "🦊", name: "Raposa Veloz", description: "Coletou 3 spots em menos de 1 hora.", rarity: "rare", unlockedAt: Date.now() - 86400000 * 5 },
      { id: "fm3", icon: "🗺️", name: "Explorador", description: "Visite 20 spots diferentes.", rarity: "epic" },
      { id: "fm4", icon: "👑", name: "Lendário", description: "Alcance o nível 10.", rarity: "legendary" },
    ],
  },
  {
    id: "user3",
    name: "ShadowByte",
    avatar: "S",
    latitude: -19.9493,
    longitude: -43.9889,
    collectingSpotId: undefined,
    collectProgress: 0,
    health: 100,
    maxHealth: 100,
    strength: 240,
    immunities: ["cryo_armor", "antidote"],
    coins: 2100,
    bag: [
      { id: "s1", type: "lightning", name: "Raio", quantity: 4, icon: "zap" },
      { id: "s2", type: "poison", name: "Veneno", quantity: 2, icon: "activity" },
      { id: "s3", type: "barrier", name: "Barreira", quantity: 1, icon: "shield" },
      { id: "s4", type: "money", name: "R$ 100", quantity: 2, icon: "dollar-sign" },
    ],
    medals: [
      { id: "sm1", icon: "🎯", name: "Primeiro Passo", description: "Realizou sua primeira coleta.", rarity: "common", unlockedAt: Date.now() - 86400000 * 30 },
      { id: "sm2", icon: "🏹", name: "Caçador", description: "Completou 5 coletas no mapa.", rarity: "common", unlockedAt: Date.now() - 86400000 * 20 },
      { id: "sm3", icon: "⚔️", name: "Guerreiro", description: "Atacou 10 jogadores diferentes.", rarity: "rare", unlockedAt: Date.now() - 86400000 * 10 },
      { id: "sm4", icon: "💀", name: "Sobrevivente", description: "Sobreviveu com menos de 20% de vida.", rarity: "rare", unlockedAt: Date.now() - 86400000 * 4 },
      { id: "sm5", icon: "🛡️", name: "Intocável", description: "Bloqueie 5 ataques seguidos.", rarity: "epic", unlockedAt: Date.now() - 86400000 * 2 },
      { id: "sm6", icon: "🗺️", name: "Explorador", description: "Visite 20 spots diferentes.", rarity: "epic" },
      { id: "sm7", icon: "👑", name: "Lendário", description: "Alcance o nível 10.", rarity: "legendary" },
    ],
  },
  {
    id: "user4",
    name: "NeonRaider",
    avatar: "N",
    latitude: -19.9488,
    longitude: -43.9898,
    collectingSpotId: "spot2",
    collectProgress: 30,
    health: 45,
    maxHealth: 100,
    strength: 60,
    immunities: [],
    coins: 320,
    bag: [
      { id: "n1", type: "ice", name: "Bomba de Gelo", quantity: 1, icon: "wind" },
      { id: "n2", type: "product", name: "Item Raro", quantity: 1, icon: "box" },
    ],
    medals: [
      { id: "nm1", icon: "🎯", name: "Primeiro Passo", description: "Realizou sua primeira coleta.", rarity: "common", unlockedAt: Date.now() - 86400000 * 3 },
      { id: "nm2", icon: "🏹", name: "Caçador", description: "Completou 5 coletas no mapa.", rarity: "common" },
      { id: "nm3", icon: "⚔️", name: "Guerreiro", description: "Atacou 10 jogadores diferentes.", rarity: "rare" },
    ],
  },
];

const DEFAULT_PROFILE: UserProfile = {
  id: "user1",
  name: "Você",
  nickname: "você",
  email: "voce@exemplo.com",
  avatar: "V",
  level: 7,
  xp: 2350,
  health: 100,
  maxHealth: 100,
  strength: 100,
  immunities: ["flame_shield"],
  coins: 1250,
  bag: [
    { id: "i1", type: "fire", name: "Bola de Fogo", quantity: 3, icon: "fire" },
    { id: "i2", type: "ice", name: "Bomba de Gelo", quantity: 5, icon: "snowflake" },
    { id: "i3", type: "lightning", name: "Raio", quantity: 2, icon: "zap" },
    { id: "i4", type: "flame_shield", name: "Escudo de Chama", quantity: 1, icon: "shield" },
    { id: "i5", type: "coupon", name: "Cupom 30%", quantity: 2, icon: "tag" },
    { id: "i6", type: "money", name: "R$ 50", quantity: 1, icon: "dollar-sign" },
  ],
  medals: [
    { id: "m1", icon: "🎯", name: "Primeiro Passo", description: "Realizou sua primeira coleta.", rarity: "common", unlockedAt: Date.now() - 86400000 * 10 },
    { id: "m2", icon: "🏹", name: "Caçador", description: "Completou 5 coletas no mapa.", rarity: "common", unlockedAt: Date.now() - 86400000 * 7 },
    { id: "m3", icon: "⚔️", name: "Guerreiro", description: "Atacou 10 jogadores diferentes.", rarity: "rare", unlockedAt: Date.now() - 86400000 * 3 },
    { id: "m4", icon: "💀", name: "Sobrevivente", description: "Sobreviveu com menos de 20% de vida.", rarity: "rare", unlockedAt: Date.now() - 86400000 },
    { id: "m5", icon: "🗺️", name: "Explorador", description: "Visite 20 spots diferentes.", rarity: "epic" },
    { id: "m6", icon: "🛡️", name: "Intocável", description: "Bloqueie 5 ataques seguidos.", rarity: "epic" },
    { id: "m7", icon: "👑", name: "Lendário", description: "Alcance o nível 10.", rarity: "legendary" },
  ],
};

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
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>(MOCK_USERS);
  const [activeCollection, setActiveCollection] = useState<ActiveCollection | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [attackEvents, setAttackEvents] = useState<AttackEvent[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const activeCollectionRef = useRef<ActiveCollection | null>(null);
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const sessionRef = useRef(session);
  const userProfileRef = useRef<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => { activeCollectionRef.current = activeCollection; }, [activeCollection]);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { userProfileRef.current = userProfile; }, [userProfile]);

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

  // Detecta quando um spot que estávamos minerando foi coletado por outro jogador
  useEffect(() => {
    const current = activeCollectionRef.current;
    if (!current) return;
    const stillAvailable = spots.find((s) => s.id === current.spotId);
    if (!stillAvailable) {
      // Outro jogador coletou primeiro — marcar nossa tentativa como falha
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
    }
  }, [spots]);

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
  }, [spots]);

  const selectSpot = useCallback((spot: Spot | null) => {
    setSelectedSpot(spot);
    if (spot) setSelectedUser(null);
  }, []);

  const selectUser = useCallback((user: NearbyUser | null) => {
    setSelectedUser(user);
    if (user) setSelectedSpot(null);
  }, []);

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

      return event;
    },
    [nearbyUsers]
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

  const value: GameState & GameActions = {
    userProfile,
    spots,
    nearbyUsers,
    activeCollection,
    selectedSpot,
    selectedUser,
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
    attackUser,
    useSubstance,
    addToInventory,
    completeCollection,
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
