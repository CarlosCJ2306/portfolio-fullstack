import "./AdminMessagesPanel.css";

function sortMessagesForInbox(messages) {
  return [...messages].sort((left, right) => {
    if (left.is_read !== right.is_read) {
      return Number(left.is_read) - Number(right.is_read);
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

export default function AdminMessagesPanel({
  contactMessages,
  markingMessageIds,
  deletingMessageIds,
  onMarkAsRead,
  onDeleteMessage,
  formatDate,
  panelError,
  panelLoading,
  refreshingMessages,
  onRefresh,
  onRetry,
}) {
  const isBusy = panelLoading || refreshingMessages;
  const orderedMessages = sortMessagesForInbox(contactMessages);

  return (
    <article className="admin-card admin-messages-panel">
      <div className="section-header admin-messages-panel__header">
        <div>
          <span className="badge">Mensajes</span>
          <h2>Bandeja de contacto</h2>
          <p className="admin-messages-panel__intro">Los mensajes pendientes aparecen primero para facilitar el seguimiento.</p>
        </div>
        {onRefresh && (
          <button type="button" className="admin-button ghost" onClick={onRefresh} disabled={isBusy}>
            {isBusy ? "Actualizando..." : "Refrescar"}
          </button>
        )}
      </div>

      {panelError && (
        <div className="form-actions-inline">
          <p className="admin-message error">{panelError}</p>
          {onRetry && (
            <button type="button" className="admin-button ghost" onClick={onRetry} disabled={isBusy}>
              {isBusy ? "Reintentando..." : "Reintentar"}
            </button>
          )}
        </div>
      )}

      {!panelError && isBusy && <p className="muted">Actualizando mensajes...</p>}

      <div className="messages-list">
        {orderedMessages.length === 0 ? (
          <p className="muted">No hay mensajes registrados.</p>
        ) : (
          orderedMessages.map((message) => {
            const isMarking = markingMessageIds?.includes(message.id);
            const isDeleting = deletingMessageIds?.includes(message.id);
            const isItemBusy = isMarking || isDeleting;

            return (
              <article className={`message-card ${message.is_read ? "read" : "unread"}`} key={message.id}>
                <div className="message-top">
                  <div className="admin-stack">
                    <strong>{message.name}</strong>
                    <span className="admin-email">{message.email}</span>
                  </div>

                  <div className="admin-meta-row">
                    <span className={`admin-status-pill ${message.is_read ? "is-read" : "is-unread"}`}>
                      {message.is_read ? "Leído" : "Pendiente"}
                    </span>
                    <time>{formatDate(message.created_at)}</time>
                  </div>
                </div>

                {message.subject && <p className="message-subject">{message.subject}</p>}
                <p className="message-body">{message.message}</p>

                <div className="message-actions">
                  <div className="message-actions__buttons">
                    {!message.is_read && (
                      <button
                        type="button"
                        className="admin-button secondary"
                        onClick={() => onMarkAsRead(message.id)}
                        disabled={isItemBusy}
                      >
                        {isMarking ? "Marcando..." : "Marcar leído"}
                      </button>
                    )}
                    {onDeleteMessage && (
                      <button
                        type="button"
                        className="admin-button ghost"
                        onClick={() => onDeleteMessage(message)}
                        disabled={isItemBusy}
                      >
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </article>
  );
}
