import { ImageResponse } from "next/og";

export const alt = "Couples Budget Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "linear-gradient(145deg, #0b1220 0%, #111827 55%, #064e3b 100%)",
          color: "white",
          fontFamily: "Geist, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#00a866",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            ♥
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>Couples Budget</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              maxWidth: 900,
            }}
          >
            Manage money together, without the confusion.
          </div>
          <div style={{ fontSize: 28, color: "#94a3b8", maxWidth: 820 }}>
            Shared bills, spending, income, and savings for two.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
