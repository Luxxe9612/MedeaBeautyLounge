export const BOOKING_LIMITS = Object.freeze({
  firstName: 60,
  lastName: 60,
  email: 254,
  phone: 30,
  message: 1000,
  allergyDetails: 500,
});

export const BOOKING_ERROR_MESSAGES = Object.freeze({
  options: "Le opzioni di prenotazione non sono disponibili. Riprova.",
  slots: "Le disponibilità non sono raggiungibili. Controlla la rete e riprova.",
  submit: "Non è stato possibile inviare la richiesta. Riprova.",
  unavailable: "Connessione non disponibile. Controlla la rete e riprova.",
  rateLimit: "Troppe richieste. Riprova più tardi.",
  slotConflict: "Lo slot non è più disponibile. Scegline un altro.",
});

export const bookingConfiguration = Object.freeze({
  whatsappNumber: String(import.meta.env.VITE_MEDEA_WHATSAPP_NUMBER ?? "").trim(),
  appCheckSiteKey: String(import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY ?? "").trim(),
});

export function normalizeBookingEmail(value) {
  return value.trim().toLocaleLowerCase("it-IT");
}

export function normalizeBookingPhone(value) {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  return `${prefix}${trimmed.replace(/\D/g, "")}`;
}

export function validateBookingContact(form) {
  const invalid = [];
  const email = normalizeBookingEmail(form.email);
  const phone = normalizeBookingPhone(form.phone);
  if (!form.firstName.trim() || form.firstName.trim().length > BOOKING_LIMITS.firstName) {
    invalid.push("firstName");
  }
  if (!form.lastName.trim() || form.lastName.trim().length > BOOKING_LIMITS.lastName) {
    invalid.push("lastName");
  }
  if (
    !email
    || email.length > BOOKING_LIMITS.email
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    invalid.push("email");
  }
  if (phone.length < 7 || phone.length > BOOKING_LIMITS.phone) invalid.push("phone");
  if (form.message.trim().length > BOOKING_LIMITS.message) invalid.push("message");
  if (form.hasCosmeticAllergies && (!form.allergyDetails.trim() || form.allergyDetails.trim().length > BOOKING_LIMITS.allergyDetails)) invalid.push("allergyDetails");
  if (!form.privacyAccepted) invalid.push("privacyAccepted");
  if (form.honeypot !== "") invalid.push("honeypot");
  return invalid;
}

export function buildWhatsAppUrl(message, phoneNumber = bookingConfiguration.whatsappNumber) {
  if (!/^\d{8,15}$/.test(phoneNumber)) {
    throw new Error("Numero WhatsApp non configurato. Confermarlo prima del deploy.");
  }
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
