const STYLES = {
  CONFIRMED: "bg-brand-100 text-brand-800",
  PENDING: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-gray-200 text-gray-600 line-through",
};

const LABELS = {
  CONFIRMED: "Confirmado",
  PENDING: "Aguardando aprovação",
  CANCELLED: "Cancelado",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] || ""}`}>
      {LABELS[status] || status}
    </span>
  );
}
