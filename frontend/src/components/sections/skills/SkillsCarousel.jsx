import { useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import SkillCard from "./SkillCard";

const AUTOPLAY_RESUME_DELAY_MS = 2500;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);

      return () => {
        mediaQuery.removeEventListener("change", updatePreference);
      };
    }

    mediaQuery.addListener(updatePreference);

    return () => {
      mediaQuery.removeListener(updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

export default function SkillsCarousel({ columns = [] }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [userPaused, setUserPaused] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const resumeTimerRef = useRef(null);

  const shouldLoop = columns.length >= 4;
  const plugins = useMemo(() => {
    if (prefersReducedMotion) {
      return [];
    }

    return [
      AutoScroll({
        active: shouldLoop,
        direction: "forward",
        speed: 0.75,
        startDelay: 0,
        playOnInit: false,
        stopOnInteraction: true,
        stopOnMouseEnter: false,
        stopOnFocusIn: false,
      }),
    ];
  }, [prefersReducedMotion, shouldLoop]);

  const autoScrollPlugin = plugins[0] ?? null;
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      containScroll: shouldLoop ? false : "trimSnaps",
      dragFree: true,
      loop: shouldLoop,
      skipSnaps: true,
      watchDrag: true,
    },
    plugins,
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!autoScrollPlugin) {
        return;
      }

      if (document.hidden) {
        autoScrollPlugin.stop();
        return;
      }

      if (!userPaused && canScroll && shouldLoop) {
        autoScrollPlugin.play(0);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoScrollPlugin, canScroll, shouldLoop, userPaused]);

  useEffect(() => {
    if (!emblaApi) {
      return undefined;
    }

    const syncScrollState = () => {
      setCanScroll(emblaApi.canScrollNext() || emblaApi.canScrollPrev());
    };

    syncScrollState();
    emblaApi.on("reInit", syncScrollState);
    emblaApi.on("resize", syncScrollState);
    emblaApi.on("slidesChanged", syncScrollState);

    return () => {
      emblaApi.off("reInit", syncScrollState);
      emblaApi.off("resize", syncScrollState);
      emblaApi.off("slidesChanged", syncScrollState);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!autoScrollPlugin) {
      return undefined;
    }

    if (!canScroll || userPaused || prefersReducedMotion || !shouldLoop) {
      autoScrollPlugin.stop();
      return undefined;
    }

    autoScrollPlugin.play(0);

    return () => {
      autoScrollPlugin.stop();
    };
  }, [autoScrollPlugin, canScroll, prefersReducedMotion, shouldLoop, userPaused]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const stopAndClearResume = () => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }

    autoScrollPlugin?.stop();
  };

  const scheduleResume = () => {
    if (
      !autoScrollPlugin ||
      userPaused ||
      prefersReducedMotion ||
      !canScroll ||
      !shouldLoop
    ) {
      return;
    }

    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = window.setTimeout(() => {
      resumeTimerRef.current = null;
      autoScrollPlugin.play(0);
    }, AUTOPLAY_RESUME_DELAY_MS);
  };

  const handlePauseToggle = () => {
    if (userPaused) {
      setUserPaused(false);
      return;
    }

    stopAndClearResume();
    setUserPaused(true);
  };

  const handlePointerDown = () => {
    stopAndClearResume();
  };

  const handlePointerUp = () => {
    scheduleResume();
  };

  const showMotionControl = canScroll && shouldLoop;

  return (
    <div className="skills-carousel-shell">
      <div className="skills-carousel-toolbar">
        <p className="skills-carousel-note" id="skills-carousel-note">
          Arrastra o desliza para explorar las skills.
        </p>

        {showMotionControl ? (
          <button
            type="button"
            className="skills-carousel-toggle"
            onClick={handlePauseToggle}
            aria-label={
              userPaused
                ? "Reanudar movimiento automático de skills"
                : "Pausar movimiento automático de skills"
            }
          >
            <span className="skills-carousel-toggle__label-full" aria-hidden="true">
              {userPaused ? "Reanudar movimiento" : "Pausar movimiento"}
            </span>
            <span className="skills-carousel-toggle__label-compact" aria-hidden="true">
              {userPaused ? "Reanudar" : "Pausar"}
            </span>
          </button>
        ) : null}
      </div>

      <div
        className="skills-carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="Carrusel de habilidades técnicas"
        aria-describedby="skills-carousel-note"
      >
        <div
          className="skills-carousel__viewport"
          ref={emblaRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="skills-carousel__container">
            {columns.map((column, columnIndex) => (
              <div
                className="skills-carousel__slide"
                key={`skill-column-${columnIndex}`}
              >
                <div className="skills-carousel__column">
                  {column.map((skill) => (
                    <SkillCard
                      key={skill.id ?? `${columnIndex}-${skill.name}`}
                      skill={skill}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
