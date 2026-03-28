import { useColorScheme } from "react-native";
import COLORS from "@/constants/colors";

export function useColors() {
  const scheme = useColorScheme();
  return scheme === "light" ? COLORS.light : COLORS.dark;
}

export function useIsDark() {
  const scheme = useColorScheme();
  return scheme !== "light";
}
