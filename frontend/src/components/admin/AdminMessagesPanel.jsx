import "./AdminMessagesPanel.css";

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

  return (
    <article className="admin-card admin-messages-panel">
      <div className="section-header admin-messages-panel__header">
        <div>
          <span className="badge">Mensajes</span>
          <h2>Mensajes de contacto</h2>
        </div>
        {onRefresh && (
          <button
            type="button"
            className="admin-button ghost"
            onClick={onRefresh}
            disabled={isBusy}
          >
            {isBusy ? "Actualizando..." : "Refrescar"}
          </button>
        )}
      </div>

      {panelError && (
        <div className="form-actions-inline">
          <p className="admin-message error">{panelError}</p>
          {onRetry && (
            <button
              type="button"
              className="admin-button ghost"
              onClick={onRetry}
              disabled={isBusy}
            >
              {isBusy ? "Reintentando..." : "Reintentar"}
            </button>
          )}
        </div>
      )}

      {!panelError && isBusy && <p className="muted">Actualizando mensajes...</p>}

      <div className="messages-list">
        {contactMessages.length === 0 ? (
          <p className="muted">No hay mensajes registrados.</p>
        ) : (
          contactMessages.map((message) => {
            const isMarking = markingMessageIds?.includes(message.id);
            const isDeleting = deletingMessageIds?.includes(message.id);
            const isItemBusy = isMarking || isDeleting;

            return (
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
