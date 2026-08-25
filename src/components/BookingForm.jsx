import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";

import {
  BOOKING_ERROR_MESSAGES,
  BOOKING_LIMITS,
  buildWhatsAppUrl,
  normalizeBookingEmail,
  normalizeBookingPhone,
  validateBookingContact,
} from "../config/booking";
import { legalConfiguration } from "../config/legal";
import {
  loadPublicBusiness,
  publicBusinessFallback,
} from "../config/public-business";
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
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  if (
    code.includes("already-exists") ||
    code.includes("failed-precondition")
  ) {
    return BOOKING_ERROR_MESSAGES.slotConflict;
  }

  if (code.includes("resource-exhausted")) {
    return BOOKING_ERROR_MESSAGES.rateLimit;
  }

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

  const dates = useMemo(
    () => futureDates(options?.policy?.maximumBookingDays),
    [options?.policy?.maximumBookingDays],
  );

  useEffect(() => {
    void loadPublicBusiness().then(setBusiness);
  }, []);

  const reloadOptions = (force = false) => {
    let active = true;

    setLoading(true);
    setOptionsError("");

    loadBookingOptions(force)
      .then((value) => {
        if (active) {
          setOptions(value);
        }
      })
      .catch((loadError) => {
        console.error(
          "Caricamento opzioni prenotazione non riuscito.",
          loadError,
        );

        if (active) {
          setOptionsError(BOOKING_ERROR_MESSAGES.options);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  };

  useEffect(() => {
    let active = true;

    loadBookingOptions()
      .then((value) => {
        if (active) {
          setOptions(value);
        }
      })
      .catch((loadError) => {
        console.error(
          "Caricamento opzioni prenotazione non riuscito.",
          loadError,
        );

        if (active) {
          setOptionsError(BOOKING_ERROR_MESSAGES.options);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!treatmentId || !date) {
      return undefined;
    }

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
        if (active) {
          setSlots(value);
        }
      })
      .catch((loadError) => {
        console.error(
          "Caricamento disponibilità non riuscito.",
          loadError,
        );

        if (active) {
          setSlots([]);
          setSlotsError(BOOKING_ERROR_MESSAGES.slots);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingSlots(false);
        }
      });

    return () => {
      active = false;
    };
  }, [date, slotsReload, staffId, treatmentId]);

  const treatment = options?.treatments.find(
    (item) => item.id === treatmentId,
  );

  const selectedStaff = options?.staff.find(
    (item) => item.id === slot?.staffId,
  );

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSubmitError("");
  };

  const toggleBeverage = (value) => {
    setForm((current) => {
      if (value === "none") {
        return {
          ...current,
          beveragePreferences: ["none"],
        };
      }

      const selected = current.beveragePreferences.filter(
        (item) => item !== "none",
      );

      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];

      return {
        ...current,
        beveragePreferences: next.length ? next : ["none"],
      };
    });

    setSubmitError("");
  };

  const next = () => {
    setSubmitError("");

    if (step === 1 && !treatmentId) {
      return setSubmitError("Seleziona un trattamento.");
    }

    if (step === 2 && (!date || !slot)) {
      return setSubmitError(
        "Seleziona una data e uno slot disponibile.",
      );
    }

    if (step === 3) {
      const invalid = validateBookingContact(form);

      if (invalid.includes("privacyAccepted")) {
        return setSubmitError(
          "Accetta la Privacy Policy per inviare la richiesta.",
        );
      }

      if (invalid.length) {
        return setSubmitError(
          "Controlla i dati inseriti prima di continuare.",
        );
      }
    }

    if (
      step === 4 &&
      form.hasCosmeticAllergies &&
      !form.allergyDetails.trim()
    ) {
      return setSubmitError(
        "Specifica le allergie o intolleranze cosmetiche.",
      );
    }

    setStep((current) => Math.min(5, current + 1));

    return undefined;
  };

  const submit = async () => {
    if (!slot || !treatment || submitting) {
      return;
    }

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

          ...(form.hasCosmeticAllergies
            ? {
                allergyDetails: form.allergyDetails.trim(),
              }
            : {}),

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
        `Data e ora: ${formatItalianDateTime(
          new Date(slot.startsAt),
        )}`,
        `Operatore: ${slot.staffName}`,
      ];

      if (form.message.trim()) {
        lines.push(`Note: ${form.message.trim()}`);
      }

      let whatsappUrl = "";

      try {
        whatsappUrl = buildWhatsAppUrl(
          lines.join("\n"),
          business.whatsappNumber,
        );
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
      console.error(
        "Invio prenotazione non riuscito.",
        submitError,
      );

      setSubmitError(errorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="prenota-form booking-form-shell booking-loading">
        Caricamento disponibilità…
      </div>
    );
  }

  if (optionsError) {
    return (
      <div
        className="prenota-form booking-form-shell"
        role="alert"
      >
        <p>{optionsError}</p>

        <button
          type="button"
          onClick={() => reloadOptions(true)}
          style={primaryButton}
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{bookingResponsiveCss}</style>

      <div className="prenota-form booking-form-shell">
        <div
          className="booking-progress"
          aria-label={`Passo ${step} di 5`}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <span
              key={value}
              className={`booking-progress-segment ${
                value <= step
                  ? "booking-progress-segment-active"
                  : ""
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <section className="booking-section">
            <Heading
              title="Scegli il trattamento"
              text="Seleziona il servizio e, se vuoi, l’operatore."
            />

            <div className="booking-medium-content">
              <Field label="Trattamento *">
                <select
                  className="prenota-input"
                  value={treatmentId}
                  onChange={(event) => {
                    setTreatmentId(event.target.value);
                    setDate("");
                    setSlots([]);
                    setSlot(null);
                    setSlotsError("");
                  }}
                >
                  <option value="">
                    Seleziona trattamento…
                  </option>

                  {options?.treatments.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Operatore (opzionale)">
                <select
                  className="prenota-input"
                  value={staffId}
                  onChange={(event) => {
                    setStaffId(event.target.value);
                    setDate("");
                    setSlots([]);
                    setSlot(null);
                    setSlotsError("");
                  }}
                >
                  <option value="">
                    Qualsiasi operatore disponibile
                  </option>

                  {options?.staff.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="booking-section">
            <Heading
              title="Data e ora"
              text="Gli orari mostrati sono realmente disponibili."
            />

            <div className="booking-medium-content">
              <Field label="Data *">
                <select
                  className="prenota-input"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setSlots([]);
                    setSlot(null);
                    setSlotsError("");
                    setSubmitError("");
                  }}
                >
                  <option value="">
                    Seleziona una data…
                  </option>

                  {dates.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div aria-live="polite">
                {loadingSlots ? (
                  <p className="booking-muted">
                    Caricamento orari…
                  </p>
                ) : null}

                {slotsError ? (
                  <div role="alert">
                    <p>{slotsError}</p>

                    <button
                      type="button"
                      onClick={() =>
                        setSlotsReload(
                          (value) => value + 1,
                        )
                      }
                      style={secondaryButton}
                    >
                      Riprova
                    </button>
                  </div>
                ) : null}

                {!loadingSlots &&
                date &&
                !slotsError &&
                !slots.length ? (
                  <p className="booking-muted">
                    Nessuno slot disponibile per questa
                    data.
                  </p>
                ) : null}

                <div className="booking-slot-grid">
                  {slots.map((item) => (
                    <button
                      key={`${item.staffId}-${item.startsAt}`}
                      type="button"
                      onClick={() => setSlot(item)}
                      style={choiceStyle(
                        slot?.startsAt === item.startsAt,
                      )}
                    >
                      <Clock size={16} />

                      {new Intl.DateTimeFormat("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hourCycle: "h23",
                        timeZone: "Europe/Rome",
                      }).format(new Date(item.startsAt))}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="booking-section">
            <Heading
              title="I tuoi dati"
              text="Inserisci i contatti per ricevere la conferma."
            />

            <div className="booking-contact-grid">
              <Field
                label={
                  <>
                    <User size={17} />
                    Nome *
                  </>
                }
              >
                <input
                  className="prenota-input"
                  maxLength={BOOKING_LIMITS.firstName}
                  value={form.firstName}
                  onChange={(event) =>
                    setField(
                      "firstName",
                      event.target.value,
                    )
                  }
                  autoComplete="given-name"
                />
              </Field>

              <Field label="Cognome *">
                <input
                  className="prenota-input"
                  maxLength={BOOKING_LIMITS.lastName}
                  value={form.lastName}
                  onChange={(event) =>
                    setField(
                      "lastName",
                      event.target.value,
                    )
                  }
                  autoComplete="family-name"
                />
              </Field>

              <Field
                label={
                  <>
                    <Mail size={17} />
                    Email *
                  </>
                }
              >
                <input
                  className="prenota-input"
                  type="email"
                  maxLength={BOOKING_LIMITS.email}
                  value={form.email}
                  onChange={(event) =>
                    setField("email", event.target.value)
                  }
                  autoComplete="email"
                />
              </Field>

              <Field
                label={
                  <>
                    <Phone size={17} />
                    Telefono *
                  </>
                }
              >
                <input
                  className="prenota-input"
                  type="tel"
                  maxLength={BOOKING_LIMITS.phone}
                  value={form.phone}
                  onChange={(event) =>
                    setField("phone", event.target.value)
                  }
                  autoComplete="tel"
                />
              </Field>
            </div>

            <div className="booking-contact-wide">
              <Field
                label={
                  <>
                    <MessageSquare size={17} />
                    Messaggio (opzionale)
                  </>
                }
              >
                <textarea
                  className="prenota-input booking-message"
                  rows={4}
                  maxLength={BOOKING_LIMITS.message}
                  value={form.message}
                  onChange={(event) =>
                    setField(
                      "message",
                      event.target.value,
                    )
                  }
                  placeholder="Scrivi qui eventuali richieste o informazioni utili…"
                />
              </Field>

              <input
                aria-hidden="true"
                tabIndex={-1}
                autoComplete="off"
                value={form.honeypot}
                onChange={(event) =>
                  setField(
                    "honeypot",
                    event.target.value,
                  )
                }
                style={{
                  position: "absolute",
                  left: "-10000px",
                }}
              />

              <label className="booking-privacy-row">
                <input
                  type="checkbox"
                  checked={form.privacyAccepted}
                  onChange={(event) =>
                    setField(
                      "privacyAccepted",
                      event.target.checked,
                    )
                  }
                />

                <span>
                  Ho letto la{" "}
                  <a href="/privacy-policy">
                    Privacy Policy
                  </a>{" "}
                  ({legalConfiguration.privacyVersion}) per
                  inviare la richiesta.
                </span>
              </label>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="booking-section booking-experience-step">
            <Heading
              title="Un ultimo passo"
              text="Queste informazioni servono solo a preparare questo appuntamento e saranno visibili esclusivamente al personale coinvolto."
            />

            <div className="booking-experience-grid">
              <PreferenceCard>
                <ChoiceQuestion
                  label="Hai bisogno di ricaricare il cellulare?"
                  value={form.needsPhoneCharging}
                  onChange={(value) =>
                    setField(
                      "needsPhoneCharging",
                      value,
                    )
                  }
                />
              </PreferenceCard>

              <PreferenceCard>
                <ChoiceQuestion
                  label="Hai allergie o intolleranze a ingredienti cosmetici?"
                  value={form.hasCosmeticAllergies}
                  onChange={(value) => {
                    setField(
                      "hasCosmeticAllergies",
                      value,
                    );

                    if (!value) {
                      setField("allergyDetails", "");
                    }
                  }}
                />

                {form.hasCosmeticAllergies ? (
                  <Field label="Specifica quali *">
                    <textarea
                      className="prenota-input"
                      rows={3}
                      maxLength={
                        BOOKING_LIMITS.allergyDetails
                      }
                      value={form.allergyDetails}
                      onChange={(event) =>
                        setField(
                          "allergyDetails",
                          event.target.value,
                        )
                      }
                      placeholder="Indica allergie o intolleranze rilevanti…"
                    />
                  </Field>
                ) : null}
              </PreferenceCard>

              <PreferenceCard>
                <Field label="Preferenze bevande">
                  <div className="booking-beverage-options">
                    {[
                      ["hot", "Calde"],
                      ["cold", "Fredde"],
                      ["classic", "Classiche"],
                      ["light", "Light"],
                      ["alcoholic", "Alcoliche"],
                      ["none", "Nessuna preferenza"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        style={choiceStyle(
                          form.beveragePreferences.includes(
                            value,
                          ),
                        )}
                        onClick={() =>
                          toggleBeverage(value)
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>
              </PreferenceCard>

              <PreferenceCard>
                <ChoiceQuestion
                  label="Hai bisogno del servizio Taxi?"
                  value={form.needsTaxi}
                  onChange={(value) =>
                    setField("needsTaxi", value)
                  }
                />

                <p className="booking-taxi-note">
                  Servizio esterno convenzionato · 10 € a
                  tratta. Medea non invierà
                  automaticamente i tuoi dati al fornitore.
                </p>
              </PreferenceCard>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="booking-section">
            <Heading
              title="Riepilogo"
              text="Controlla i dati prima di inviare la richiesta."
            />

            <div className="booking-summary-grid">
              <SummaryItem
                label="Trattamento"
                value={treatment?.name}
              />

              <SummaryItem
                label="Data e ora"
                value={
                  slot
                    ? formatItalianDateTime(
                        new Date(slot.startsAt),
                      )
                    : ""
                }
              />

              <SummaryItem
                label="Operatore"
                value={
                  selectedStaff?.name ??
                  slot?.staffName
                }
              />

              <SummaryItem
                label="Cliente"
                value={`${form.firstName.trim()} ${form.lastName.trim()}`}
              />
            </div>
          </section>
        )}

        {submitError ? (
          <p
            role="alert"
            className="prenota-error booking-submit-error"
          >
            {submitError}
          </p>
        ) : null}

        <div className="prenota-buttons booking-button-row">
          {step > 1 ? (
            <button
              type="button"
              onClick={() =>
                setStep((value) => value - 1)
              }
              style={secondaryButton}
            >
              <ArrowLeft size={18} />
              Indietro
            </button>
          ) : (
            <span className="booking-button-spacer" />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              style={primaryButton}
            >
              Continua
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              style={{
                ...primaryButton,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting
                ? "Invio…"
                : "Invia richiesta"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Heading({ title, text }) {
  return (
    <div className="booking-heading">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="booking-field">
      <label className="prenota-label booking-field-label">
        {label}
      </label>

      <div className="booking-field-control">
        {children}
      </div>
    </div>
  );
}

function ChoiceQuestion({
  label,
  value,
  onChange,
}) {
  return (
    <div className="booking-choice-question">
      <p className="booking-choice-label">
        {label}
      </p>

      <div className="booking-choice-buttons">
        <button
          type="button"
          style={choiceStyle(value)}
          onClick={() => onChange(true)}
        >
          Sì
        </button>

        <button
          type="button"
          style={choiceStyle(!value)}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
    </div>
  );
}

function PreferenceCard({ children }) {
  return (
    <div className="booking-preference-card">
      {children}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="booking-summary-item">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

const primaryButton = {
  flex: 1,
  minHeight: 56,
  borderRadius: 18,
  border: 0,
  background: "#736357",
  color: "#fff",
  fontWeight: 800,
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  transition:
    "transform .2s ease, opacity .2s ease, background .2s ease",
};

const secondaryButton = {
  ...primaryButton,
  border: "1.5px solid #736357",
  background: "transparent",
  color: "#1d1716",
};

const choiceStyle = (selected) => ({
  minHeight: 48,
  minWidth: 84,
  padding: "0 18px",
  borderRadius: 14,
  border: selected
    ? "1.5px solid #736357"
    : "1.5px solid rgba(29,23,22,0.12)",
  background: selected
    ? "#736357"
    : "#fff",
  color: selected ? "#fff" : "#1d1716",
  fontWeight: 700,
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  cursor: "pointer",
  transition:
    "background .2s ease, color .2s ease, border-color .2s ease, transform .2s ease",
});

const bookingResponsiveCss = `
  .booking-form-shell {
    width: min(1180px, calc(100% - 32px));
    margin: 0 auto;
    padding: clamp(28px, 4vw, 56px);
    border-radius: 34px;
    background: #fffaf5;
    border: 1px solid rgba(29, 23, 22, 0.06);
    box-shadow: 0 24px 70px rgba(29, 23, 22, 0.08);
    color: #1d1716;
    text-align: left;
    box-sizing: border-box;
  }

  .booking-loading {
    text-align: center;
  }

  .booking-progress {
    display: flex;
    gap: 10px;
    width: 100%;
    margin-bottom: 44px;
  }

  .booking-progress-segment {
    flex: 1;
    height: 4px;
    border-radius: 999px;
    background: #e3d9d1;
    transition: background .25s ease;
  }

  .booking-progress-segment-active {
    background: #736357;
  }

  .booking-section {
    width: 100%;
  }

  .booking-heading {
    max-width: 780px;
    margin-bottom: 36px;
  }

  .booking-heading h3 {
    margin: 0 0 10px;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(32px, 3.2vw, 48px);
    font-weight: 500;
    line-height: 1.08;
    letter-spacing: -0.02em;
    color: #1d1716;
  }

  .booking-heading p {
    margin: 0;
    max-width: 720px;
    color: #766961;
    font-size: 16px;
    line-height: 1.65;
  }

  .booking-medium-content {
    max-width: 760px;
  }

  .booking-field {
    margin-bottom: 24px;
  }

  .booking-field-label,
  .booking-choice-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    color: #2b2421;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.35;
    letter-spacing: 0.01em;
  }

  .booking-field-control {
    width: 100%;
  }

  .booking-form-shell .prenota-input {
    width: 100%;
    min-height: 58px;
    padding: 14px 16px;
    border: 1px solid rgba(29, 23, 22, 0.12);
    border-radius: 16px;
    background: #ffffff;
    color: #1d1716;
    font: inherit;
    font-size: 16px;
    outline: none;
    box-sizing: border-box;
    transition:
      border-color .2s ease,
      box-shadow .2s ease,
      background .2s ease;
  }

  .booking-form-shell .prenota-input:focus {
    border-color: #9c8775;
    box-shadow: 0 0 0 4px rgba(115, 99, 87, 0.09);
  }

  .booking-form-shell textarea.prenota-input {
    min-height: 118px;
    resize: vertical;
    line-height: 1.5;
  }

  .booking-contact-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 24px;
    width: 100%;
  }

  .booking-contact-wide {
    width: 100%;
  }

  .booking-message {
    min-height: 140px !important;
  }

  .booking-privacy-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 8px;
    color: #544943;
    font-size: 14px;
    line-height: 1.55;
    cursor: pointer;
  }

  .booking-privacy-row input {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: #736357;
    flex: 0 0 auto;
  }

  .booking-privacy-row a {
    color: #736357;
    font-weight: 700;
  }

  .booking-experience-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
    align-items: stretch;
  }

  .booking-preference-card {
    min-height: 190px;
    padding: 26px;
    border: 1px solid rgba(29, 23, 22, 0.08);
    border-radius: 22px;
    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,.96),
        rgba(250,245,239,.88)
      );
    box-shadow: 0 10px 34px rgba(29, 23, 22, 0.045);
    box-sizing: border-box;
  }

  .booking-preference-card .booking-field:last-child,
  .booking-preference-card .booking-choice-question:last-child {
    margin-bottom: 0;
  }

  .booking-choice-question {
    margin-bottom: 18px;
  }

  .booking-choice-label {
    max-width: 430px;
    margin-bottom: 18px;
    font-size: 16px;
  }

  .booking-choice-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .booking-beverage-options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .booking-taxi-note {
    margin: 18px 0 0;
    color: #766961;
    font-size: 14px;
    line-height: 1.6;
  }

  .booking-slot-grid {
    display: grid;
    grid-template-columns:
      repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
  }

  .booking-summary-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .booking-summary-item {
    min-height: 96px;
    padding: 20px;
    border-radius: 18px;
    border: 1px solid rgba(29, 23, 22, 0.08);
    background: #fff;
  }

  .booking-summary-item span {
    display: block;
    margin-bottom: 7px;
    color: #87776d;
    font-size: 13px;
    font-weight: 700;
  }

  .booking-summary-item strong {
    display: block;
    color: #1d1716;
    font-size: 17px;
    line-height: 1.4;
  }

  .booking-submit-error {
    margin: 24px 0 0;
  }

  .booking-button-row {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-top: 40px;
  }

  .booking-button-spacer {
    display: block;
  }

  .booking-muted {
    color: #766961;
  }

  @media (max-width: 899px) {
    .booking-form-shell {
      width: min(100% - 24px, 760px);
      padding: 32px 24px;
      border-radius: 26px;
    }

    .booking-progress {
      margin-bottom: 32px;
    }

    .booking-heading {
      margin-bottom: 28px;
    }

    .booking-heading h3 {
      font-size: 34px;
    }

    .booking-contact-grid,
    .booking-experience-grid {
      grid-template-columns: 1fr;
    }

    .booking-preference-card {
      min-height: 0;
    }
  }

  @media (max-width: 640px) {
    .booking-form-shell {
      width: calc(100% - 16px);
      padding: 24px 18px;
      border-radius: 22px;
      box-shadow: 0 12px 35px rgba(29, 23, 22, 0.07);
    }

    .booking-progress {
      gap: 6px;
      margin-bottom: 28px;
    }

    .booking-heading h3 {
      font-size: 29px;
    }

    .booking-heading p {
      font-size: 15px;
    }

    .booking-preference-card {
      padding: 20px;
      border-radius: 18px;
    }

    .booking-summary-grid {
      grid-template-columns: 1fr;
    }

    .booking-button-row {
      grid-template-columns: 1fr;
      gap: 10px;
      margin-top: 30px;
    }

    .booking-button-spacer {
      display: none;
    }

    .booking-choice-buttons {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .booking-choice-buttons button {
      width: 100%;
    }

    .booking-beverage-options button {
      flex: 1 1 calc(50% - 10px);
    }
  }

  @media (max-width: 390px) {
    .booking-form-shell {
      width: calc(100% - 12px);
      padding: 22px 15px;
    }

    .booking-beverage-options button {
      flex-basis: 100%;
    }
  }
`;

export default BookingForm;