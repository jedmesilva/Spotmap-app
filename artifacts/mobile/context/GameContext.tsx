import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

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
  immunities: SubstanceType[];
}

export interface InventoryItem {
  id: string;
  type: SpotType | ArtifactType | SubstanceType;
  name: string;
  quantity: number;
  icon: string;
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

interface GameState {
  userProfile: UserProfile;
  spots: Spot[];
  nearbyUsers: NearbyUser[];
  activeCollection: {
    spotId: string;
    progress: number;
    startedAt: number;
  } | null;
  selectedSpot: Spot | null;
  selectedUser: NearbyUser | null;
  attackEvents: AttackEvent[];
  userLocation: { latitude: number; longitude: number } | null;
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
}

const SPOT_HITS: Record<SpotType, number> = {
  coupon: 5,
  money: 8,
  product: 12,
  rare: 20,
};

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
    immunities: ["flame_shield"],
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
    immunities: ["cryo_armor", "antidote"],
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
    immunities: [],
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
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [spots, setSpots] = useState<Spot[]>(MOCK_SPOTS);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>(MOCK_USERS);
  const [activeCollection, setActiveCollection] = useState<GameState["activeCollection"]>(null);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [attackEvents, setAttackEvents] = useState<AttackEvent[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const activeCollectionRef = useRef<GameState["activeCollection"]>(null);
  useEffect(() => {
    activeCollectionRef.current = activeCollection;
  }, [activeCollection]);

  const setUserLocationCb = useCallback((loc: { latitude: number; longitude: number }) => {
    setUserLocation(loc);
  }, []);

  const startCollecting = useCallback((spotId: string) => {
    setActiveCollection({ spotId, progress: 0, startedAt: Date.now() });
    setSpots((prev) =>
      prev.map((s) => (s.id === spotId ? { ...s, isCollecting: true } : s))
    );
  }, []);

  const stopCollecting = useCallback(() => {
    if (activeCollection) {
      setSpots((prev) =>
        prev.map((s) =>
          s.id === activeCollection.spotId ? { ...s, isCollecting: false } : s
        )
      );
    }
    setActiveCollection(null);
  }, [activeCollection]);

  const updateCollectProgress = useCallback((progress: number) => {
    setActiveCollection((prev) => (prev ? { ...prev, progress } : null));
  }, []);

  const mineSpot = useCallback((spotId: string) => {
    const spot = spots.find((s) => s.id === spotId);
    if (!spot) return;

    const hitsRequired = SPOT_HITS[spot.type];
    const progressPerHit = 100 / hitsRequired;

    const prev = activeCollectionRef.current;
    const currentProgress = prev?.spotId === spotId ? prev.progress : 0;
    const newProgress = Math.min(100, currentProgress + progressPerHit);

    if (newProgress >= 100) {
      setSpots((prevSpots) => prevSpots.filter((s) => s.id !== spotId));
      setActiveCollection(null);
      setSelectedSpot(null);
      setUserProfile((prevProfile) => ({
        ...prevProfile,
        xp: prevProfile.xp + 100,
        coins: prevProfile.coins + (spot.type === "money" ? 50 : 10),
      }));
      return;
    }

    if (!prev || prev.spotId !== spotId) {
      setActiveCollection({ spotId, progress: newProgress, startedAt: Date.now() });
      setSpots((prevSpots) =>
        prevSpots.map((s) => (s.id === spotId ? { ...s, isCollecting: true } : s))
      );
    } else {
      setActiveCollection({ ...prev, progress: newProgress });
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

  const completeCollection = useCallback((spotId: string) => {
    const spot = spots.find((s) => s.id === spotId);
    if (!spot) return;

    setSpots((prev) => prev.filter((s) => s.id !== spotId));
    setActiveCollection(null);
    setSelectedSpot(null);

    setUserProfile((prev) => ({
      ...prev,
      xp: prev.xp + 100,
      coins: prev.coins + (spot.type === "money" ? 50 : 10),
    }));
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
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
