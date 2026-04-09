import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InventoryItem, Spot, SPOT_BADGE_CONFIGS } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SPOT_ICONS: Record<string, string> = {
  coupon: "tag",
  money: "dollar-sign",
  product: "box",
  rare: "star",
};

const ITEM_ICONS: Record<string, string> = {
  fire: "zap",
  ice: "wind",
  lightning: "zap",
  poison: "activity",
  flame_shield: "shield",
  cryo_armor: "shield",
  volt_ward: "shield",
  antidote: "shield",
  barrier: "shield",
  coupon: "tag",
  money: "dollar-sign",
  product: "box",
  rare: "star",
};

const TYPE_LABELS: Record<string, string> = {
  coupon: "CUPOM",
  money: "DINHEIRO",
  product: "PRODUTO",
  rare: "RARO",
  fire: "FOGO",
  ice: "GELO",
  lightning: "RAIO",
  poison: "VENENO",
  flame_shield: "ESCUDO CHAMA",
  cryo_armor: "ARMADURA CRYO",
  volt_ward: "PROTEÇÃO VOLT",
  antidote: "ANTÍDOTO",
  barrier: "BARREIRA",
};

const ITEM_DESCRIPTIONS: Record<string, string> = {
  coupon: "Voucher de desconto encontrado no campo. Pode ser resgatado em estabelecimentos parceiros.",
  money: "Créditos digitais coletados durante a operação. Adiciona ao saldo da missão.",
  product: "Produto de alto valor localizado e extraído com sucesso.",
  rare: "Item raro de valor excepcional. Extremamente difícil de encontrar.",
  fire: "Artefato ofensivo elementar de fogo. Causa dano massivo ao inimigo.",
  ice: "Artefato de gelo que congela e desacelera o oponente.",
  lightning: "Descarga elétrica de alta voltagem. Ataque rápido e preciso.",
  poison: "Substância tóxica de efeito contínuo. Drena a vida gradualmente.",
  flame_shield: "Escudo térmico que protege contra ataques de fogo.",
  cryo_armor: "Armadura criogênica resistente a ataques de gelo.",
  volt_ward: "Protetor eletrostático contra descargas de raio.",
  antidote: "Neutraliza efeitos de veneno e toxinas inimigas.",
  barrier: "Campo de força defensivo de amplo espectro.",
};

const RARITY_LABELS: Record<string, { label: string; color: string }> = {
  coupon: { label: "COMUM", color: "#C97400" },
  money: { label: "INCOMUM", color: "#5D8A20" },
  product: { label: "RARO", color: "#1A6B9A" },
  rare: { label: "LENDÁRIO", color: "#7A5CB0" },
  fire: { label: "OFENSIVO", color: "#CC4400" },
  ice: { label: "OFENSIVO", color: "#1A6B9A" },
  lightning: { label: "OFENSIVO", color: "#C97400" },
  poison: { label: "OFENSIVO", color: "#3A8A20" },
  flame_shield: { label: "DEFENSIVO", color: "#7A5CB0" },
  cryo_armor: { label: "DEFENSIVO", color: "#1A6B9A" },
  volt_ward: { label: "DEFENSIVO", color: "#C97400" },
  antidote: { label: "DEFENSIVO", color: "#3A8A20" },
  barrier: { label: "DEFENSIVO", color: "#7A5CB0" },
};

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatExpiry(ts: number) {
  const diff = ts - Date.now();
  if (diff <= 0) return "EXPIRADO";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}H ${m}MIN`;
  return `${m}MIN`;
}

interface DataBlockProps {
  label: string;
  value: string;
  color: string;
  icon?: string;
}

function DataBlock({ label, value, color, icon }: DataBlockProps) {
  const C = useColors();
  return (
    <View style={[styles.dataBlock, { borderColor: color + "33", backgroundColor: color + "0A" }]}>
      <View style={styles.dataBlockHeader}>
        {icon && <Feather name={icon as any} size={10} color={color} />}
        <Text style={[styles.dataBlockLabel, { color: color + "AA" }]}>{label}</Text>
      </View>
      <Text style={[styles.dataBlockValue, { color }]}>{value}</Text>
    </View>
  );
}

interface ItemDetailModalProps {
  visible: boolean;
  onClose: () => void;
  spot?: Spot;
  item?: InventoryItem;
  mode: "map" | "inventory";
  onClaim?: () => void;
}

export function ItemDetailModal({ visible, onClose, spot, item, mode, onClaim }: ItemDetailModalProps) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const [imageError, setImageError] = React.useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const type = spot?.type ?? item?.type ?? "rare";
  const SPOT_COLORS: Record<string, string> = {
    coupon: C.spotCoupon,
    money: C.spotMoney,
    product: C.spotProduct,
    rare: C.spotRare,
    fire: "#CC4400",
    ice: C.spotProduct,
    lightning: C.spotCoupon,
    poison: C.spotMoney,
    flame_shield: C.spotRare,
    cryo_armor: C.spotProduct,
    volt_ward: C.spotCoupon,
    antidote: C.spotMoney,
    barrier: C.spotRare,
  };
  const color = SPOT_COLORS[type] ?? C.accent;
  const iconName = (spot ? SPOT_ICONS[type] : ITEM_ICONS[type]) ?? "package";
  const name = spot?.title ?? item?.name ?? "";
  const description = ITEM_DESCRIPTIONS[type] ?? "Item coletado em campo.";
  const rarity = RARITY_LABELS[type] ?? { label: "COMUM", color };

  useEffect(() => {
    setImageError(false);
  }, [spot?.id, item?.id]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  if (!visible || (!spot && !item)) return null;

  const panelContent = (
    <View style={{ flex: mode === "inventory" ? 1 : undefined }}>
      {/* Tactical top bar */}
      <View style={[styles.topBar, { borderBottomColor: color + "44" }]}>
        <View style={styles.topBarLeft}>
          <View style={[styles.topBarDot, { backgroundColor: color }]} />
          <Text style={[styles.topBarLabel, { color: color }]}>ANÁLISE DE CAMPO</Text>
        </View>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }} style={[styles.closeBtn, { borderColor: C.border }]}>
          <Feather name="x" size={16} color={C.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: mode === "inventory" ? insets.bottom + 24 : 32 },
        ]}
      >
        {/* Header with image + name */}
        <View style={styles.headerSection}>
          {/* Item image / placeholder */}
          <View style={[styles.imageContainer, { borderColor: color + "55" }]}>
            {spot?.imageUrl && !imageError ? (
              <Image
                source={{ uri: spot.imageUrl }}
                style={styles.itemImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: color + "15" }]}>
                <Feather name={iconName as any} size={32} color={color + "CC"} />
              </View>
            )}
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL, { borderColor: color }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: color }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: color }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: color }]} />
          </View>

          {/* Name and type info */}
          <View style={styles.headerInfo}>
            <View style={[styles.typeBadge, { backgroundColor: color + "18", borderColor: color + "55" }]}>
              <Feather name={iconName as any} size={10} color={color} />
              <Text style={[styles.typeLabel, { color }]}>{TYPE_LABELS[type] ?? type.toUpperCase()}</Text>
            </View>
            <Text style={[styles.itemName, { color: C.text }]}>{name}</Text>
            <View style={[styles.rarityBadge, { borderColor: rarity.color + "44" }]}>
              <View style={[styles.rarityDot, { backgroundColor: rarity.color }]} />
              <Text style={[styles.rarityLabel, { color: rarity.color }]}>{rarity.label}</Text>
            </View>
            {item?.quantity && item.quantity > 1 && (
              <View style={[styles.qtyBadge, { backgroundColor: color + "15", borderColor: color + "44" }]}>
                <Text style={[styles.qtyText, { color }]}>×{item.quantity} EM ESTOQUE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: color + "33" }]} />

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {spot && (
            <>
              <DataBlock label="VALOR" value={spot.value} color={color} icon="dollar-sign" />
              <DataBlock label="RAIO" value={`${spot.radius}M`} color={C.textSecondary} icon="map-pin" />
              {spot.expiresAt && (
                <DataBlock label="TEMPO RESTANTE" value={formatExpiry(spot.expiresAt)} color={spot.expiresAt - Date.now() < 3600000 ? C.danger : C.warning} icon="clock" />
              )}
              {spot.expiresAt && (
                <DataBlock label="EXPIRA EM" value={formatDate(spot.expiresAt)} color={C.textSecondary} icon="calendar" />
              )}
            </>
          )}
          {item && (
            <>
              <DataBlock label="QUANTIDADE" value={`${item.quantity}×`} color={color} icon="package" />
              <DataBlock label="CATEGORIA" value={type.includes("shield") || type.includes("armor") || type.includes("ward") || type === "antidote" || type === "barrier" ? "DEFESA" : "ATAQUE"} color={color} icon="shield" />
            </>
          )}
        </View>

        {/* Badges (spots only) */}
        {spot?.badges && spot.badges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>MODIFICADORES</Text>
            <View style={styles.badgesRow}>
              {spot.badges.map((badge) => {
                const cfg = SPOT_BADGE_CONFIGS[badge];
                if (!cfg) return null;
                return (
                  <View key={badge} style={[styles.badge, { backgroundColor: cfg.color + "18", borderColor: cfg.color + "55" }]}>
                    <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
                    <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={[styles.descriptionSection, { borderColor: C.border + "55" }]}>
          <Text style={[styles.sectionLabel, { color: C.textMuted }]}>RELATÓRIO DE INTELIGÊNCIA</Text>
          <Text style={[styles.descriptionText, { color: C.textSecondary }]}>{description}</Text>
        </View>

        {/* Claim button */}
        <Animated.View style={{ opacity: glowOpacity }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onClaim?.();
              onClose();
            }}
            style={({ pressed }) => [
              styles.claimBtn,
              {
                backgroundColor: color,
                borderColor: color,
                shadowColor: color,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.claimBtnCorner, styles.claimCornerTL]} />
            <View style={[styles.claimBtnCorner, styles.claimCornerTR]} />
            <Feather name="download" size={18} color="#fff" />
            <Text style={styles.claimBtnText}>RESGATAR ITEM</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );

  if (mode === "map") {
    return (
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
        <Animated.View style={[styles.mapOverlay, { opacity: fadeAnim }]}>
          {/* Scrim tap to close */}
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

          {/* Scan line animation */}
          <Animated.View
            style={[
              styles.scanLine,
              { backgroundColor: color + "88" },
              {
                transform: [{
                  translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-4, SCREEN_HEIGHT] }),
                }],
              },
            ]}
          />

          {/* Panel */}
          <Animated.View
            style={[
              styles.mapPanel,
              { backgroundColor: C.card, borderColor: color + "55", transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Notch decoration */}
            <View style={[styles.panelNotch, { borderBottomColor: color + "88" }]}>
              <View style={[styles.notchLine, { backgroundColor: color }]} />
            </View>
            {panelContent}
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // Inventory full-screen mode
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.inventoryOverlay, { backgroundColor: C.bg, opacity: fadeAnim }]}>
        <Animated.View style={[styles.inventoryPanel, { transform: [{ translateY: slideAnim }] }]}>
          {/* Safe area top padding */}
          <View style={{ paddingTop: insets.top + 8 }} />

          {/* Scan line */}
          <Animated.View
            style={[
              styles.scanLine,
              { backgroundColor: color + "55" },
              {
                transform: [{
                  translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-4, SCREEN_HEIGHT] }),
                }],
              },
            ]}
          />

          {/* Corner decorations full screen */}
          <View style={[styles.fullCorner, styles.fullCornerTL, { borderColor: color + "66" }]} />
          <View style={[styles.fullCorner, styles.fullCornerTR, { borderColor: color + "66" }]} />
          <View style={[styles.fullCorner, styles.fullCornerBL, { borderColor: color + "66" }]} />
          <View style={[styles.fullCorner, styles.fullCornerBR, { borderColor: color + "66" }]} />

          {panelContent}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Map overlay mode
  mapOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 10, 4, 0.72)",
    justifyContent: "flex-end",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    zIndex: 10,
  },
  mapPanel: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  panelNotch: {
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  notchLine: {
    width: 44,
    height: 3,
    borderRadius: 2,
  },

  // Inventory full screen mode
  inventoryOverlay: {
    flex: 1,
  },
  inventoryPanel: {
    flex: 1,
  },

  // Shared
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topBarDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  topBarLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  headerSection: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderWidth: 1.5,
    borderRadius: 2,
    position: "relative",
    overflow: "visible",
    flexShrink: 0,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    borderRadius: 2,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: 10,
    height: 10,
    borderWidth: 2,
  },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },

  headerInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  typeLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  itemName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  rarityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
  },
  rarityDot: {
    width: 5,
    height: 5,
    borderRadius: 1,
  },
  rarityLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  qtyBadge: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
    alignSelf: "flex-start",
  },
  qtyText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },

  divider: {
    height: 1,
    marginBottom: 14,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  dataBlock: {
    flex: 1,
    minWidth: "44%",
    borderWidth: 1,
    borderRadius: 2,
    padding: 10,
    gap: 4,
  },
  dataBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dataBlockLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  dataBlockValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },

  badgesSection: {
    marginBottom: 14,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },

  descriptionSection: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  descriptionText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },

  claimBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 2,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
  },
  claimBtnCorner: {
    position: "absolute",
    width: 8,
    height: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  claimCornerTL: { top: 4, left: 4, borderRightWidth: 0, borderBottomWidth: 0 },
  claimCornerTR: { top: 4, right: 4, borderLeftWidth: 0, borderBottomWidth: 0 },
  claimBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 2.5,
  },

  // Full screen corner decorations
  fullCorner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderWidth: 2,
    zIndex: 5,
  },
  fullCornerTL: { top: 8, left: 8, borderRightWidth: 0, borderBottomWidth: 0 },
  fullCornerTR: { top: 8, right: 8, borderLeftWidth: 0, borderBottomWidth: 0 },
  fullCornerBL: { bottom: 8, left: 8, borderRightWidth: 0, borderTopWidth: 0 },
  fullCornerBR: { bottom: 8, right: 8, borderLeftWidth: 0, borderTopWidth: 0 },
});
