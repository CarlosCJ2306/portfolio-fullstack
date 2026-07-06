import "./AdminMessagesPanel.css";

export default function AdminMessagesPanel({
  contactMessages,
  refreshingMessages,
  onMarkAsRead,
  formatDate,
  panelError,
  panelLoading,
  onRetry,
}) {
  return (
    <article className="admin-card admin-messages-panel">
      <div className="section-header">
        <span className="badge">Mensajes</span>
        <h2>Mensajes de contacto</h2>
      </div>

      {panelError && (
        <div className="form-actions-inline">
          <p className="admin-message error">{panelError}</p>
          {onRetry && (
            <button type="button" className="admin-button ghost" onClick={onRetry} disabled={panelLoading}>
              {panelLoading ? "Reintentando..." : "Reintentar"}
            </button>
          )}
        </div>
      )}

      {!panelError && panelLoading && <p className="muted">Actualizando mensajes...</p>}

      <div className="messages-list">
        {contactMessages.length === 0 ? (
          <p className="muted">No hay mensajes registrados.</p>
        ) : (
          contactMessages.map((message) => (
            <article className={`message-card ${message.is_read ? "read" : "unread"}`} key={message.id}>
              <div className="message-top">
                <div>
                  <strong>{message.name}</strong>
                  <span>{message.email}</span>
                </div>

                <time>{formatDate(message.created_at)}</time>
              </div>

              {message.subject && <p className="message-subject">{message.subject}</p>}
              <p className="message-body">{message.message}</p>

              <div className="message-actions">
                <span className="message-status">{message.is_read ? "Leído" : "Pendiente"}</span>
                {!message.is_read && (
                  <button
                    type="button"
                    className="admin-button secondary"
                    onClick={() => onMarkAsRead(message.id)}
                    disabled={refreshingMessages}
                  >
                    Marcar leído
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </article>
  );
}
