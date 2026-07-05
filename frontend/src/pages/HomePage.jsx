import { useEffect, useState } from "react";
import { getHomeData, getProjects } from "../services/publicApi";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/sections/HeroSection";
import SkillsSection from "../components/sections/SkillsSection";
import ProjectsSection from "../components/sections/ProjectsSection";
import ExperienceSection from "../components/sections/ExperienceSection";
import EducationSection from "../components/sections/EducationSection";
import CertificationsSection from "../components/sections/CertificationsSection";
import ContactSection from "../components/sections/ContactSection";

export default function HomePage() {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const profile = homeData?.profile ?? null;
  const socialLinks = homeData?.social_links ?? [];
  const skills = homeData?.skills ?? [];
  const projects = homeData?.projects ?? homeData?.featured_projects ?? [];
  const experiences = homeData?.experience ?? homeData?.experiences ?? [];
  const education = homeData?.education ?? [];
  const certifications = homeData?.certifications ?? [];

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [data, projectsData] = await Promise.all([
          getHomeData(),
          getProjects(),
        ]);

        setHomeData({
          ...data,
          projects: Array.isArray(projectsData) ? projectsData : [],
        });
      } catch (error) {
        console.error("Error cargando datos del portafolio:", error);
        setErrorMessage(error.message || "No se pudo cargar la informaciÃ³n.");
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  if (loading) {
    return (
      <>
        <Header />

        <main className="page">
          <section className="container">
            <span className="badge">Portfolio CJ</span>

            {/* AquÃ­ debe aparecer un mensaje mientras React espera la respuesta del backend. */}
            <h1>Cargando portafolio...</h1>

            <p className="description">
              Consultando la informaciÃ³n desde el backend FastAPI.
            </p>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  if (errorMessage) {
    return (
      <>
        <Header />

        <main className="page">
          <section className="container">
            <span className="badge">Error de conexiÃ³n</span>

            {/* AquÃ­ debe aparecer un mensaje claro si el frontend no puede consumir la API. */}
            <h1>No se pudo conectar con el backend</h1>

            <p className="description">{errorMessage}</p>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="page">
        <HeroSection profile={profile} socialLinks={socialLinks} />

        <SkillsSection skills={skills} />

        <ProjectsSection projects={projects} />

        <ExperienceSection experiences={experiences} />

        <EducationSection education={education} />

        <CertificationsSection certifications={certifications} />

        <ContactSection profile={profile} />
      </main>

      <Footer />
    </>
  );
}
