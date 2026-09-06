function uniqueRates(values: number[]) {
  return [...new Set(values
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.round(value * 100) / 100))];
}

export function hourlyRatesFromPrice(price: string) {
  const normalized = price
    .replace(/[，,]/g, '')
    .replace(/／/g, '/')
    .replace(/[－–—]/g, '-');
  const rates: number[] = [];

  // Total fee divided by a stated duration, e.g. “550元8小时” or “550/8小时”.
  const totalFeePattern = /(\d+(?:\.\d+)?)\s*元?\s*(?:\/\s*)?(\d+(?:\.\d+)?)\s*(?:个)?小时/gi;
  for (const match of normalized.matchAll(totalFeePattern)) {
    const totalFee = Number(match[1]);
    const hours = Number(match[2]);
    if (hours > 0) rates.push(totalFee / hours);
  }

  // Explicit hourly fees and ranges, e.g. “190/小时”, “250/h”, “170-190一小时”.
  const hourlyPattern = /(\d+(?:\.\d+)?)(?:\s*[-~～至]\s*(\d+(?:\.\d+)?))?\s*元?\s*(?:\/\s*(?:h|小时|课时)|每\s*(?:个)?(?:小时|课时)|一\s*(?:个)?小时)/gi;
  for (const match of normalized.matchAll(hourlyPattern)) {
    rates.push(Number(match[1]));
    if (match[2]) rates.push(Number(match[2]));
  }

  if (rates.length > 0) return uniqueRates(rates);

  // Fall back to numbers inside the price field only. School labels are not prices.
  const withoutSchoolLabels = normalized.replace(/\b(?:985|211)\b/g, '');
  return uniqueRates(withoutSchoolLabels.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? []);
}
