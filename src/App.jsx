import logo from "./assets/logo-clean-gold.png";
import epilsoft from "./assets/epilsoft.png";
import addomeSculpt from "./assets/addome-sculpt.png";
import skinLab from "./assets/skin-lab.png";
import { useState, useEffect, useRef } from "react";
import rosy from "./assets/rosy.png";
import {
  Sparkles,
  Calendar,
} from "lucide-react";
import { loadContent } from "./content/content-service";
import {
  legalConfiguration,
  privacySections,
  webCookieSections,
} from "./config/legal";
import "./App.css";
import { loadPublicBusiness, publicBusinessFallback } from "./config/public-business";


const BUSINESS_INFO = {
  vat: "07118580823",
  developer: "Lucas Giarraffa",
};

function LegalPage({ type, onNavigate }) {
  const isPrivacy = type === "privacy";
  const sections = isPrivacy ? privacySections : webCookieSections;
  const version = isPrivacy
    ? legalConfiguration.privacyVersion
    : legalConfiguration.cookieVersion;

  return (
    <main className="site legal-page">
      <section className="legal-hero">
        <a href="/" className="legal-logo-link" onClick={(e) => { e.preventDefault(); onNavigate(null); }}>
          <img src={logo} alt="Medea Beauty Lounge" className="legal-logo" />
        </a>
        <p className="eyebrow">Medea Beauty Lounge</p>
        <h1>{isPrivacy ? "Privacy Policy" : "Cookie Policy"}</h1>
        <p className="legal-updated">In vigore dal {legalConfiguration.effectiveDate} · Versione {version}</p>
      </section>

      <section className="legal-content">
        {sections.map((section) => (
          <div key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        ))}

        <div className="legal-actions">
          <a href="/" className="btn primary" onClick={(e) => { e.preventDefault(); onNavigate(null); }}>Torna al sito</a>
          <a
            href={isPrivacy ? "/cookie-policy" : "/privacy-policy"}
            className="btn secondary"
            onClick={(e) => { e.preventDefault(); onNavigate(isPrivacy ? "cookie" : "privacy"); }}
          >
            {isPrivacy ? "Leggi la Cookie Policy" : "Leggi la Privacy Policy"}
          </a>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [publicBusiness, setPublicBusiness] = useState(publicBusinessFallback);
  useEffect(() => { void loadPublicBusiness().then(setPublicBusiness); }, []);
  const [hideFloatingBtn, setHideFloatingBtn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroAnimate, setHeroAnimate] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [clienti, setClienti] = useState(0);
  const [stelle, setStelle] = useState(0);
  const [percorsi, setPercorsi] = useState(0);
  const statsRef = useRef(null);
  const [beforeAfterItems, setBeforeAfterItems] = useState([]);
  const getLegalPageFromLocation = () => {
    const path = window.location.pathname.toLowerCase();
    if (path === "/privacy-policy" || path === "/privacy-policy/") return "privacy";
    if (path === "/cookie-policy" || path === "/cookie-policy/") return "cookie";
    return null;
  };
  const [legalPage, setLegalPage] = useState(getLegalPageFromLocation);

  const navigateLegal = (page) => {
    setLegalPage(page);
    const nextPath = page === "privacy" ? "/privacy-policy" : page === "cookie" ? "/cookie-policy" : "/";
    window.history.pushState({}, "", nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
  const footer = document.querySelector("footer");

  if (!footer) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      setHideFloatingBtn(entry.isIntersecting);
    },
    {
      threshold: 0.1,
    }
  );

  observer.observe(footer);

  return () => observer.disconnect();
}, []);


  useEffect(() => {
    const timer = setTimeout(() => setHeroAnimate(true), 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handlePopState = () => setLegalPage(getLegalPageFromLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const loadBeforeAfter = async () => {
      try {
        setBeforeAfterItems(await loadContent("beforeAfter", { legacyFallback: true }));
      } catch (error) {
        console.error(error);
      }
    };

    loadBeforeAfter();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!statsVisible) return;

    let c = 0;
    let s = 0;
    let p = 0;

    const interval = setInterval(() => {
      if (c < 500) c += 7;
      if (s < 5) s += 2;
      if (p < 100) p += 2;

      setClienti(Math.min(c, 500));
      setStelle(Math.min(s, 5));
      setPercorsi(Math.min(p, 100));

      if (c >= 500 && s >= 5 && p >= 100) {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [statsVisible]);

  // === ANIMAZIONE SCROLL TRATTAMENTI MOBILE ===
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = document.querySelectorAll('.treatment-card');
    cards.forEach((card, index) => {
      card.style.transitionDelay = `${index * 0.1}s`;
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  if (legalPage) return <LegalPage type={legalPage} onNavigate={navigateLegal} />;

  return (
    <main className="site">
      <section className={`hero-reveal ${heroAnimate ? "hero-animate" : ""}`}>
        <nav className="navbar">
          <div className="nav-links">
            <a
  href="/"
  onClick={(e) => {
    e.preventDefault();
    document
      .getElementById("trattamenti")
      ?.scrollIntoView({ behavior: "smooth" });
  }}
>
  ALTRI TRATTAMENTI
</a>
            <a
  href="/"
  onClick={(e) => {
    e.preventDefault();
    document
      .getElementById("metodo")
      ?.scrollIntoView({ behavior: "smooth" });
  }}
>
  METODO
</a>
           <a href="/gallery">GALLERY</a> 
            <a
  href="/"
  onClick={(e) => {
    e.preventDefault();
    document
      .getElementById("contatti")
      ?.scrollIntoView({ behavior: "smooth" });
  }}
>
  CONTATTI
</a>
          </div>

          {/* RIMOSSO: bottone PRENOTA ORA in alto a destra */}

          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
        </nav>

        {menuOpen && (
          <div className="mobile-menu premium-mobile-menu">
            <button className="mobile-close" onClick={() => setMenuOpen(false)}>
              ×
            </button>

            <p className="mobile-menu-label">Medea Beauty Lounge</p>

            <a
  href="/"
  onClick={(e) => {
    e.preventDefault();
    setMenuOpen(false);
    document
      .getElementById("trattamenti")
      ?.scrollIntoView({ behavior: "smooth" });
  }}
>
  Altri Trattamenti
</a>
<a
  href="/"
  onClick={(e) => {
    e.preventDefault();
    setMenuOpen(false);
    document
      .getElementById("metodo")
      ?.scrollIntoView({ behavior: "smooth" });
  }}
>
  Metodo
</a>
            <a href="/gallery" onClick={() => setMenuOpen(false)}>Gallery</a>
   <a
  href="/"
  onClick={(e) => {
    e.preventDefault();
    setMenuOpen(false);
    document
      .getElementById("contatti")
      ?.scrollIntoView({ behavior: "smooth" });
  }}
>
  Contatti
</a>

            <a
              className="mobile-menu-cta"
              href="/prenota"
              onClick={() => setMenuOpen(false)}
            >
              Prenota Ora
            </a>
          </div>
        )}

        <div className="hero-content">
          <img
            src={logo}
            alt="Medea Beauty Lounge"
            className="hero-logo"
          />

          <p className="eyebrow">Palermo</p>

          <p
            className="mini-subtitle"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(42px, 4.6vw, 72px)",
              lineHeight: "1.08",
              fontWeight: "500",
              color: "#ffffff",
              margin: "14px 0 30px",
              maxWidth: "1100px",
            }}
          >
            Il tuo percorso beauty personalizzato
          </p>
          <div className="hero-actions">
            <a
              className="btn primary"
              href="/prenota"
            >
              Prenota Ora →
            </a>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
<section
  className="trust-bar reveal"
  style={{
    maxWidth: "1200px",
    margin: "34px auto 0",
    padding: "0 32px",
  }}
>
  <div
    style={{
      background: "#fffaf5",
      border: "1px solid rgba(115,99,87,0.16)",
      borderRadius: "999px",
      boxShadow: "0 20px 60px rgba(29,23,22,0.08)",
      padding: "20px 32px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "34px",
      flexWrap: "wrap",
      textAlign: "center",
    }}
  >
    {[
      "★★★★★ 5.0 Google Reviews",
      "+500 Clienti soddisfatte",
      "Consulenza gratuita",
      "Percorsi personalizzati",
    ].map((item) => (
      <span
        key={item}
        style={{
          color: "#736357",
          fontWeight: "900",
          fontSize: "14px",
          letterSpacing: "1.4px",
          textTransform: "uppercase",
        }}
      >
        {item}
      </span>
    ))}
  </div>
</section>

      <div className="luxury-divider"></div>

      {/* TRATTAMENTI ESCLUSIVI */}
      <section
        className="reveal"
        style={{
          maxWidth: "1300px",
          margin: "120px auto",
          padding: "0 48px",
        }}
      >
        <p className="eyebrow">Medea Beauty Lounge</p>

        <h2
          style={{
            fontSize: "clamp(42px, 7vw, 72px)",
            lineHeight: "1",
            color: "#1d1716",
            maxWidth: "780px",
            marginBottom: "60px",
          }}
        >
          I nostri trattamenti esclusivi
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "28px",
          }}
        >
          {[
            {
              name: "Epilsoft",
              image: epilsoft,
              text: "Metodo di epilazione progressiva permanente",
            },
            {
              name: "Addome Sculpt",
              image: addomeSculpt,
              text: "Percorsi di rimodellamento corporeo mirati a tutti gli inestetismi corpo",
            },
            {
              name: "Skin Lab 360",
              image: skinLab,
              text: "Percorsi avanzati di ringiovanimento e miglioramento del viso",
            },
          ].map((service) => (
            <a
              key={service.name}
              href={`/${service.name.toLowerCase().replaceAll(" ", "-")}`}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-10px)";
                const img = e.currentTarget.querySelector("img");
                if (img) img.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 35px 90px rgba(115,99,87,0.18)";
                const line = e.currentTarget.querySelector(".gold-line");
                if (line) line.style.width = "120px";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0px)";
                const img = e.currentTarget.querySelector("img");
                if (img) img.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
                const line = e.currentTarget.querySelector(".gold-line");
                if (line) line.style.width = "60px";
              }}
              style={{
                background: "transparent",
                borderRadius: "34px",
                padding: "42px",
                minHeight: "320px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                textDecoration: "none",
                boxShadow: "0 24px 70px rgba(29,23,22,0.10)",
                border: "1px solid rgba(115,99,87,0.18)",
                transition: "all 0.35s ease",
                cursor: "pointer",
              }}
            >
              <img
                src={service.image}
                alt={service.name}
                style={{
                  width: "220px",
                  maxWidth: "100%",
                  height: "auto",
                  objectFit: "contain",
                  marginBottom: "28px",
                  filter: "brightness(0.15)",
                  transition: "all 0.35s ease",
                }}
              />
              <div
                className="gold-line"
                style={{
                  width: "60px",
                  height: "2px",
                  background: "#736357",
                  borderRadius: "999px",
                  margin: "0 auto 22px",
                }}
              />
              <p
                style={{
                  color: "#6d5e57",
                  lineHeight: "1.7",
                  fontSize: "18px",
                  margin: 0,
                  maxWidth: "320px",
                }}
              >
                {service.text}
              </p>
            </a>
          ))}
        </div>
      </section>

      <div className="luxury-divider"></div>

      {/* SERVIZI */}
      <section
        id="trattamenti"
        className="section reveal"
        style={{
          paddingTop: "110px",
          paddingBottom: "110px",
        }}
      >
        <p className="eyebrow">Altri nostri servizi</p>

        <div className="treatment-grid">
          {[
            "Manicure & Pedicure",
            "Ciglia e sopracciglia",
            "Epilazione con cera",
            "Make-up",
            "Massoterapia",
            "Linfodrenaggio",
          ].map((title) => (
            <div className="treatment-card" key={title}>
              <div className="beauty-icon">
                <Sparkles size={24} />
              </div>
              <h3>{title}</h3>
              
            </div>
          ))}
        </div>
      </section>

      {/* METODO */}
      <section
      id="metodo"
        className="method reveal"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "100px 32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "60px",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <p className="eyebrow">Metodo Medea</p>
          <h2
            style={{
              fontSize: "clamp(46px, 6vw, 72px)",
              lineHeight: "1",
              maxWidth: "620px",
              marginBottom: "28px",
              color: "#1d1716",
            }}
          >
            Ogni trattamento nasce da un percorso
          </h2>
          <p
            style={{
              fontSize: "20px",
              lineHeight: "1.8",
              color: "#6d5e57",
              maxWidth: "560px",
            }}
          >
            Analisi, ascolto e personalizzazione: il nostro metodo mette al centro la persona,
            non solo il trattamento
          </p>
        </div>

        <div style={{ display: "grid", gap: "18px" }}>
          {[
            ["01", "Consulenza iniziale gratuita"],
            ["02", "Analisi e valutazione personalizzata "],
            ["03", "Trattamento mirato"],
            ["04", "Risultati seguiti nel tempo"]
          ].map(([num, text]) => (
            <div
              key={num}
              style={{
                background: "#1d1716",
                color: "white",
                borderRadius: "28px",
                padding: "28px",
                boxShadow: "0 20px 50px rgba(29,23,22,0.18)",
              }}
            >
              <span style={{ color: "#736357", fontWeight: "900" }}>{num}</span>
              <p style={{ fontSize: "24px", margin: "10px 0 0" }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="luxury-divider"></div>

      {/* PERCHÉ SCEGLIERE MEDEA */}
      <section
        className="reveal"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 32px 120px",
        }}
      >
        <p className="eyebrow">Perché scegliere Medea</p>
        <h2
          style={{
            fontSize: "72px",
            lineHeight: "0.95",
            maxWidth: "700px",
            marginBottom: "60px",
            color: "#1d1716",
          }}
        >
          Eleganza, attenzione e risultati
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "28px",
          }}
        >
          {[
            [
              "Percorsi personalizzati",
              "Ogni trattamento viene studiato su misura per favorire risultati più efficaci"
            ],
            [
              "Ambiente premium",
              "Un luogo elegante e accogliente pensato per farti sentire bene."
            ],
            [
              "Attenzione ai dettagli",
              "Professionalità, cura e supporto costante durante il percorso."
            ]
          ].map(([title, text]) => (
            <div
              key={title}
              style={{
                background: "#fffaf5",
                padding: "40px",
                borderRadius: "34px",
                boxShadow: "0 20px 60px rgba(29,23,22,0.08)",
                border: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <h3 style={{ fontSize: "30px", marginBottom: "18px", color: "#1d1716" }}>{title}</h3>
              <p style={{ color: "#6d5e57", lineHeight: "1.8", fontSize: "18px" }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="luxury-divider"></div>

      {/* STATS */}
      <section
        ref={statsRef}
        className="reveal"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 32px 120px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            [`+${clienti}`, "Clienti soddisfatte"],
            [`${stelle}★`, "Esperienza premium"],
            [`${percorsi}%`, "Percorsi personalizzati"],
            ["Palermo", "Beauty Lounge"]
          ].map(([number, text]) => (
            <div
              key={number}
              style={{
                background: "#fffaf5",
                borderRadius: "34px",
                padding: "42px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 20px 60px rgba(29,23,22,0.08)",
                border: "1px solid rgba(115,99,87,0.15)",
              }}
            >
              <h2 style={{ fontSize: "58px", margin: "0 0 12px", color: "#736357" }}>{number}</h2>
              <p style={{ margin: 0, color: "#6d5e57", fontSize: "18px" }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="luxury-divider"></div>
      
      {/* PRIMA E DOPO */}
<section
  className="reveal"
  style={{
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "60px 32px 120px",
  }}
>
  <p className="eyebrow">Prima e Dopo</p>

  <h2
    style={{
      fontSize: "clamp(42px, 7vw, 72px)",
      lineHeight: "1",
      maxWidth: "760px",
      marginBottom: "50px",
      color: "#1d1716",
    }}
  >
    Risultati visibili, percorsi reali
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "24px",
    }}
  >
    {(
      beforeAfterItems.length
        ? beforeAfterItems
        : [
            { title: "Trattamenti viso", before: "", after: "", description: "" },
            { title: "Percorsi corpo", before: "", after: "", description: "" },
            { title: "Epilazione progressiva", before: "", after: "", description: "" },
          ]
    ).map((item) => (
      <div
        key={item.id || item.title}
        className="before-after-card"
        style={{
          background: "#fffaf5",
          borderRadius: "34px",
          padding: "32px",
          minHeight: "280px",
          boxShadow: "0 20px 60px rgba(29,23,22,0.08)",
          border: "1px solid rgba(115,99,87,0.14)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            height: "220px",
            borderRadius: "24px",
            overflow: "hidden",
            position: "relative",
            background: "#e9e1db",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "50%",
              height: "100%",
              background: item.before ? `url(${item.before}) center/cover` : "#d8cec6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "900",
              color: "#736357",
            }}
          >
            {!item.before && "PRIMA"}
          </div>

          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: "50%",
              height: "100%",
              background: item.after ? `url(${item.after}) center/cover` : "#f5eee8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "900",
              color: "#736357",
            }}
          >
            {!item.after && "DOPO"}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              width: "3px",
              height: "100%",
              background: "#736357",
              transform: "translateX(-50%)",
            }}
          />
        </div>

        <div>
          <h3
            style={{
              fontSize: "26px",
              marginBottom: "10px",
              color: "#1d1716",
            }}
          >
            {item.title}
          </h3>

          <p
            style={{
              color: "#6d5e57",
              lineHeight: "1.7",
              margin: 0,
            }}
          >
            {item.description || "Presto inseriremo risultati reali dei percorsi effettuati presso Medea Beauty Lounge."}
          </p>
        </div>
      </div>
    ))}
  </div>
</section>

<div className="luxury-divider"></div>
{/* CHI SIAMO */}
<section
  className="reveal"
  style={{
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "80px 32px 120px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "60px",
    alignItems: "center",
  }}
>
  {/* FOTO TITOLARE */}
  <div
      style={{
      background: "#fffaf5",
      borderRadius: "36px",
      minHeight: "500px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#736357",
      fontSize: "22px",
      fontWeight: "700",
      border: "1px solid rgba(115,99,87,0.15)",
      boxShadow: "0 20px 60px rgba(29,23,22,0.08)",
    }}
  >
   <img
  src={rosy}
  alt="Rosy Chiaramonte"
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "36px",
  }}
/>
  </div>

  {/* TESTO */}
  <div>
    <p className="eyebrow">Chi siamo</p>

    <h2
      style={{
        fontSize: "clamp(42px, 6vw, 72px)",
        lineHeight: "1",
        color: "#1d1716",
        marginBottom: "28px",
      }}
    >
      Bellezza, esperienza e attenzione alla persona
    </h2>

    <p
      style={{
        color: "#6d5e57",
        fontSize: "20px",
        lineHeight: "1.9",
        marginBottom: "22px",
      }}
    >
      Medea Beauty Lounge nasce dalla passione per la cura della persona e dal
      desiderio di offrire percorsi realmente personalizzati.
    </p>

    <p
      style={{
        color: "#6d5e57",
        fontSize: "20px",
        lineHeight: "1.9",
        marginBottom: "22px",
      }}
    >
      Ogni cliente viene accompagnata passo dopo passo attraverso trattamenti
      studiati sulle proprie esigenze, con l'obiettivo di ottenere risultati
      naturali, armoniosi e duraturi nel tempo.
    </p>

    <p
      style={{
        color: "#6d5e57",
        fontSize: "20px",
        lineHeight: "1.9",
        marginBottom: "40px",
      }}
    >
      Professionalità, aggiornamento continuo e attenzione ai dettagli sono i
      valori che guidano ogni esperienza all'interno del nostro centro.
    </p>

    <a
      href="/prenota"
      style={{
        display: "inline-flex",
        background: "#736357",
        color: "#ffffff",
        padding: "16px 28px",
        borderRadius: "999px",
        textDecoration: "none",
        fontWeight: "800",
      }}
    >
      Prenota una consulenza →
    </a>
  </div>
</section>

<div className="luxury-divider"></div>

      {/* RECENSIONI */}
      <section
        className="reviews reveal"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "90px 32px",
          background: "#736357",
          color: "white",
          borderRadius: "48px",
          textAlign: "center",
        }}
      >
        <p className="eyebrow">Recensioni verificate Google</p>
        <h2
          style={{
            color: "black",
            fontSize: "clamp(38px, 7vw, 64px)",
            lineHeight: "1",
            maxWidth: "850px",
            margin: "0 auto 50px",
          }}
        >
          Esperienze reali, risultati autentici.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            {
              name: "Ivana Lo Re",
              text: "Ho fatto una pedicure curativa Rosy è stata bravissima. Professionale e precisa. Dopo anni di pedicure fatta in altro centro, per la prima volta con Rosy ho risolto il mio problema. Lei ha riconosciuto immediatamente la causa del mio dolore e ha risolto! Rosy è eccezionaleConsiglio vivamente il centro a tutti coloro che hanno bisogno.",
            },
            {
              name: "Lorena T.",
              text: "Frequento questo centro estetico per trattamenti di lipolaser, massaggi ed epilazione laser e sono veramente soddisfatta.Rosy, la titolare, è una vera professionista: estremamente preparata, attenta e sempre disponibile. Ti segue passo passo, ascolta le tue esigenze e ti propone un percorso personalizzato, studiato su misura per la tua persona facendoti sentire in ottime mani. Consiglio questo centro a chi cerca risultati concreti, competenza e attenzione autentica al cliente ♥️",
            },
            {
              name: "Rosanna Lo Cicero",
              text: "Ho acquistato il pacchetto da 10 sedute di lipolaser e pressoterapia presso il centro estetico di Rosy Chiaramonte,sono rimasta molto soddisfatta dei risultati ottenuti visibili già dalla quarta seduta,ho trovato il centro molto pulito e Rosy è una ragazza molto empatica e professionale",
            },
          ].map((review) => (
            <div
              key={review.name}
              className="google-review-card"
            >
              <div className="google-review-rating">★★★★★</div>
              <p className="google-review-text">“{review.text}”</p>
              <div className="google-review-footer">
                <strong>{review.name}</strong>
                <span>Recensione Google</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="luxury-divider"></div>

      {/* FAQ */}
      <section
        className="reveal"
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "100px 32px",
        }}
      >
        <p className="eyebrow">Domande frequenti</p>
        <h2
          style={{
            fontSize: "clamp(44px, 7vw, 76px)",
            lineHeight: "1",
            marginBottom: "50px",
            color: "#1d1716",
          }}
        >
          Prima di prenotare
        </h2>

        {[
          [
            "Serve una consulenza prima del trattamento?",
            "Sì, sarebbe preferibile prenotare una consulenza iniziale per valutare caratteristiche ed esigenze personali  e scegliere il percorso più adatto"
          ],
          [
            "Posso prenotare tramite WhatsApp?",
            "Sì, puoi scriverci direttamente su WhatsApp per informazioni, disponibilità e appuntamenti"
          ],
          [
            "I trattamenti sono personalizzati?",
            "Sì, ogni percorso viene studiato sugli inestetismi e sui desideri personali"
          ],
          [
            "Dove si trova Medea Beauty Lounge a Palermo?",
            "Medea Beauty Lounge si trova in Via Giorgio D'Antiochia 6,  Palermo (Zona Fiera del Mediterraneo)"
          ]
        ].map(([question, answer]) => (
          <details
            key={question}
            style={{
              background: "#fffaf5",
              padding: "28px 32px",
              borderRadius: "28px",
              marginBottom: "18px",
              boxShadow: "0 18px 50px rgba(29,23,22,0.07)",
              border: "1px solid rgba(115,99,87,0.18)",
              transition: "all 0.35s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 28px 70px rgba(29,23,22,0.12)";
              e.currentTarget.style.border = "1px solid rgba(115,99,87,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 18px 50px rgba(29,23,22,0.07)";
              e.currentTarget.style.border = "1px solid rgba(115,99,87,0.18)";
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: "900",
                fontSize: "20px",
                color: "#1d1716",
                listStyle: "none",
              }}
            >
              {question}
            </summary>
            <p
              style={{
                color: "#6d5e57",
                lineHeight: "1.8",
                marginTop: "18px",
                marginBottom: 0,
                fontSize: "18px",
              }}
            >
              {answer}
            </p>
          </details>
        ))}
      </section>

      <div className="luxury-divider"></div>

      {/* CONTATTI */}
      <section
        id="contatti"
        className="contact-reveal"
        style={{
          maxWidth: "1200px",
          margin: "120px auto",
          padding: "0 32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "60px",
          alignItems: "center",
        }}
      >
        <div>
          <p className="eyebrow">Contatti</p>
          <h2
            style={{
              fontSize: "72px",
              lineHeight: "0.95",
              marginBottom: "28px",
              color: "#1d1716",
            }}
          >
            Prenota la tua consulenza beauty
          </h2>
          <p
            style={{
              color: "#6d5e57",
              lineHeight: "1.8",
              fontSize: "20px",
              maxWidth: "500px",
            }}
          >
            Scrivici su WhatsApp per ricevere informazioni sui trattamenti,
            disponibilità e percorsi personalizzati.
          </p>
        </div>

        <div
          style={{
            background: "#fffaf5",
            padding: "42px",
            borderRadius: "36px",
            boxShadow: "0 20px 60px rgba(29,23,22,0.08)",
            border: "1px solid rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "grid", gap: "20px" }}>
 <a
  href={publicBusiness.mapsUrl}
  target="_blank"
  rel="noopener noreferrer"
  style={{
    display: "block",
    textDecoration: "none",
    borderRadius: "24px",
    overflow: "hidden",
    border: "1px solid rgba(115,99,87,0.18)",
    background: "#f7f4f1",
    marginBottom: "20px",
  }}
>
  <div
    style={{
      height: "180px",
      background: "linear-gradient(135deg,#736357,#a89585)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: "48px",
    }}
  >
    📍
  </div>

  <div style={{ padding: "18px" }}>
    <strong
      style={{
        display: "block",
        color: "#1d1716",
        fontSize: "18px",
        marginBottom: "6px",
      }}
    >
      {publicBusiness.businessName}
    </strong>

    <span
      style={{
        color: "#6d5e57",
        fontSize: "15px",
        display: "block",
      }}
    >
      {publicBusiness.address}
    </span>

    <span
      style={{
        color: "#736357",
        fontSize: "14px",
        fontWeight: "800",
      }}
    >
      Apri indicazioni →
    </span>
  </div>
</a>
            <p style={{ fontSize: "18px" }}> Tel. Fisso: {publicBusiness.phoneDisplay} </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginTop: "36px",
            }}
          >
            <a
              href="/prenota"
              style={{
                background: "#736357",
                color: "#ffffff",
                padding: "16px 26px",
                borderRadius: "999px",
                textDecoration: "none",
                fontWeight: "800",
              }}
            >
              Prenota Ora
            </a>
            <a
              href="https://www.instagram.com/medea.beautylounge/"
              target="_blank"
              style={{
                background: "#1d1716",
                color: "white",
                padding: "16px 26px",
                borderRadius: "999px",
                textDecoration: "none",
                fontWeight: "800",
              }}
            >
              Vai su Instagram
            </a>
          </div>
        </div>
      </section>

      <div className="luxury-divider"></div>

      {/* CTA FINALE */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "90px auto",
          padding: "60px 32px",
          background: "#736357",
          borderRadius: "42px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: "#ffffff",
            fontSize: "clamp(38px, 7vw, 68px)",
            lineHeight: "1",
            marginBottom: "24px",
          }}
        >
          Inizia il tuo percorso beauty con Medea.
        </h2>
        <p
          style={{
            color: "#ffffff",
            fontSize: "20px",
            lineHeight: "1.7",
            maxWidth: "650px",
            margin: "0 auto 34px",
          }}
        >
          Scrivici ora per ricevere informazioni sui trattamenti e prenotare la tua consulenza.
        </p>
        <a
          href="/prenota"
          style={{
            display: "inline-flex",
            background: "#1d1716",
            color: "white",
            padding: "16px 28px",
            borderRadius: "999px",
            textDecoration: "none",
            fontWeight: "800",
          }}
        >
          Prenota Ora
        </a>
      </section>

      {/* HERO FINALE */}
      <section
        className="reveal"
        style={{
          position: "relative",
          margin: "140px auto",
          maxWidth: "1400px",
          minHeight: "620px",
          borderRadius: "42px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 40px",
          background: 'linear-gradient(#736357, #736357),  center/cover',
          boxShadow: "0 35px 100px rgba(29,23,22,0.18)",
        }}
      >
        <div style={{ maxWidth: "950px", zIndex: 2 }}>
          <p
            style={{
              color: "#736357",
              textTransform: "uppercase",
              letterSpacing: "6px",
              fontSize: "15px",
              fontWeight: "800",
              marginBottom: "24px",
            }}
          >
            Medea Beauty Lounge
          </p>
          <h2
            style={{
              fontSize: "clamp(56px, 8vw, 120px)",
              lineHeight: "0.95",
              color: "white",
              marginBottom: "28px",
              fontFamily: "Georgia, serif",
            }}
          >
            La tua beauty experience inizia qui
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: "24px",
              lineHeight: "1.8",
              maxWidth: "760px",
              margin: "0 auto 40px",
            }}
          >
            Percorsi personalizzati, eleganza, cura dei dettagli e trattamenti studiati
            per valorizzare la tua bellezza in modo autentico.
          </p>
          <a
            href="/prenota"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#736357",
              color: "#ffffff",
              padding: "22px 38px",
              borderRadius: "999px",
              textDecoration: "none",
              fontWeight: "900",
              fontSize: "18px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              transition: "all 0.35s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Prenota la tua consulenza
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "#1d1716",
          color: "white",
          padding: "90px 32px 38px",
          marginTop: "120px",
        }}
      >
        <div
          style={{
            maxWidth: "1300px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
            gap: "42px",
            alignItems: "start",
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "48px",
                letterSpacing: "5px",
                margin: "0 0 18px",
                color: "#736357",
              }}
            >
              MEDEA
            </h3>
          </div>

          <div>
            <h4 style={{ color: "#736357", marginBottom: "18px" }}>Navigazione</h4>
            <p><a
  href="/"
  onClick={(e) => {
    e.preventDefault();
    document
      .getElementById("trattamenti")
      ?.scrollIntoView({ behavior: "smooth" });
  }}
>
   Altri Trattamenti
</a></p>
            <p><a
  href="/"
  onClick={(e) => {
    e.preventDefault();
    document
      .getElementById("metodo")
      ?.scrollIntoView({ behavior: "smooth" });
  }}
>
  Metodo
</a></p>
            <p><a href="/gallery" style={{ color: "#e9d7c6", textDecoration: "none" }}>Gallery</a></p>
            <p><a
  href="/"
  onClick={(e) => {
    e.preventDefault();
    document
      .getElementById("contatti")
      ?.scrollIntoView({ behavior: "smooth" });
  }}
>
  Contatti
</a></p>
          </div>

          <div>
            <h4 style={{ color: "#736357", marginBottom: "18px" }}>Contatti</h4>
            <p style={{ color: "#e9d7c6" }}>📍 {publicBusiness.address}</p>
            <p style={{ color: "#e9d7c6" }}> Tel. Fisso: {publicBusiness.phoneDisplay}</p>
          </div>

          <div>
            <h4 style={{ color: "#736357", marginBottom: "18px" }}>Prenota</h4>
            <p style={{ color: "#e9d7c6", lineHeight: "1.7" }}>
              Scrivici per informazioni, disponibilità e consulenze beauty.
            </p>

            <p style={{ marginTop: "22px" }}>
              <a
                href="/admin"
                style={{
                  color: "#736357",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "900",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Area Riservata
              </a>
            </p>
          </div>
        </div>

        <div
          style={{
            maxWidth: "1300px",
            margin: "60px auto 0",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            color: "#e9d7c6",
            fontSize: "14px",
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <span>© 2026 Medea Beauty Lounge. Tutti i diritti riservati. P. IVA {BUSINESS_INFO.vat}</span>
          <span>Progettazione e sviluppo web: {BUSINESS_INFO.developer}</span>
          <span><a href="/privacy-policy" onClick={(e) => { e.preventDefault(); navigateLegal("privacy"); }}>Privacy Policy</a> · <a href="/cookie-policy" onClick={(e) => { e.preventDefault(); navigateLegal("cookie"); }}>Cookie Policy</a></span>
        </div>
           </footer>

      {/* FLOATING BUTTON - INGRANDITO */}
      {!hideFloatingBtn && (
        <a
          href="/prenota"
          className="floating-btn"
        >
          <Calendar size={22} />
          Prenota ora
        </a>
      )}

    </main>
  );
}

export default App;
