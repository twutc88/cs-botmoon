import { differenceInHours, differenceInDays } from 'date-fns';

export function calculateLeadStage(
  createdTime: string,
  addPayment: boolean,
  botIsRunning: boolean
): { stage: string; emoji: string; label: string } {
  const now = new Date();
  const created = new Date(createdTime);
  const hoursSinceSignup = differenceInHours(now, created);
  const daysSinceSignup = differenceInDays(now, created);

  if (hoursSinceSignup <= 48) {
    return { stage: 'new', emoji: '🟢', label: 'New' };
  } else if (daysSinceSignup <= 7) {
    if (addPayment) {
      return { stage: 'demo-7d', emoji: '🟡', label: 'Demo 7D' };
    } else {
      return { stage: 'demo-1d', emoji: '🟣', label: 'Demo 1D' };
    }
  } else {
    // After 7 days
    if (addPayment && botIsRunning) {
      return { stage: 'active', emoji: '🔵', label: 'Active user' };
    } else if (addPayment && !botIsRunning) {
      return { stage: 'inactive', emoji: '⚪️', label: 'Inactive user' };
    } else {
      return { stage: 'payment-failed', emoji: '⚫️', label: 'Payment Failed' };
    }
  }
}

