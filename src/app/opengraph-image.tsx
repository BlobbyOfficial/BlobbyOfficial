import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

/**
 * The social preview card. Generated rather than committed as a binary so it
 * can't drift out of sync with the site — the previous setup pointed at a
 * /preview.png that was never actually added, so every shared link rendered
 * a blank card.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — freelance video editor and free editing presets`;

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#000000",
          padding: "72px",
          position: "relative",
        }}
      >
        {/* Same skewed highlight the .cine-backdrop treatment uses on-site. */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "55%",
            height: "130%",
            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 60%)",
            transform: "skewX(-12deg)",
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#888888",
            marginBottom: 28,
          }}
        >
          Freelance Video Editor
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 116,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          @blobbyofficial
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#888888",
            marginTop: 32,
            lineHeight: 1.4,
            maxWidth: 900,
          }}
        >
          High-retention TikTok edits, and the free DaVinci Resolve presets behind them.
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 48,
            paddingTop: 32,
            borderTop: "1px solid rgba(255,255,255,0.14)",
            fontSize: 24,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#c9a869",
          }}
        >
          blobbyofficial.com
        </div>
      </div>
    ),
    size
  );
}
