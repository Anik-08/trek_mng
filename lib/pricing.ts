export function calculateTrekPrice(
  basePricePerDay: number,
  duration: number,
  participants: number
) {
  const subtotal = basePricePerDay * duration * participants;
  return {
    basePricePerDay,
    duration,
    participants,
    subtotal,
    totalAmount: subtotal,
  };
}
