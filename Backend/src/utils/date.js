export const monthLabelFromPeriod = (period) => {
  const [year, month] = String(period || "").split("-").map(Number);
  if (!year || !month) return period;

  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

export const periodFromLabel = (periodLabel) => {
  const parsed = new Date(periodLabel);
  if (Number.isNaN(parsed.getTime())) return "";

  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}`;
};

export const paydayFromPeriod = (period) => `${period}-28`;
