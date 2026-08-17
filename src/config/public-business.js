import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebase";

export const publicBusinessFallback = Object.freeze({
  businessName: "Medea Beauty Lounge",
  phoneDisplay: "091 6727291",
  whatsappNumber: String(import.meta.env.VITE_MEDEA_WHATSAPP_NUMBER ?? "390916727291").trim(),
  publicEmail: "info@medeabeautylounge.com",
  address: "Via Giorgio D'Antiochia, 6 - Palermo",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Via+Giorgio+D%27Antiochia+6+Palermo",
});

let request;
export function loadPublicBusiness(force = false) {
  if (!request || force) request = getDoc(doc(db, "publicConfig", "business"))
    .then((snapshot) => snapshot.exists() ? { ...publicBusinessFallback, ...snapshot.data() } : publicBusinessFallback)
    .catch(() => publicBusinessFallback);
  return request;
}
