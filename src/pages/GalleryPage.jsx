import { useEffect, useState } from "react";
import { loadContent } from "../content/content-service";

export default function GalleryPage() {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        setGallery(await loadContent("gallery", { legacyFallback: true }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#736357", padding: "80px 24px", color: "white" }}>
      <section style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <a href="/" style={{ display: "inline-flex", color: "white", textDecoration: "none", fontWeight: "900", marginBottom: "42px" }}>← Torna alla Home</a>
        <p style={{ textTransform: "uppercase", letterSpacing: "5px", fontWeight: "900", color: "#f7efe8" }}>Medea Beauty Lounge</p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(52px, 8vw, 110px)", lineHeight: "0.95", margin: "0 0 26px" }}>Beauty Gallery</h1>
        <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "20px", lineHeight: "1.7", maxWidth: "760px", marginBottom: "56px" }}>
          Una raccolta dei percorsi, dei dettagli e dell'esperienza Medea Beauty Lounge.
        </p>

        {loading ? (
          <p>Caricamento Gallery...</p>
        ) : gallery.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "32px", padding: "60px 32px", textAlign: "center" }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "42px" }}>Foto in arrivo</h2>
            <p style={{ color: "rgba(255,255,255,0.78)" }}>Le immagini verranno aggiunte presto dal pannello admin.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "22px" }}>
            {gallery.map((item) => (
              <img key={item.id} src={item.src} alt={item.title || "Medea Gallery"} style={{ width: "100%", height: "340px", objectFit: "cover", borderRadius: "28px", boxShadow: "0 30px 80px rgba(0,0,0,0.25)" }} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
