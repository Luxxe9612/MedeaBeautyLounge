// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BookingForm from "./BookingForm";
import ConfirmModal from "./ConfirmModal";
import {
  BOOKING_LIMITS,
  normalizeBookingEmail,
  normalizeBookingPhone,
  validateBookingContact,
} from "../config/booking";
import { formatItalianDate, formatItalianDateTime } from "../utils/italian-date";
import {
  loadBookingAvailability,
  loadBookingOptions,
  submitGuestBooking,
} from "../services/booking-service";

vi.mock("../services/booking-service", () => ({
  loadBookingAvailability: vi.fn(),
  loadBookingOptions: vi.fn(),
  submitGuestBooking: vi.fn(),
}));

const options = {
  treatments: [{ id: "treatment-a", name: "Trattamento viso", durationMinutes: 60 }],
  staff: [{ id: "staff-a", name: "Operatrice Esempio", roleLabel: "Specialista" }],
  timezone: "Europe/Rome",
  slotMinutes: 15,
};

const slots = [{
  startsAt: "2030-06-19T08:00:00.000Z",
  endsAt: "2030-06-19T09:00:00.000Z",
  staffId: "staff-a",
  staffName: "Operatrice Esempio",
}];

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function reachConfirmationStep(onSubmit = vi.fn()) {
  render(<BookingForm onSubmit={onSubmit} />);
  await screen.findByText("Scegli il trattamento");
  fireEvent.change(screen.getByLabelText("Trattamento *"), { target: { value: "treatment-a" } });
  fireEvent.click(screen.getByRole("button", { name: /continua/i }));
  fireEvent.change(screen.getByLabelText("Data *"), {
    target: { value: screen.getByLabelText("Data *").querySelectorAll("option")[1].value },
  });
  await screen.findByRole("button", { name: /10:00/i });
  fireEvent.click(screen.getByRole("button", { name: /10:00/i }));
  fireEvent.click(screen.getByRole("button", { name: /continua/i }));
  fireEvent.change(screen.getByLabelText("Nome *"), { target: { value: "Maria" } });
  fireEvent.change(screen.getByLabelText("Cognome *"), { target: { value: "Rossi" } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "Maria@Example.com" } });
  fireEvent.change(screen.getByLabelText(/telefono/i), { target: { value: "+39 333 1234567" } });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: /continua/i }));
  await screen.findByText("Riepilogo");
  return onSubmit;
}

beforeEach(() => {
  loadBookingOptions.mockResolvedValue(options);
  loadBookingAvailability.mockResolvedValue(slots);
  submitGuestBooking.mockResolvedValue({
    kind: "guest",
    requestId: "request-a",
    status: "pending",
    duplicate: false,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BookingForm guest", () => {
  it("loads options and slots and confirms a normalized request", async () => {
    const onSubmit = await reachConfirmationStep();
    fireEvent.click(screen.getByRole("button", { name: "Invia richiesta" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(submitGuestBooking).toHaveBeenCalledWith(expect.objectContaining({
      email: "maria@example.com",
      phone: "+393331234567",
      source: "website",
    }));
  });

  it("recovers after a failed options Promise through an explicit retry", async () => {
    loadBookingOptions.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(options);
    render(<BookingForm onSubmit={vi.fn()} />);
    expect(await screen.findByText(/opzioni di prenotazione non sono disponibili/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));
    expect(await screen.findByText("Scegli il trattamento")).toBeTruthy();
    expect(loadBookingOptions).toHaveBeenLastCalledWith(true);
  });

  it("keeps slot errors separate and retries the slot request", async () => {
    loadBookingAvailability
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(slots);
    render(<BookingForm onSubmit={vi.fn()} />);
    await screen.findByText("Scegli il trattamento");
    fireEvent.change(screen.getByLabelText("Trattamento *"), { target: { value: "treatment-a" } });
    fireEvent.click(screen.getByRole("button", { name: /continua/i }));
    fireEvent.change(screen.getByLabelText("Data *"), {
      target: { value: screen.getByLabelText("Data *").querySelectorAll("option")[1].value },
    });
    expect(await screen.findByText(/disponibilità non sono raggiungibili/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));
    expect(await screen.findByRole("button", { name: /10:00/i })).toBeTruthy();
  });

  it("prevents a double submit while the first request is pending", async () => {
    const pending = deferred();
    submitGuestBooking.mockReturnValue(pending.promise);
    await reachConfirmationStep();
    const submit = screen.getByRole("button", { name: "Invia richiesta" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(submitGuestBooking).toHaveBeenCalledTimes(1);
    pending.resolve({ kind: "guest", requestId: "request-a", status: "pending", duplicate: false });
  });

  it("uses backend-compatible limits, validation and normalization", () => {
    expect(BOOKING_LIMITS).toEqual({
      firstName: 60,
      lastName: 60,
      email: 254,
      phone: 30,
      message: 1000,
    });
    expect(normalizeBookingEmail(" Maria@Example.COM ")).toBe("maria@example.com");
    expect(normalizeBookingPhone("+39 333-123 4567")).toBe("+393331234567");
    expect(validateBookingContact({
      firstName: "M".repeat(61),
      lastName: "Rossi",
      email: "invalid",
      phone: "123",
      message: "",
      privacyAccepted: false,
      honeypot: "",
    })).toEqual(expect.arrayContaining(["firstName", "email", "phone", "privacyAccepted"]));
  });

  it("formats dates and times in Italian without persisting formatted strings", () => {
    expect(formatItalianDate("2030-06-19")).toBe("19/06/2030");
    expect(formatItalianDateTime(new Date(slots[0].startsAt))).toBe("19/06/2030, 10:00");
  });

  it("shows WhatsApp only as an optional alternative after confirmation", () => {
    const { rerender } = render(<ConfirmModal data={{
      nome: "Maria Rossi",
      tipoLabel: "Trattamento viso",
      data: "19/06/2030",
      ora: "10:00",
      telefono: "+393331234567",
      whatsappUrl: "https://wa.me/390000000000",
    }} onClose={vi.fn()} />);
    expect(screen.getByText(/in alternativa/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apri WhatsApp" })).toBeTruthy();
    rerender(<ConfirmModal data={{
      nome: "Maria Rossi",
      tipoLabel: "Trattamento viso",
      data: "19/06/2030",
      ora: "10:00",
      telefono: "+393331234567",
      whatsappUrl: "",
    }} onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Apri WhatsApp" })).toBeNull();
    expect(screen.getByText(/richiesta è stata comunque ricevuta/i)).toBeTruthy();
  });

  it("contains explicit responsive safeguards for 320px and 360px layouts", () => {
    const css = readFileSync(resolve(cwd(), "src/App.css"), "utf8");
    expect(css).toMatch(/@media \(max-width: 768px\)/);
    expect(css).toMatch(/grid-template-columns:\s*1fr !important/);
    expect(css).toMatch(/width:\s*100% !important/);
    expect(css).toMatch(/@media \(max-width: 420px\)/);
  });
});
