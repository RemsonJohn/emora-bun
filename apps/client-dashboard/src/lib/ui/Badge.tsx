export function Badge({ value = "pending" }: { value?: string }) {
  const positive = [
    "published",
    "captured",
    "completed",
    "fulfilled",
    "active",
  ].includes(value);
  return (
    <span
      className={`badge ${positive ? "positive" : ["draft", "canceled", "failed"].includes(value) ? "neutral" : "pending"}`}
    >
      <span />
      {value === "published"
        ? "Active"
        : value === "captured"
          ? "Paid"
          : value.replaceAll("_", " ")}
    </span>
  );
}
