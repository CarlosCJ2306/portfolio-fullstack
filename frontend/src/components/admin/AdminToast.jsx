import "./AdminToast.css";

export default function AdminToast({ notice }) {
  if (!notice) {
    return null;
  }

  return (
    <div className={`admin-toast admin-toast-${notice.type}`} role="status" aria-live="polite">
      <span className="badge">{notice.type === "error" ? "Error" : "Guardado"}</span>
      <strong>{notice.title}</strong>
      {notice.message && <p>{notice.message}</p>}
    </div>
  );
}