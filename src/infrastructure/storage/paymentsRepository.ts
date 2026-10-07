import AsyncStorage from '@react-native-async-storage/async-storage';

import { Payment, parsePayments } from '@domain/spending/payments';

const PAYMENTS_KEY = 'mood-tracker:payments:v1';

export async function loadPayments(): Promise<Payment[]> {
  const raw = await AsyncStorage.getItem(PAYMENTS_KEY);
  return parsePayments(raw ? JSON.parse(raw) : []);
}

export async function savePayments(payments: Payment[]): Promise<void> {
  await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}
