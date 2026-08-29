import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "@/lib/site";

// Rendered once at build time, so the social card is a real image rather than
// the missing file the metadata previously pointed at.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "NEBULA — Planet Intelligence Dashboard";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#05070f",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Ambient glow, echoing the app's own background treatment. */}
        <div
          style={{
            position: "absolute",
            top: -220,
            left: -160,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(94,139,255,0.30) 0%, rgba(5,7,15,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -260,
            right: -140,
            width: 640,
            height: 640,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(55,224,232,0.22) 0%, rgba(5,7,15,0) 70%)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 32,
          }}
        >
          {/* Ringed globe, matching the app icon. */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              border: "2px solid rgba(94,139,255,0.55)",
              background: "rgba(94,139,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 36% 32%, rgba(55,224,232,0.95) 0%, rgba(94,139,255,0.75) 60%, rgba(94,139,255,0.25) 100%)",
                display: "flex",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#8b95b2",
              letterSpacing: 8,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Planet Intelligence
          </div>
        </div>

        <div
          style={{
            fontSize: 116,
            color: "#e8ecf8",
            letterSpacing: -3,
            lineHeight: 1,
            display: "flex",
          }}
        >
          NEBULA
        </div>

        <div
          style={{
            fontSize: 34,
            color: "#8b95b2",
            marginTop: 28,
            maxWidth: 900,
            lineHeight: 1.35,
            display: "flex",
          }}
        >
          {SITE_DESCRIPTION}
        </div>

        <div
          style={{
            display: "flex",
            gap: 28,
            marginTop: 48,
            fontSize: 24,
            color: "#5c6786",
          }}
        >
          <div style={{ display: "flex" }}>NASA</div>
          <div style={{ display: "flex" }}>·</div>
          <div style={{ display: "flex" }}>USGS</div>
          <div style={{ display: "flex" }}>·</div>
          <div style={{ display: "flex" }}>NOAA</div>
          <div style={{ display: "flex" }}>·</div>
          <div style={{ display: "flex" }}>Launch Library</div>
        </div>
      </div>
    ),
    size
  );
}
