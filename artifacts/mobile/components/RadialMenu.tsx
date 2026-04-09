import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated as RNAnimated,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { useColors } from "@/hooks/useColors";

export interface RadialSlot {
  id: string;
  label: string;
  color: string;
  icon: string;
  previewName: string;
  previewType: string;
  previewDescription: string;
  previewImpact: string;
  previewTarget: string;
  previewImageUrl?: string;
  quantity?: number;
}

interface RadialMenuProps {
  visible: boolean;
  slots: RadialSlot[];
  center: { x: number; y: number };
  offset: number;
  hoveredIndex: number | null;
  previewOnLeft: boolean;
  topInset: number;
  visCenter: number;
}

// ─── Geometry ─────────────────────────────────────────────────────────────────
const OUTER_R         = 130;
const INNER_R         = 78;
const LABEL_R         = 104;
const DOT_R           = 66;
const SVG_SIZE        = (OUTER_R + 16) * 2;
const SVG_C           = SVG_SIZE / 2;
const GAP_DEG         = 1.5;
const VISIBLE_ARC     = 150;
const SCROLL_ZONE_ARC = 12;
const FADE_ZONE       = 12;

const toRad   = (d: number) => (d * Math.PI) / 180;
const norm360 = (d: number) => ((d % 360) + 360) % 360;

function arcDelta(fromTop: number, visCenter: number): number {
  return norm360(fromTop - visCenter + 180) - 180;
}

function wedgePath(svgDeg: number, N: number): string {
  const SLICE = 360 / N;
  const half  = SLICE / 2 - GAP_DEG / 2;
  const s     = toRad(svgDeg - half);
  const e     = toRad(svgDeg + half);
  const lg    = SLICE - GAP_DEG > 180 ? 1 : 0;
  const c = Math.cos, si = Math.sin;
  return [
    `M ${SVG_C + INNER_R * c(s)} ${SVG_C + INNER_R * si(s)}`,
    `L ${SVG_C + OUTER_R * c(s)} ${SVG_C + OUTER_R * si(s)}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${lg} 1 ${SVG_C + OUTER_R * c(e)} ${SVG_C + OUTER_R * si(e)}`,
    `L ${SVG_C + INNER_R * c(e)} ${SVG_C + INNER_R * si(e)}`,
    `A ${INNER_R} ${INNER_R} 0 ${lg} 0 ${SVG_C + INNER_R * c(s)} ${SVG_C + INNER_R * si(s)} Z`,
  ].join(" ");
}

function trackArcPath(angleCenter: number, arcSpan: number, radius: number): string {
  const s  = toRad(angleCenter - arcSpan / 2 - 90);
  const e  = toRad(angleCenter + arcSpan / 2 - 90);
  const lg = arcSpan > 180 ? 1 : 0;
  return `M ${SVG_C + radius * Math.cos(s)} ${SVG_C + radius * Math.sin(s)} A ${radius} ${radius} 0 ${lg} 1 ${SVG_C + radius * Math.cos(e)} ${SVG_C + radius * Math.sin(e)}`;
}

function scrollZoneWedgePath(center: number, span: number): string {
  const s  = toRad(center - span / 2 - 90);
  const e  = toRad(center + span / 2 - 90);
  const lg = span > 180 ? 1 : 0;
  const c = Math.cos, si = Math.sin;
  const r1 = INNER_R + 2, r2 = OUTER_R - 2;
  return [
    `M ${SVG_C + r1 * c(s)} ${SVG_C + r1 * si(s)}`,
    `L ${SVG_C + r2 * c(s)} ${SVG_C + r2 * si(s)}`,
    `A ${r2} ${r2} 0 ${lg} 1 ${SVG_C + r2 * c(e)} ${SVG_C + r2 * si(e)}`,
    `L ${SVG_C + r1 * c(e)} ${SVG_C + r1 * si(e)}`,
    `A ${r1} ${r1} 0 ${lg} 0 ${SVG_C + r1 * c(s)} ${SVG_C + r1 * si(s)} Z`,
  ].join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RadialMenu({
  visible,
  slots,
  center,
  offset,
  hoveredIndex,
  previewOnLeft,
  topInset,
  visCenter,
}: RadialMenuProps) {
  const C  = useColors();
  const N  = slots.length;
  const SLICE = N > 0 ? 360 / N : 360;

  const backdropOpacity  = useRef(new RNAnimated.Value(0)).current;
  const discScale        = useRef(new RNAnimated.Value(0.7)).current;
  const discOpacity      = useRef(new RNAnimated.Value(0)).current;
  const previewOpacity   = useRef(new RNAnimated.Value(0)).current;
  const previewTranslateY = useRef(new RNAnimated.Value(-8)).current;

  useEffect(() => {
    if (visible) {
      RNAnimated.timing(backdropOpacity, { toValue: 0.85, duration: 180, useNativeDriver: true }).start();
      RNAnimated.parallel([
        RNAnimated.spring(discScale, { toValue: 1, tension: 140, friction: 8, useNativeDriver: true }),
        RNAnimated.timing(discOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      RNAnimated.timing(backdropOpacity, { toValue: 0, duration: 140, useNativeDriver: true }).start();
      RNAnimated.timing(discOpacity, { toValue: 0, duration: 120, useNativeDriver: true }).start();
      discScale.setValue(0.7);
      RNAnimated.timing(previewOpacity, { toValue: 0, duration: 100, useNativeDriver: true }).start();
      previewTranslateY.setValue(-8);
    }
  }, [visible]);

  useEffect(() => {
    if (hoveredIndex !== null) {
      RNAnimated.parallel([
        RNAnimated.timing(previewOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        RNAnimated.spring(previewTranslateY, { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      RNAnimated.timing(previewOpacity, { toValue: 0, duration: 100, useNativeDriver: true }).start();
      previewTranslateY.setValue(-8);
    }
  }, [hoveredIndex]);

  // ── Build visible wedges ────────────────────────────────────────────────
  const wedges: Array<{
    slot: RadialSlot;
    index: number;
    svgDeg: number;
    opacity: number;
    isHovered: boolean;
  }> = [];

  if (N > 0) {
    for (let i = 0; i < N; i++) {
      const fromTop = norm360(i * SLICE + offset);
      const d       = arcDelta(fromTop, visCenter);
      if (Math.abs(d) > VISIBLE_ARC / 2 + SLICE) continue;
      const fadeStart = VISIBLE_ARC / 2 - FADE_ZONE;
      const opacity   = Math.max(0, Math.min(1, 1 - Math.max(0, Math.abs(d) - fadeStart) / FADE_ZONE));
      const svgDeg    = fromTop - 90;
      wedges.push({ slot: slots[i], index: i, svgDeg, opacity, isHovered: i === hoveredIndex });
    }
  }

  // ── Scroll zone indicators ──────────────────────────────────────────────
  const scrollZones = [
    { center: visCenter - VISIBLE_ARC / 2 + SCROLL_ZONE_ARC / 2, arrow: "◀" },
    { center: visCenter + VISIBLE_ARC / 2 - SCROLL_ZONE_ARC / 2, arrow: "▶" },
  ];

  const hoveredSlot = hoveredIndex !== null ? slots[hoveredIndex] : null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
      {/* Dark backdrop */}
      <RNAnimated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: backdropOpacity }]}
      />

      {/* SVG spinning disc */}
      {N > 0 && (
        <RNAnimated.View
          style={{
            position: "absolute",
            left: center.x - SVG_C,
            top: center.y - SVG_C,
            width: SVG_SIZE,
            height: SVG_SIZE,
            opacity: discOpacity,
            transform: [{ scale: discScale }],
          }}
        >
          <Svg width={SVG_SIZE} height={SVG_SIZE} overflow="visible">
            <Defs>
              <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor="rgba(255,255,255,0.04)" />
                <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </RadialGradient>
            </Defs>

            {/* Ghost track arcs (boundary of visible region) */}
            <Path d={trackArcPath(visCenter, VISIBLE_ARC, OUTER_R + 2)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <Path d={trackArcPath(visCenter, VISIBLE_ARC, INNER_R - 2)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

            {/* Scroll zone indicators */}
            {scrollZones.map(({ center: zc, arrow }) => {
              const midRad = toRad(zc - 90);
              const ax     = SVG_C + LABEL_R * Math.cos(midRad);
              const ay     = SVG_C + LABEL_R * Math.sin(midRad);
              return (
                <G key={arrow}>
                  <Path
                    d={scrollZoneWedgePath(zc, SCROLL_ZONE_ARC)}
                    fill="rgba(255,255,255,0.03)"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={0.5}
                    strokeDasharray="2,3"
                  />
                  <SvgText
                    x={ax} y={ay}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={10}
                    fill="rgba(255,255,255,0.22)"
                  >
                    {arrow}
                  </SvgText>
                </G>
              );
            })}

            {/* Wedge slices */}
            {wedges.map(({ slot, index, svgDeg, opacity, isHovered }) => {
              const rad  = toRad(svgDeg);
              const lx   = SVG_C + LABEL_R * Math.cos(rad);
              const ly   = SVG_C + LABEL_R * Math.sin(rad);
              const dx   = SVG_C + DOT_R   * Math.cos(rad);
              const dy2  = SVG_C + DOT_R   * Math.sin(rad);

              const shortLabel = slot.label.length > 8 ? slot.label.slice(0, 7) + "…" : slot.label;

              return (
                <G key={slot.id} opacity={opacity}>
                  <Path
                    d={wedgePath(svgDeg, N)}
                    fill={isHovered ? slot.color + "CC" : "rgba(16,20,36,0.92)"}
                    stroke={isHovered ? slot.color : "rgba(255,255,255,0.09)"}
                    strokeWidth={isHovered ? 1.5 : 0.5}
                  />
                  {/* Icon placeholder area — colored bar inside wedge when hovered */}
                  {isHovered && (
                    <Path
                      d={wedgePath(svgDeg, N)}
                      fill="transparent"
                      stroke={slot.color}
                      strokeWidth={2.5}
                    />
                  )}
                  {/* Label */}
                  <SvgText
                    x={lx} y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={isHovered ? 9.5 : 8.5}
                    fontWeight={isHovered ? "700" : "400"}
                    fill={isHovered ? "#fff" : "rgba(255,255,255,0.5)"}
                    letterSpacing={0.8}
                  >
                    {shortLabel}
                  </SvgText>
                  {/* Quantity badge */}
                  {slot.quantity !== undefined && slot.quantity > 1 && (
                    <SvgText
                      x={lx + 14} y={ly - 8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={7}
                      fontWeight="700"
                      fill={slot.color}
                    >
                      {`×${slot.quantity}`}
                    </SvgText>
                  )}
                  {/* Pagination dot */}
                  <Circle
                    cx={dx} cy={dy2}
                    r={isHovered ? 3.5 : 2}
                    fill={isHovered ? slot.color : "rgba(255,255,255,0.28)"}
                  />
                </G>
              );
            })}
          </Svg>
        </RNAnimated.View>
      )}

      {/* Feather icons rendered as absolutely positioned views */}
      {N > 0 && visible && wedges.map(({ slot, svgDeg, opacity, isHovered }) => {
        const rad = toRad(svgDeg);
        const sx  = center.x + LABEL_R * Math.cos(rad) - 12;
        const sy  = center.y + LABEL_R * Math.sin(rad) - 24;
        return (
          <View
            key={`fi-${slot.id}`}
            style={{
              position: "absolute",
              left: sx,
              top: sy,
              width: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
              opacity,
            }}
          >
            {slot.previewImageUrl ? (
              <Image
                source={{ uri: slot.previewImageUrl }}
                style={{ width: 20, height: 20, borderRadius: 3 }}
              />
            ) : (
              <Feather
                name={slot.icon as any}
                size={isHovered ? 18 : 15}
                color={isHovered ? slot.color : slot.color + "BB"}
              />
            )}
          </View>
        );
      })}

      {/* Hover preview card */}
      {hoveredSlot && (
        <RNAnimated.View
          style={[
            styles.preview,
            previewOnLeft ? { left: 16 } : { right: 16 },
            {
              top: topInset + 8,
              opacity: previewOpacity,
              transform: [{ translateY: previewTranslateY }],
              backgroundColor: C.card,
              borderColor: hoveredSlot.color + "88",
            },
          ]}
        >
          <View
            style={[
              styles.previewIconWrap,
              { backgroundColor: hoveredSlot.color + "22", borderColor: hoveredSlot.color + "44" },
            ]}
          >
            {hoveredSlot.previewImageUrl ? (
              <Image source={{ uri: hoveredSlot.previewImageUrl }} style={styles.previewImage} />
            ) : (
              <Feather name={hoveredSlot.icon as any} size={24} color={hoveredSlot.color} />
            )}
          </View>
          <View style={styles.previewBody}>
            <Text style={[styles.previewName, { color: C.text }]} numberOfLines={1}>
              {hoveredSlot.previewName}
            </Text>
            <Text style={[styles.previewType, { color: hoveredSlot.color }]}>
              {hoveredSlot.previewType}
            </Text>
            <Text style={[styles.previewDesc, { color: C.textSecondary }]} numberOfLines={2}>
              {hoveredSlot.previewDescription}
            </Text>
            <View style={styles.previewStats}>
              <View
                style={[
                  styles.statChip,
                  { backgroundColor: hoveredSlot.color + "22", borderColor: hoveredSlot.color + "55" },
                ]}
              >
                <Text style={[styles.statText, { color: hoveredSlot.color }]}>
                  {hoveredSlot.previewImpact}
                </Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.statText, { color: C.textSecondary }]}>
                  {hoveredSlot.previewTarget}
                </Text>
              </View>
            </View>
          </View>
        </RNAnimated.View>
      )}

      {/* Empty state */}
      {N === 0 && visible && (
        <View style={styles.emptyHint}>
          <Feather name="package" size={22} color="#fff" style={{ opacity: 0.5 }} />
          <Text style={styles.emptyHintText}>Nenhum item disponível</Text>
          <Text style={styles.emptyHintSub}>Colete spots no mapa para equipar</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
    elevation: 999,
  },
  preview: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 4,
    padding: 12,
    maxWidth: 230,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  previewIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  previewImage: {
    width: 52,
    height: 52,
    borderRadius: 4,
  },
  previewBody: {
    flex: 1,
    gap: 3,
  },
  previewName: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  previewType: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  previewDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
    marginTop: 1,
  },
  previewStats: {
    flexDirection: "row",
    gap: 5,
    marginTop: 4,
    flexWrap: "wrap",
  },
  statChip: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  emptyHint: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyHintText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    opacity: 0.8,
  },
  emptyHintSub: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    opacity: 0.5,
    textAlign: "center",
  },
});
