import "./AdminToast.css";

export default function AdminToast({ notice }) {
  if (!notice) {
    return null;
  }

  const badgeLabel =
    notice.type === "error"
      ? "Error"
      : notice.type === "warning"
        ? "Aviso"
        : "Guardado";

  return (
    <div className={`admin-toast admin-toast-${notice.type}`} role="status" aria-live="polite">
      <span className="badge">{badgeLabel}</span>
      <strong>{notice.title}</strong>
      {notice.message && <p>{notice.message}</p>}
    </div>
  );
}
