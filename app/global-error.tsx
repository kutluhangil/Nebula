"use client";

/**
 * Last-resort boundary for errors thrown in the root layout itself, where the
 * normal error page cannot render. It must ship its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#05070f",
          color: "#e8ecf8",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem" }}>Nebula failed to start</h1>
        <p style={{ color: "#8b95b2", maxWidth: "32rem" }}>{error.message}</p>
        <button
          onClick={reset}
          style={{
            border: "1px solid #232a3d",
            background: "#0d1220",
            color: "#e8ecf8",
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
