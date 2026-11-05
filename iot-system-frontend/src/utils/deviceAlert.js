const ALERT_PATTERNS = [
  { kind: "gas", pattern: /^Gas detected!\s*Value:\s*(.+)$/i },
  {
    kind: "gas_danger",
    pattern: /^Warning!\s*Gas level exceeded!\s*Value:\s*(.+)$/i,
  },
  { kind: "temp_high", pattern: /^Hot air!\s*(.+?)\s*°C$/i },
  { kind: "humid_low", pattern: /^Dry air!\s*(.+?)\s*%$/i },
  { kind: "humid_high", pattern: /^Damp air!\s*(.+?)\s*%$/i },
];

const KNOWN_ALERT_KINDS = new Set(ALERT_PATTERNS.map(({ kind }) => kind));

export function getDeviceAlertDetails(message, type) {
  const text = typeof message === "string" ? message.trim() : "";

  for (const { kind, pattern } of ALERT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return { kind, value: match[1].trim() };
    }
  }

  const normalizedType = typeof type === "string" ? type.toLowerCase() : "";
  return {
    kind: KNOWN_ALERT_KINDS.has(normalizedType) ? normalizedType : "unknown",
    value: null,
  };
}
