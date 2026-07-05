import "./AdminStatsGrid.css";

export default function AdminStatsGrid({ dashboard }) {
  const stats = dashboard
    ? [
        ["Perfil", dashboard.profile_exists ? "Configurado" : "Pendiente"],
        ["Redes", dashboard.total_social_links],
        ["Skills", dashboard.total_skills],
        ["Proyectos", dashboard.total_projects],
        ["Destacados", dashboard.featured_projects],
        ["Experiencia", dashboard.total_experience],
        ["Educación", dashboard.total_education],
        ["Certificaciones", dashboard.total_certifications],
        ["Mensajes", dashboard.total_contact_messages],
        ["No leídos", dashboard.unread_contact_messages],
      ]
    : [];

  return (
    <section className="admin-grid stats-grid admin-stats-grid">
      {stats.map(([label, value]) => (
        <article className="stat-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}