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

function getReadableErrorMessage(error, fallbackMessage) {
  return error?.userMessage || error?.message || fallbackMessage;
}

export default function HomePage() {
  const [homeData, setHomeData] = useState(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeErrorMessage, setHomeErrorMessage] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsErrorMessage, setProjectsErrorMessage] = useState("");
  const [homeRetryKey, setHomeRetryKey] = useState(0);
  const [projectsRetryKey, setProjectsRetryKey] = useState(0);

  const profile = homeData?.profile ?? null;
  const socialLinks = homeData?.social_links ?? [];
  const skills = homeData?.skills ?? [];
  const experiences = homeData?.experience ?? homeData?.experiences ?? [];
  const education = homeData?.education ?? [];
  const certifications = homeData?.certifications ?? [];

  useEffect(() => {
    const controller = new AbortController();

    async function loadHomeData() {
      setHomeLoading(true);
      setHomeErrorMessage("");

      try {
        const data = await getHomeData({ signal: controller.signal });
        setHomeData(data);
      } catch (error) {
        if (error?.isAbortError || error?.name === "AbortError") {
          return;
        }

        console.error("Error cargando informacion principal del portafolio:", error);
        setHomeErrorMessage(
          getReadableErrorMessage(
            error,
            "No se pudo cargar la informacion principal del portafolio."
          )
        );
      } finally {
        if (!controller.signal.aborted) {
          setHomeLoading(false);
        }
      }
    }

    loadHomeData();

    return () => controller.abort();
  }, [homeRetryKey]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjectsData() {
      setProjectsLoading(true);
      setProjectsErrorMessage("");

      try {
        const data = await getProjects({ signal: controller.signal });
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error?.isAbortError || error?.name === "AbortError") {
          return;
        }

        console.error("Error cargando proyectos del portafolio:", error);
        setProjectsErrorMessage(
          getReadableErrorMessage(
            error,
            "No se pudo cargar la seccion de proyectos."
          )
        );
      } finally {
        if (!controller.signal.aborted) {
          setProjectsLoading(false);
        }
      }
    }

    loadProjectsData();

    return () => controller.abort();
  }, [projectsRetryKey]);

  function retryHomeData() {
    setHomeRetryKey((currentValue) => currentValue + 1);
  }

  function retryProjectsData() {
    setProjectsRetryKey((currentValue) => currentValue + 1);
  }

  if (homeLoading && !homeData) {
    return (
      <>
        <Header />

        <main className="page">
          <section className="container">
            <span className="badge">Portfolio CJ</span>
            <h1>Cargando portafolio...</h1>
            <p className="description">
              Consultando la informacion principal desde el backend FastAPI.
            </p>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  if (homeErrorMessage && !homeData) {
    return (
      <>
        <Header />

        <main className="page">
          <section className="container">
            <span className="badge">Error de conexion</span>
            <h1>No se pudo cargar la informacion principal del portafolio</h1>
            <p className="description">{homeErrorMessage}</p>

            <button
              type="button"
              className="project-action-button"
              onClick={retryHomeData}
              disabled={homeLoading}
            >
              {homeLoading ? "Reintentando..." : "Reintentar"}
            </button>
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

        <ProjectsSection
          projects={projects}
          isLoading={projectsLoading}
          errorMessage={projectsErrorMessage}
          onRetry={retryProjectsData}
        />

        <ExperienceSection experiences={experiences} />

        <EducationSection education={education} />

        <CertificationsSection certifications={certifications} />

        <ContactSection profile={profile} />
      </main>

      <Footer />
    </>
  );
}
