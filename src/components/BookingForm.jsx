import { useState } from "react";
import { Calendar, User, Mail, Phone, MessageSquare, Sparkles, ChevronDown, ArrowRight, Clock } from "lucide-react";

const TRATTAMENTI = [
  "Epilazione laser",
  "Trattamenti viso",
  "Body shaping",
  "Nails & manicure",
  "Pedicure estetica",
  "Laminazione ciglia",
  "Epilsoft",
  "Addome Sculpt",
  "Skin Lab 360",
];

const ORARI = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

function BookingForm({ onSubmit }) {
  const [step, setStep] = useState(1); // 1=Tipo, 2=Dati, 3=Data/Ora, 4=Riepilogo
  const [tipo, setTipo] = useState(""); // "consulenza" o "trattamento"
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefono: "",
    trattamento: "",
    data: "",
    ora: "",
    messaggio: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcola date disponibili (prossimi 30 giorni)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Salta domenica
      if (date.getDay() !== 0) {
        dates.push({
          value: date.toISOString().split("T")[0],
          label: date.toLocaleDateString("it-IT", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
        });
      }
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1 && !tipo) {
      newErrors.tipo = "Seleziona il tipo di appuntamento";
    }
    if (currentStep === 2) {
      if (!formData.nome.trim()) newErrors.nome = "Inserisci il nome";
      if (!formData.email.trim()) newErrors.email = "Inserisci l'email";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email non valida";
      if (!formData.telefono.trim()) newErrors.telefono = "Inserisci il telefono";
    }
    if (currentStep === 3) {
      if (!formData.trattamento) newErrors.trattamento = "Seleziona un trattamento";
      if (!formData.data) newErrors.data = "Seleziona una data";
      if (!formData.ora) newErrors.ora = "Seleziona un orario";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleTipoSelect = (selectedTipo) => {
    setTipo(selectedTipo);
    setErrors((prev) => ({ ...prev, tipo: "" }));
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);

    // Prepara messaggio WhatsApp
const tipoLabel = tipo === "consulenza" ? `Consulenza Beauty - ${formData.trattamento || "Generale"}` : `Trattamento: ${formData.trattamento}`;

const messaggioTesto = 
  `Richiesta di prenotazione!\n\n` +
  `Dati della prenotazione:\n` +
  `${tipoLabel}\n` +
  `Nome: ${formData.nome}\n` +
  `Telefono: ${formData.telefono}\n` +
  `Data: ${formData.data}\n` +
  `Ora: ${formData.ora}\n` +
  (formData.messaggio ? `Note del cliente: ${formData.messaggio}\n` : "") +
  `\nConfermatemi la prenotazione, grazie!`;

// Codifica correttamente per l'URL
const whatsappMessage = encodeURIComponent(messaggioTesto);

// Link WhatsApp
const whatsappUrl = `https://wa.me/390916727291?text=${whatsappMessage}`;
    onSubmit({
      ...formData,
      tipo,
      tipoLabel,
      whatsappUrl,
    });

    setIsSubmitting(false);
  };

  return (
    <div
      className="prenota-form booking-form-shell"
      style={{
        background: "#fffaf5",
        padding: "48px",
        borderRadius: "34px",
        boxShadow: "0 20px 60px rgba(29,23,22,0.08)",
        border: "1px solid rgba(0,0,0,0.04)",
        textAlign: "left",
      }}
    >
      {/* Step indicator */}
      <div
        className="step-indicator"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "32px",
        }}
      >
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "999px",
              background: s <= step ? "#736357" : "rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* STEP 1: Scegli tipo */}
      {step === 1 && (
        <div>
          <h3
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "28px",
              color: "#1d1716",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            Cosa cerchi?
          </h3>
          <p
            style={{
              textAlign: "center",
              color: "#6d5e57",
              marginBottom: "32px",
            }}
          >
            Scegli il tipo di appuntamento
          </p>

          <div
            className="tipo-grid booking-type-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <button
              className="tipo-card booking-choice-card"
              onClick={() => handleTipoSelect("consulenza")}
              style={{
                padding: "32px 24px",
                borderRadius: "24px",
                border: tipo === "consulenza" ? "2px solid #736357" : "2px solid rgba(0,0,0,0.08)",
                background: tipo === "consulenza" ? "rgba(115,99,87,0.1)" : "white",
                cursor: "pointer",
                transition: "all 0.3s ease",
                textAlign: "center",
              }}
            >
              <Sparkles size={32} color="#736357" style={{ marginBottom: "12px" }} />
              <h4 style={{ fontSize: "20px", color: "#1d1716", marginBottom: "8px" }}>
                Consulenza
              </h4>
              <p style={{ fontSize: "14px", color: "#6d5e57" }}>
                Scopri il percorso beauty perfetto per te
              </p>
            </button>

            <button
              className="tipo-card booking-choice-card"
              onClick={() => handleTipoSelect("trattamento")}
              style={{
                padding: "32px 24px",
                borderRadius: "24px",
                border: tipo === "trattamento" ? "2px solid #736357" : "2px solid rgba(0,0,0,0.08)",
                background: tipo === "trattamento" ? "rgba(115,99,87,0.1)" : "white",
                cursor: "pointer",
                transition: "all 0.3s ease",
                textAlign: "center",
              }}
            >
              <Calendar size={32} color="#736357" style={{ marginBottom: "12px" }} />
              <h4 style={{ fontSize: "20px", color: "#1d1716", marginBottom: "8px" }}>
                Trattamento
              </h4>
              <p style={{ fontSize: "14px", color: "#6d5e57" }}>
                Prenota il tuo trattamento specifico
              </p>
            </button>
          </div>
          {errors.tipo && (
            <p style={{ color: "#e74c3c", fontSize: "14px", textAlign: "center", marginTop: "16px" }}>
              {errors.tipo}
            </p>
          )}

          <button
            onClick={handleNext}
            style={{
              width: "100%",
              marginTop: "32px",
              padding: "18px 32px",
              borderRadius: "999px",
              border: "none",
              background: "#736357",
              color: "#ffffff",
              fontWeight: "900",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            Continua
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 2: Dati personali */}
      {step === 2 && (
        <div>
          <h3
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "28px",
              color: "#1d1716",
              marginBottom: "8px",
            }}
          >
            I tuoi dati
          </h3>
          <p style={{ color: "#6d5e57", marginBottom: "32px" }}>
            Inserisci i tuoi dati per la prenotazione
          </p>

          <div style={{ marginBottom: "20px" }}>
            <label className="prenota-label">
              <User size={16} color="#736357" />
              Nome e Cognome *
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Maria Rossi"
              className="prenota-input"
              style={{ borderColor: errors.nome ? "#e74c3c" : undefined }}
            />
            {errors.nome && <p className="prenota-error">{errors.nome}</p>}
          </div>

          <div
            className="prenota-grid booking-contact-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div>
              <label className="prenota-label">
                <Mail size={16} color="#736357" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="maria@email.it"
                className="prenota-input"
                style={{ borderColor: errors.email ? "#e74c3c" : undefined }}
              />
              {errors.email && <p className="prenota-error">{errors.email}</p>}
            </div>
            <div>
              <label className="prenota-label">
                <Phone size={16} color="#736357" />
                Telefono *
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+39 333 123 4567"
                className="prenota-input"
                style={{ borderColor: errors.telefono ? "#e74c3c" : undefined }}
              />
              {errors.telefono && <p className="prenota-error">{errors.telefono}</p>}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label className="prenota-label">
              <MessageSquare size={16} color="#736357" />
              Note (opzionale)
            </label>
            <textarea
              name="messaggio"
              value={formData.messaggio}
              onChange={handleChange}
              placeholder="Dicci cosa cerchi, eventuali allergie o preferenze..."
              rows={3}
              className="prenota-input"
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="prenota-buttons booking-button-row" style={{ display: "flex", gap: "16px" }}>
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: "18px 32px",
                borderRadius: "999px",
                border: "2px solid #1d1716",
                background: "transparent",
                color: "#1d1716",
                fontWeight: "900",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Indietro
            </button>
            <button
              onClick={handleNext}
              style={{
                flex: 1,
                padding: "18px 32px",
                borderRadius: "999px",
                border: "none",
                background: "#736357",
                color: "#ffffff",
                fontWeight: "900",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              Continua
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Data e Ora */}
      {step === 3 && (
        <div>
          <h3
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "28px",
              color: "#1d1716",
              marginBottom: "8px",
            }}
          >
            Data e Ora
          </h3>
          <p style={{ color: "#6d5e57", marginBottom: "32px" }}>
            Scegli la disponibilità per il tuo appuntamento
          </p>

          {/* Selezione trattamento (sempre richiesto, anche per consulenza) */}
          <div style={{ marginBottom: "24px" }}>
            <label className="prenota-label">
              <Sparkles size={16} color="#736357" />
              {tipo === "consulenza" ? "Trattamento di interesse *" : "Trattamento *"}
            </label>
            <div style={{ position: "relative" }}>
              <select
                name="trattamento"
                value={formData.trattamento}
                onChange={handleChange}
                className="prenota-input"
                style={{
                  borderColor: errors.trattamento ? "#e74c3c" : undefined,
                  appearance: "none",
                  cursor: "pointer",
                }}
              >
                <option value="" disabled>
                  {tipo === "consulenza" ? "Seleziona il trattamento per la consulenza..." : "Seleziona trattamento..."}
                </option>
                {TRATTAMENTI.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown
                size={18}
                color="#736357"
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
            </div>
            {errors.trattamento && <p className="prenota-error">{errors.trattamento}</p>}
          </div>

          {/* Selezione data */}
          <div style={{ marginBottom: "24px" }}>
            <label className="prenota-label">
              <Calendar size={16} color="#736357" />
              Data *
            </label>
            <div
              className="date-grid booking-date-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: "10px",
              }}
            >
              {availableDates.map((date) => (
                <button
                  className="date-card booking-date-card"
                  key={date.value}
                  onClick={() => setFormData((prev) => ({ ...prev, data: date.value }))}
                  style={{
                    padding: "12px 8px",
                    borderRadius: "16px",
                    border: formData.data === date.value ? "2px solid #736357" : "2px solid rgba(0,0,0,0.08)",
                    background: formData.data === date.value ? "rgba(115,99,87,0.1)" : "white",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: "12px", color: "#6d5e57", textTransform: "uppercase" }}>
                    {date.label.split(" ")[0]}
                  </p>
                  <p style={{ fontSize: "18px", fontWeight: "800", color: "#1d1716" }}>
                    {date.label.split(" ")[1]}
                  </p>
                  <p style={{ fontSize: "12px", color: "#6d5e57" }}>
                    {date.label.split(" ")[2]}
                  </p>
                </button>
              ))}
            </div>
            {errors.data && <p className="prenota-error">{errors.data}</p>}
          </div>

          {/* Selezione orario */}
          <div style={{ marginBottom: "24px" }}>
            <label className="prenota-label">
              <Clock size={16} color="#736357" />
              {tipo === "trattamento" ? "Orario preferibile *" : "Orario *"}
            </label>

            {tipo === "trattamento" ? (
              <>
                <input
                  type="time"
                  name="ora"
                  value={formData.ora}
                  onChange={handleChange}
                  min="08:30"
                  max="17:00"
                  className="prenota-input booking-time-input"
                  style={{
                    borderColor: errors.ora ? "#e74c3c" : undefined,
                  }}
                />

                <p
                  style={{
                    fontSize: "16px",
                    color: "#6d5e57",
                    marginTop: "8px",
                    lineHeight: "1.5",
                  }}
                >
                  Inserisci l'orario che preferisci tra le 08:30 e le 17:00 e Medea ti confermerà la disponibilità
                </p>
              </>
            ) : (
              <div
                className="time-grid booking-time-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "10px",
                }}
              >
                {ORARI.map((ora) => (
                  <button
                    className="time-card booking-time-card"
                    key={ora}
                    onClick={() => setFormData((prev) => ({ ...prev, ora }))}
                    style={{
                      padding: "14px",
                      borderRadius: "14px",
                      border: formData.ora === ora ? "2px solid #736357" : "2px solid rgba(0,0,0,0.08)",
                      background: formData.ora === ora ? "rgba(115,99,87,0.1)" : "white",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      fontWeight: "800",
                      fontSize: "14px",
                      color: formData.ora === ora ? "#1d1716" : "#6d5e57",
                    }}
                  >
                    {ora}
                  </button>
                ))}
              </div>
            )}

            {errors.ora && <p className="prenota-error">{errors.ora}</p>}
          </div>

          <div className="prenota-buttons booking-button-row" style={{ display: "flex", gap: "16px" }}>
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: "18px 32px",
                borderRadius: "999px",
                border: "2px solid #1d1716",
                background: "transparent",
                color: "#1d1716",
                fontWeight: "900",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Indietro
            </button>
            <button
              onClick={handleNext}
              style={{
                flex: 1,
                padding: "18px 32px",
                borderRadius: "999px",
                border: "none",
                background: "#736357",
                color: "#ffffff",
                fontWeight: "900",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              Riepilogo
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Riepilogo */}
      {step === 4 && (
        <div>
          <h3
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "28px",
              color: "#1d1716",
              marginBottom: "8px",
            }}
          >
            Conferma prenotazione
          </h3>
          <p style={{ color: "#6d5e57", marginBottom: "32px" }}>
            Controlla i dati e conferma
          </p>

          <div
            className="riepilogo-box booking-summary-box"
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "28px",
              marginBottom: "32px",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: "12px", color: "#6d5e57", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>
                Tipo appuntamento
              </p>
              <p style={{ fontSize: "18px", color: "#1d1716", fontWeight: "800" }}>
                {tipo === "consulenza" ? `Consulenza Beauty - ${formData.trattamento}` : `Trattamento: ${formData.trattamento}`}
              </p>
            </div>
            <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: "12px", color: "#6d5e57", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>
                Data e Ora
              </p>
              <p style={{ fontSize: "18px", color: "#1d1716", fontWeight: "800" }}>
                {formData.data} alle {formData.ora}
              </p>
            </div>
            <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: "12px", color: "#6d5e57", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>
                Dati cliente
              </p>
              <p style={{ fontSize: "16px", color: "#1d1716" }}>{formData.nome}</p>
              <p style={{ fontSize: "14px", color: "#6d5e57" }}>{formData.email}</p>
              <p style={{ fontSize: "14px", color: "#6d5e57" }}>{formData.telefono}</p>
            </div>
            {formData.messaggio && (
              <div>
                <p style={{ fontSize: "12px", color: "#6d5e57", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>
                  Note
                </p>
                <p style={{ fontSize: "14px", color: "#1d1716" }}>{formData.messaggio}</p>
              </div>
            )}
          </div>

          <div className="prenota-buttons booking-button-row" style={{ display: "flex", gap: "16px" }}>
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: "18px 32px",
                borderRadius: "999px",
                border: "2px solid #1d1716",
                background: "transparent",
                color: "#1d1716",
                fontWeight: "900",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Modifica
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: "18px 32px",
                borderRadius: "999px",
                border: "none",
                background: "#736357",
                color: "#ffffff",
                fontWeight: "900",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {isSubmitting ? "Conferma..." : "Conferma Prenotazione"}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingForm;