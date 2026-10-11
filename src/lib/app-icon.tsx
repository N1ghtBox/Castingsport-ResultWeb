import { ImageResponse } from "next/og";

// Placeholder app icon: target rings on the site's background.
// The rings stay inside the middle 80%, so Android can crop it to any mask shape.
export function appIcon(size: number) {
  const ring = (diameter: number, color: string) => ({
    position: "absolute" as const,
    width: size * diameter,
    height: size * diameter,
    borderRadius: "50%",
    background: color,
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030712", // gray-950
        }}
      >
        <div style={ring(0.62, "#10b981")} /> {/* emerald-500 */}
        <div style={ring(0.46, "#030712")} />
        <div style={ring(0.32, "#3b82f6")} /> {/* blue-500 */}
        <div style={ring(0.16, "#030712")} />
        <div style={ring(0.08, "#f9fafb")} />
      </div>
    ),
    { width: size, height: size }
  );
}
