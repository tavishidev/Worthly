export const LIGHT_COLORS = {
  primary: "#087F5B",
  primaryLight: "#E4F5ED",
  emerald: "#38C98B",
  navy: "#102822",
  navySurface: "#193A30",
  background: "#F3F7F4",
  surface: "#FFFFFF",
  surfaceSubtle: "#F8FBF9",
  white: "#FFFFFF",
  text: "#18342B",
  muted: "#6F8278",
  success: "#16A36A",
  successLight: "#E6F7F1",
  successOnDark: "#72D8B1",
  warning: "#E9A23B",
  warningLight: "#FFF3DF",
  warningSurface: "#FFF4DD",
  warningText: "#805A16",
  danger: "#E05252",
  dangerLight: "#FFF0F0",
  dangerOnDark: "#FF9C9C",
  info: "#3978D7",
  infoLight: "#EAF1FC",
  border: "#E1EAE4",
  onNavy: "#D4E6DD",
  onNavyMuted: "#A9C8B9",
  onNavySoft: "#C3DCCF",
  navyOverlay: "#FFFFFF16",
  navyDivider: "#FFFFFF20",
  navySeparator: "#FFFFFF44",
  navyTrack: "#FFFFFF24",
  navyBar: "#34516B",
} as const;

export type AppPalette = Record<keyof typeof LIGHT_COLORS, string>;

export const DARK_COLORS: AppPalette = {
  primary: "#48D6A0",
  primaryLight: "#153B2D",
  emerald: "#55E2AE",
  navy: "#081710",
  navySurface: "#10231A",
  background: "#07120D",
  surface: "#0D1D15",
  surfaceSubtle: "#12251B",
  white: "#FFFFFF",
  text: "#E9F4ED",
  muted: "#9BB2A3",
  success: "#4BD49A",
  successLight: "#153B2D",
  successOnDark: "#83E9BC",
  warning: "#F2BC63",
  warningLight: "#3A2D18",
  warningSurface: "#2B2417",
  warningText: "#F2CF91",
  danger: "#FF8585",
  dangerLight: "#3A2020",
  dangerOnDark: "#FFAAAA",
  info: "#83B6FF",
  infoLight: "#172B45",
  border: "#263B30",
  onNavy: "#D7E8DE",
  onNavyMuted: "#A9C0B2",
  onNavySoft: "#C2D8CA",
  navyOverlay: "#FFFFFF0D",
  navyDivider: "#FFFFFF18",
  navySeparator: "#FFFFFF35",
  navyTrack: "#FFFFFF1C",
  navyBar: "#29483A",
};

let activeColors: AppPalette = LIGHT_COLORS;

export const COLORS = new Proxy(LIGHT_COLORS, {
  get: (_target, key: keyof AppPalette) => activeColors[key],
}) as typeof LIGHT_COLORS;

export function setActiveColorScheme(scheme: "light" | "dark") {
  activeColors = scheme === "dark" ? DARK_COLORS : LIGHT_COLORS;
}

const paletteKeyByValue = new Map<string, keyof AppPalette>();
for (const palette of [LIGHT_COLORS, DARK_COLORS]) {
  for (const [key, value] of Object.entries(palette)) {
    paletteKeyByValue.set(value.toLowerCase(), key as keyof AppPalette);
  }
}

function mapStyleColors(
  value: unknown,
  scheme: "light" | "dark",
  styleName = ""
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => mapStyleColors(item, scheme, styleName));
  }
  if (!value || typeof value !== "object") return value;

  const mapped: Record<string, unknown> = {};
  for (const [key, property] of Object.entries(value)) {
    if (
      typeof property === "string" &&
      /color$/i.test(key) &&
      paletteKeyByValue.has(property.toLowerCase())
    ) {
      const propertyValue = property.toLowerCase();
      const propertyName = key.toLowerCase();
      const isSurfaceBackground =
        propertyName === "backgroundcolor" &&
        (propertyValue === LIGHT_COLORS.surface.toLowerCase() ||
          propertyValue === DARK_COLORS.surface.toLowerCase());
      const isNavyText =
        propertyName === "color" &&
        (propertyValue === LIGHT_COLORS.navy.toLowerCase() ||
          propertyValue === DARK_COLORS.navy.toLowerCase());
      const paletteKey = isSurfaceBackground
        ? "surface"
        : isNavyText
          ? "text"
          : paletteKeyByValue.get(propertyValue)!;
      const highContrastButtonText =
        scheme === "dark" &&
        key.toLowerCase() === "color" &&
        propertyValue === LIGHT_COLORS.white.toLowerCase() &&
        /buttontext$|checkmark$/i.test(styleName);
      mapped[key] = highContrastButtonText
        ? DARK_COLORS.navy
        : scheme === "dark"
          ? DARK_COLORS[paletteKey]
          : LIGHT_COLORS[paletteKey];
    } else {
      mapped[key] = mapStyleColors(
        property,
        scheme,
        typeof property === "object" && property !== null ? key : styleName
      );
    }
  }
  return mapped;
}

export function createThemedStyles<T extends Record<string, object>>(
  styles: T,
  scheme: "light" | "dark"
): T {
  return mapStyleColors(styles, scheme) as T;
}
