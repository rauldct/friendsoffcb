import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "Friends of Barça";
  const subtitle = searchParams.get("subtitle") || "";
  const type = searchParams.get("type") || "default";

  const typeColors: Record<string, [string, string]> = {
    news: ["#004D98", "#1A1A2E"],
    blog: ["#A50044", "#1A1A2E"],
    guide: ["#004D98", "#A50044"],
    package: ["#A50044", "#004D98"],
    default: ["#1A1A2E", "#004D98"],
  };

  const [color1, color2] = typeColors[type] || typeColors.default;

  const typeLabels: Record<string, string> = {
    news: "NEWS",
    blog: "BLOG",
    guide: "TRAVEL GUIDE",
    package: "MATCH PACKAGE",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {typeLabels[type] && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  backgroundColor: "#EDBB00",
                  color: "#1A1A2E",
                  padding: "6px 16px",
                  borderRadius: "6px",
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                }}
              >
                {typeLabels[type]}
              </span>
            </div>
          )}
          <div
            style={{
              fontSize: title.length > 60 ? "42px" : "52px",
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: "90%",
              display: "flex",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: "24px",
                marginTop: "16px",
                color: "rgba(255,255,255,0.75)",
                display: "flex",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                display: "flex",
              }}
            >
              Friends of Barça
            </div>
          </div>
          <div
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.6)",
              display: "flex",
            }}
          >
            friendsofbarca.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
