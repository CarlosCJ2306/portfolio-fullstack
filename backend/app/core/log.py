# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.core.log

Sistema de logging centralizado para el backend del portafolio full stack.

Este módulo permite registrar eventos técnicos del proyecto en consola y archivo,
incluyendo mensajes informativos, advertencias, errores, errores críticos,
mensajes de éxito, documentación técnica y trazas completas de excepciones.

Características:
- Usa la configuración centralizada de `app.core.config`.
- Guarda los logs dentro de la ruta definida en el archivo `.env`.
- Usa rotación de archivos para evitar que el log crezca indefinidamente.
- Evita duplicación de handlers.
- Incluye niveles personalizados: SUCCESS y DOC.
- Permite agregar contexto técnico en formato JSON.
- Incluye `log_step()` para registrar procesos completos.

Ejemplo de uso:
    from app.core.log import log_info, log_success, log_error

    log_info("Iniciando creación de base de datos")
    log_success("Base de datos creada correctamente")

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from __future__ import annotations

import inspect
import json
import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from types import TracebackType
from typing import Any

from app.core.config import settings


# -----------------------------------------------------------------------------
#                          NIVELES PERSONALIZADOS
# -----------------------------------------------------------------------------
# DEBUG    = 10
# INFO     = 20
# WARNING  = 30
# ERROR    = 40
# CRITICAL = 50
#
# Creamos:
# DOC      = 15, entre DEBUG e INFO.
# SUCCESS  = 25, entre INFO y WARNING.

SUCCESS_LEVEL = 25
DOCUMENTATION_LEVEL = 15

logging.addLevelName(SUCCESS_LEVEL, "SUCCESS")
logging.addLevelName(DOCUMENTATION_LEVEL, "DOC")


# -----------------------------------------------------------------------------
#                          CONSTANTES DEL LOGGER
# -----------------------------------------------------------------------------

LOGGER_NAME = "portfolio_backend"

LOG_FORMAT = (
    "%(asctime)s | %(levelname)-8s | %(name)s | "
    "%(filename)s:%(lineno)d | %(message)s"
)

LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


# -----------------------------------------------------------------------------
#                          FUNCIONES INTERNAS
# -----------------------------------------------------------------------------

def _get_log_level() -> int:
    """
    Obtiene el nivel de log configurado desde settings.

    Si el valor configurado no coincide con un nivel válido de logging,
    se usa DEBUG por defecto.

    Returns:
        Nivel de logging como entero.
    """
    return getattr(logging, settings.log_level, logging.DEBUG)


def _safe_json(data: dict[str, Any]) -> str:
    """
    Convierte un diccionario a JSON de forma segura.

    Args:
        data: Diccionario con información adicional.

    Returns:
        Cadena JSON.
    """
    return json.dumps(
        data,
        ensure_ascii=False,
        default=str
    )


def _format_message(message: str, context: dict[str, Any] | None = None) -> str:
    """
    Construye el mensaje final del log.

    Args:
        message: Mensaje principal.
        context: Datos adicionales opcionales.

    Returns:
        Mensaje final formateado.
    """
    if not context:
        return message

    return f"{message} | context={_safe_json(context)}"


def _build_formatter() -> logging.Formatter:
    """
    Crea el formato estándar para consola y archivo.

    Returns:
        Formatter de logging.
    """
    return logging.Formatter(
        fmt=LOG_FORMAT,
        datefmt=LOG_DATE_FORMAT
    )


def _get_exception_info(error: Exception | None):
    """
    Convierte una excepción en información compatible con logging.

    Args:
        error: Excepción capturada.

    Returns:
        Tupla de excepción o None.
    """
    if error is None:
        return None

    return type(error), error, error.__traceback__


def _write_log(
    level: int,
    message: str,
    context: dict[str, Any] | None = None,
    error: Exception | None = None,
    stacklevel: int = 3
) -> None:
    """
    Escribe un log en el logger principal.

    Esta función centraliza la escritura real para evitar repetir código
    en cada función pública.

    Args:
        level: Nivel numérico de logging.
        message: Mensaje principal.
        context: Contexto adicional.
        error: Excepción opcional.
        stacklevel: Nivel de pila para mostrar el archivo real que llamó al log.
    """
    logger = get_logger()

    final_context = dict(context) if context else {}

    if error is not None:
        final_context["exception_type"] = type(error).__name__
        final_context["exception_message"] = str(error)

    logger.log(
        level,
        _format_message(message, final_context),
        exc_info=_get_exception_info(error),
        stacklevel=stacklevel
    )


def _get_caller_location() -> tuple[str, int]:
    """
    Obtiene el archivo y la línea desde donde se llamó a `log_step()`.

    Returns:
        Tupla con nombre del archivo y número de línea.
    """
    current_frame = inspect.currentframe()

    if (
        current_frame is not None
        and current_frame.f_back is not None
    ):
        caller = current_frame.f_back
        return Path(caller.f_code.co_filename).name, caller.f_lineno

    return "desconocido", 0


# -----------------------------------------------------------------------------
#                          CONFIGURACIÓN DEL LOGGER
# -----------------------------------------------------------------------------

def get_logger() -> logging.Logger:
    """
    Obtiene el logger principal del backend.

    Si el logger aún no ha sido configurado, crea sus handlers:
    - Handler de archivo con rotación.
    - Handler de consola, si está habilitado desde el .env.

    Returns:
        Logger configurado del backend.
    """
    logger = logging.getLogger(LOGGER_NAME)

    if getattr(logger, "_portfolio_logger_configured", False):
        return logger

    log_level = _get_log_level()

    logger.setLevel(log_level)
    logger.propagate = False

    settings.log_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    formatter = _build_formatter()

    file_handler = RotatingFileHandler(
        filename=settings.log_file_path,
        maxBytes=settings.log_max_bytes,
        backupCount=settings.log_backup_count,
        encoding="utf-8"
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)

    if settings.log_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        console_handler.setFormatter(formatter)

        logger.addHandler(console_handler)

    logger._portfolio_logger_configured = True

    return logger


# -----------------------------------------------------------------------------
#                          FUNCIONES PÚBLICAS
# -----------------------------------------------------------------------------

def log_debug(message: str, **context: Any) -> None:
    """
    Registra un mensaje de depuración.

    Se usa para información técnica detallada durante desarrollo.

    Args:
        message: Mensaje principal.
        **context: Datos adicionales opcionales.
    """
    _write_log(
        logging.DEBUG,
        message,
        context
    )


def log_info(message: str, **context: Any) -> None:
    """
    Registra un mensaje informativo.

    Se usa para eventos normales del sistema.

    Args:
        message: Mensaje principal.
        **context: Datos adicionales opcionales.
    """
    _write_log(
        logging.INFO,
        message,
        context
    )


def log_success(message: str, **context: Any) -> None:
    """
    Registra un mensaje de éxito.

    Se usa cuando una operación termina correctamente.

    Args:
        message: Mensaje principal.
        **context: Datos adicionales opcionales.
    """
    _write_log(
        SUCCESS_LEVEL,
        message,
        context
    )


def log_warning(message: str, **context: Any) -> None:
    """
    Registra una advertencia.

    Se usa para situaciones que no detienen el sistema,
    pero que conviene revisar.

    Args:
        message: Mensaje principal.
        **context: Datos adicionales opcionales.
    """
    _write_log(
        logging.WARNING,
        message,
        context
    )


def log_error(
    message: str,
    error: Exception | None = None,
    **context: Any
) -> None:
    """
    Registra un error.

    Si recibe una excepción, guarda también el traceback.

    Args:
        message: Mensaje principal.
        error: Excepción capturada.
        **context: Datos adicionales opcionales.
    """
    _write_log(
        logging.ERROR,
        message,
        context,
        error=error
    )


def log_critical(
    message: str,
    error: Exception | None = None,
    **context: Any
) -> None:
    """
    Registra un error crítico.

    Se usa para errores graves que pueden impedir continuar la ejecución.

    Args:
        message: Mensaje principal.
        error: Excepción capturada.
        **context: Datos adicionales opcionales.
    """
    _write_log(
        logging.CRITICAL,
        message,
        context,
        error=error
    )


def log_exception(message: str, **context: Any) -> None:
    """
    Registra una excepción activa dentro de un bloque except.

    Este método debe usarse dentro de un `except`, porque toma
    automáticamente el traceback actual.

    Ejemplo:
        try:
            ...
        except Exception:
            log_exception("Error ejecutando proceso")

    Args:
        message: Mensaje principal.
        **context: Datos adicionales opcionales.
    """
    logger = get_logger()

    logger.exception(
        _format_message(message, context),
        stacklevel=2
    )


def log_documentation(message: str, **context: Any) -> None:
    """
    Registra documentación técnica del proceso.

    Se usa para dejar trazabilidad de decisiones, pasos internos
    o explicaciones relevantes del flujo.

    Args:
        message: Mensaje principal.
        **context: Datos adicionales opcionales.
    """
    _write_log(
        DOCUMENTATION_LEVEL,
        message,
        context
    )


# -----------------------------------------------------------------------------
#                          CONTEXT MANAGER DE PROCESOS
# -----------------------------------------------------------------------------

class LogStep:
    """
    Context manager personalizado para registrar el ciclo de vida de un proceso.

    Uso:
        with log_step("Crear base de datos"):
            Base.metadata.create_all(bind=engine)
    """

    def __init__(
        self,
        step_name: str,
        origin_file: str,
        origin_line: int,
        **context: Any
    ) -> None:
        """
        Inicializa el proceso de logging.

        Args:
            step_name: Nombre descriptivo del proceso.
            origin_file: Archivo desde donde se llamó a log_step().
            origin_line: Línea desde donde se llamó a log_step().
            **context: Datos adicionales opcionales.
        """
        self.step_name = step_name
        self.context = dict(context)

        self.context.setdefault("origin_file", origin_file)
        self.context.setdefault("origin_line", origin_line)

    def __enter__(self) -> "LogStep":
        """
        Registra el inicio del proceso.

        Returns:
            Instancia actual del context manager.
        """
        _write_log(
            logging.INFO,
            f"Iniciando proceso: {self.step_name}",
            self.context,
            stacklevel=3
        )

        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        exc_traceback: TracebackType | None
    ) -> bool:
        """
        Registra el resultado del proceso.

        Si no hubo error, registra SUCCESS.
        Si hubo error, registra ERROR con traceback.

        Args:
            exc_type: Tipo de excepción.
            exc_value: Instancia de la excepción.
            exc_traceback: Traceback de la excepción.

        Returns:
            False para permitir que la excepción siga su flujo normal.
        """
        if exc_value is None:
            _write_log(
                SUCCESS_LEVEL,
                f"Proceso finalizado correctamente: {self.step_name}",
                self.context,
                stacklevel=3
            )

            return False

        error = (
            exc_value
            if isinstance(exc_value, Exception)
            else Exception(str(exc_value))
        )

        _write_log(
            logging.ERROR,
            f"Proceso fallido: {self.step_name}",
            self.context,
            error=error,
            stacklevel=3
        )

        return False


def log_step(
    step_name: str,
    **context: Any
) -> LogStep:
    """
    Crea un context manager para registrar inicio, éxito o error de una operación.

    Esto es útil para scripts como:
    - create_db.py
    - reset_db.py
    - seed_db.py

    Ejemplo:
        with log_step("Crear tablas de base de datos"):
            Base.metadata.create_all(bind=engine)

    Args:
        step_name: Nombre descriptivo del proceso.
        **context: Datos adicionales opcionales.

    Returns:
        Instancia de LogStep.
    """
    origin_file, origin_line = _get_caller_location()

    return LogStep(
        step_name=step_name,
        origin_file=origin_file,
        origin_line=origin_line,
        **context
    )


def get_log_file_path() -> str:
    """
    Devuelve la ruta absoluta del archivo de logs configurado.

    Esta función es útil para scripts de prueba, depuración o validación,
    porque permite confirmar dónde se está guardando físicamente el archivo
    de logs del backend.

    Returns:
        Ruta absoluta del archivo .log como texto.
    """
    return str(settings.log_file_path)