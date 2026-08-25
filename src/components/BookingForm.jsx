import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Clock, Mail, MessageSquare, Phone, User } from "lucide-react";

import {
  BOOKING_ERROR_MESSAGES,
  BOOKING_LIMITS,
  buildWhatsAppUrl,
  normalizeBookingEmail,
  normalizeBookingPhone,
  validateBookingContact,
} from "../config/booking";
import { legalConfiguration } from "../config/legal";
import { loadPublicBusiness, publicBusinessFallback } from "../config/public-business";
import {
  loadBookingAvailability,
  loadBookingOptions,
  submitGuestBooking,
} from "../services/booking-service";
import {
  formatItalianDate,
  formatItalianDateTime,
  toCalendarDateValue,
} from "../utils/italian-date";

function createSubmissionId() {
  return globalThis.crypto.randomUUID();
}

function futureDates(maximumBookingDays = 30) {
  const result = [];
  const today = new Date();
  for (let offset = 1; offset <= maximumBookingDays; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    result.push({
      value: toCalendarDateValue(date),
      label: formatItalianDate(date),
    });
  }
  return result;
}

function errorMessage(error) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code.includes("already-exists") || code.includes("failed-precondition")) {
    return BOOKING_ERROR_MESSAGES.slotConflict;
  }
  if (code.includes("resource-exhausted")) return BOOKING_ERROR_MESSAGES.rateLimit;
  if (code.includes("unavailable") || code.includes("network")) {
    return BOOKING_ERROR_MESSAGES.unavailable;
  }
  return BOOKING_ERROR_MESSAGES.submit;
}

function BookingForm({ onSubmit }) {
  const [step, setStep] = useState(1);
  const [options, setOptions] = useState(null);
  const [business, setBusiness] = useState(publicBusinessFallback);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsReload, setSlotsReload] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [slotsError, setSlotsError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState(null);
  const [submissionId] = useState(createSubmissionId);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    needsPhoneCharging: false,
    hasCosmeticAllergies: false,
    allergyDetails: "",
    beveragePreferences: ["none"],
    needsTaxi: false,
    privacyAccepted: false,
    honeypot: "",
  });
  const dates = useMemo(() => futureDates(options?.policy?.maximumBookingDays), [options?.policy?.maximumBookingDays]);

  useEffect(() => { void loadPublicBusiness().then(setBusiness); }, []);

  const reloadOptions = (force = false) => {
    let active = true;
    setLoading(true);
    setOptionsError("");
    loadBookingOptions(force)
      .then((value) => {
        if (active) setOptions(value);
      })
      .catch((loadError) => {
        console.error("Caricamento opzioni prenotazione non riuscito.", loadError);
        if (active) setOptionsError(BOOKING_ERROR_MESSAGES.options);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    let active = true;
    loadBookingOptions()
      .then((value) => {
        if (active) setOptions(value);
      })
      .catch((loadError) => {
        console.error("Caricamento opzioni prenotazione non riuscito.", loadError);
        if (active) setOptionsError(BOOKING_ERROR_MESSAGES.options);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!treatmentId || !date) return undefined;
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setLoadingSlots(true);
        setSlotsError("");
      }
    });
    loadBookingAvailability({
      treatmentId,
      date,
      ...(staffId ? { staffId } : {}),
    })
      .then((value) => {
        if (active) setSlots(value);
      })
      .catch((loadError) => {
        console.error("Caricamento disponibilità non riuscito.", loadError);
        if (active) {
          setSlots([]);
          setSlotsError(BOOKING_ERROR_MESSAGES.slots);
        }
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [date, slotsReload, staffId, treatmentId]);

  const treatment = options?.treatments.find((item) => item.id === treatmentId);
  const selectedStaff = options?.staff.find((item) => item.id === slot?.staffId);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSubmitError("");
  };

  const toggleBeverage = (value) => {
    setForm((current) => {
      if (value === "none") return { ...current, beveragePreferences: ["none"] };
      const selected = current.beveragePreferences.filter((item) => item !== "none");
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      return { ...current, beveragePreferences: next.length ? next : ["none"] };
    });
    setSubmitError("");
  };

  const next = () => {
    setSubmitError("");
    if (step === 1 && !treatmentId) return setSubmitError("Seleziona un trattamento.");
    if (step === 2 && (!date || !slot)) {
      return setSubmitError("Seleziona una data e uno slot disponibile.");
    }
    if (step === 3) {
      const invalid = validateBookingContact(form);
      if (invalid.includes("privacyAccepted")) {
        return setSubmitError("Accetta la Privacy Policy per inviare la richiesta.");
      }
      if (invalid.length) return setSubmitError("Controlla i dati inseriti prima di continuare.");
    }
    if (step === 4 && form.hasCosmeticAllergies && !form.allergyDetails.trim()) {
      return setSubmitError("Specifica le allergie o intolleranze cosmetiche.");
    }
    setStep((current) => Math.min(5, current + 1));
    return undefined;
  };

  const submit = async () => {
    if (!slot || !treatment || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await submitGuestBooking({
        submissionId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: normalizeBookingEmail(form.email),
        phone: normalizeBookingPhone(form.phone),
        message: form.message.trim(),
        treatmentId,
        staffId: slot.staffId,
        startsAt: slot.startsAt,
        experiencePreferences: {
          needsPhoneCharging: form.needsPhoneCharging,
          hasCosmeticAllergies: form.hasCosmeticAllergies,
          ...(form.hasCosmeticAllergies ? { allergyDetails: form.allergyDetails.trim() } : {}),
          beveragePreferences: form.beveragePreferences,
          needsTaxi: form.needsTaxi,
        },
        privacyAccepted: true,
        source: "website",
        honeypot: form.honeypot,
      });
      const lines = [
        "Richiesta di prenotazione",
        treatment.name,
        `Nome: ${form.firstName.trim()} ${form.lastName.trim()}`,
        `Telefono: ${form.phone.trim()}`,
        `Data e ora: ${formatItalianDateTime(new Date(slot.startsAt))}`,
        `Operatore: ${slot.staffName}`,
      ];
      if (form.message.trim()) lines.push(`Note: ${form.message.trim()}`);
      let whatsappUrl = "";
      try {
        whatsappUrl = buildWhatsAppUrl(lines.join("\n"), business.whatsappNumber);
      } catch {
        whatsappUrl = "";
      }
      onSubmit({
        result,
        nome: `${form.firstName.trim()} ${form.lastName.trim()}`,
        telefono: form.phone.trim(),
        tipoLabel: treatment.name,
        trattamento: treatment.name,
        data: formatItalianDate(date),
        ora: new Intl.DateTimeFormat("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
          timeZone: "Europe/Rome",
        }).format(new Date(slot.startsAt)),
        whatsappUrl,
      });
    } catch (submitError) {
      console.error("Invio prenotazione non riuscito.", submitError);
      setSubmitError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="prenota-form booking-form-shell">Caricamento disponibilità…</div>;

  if (optionsError) {
    return (
      <div className="prenota-form booking-form-shell" role="alert">
        <p>{optionsError}</p>
        <button type="button" onClick={() => reloadOptions(true)} style={primaryButton}>Riprova</button>
      </div>
    );
  }

  return (
    <div className="prenota-form booking-form-shell" style={shellStyle}>
      <div aria-label={`Passo ${step} di 5`} style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[1, 2, 3, 4, 5].map((value) => (
          <span key={value} style={{ flex: 1, height: 4, borderRadius: 4, background: value <= step ? "#736357" : "#e3d9d1" }} />
        ))}
      </div>

      {step === 1 && (
        <section>
          <Heading title="Scegli il trattamento" text="Seleziona il servizio e, se vuoi, l’operatore." />
          <Field label="Trattamento *">
            <select className="prenota-input" value={treatmentId} onChange={(event) => { setTreatmentId(event.target.value); setDate(""); setSlots([]); setSlot(null); setSlotsError(""); }}>
              <option value="">Seleziona trattamento…</option>
              {options?.treatments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Operatore (opzionale)">
            <select className="prenota-input" value={staffId} onChange={(event) => { setStaffId(event.target.value); setDate(""); setSlots([]); setSlot(null); setSlotsError(""); }}>
              <option value="">Qualsiasi operatore disponibile</option>
              {options?.staff.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
        </section>
      )}

      {step === 2 && (
        <section>
          <Heading title="Data e ora" text="Gli orari mostrati sono realmente disponibili." />
          <Field label="Data *">
            <select className="prenota-input" value={date} onChange={(event) => { setDate(event.target.value); setSlots([]); setSlot(null); setSlotsError(""); setSubmitError(""); }}>
              <option value="">Seleziona una data…</option>
              {dates.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>
          <div aria-live="polite">
            {loadingSlots ? <p>Caricamento orari…</p> : null}
            {slotsError ? (
              <div role="alert">
                <p>{slotsError}</p>
                <button type="button" onClick={() => setSlotsReload((value) => value + 1)} style={secondaryButton}>Riprova</button>
              </div>
            ) : null}
            {!loadingSlots && date && !slotsError && !slots.length ? <p>Nessuno slot disponibile per questa data.</p> : null}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
              {slots.map((item) => (
                <button key={`${item.staffId}-${item.startsAt}`} type="button" onClick={() => setSlot(item)} style={choiceStyle(slot?.startsAt === item.startsAt)}>
                  <Clock size={16} /> {new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Rome" }).format(new Date(item.startsAt))}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <Heading title="I tuoi dati" text="Inserisci i contatti per ricevere la conferma." />
          <div className="prenota-grid booking-contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label={<><User size={16} /> Nome *</>}><input className="prenota-input" maxLength={BOOKING_LIMITS.firstName} value={form.firstName} onChange={(event) => setField("firstName", event.target.value)} autoComplete="given-name" /></Field>
            <Field label="Cognome *"><input className="prenota-input" maxLength={BOOKING_LIMITS.lastName} value={form.lastName} onChange={(event) => setField("lastName", event.target.value)} autoComplete="family-name" /></Field>
            <Field label={<><Mail size={16} /> Email *</>}><input className="prenota-input" type="email" maxLength={BOOKING_LIMITS.email} value={form.email} onChange={(event) => setField("email", event.target.value)} autoComplete="email" /></Field>
            <Field label={<><Phone size={16} /> Telefono *</>}><input className="prenota-input" type="tel" maxLength={BOOKING_LIMITS.phone} value={form.phone} onChange={(event) => setField("phone", event.target.value)} autoComplete="tel" /></Field>
          </div>
          <Field label={<><MessageSquare size={16} /> Messaggio (opzionale)</>}>
            <textarea className="prenota-input" rows={3} maxLength={BOOKING_LIMITS.message} value={form.message} onChange={(event) => setField("message", event.target.value)} />
          </Field>
          <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={form.honeypot} onChange={(event) => setField("honeypot", event.target.value)} style={{ position: "absolute", left: "-10000px" }} />
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.5 }}>
            <input type="checkbox" checked={form.privacyAccepted} onChange={(event) => setField("privacyAccepted", event.target.checked)} />
            <span>Ho letto la <a href="/privacy-policy">Privacy Policy</a> ({legalConfiguration.privacyVersion}) per inviare la richiesta.</span>
          </label>
        </section>
      )}

      {step === 4 && (
        <section>
          <Heading title="Un ultimo passo" text="Queste informazioni servono solo a preparare questo appuntamento e saranno visibili esclusivamente al personale coinvolto." />
          <ChoiceQuestion label="Hai bisogno di ricaricare il cellulare?" value={form.needsPhoneCharging} onChange={(value) => setField("needsPhoneCharging", value)} />
          <ChoiceQuestion label="Hai allergie o intolleranze a ingredienti cosmetici?" value={form.hasCosmeticAllergies} onChange={(value) => { setField("hasCosmeticAllergies", value); if (!value) setField("allergyDetails", ""); }} />
          {form.hasCosmeticAllergies ? <Field label="Specifica quali *"><textarea className="prenota-input" rows={2} maxLength={BOOKING_LIMITS.allergyDetails} value={form.allergyDetails} onChange={(event) => setField("allergyDetails", event.target.value)} /></Field> : null}
          <Field label="Preferenze bevande"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{[["hot", "Calde"], ["cold", "Fredde"], ["classic", "Classiche"], ["light", "Light"], ["alcoholic", "Alcoliche"], ["none", "Nessuna preferenza"]].map(([value, label]) => <button key={value} type="button" style={choiceStyle(form.beveragePreferences.includes(value))} onClick={() => toggleBeverage(value)}>{label}</button>)}</div></Field>
          <ChoiceQuestion label="Hai bisogno del servizio Taxi?" value={form.needsTaxi} onChange={(value) => setField("needsTaxi", value)} />
          <p style={{ color: "#6d5e57" }}>Servizio esterno convenzionato · 10 € a tratta. Medea non invierà automaticamente i tuoi dati al fornitore.</p>
        </section>
      )}

      {step === 5 && (
        <section>
          <Heading title="Riepilogo" text="Controlla i dati prima di inviare la richiesta." />
          <p><strong>Trattamento:</strong> {treatment?.name}</p>
          <p><strong>Data e ora:</strong> {slot ? formatItalianDateTime(new Date(slot.startsAt)) : ""}</p>
          <p><strong>Operatore:</strong> {selectedStaff?.name ?? slot?.staffName}</p>
          <p><strong>Nome:</strong> {form.firstName.trim()} {form.lastName.trim()}</p>
        </section>
      )}

      {submitError ? <p role="alert" className="prenota-error" style={{ marginTop: 18 }}>{submitError}</p> : null}
      <div className="prenota-buttons booking-button-row" style={{ display: "flex", gap: 12, marginTop: 28 }}>
        {step > 1 ? <button type="button" onClick={() => setStep((value) => value - 1)} style={secondaryButton}><ArrowLeft size={18} /> Indietro</button> : null}
        {step < 5
          ? <button type="button" onClick={next} style={primaryButton}>Continua <ArrowRight size={18} /></button>
          : <button type="button" disabled={submitting} onClick={submit} style={{ ...primaryButton, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Invio…" : "Invia richiesta"}</button>}
      </div>
    </div>
  );
}

function Heading({ title, text }) {
  return <><h3 style={{ fontFamily: "Georgia, serif", fontSize: 28, marginBottom: 8 }}>{title}</h3><p style={{ color: "#6d5e57", marginBottom: 28 }}>{text}</p></>;
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 20 }}><label className="prenota-label">{label}{children}</label></div>;
}

function ChoiceQuestion({ label, value, onChange }) {
  return <Field label={label}><div style={{ display: "flex", gap: 8 }}><button type="button" style={choiceStyle(value)} onClick={() => onChange(true)}>Sì</button><button type="button" style={choiceStyle(!value)} onClick={() => onChange(false)}>No</button></div></Field>;
}

const shellStyle = { background: "#fffaf5", padding: "clamp(24px, 6vw, 48px)", borderRadius: 34, boxShadow: "0 20px 60px rgba(29,23,22,0.08)", border: "1px solid rgba(0,0,0,0.04)", textAlign: "left" };
const primaryButton = { flex: 1, minHeight: 52, borderRadius: 999, border: 0, background: "#736357", color: "#fff", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" };
const secondaryButton = { ...primaryButton, border: "2px solid #1d1716", background: "transparent", color: "#1d1716" };
const choiceStyle = (selected) => ({ minHeight: 48, borderRadius: 16, border: selected ? "2px solid #736357" : "2px solid rgba(0,0,0,0.08)", background: selected ? "rgba(115,99,87,0.1)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" });

export default BookingForm;
