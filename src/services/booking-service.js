import { httpsCallable } from "firebase/functions";

import { ensureFirebaseAppCheck, functions } from "../firebase";

const getBookingOptionsCallable = httpsCallable(functions, "getBookingOptions");
const getBookingAvailabilityCallable = httpsCallable(functions, "getBookingAvailability");
const submitBookingRequestCallable = httpsCallable(functions, "submitBookingRequest");

let optionsPromise;

export function loadBookingOptions(force = false) {
  if (!optionsPromise || force) {
    optionsPromise = ensureFirebaseAppCheck()
      .then(() => getBookingOptionsCallable(null))
      .then(({ data }) => data)
      .catch((error) => {
        optionsPromise = undefined;
        throw error;
      });
  }
  return optionsPromise;
}

export async function loadBookingAvailability(input) {
  await ensureFirebaseAppCheck();
  const { data } = await getBookingAvailabilityCallable(input);
  return data.slots;
}

export async function submitGuestBooking(input) {
  await ensureFirebaseAppCheck();
  const { data } = await submitBookingRequestCallable(input);
  return data;
}
