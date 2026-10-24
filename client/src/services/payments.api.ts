import { api } from "./api";
import type { BookingPaymentDetails, Payment } from "../types/payment";

export interface InitiatePaymentResponse {
  payment: Payment;
  instructions: string;
  checkoutUrl?: string;
}

export async function initiatePayment(bookingId: string, customerPhone: string): Promise<InitiatePaymentResponse> {
  const res = await api.post("/payments/initiate", {
    bookingId,
    customerPhone,
  });
  return res.data.data as InitiatePaymentResponse;
}

export async function getPaymentForBooking(bookingId: string): Promise<BookingPaymentDetails> {
  const res = await api.get(`/payments/booking/${bookingId}`);
  return res.data.data as BookingPaymentDetails;
}

export async function verifyPayment(paymentId: string): Promise<Payment> {
  const res = await api.post(`/payments/${paymentId}/verify`);
  return res.data.data.payment as Payment;
}
