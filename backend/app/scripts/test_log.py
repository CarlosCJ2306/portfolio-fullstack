"""
Módulo: app.scripts.test_log

Script de prueba para validar el sistema de logging del backend.

Este archivo verifica:
- Escritura de logs en consola.
- Escritura de logs en archivo.
- Niveles DEBUG, INFO, SUCCESS, WARNING, ERROR, CRITICAL y DOC.
- Registro de contexto adicional.
- Registro de excepciones con traceback.
- Funcionamiento del context manager log_step().

Uso:
    python -m app.scripts.test_log
"""

from app.core.config import settings
from app.core.log import (
    get_log_file_path,
    log_critical,
    log_debug,
    log_documentation,
    log_error,
    log_exception,
    log_info,
    log_step,
    log_success,
    log_warning,
)


def probar_logs_basicos() -> None:
    """
    Prueba los niveles básicos y personalizados del logger.
    """
    log_debug(
        "Prueba de log DEBUG ejecutada correctamente.",
        modulo="test_log",
        prueba="debug"
    )

    log_info(
        "Prueba de log INFO ejecutada correctamente.",
        modulo="test_log",
        prueba="info"
    )

    log_success(
        "Prueba de log SUCCESS ejecutada correctamente.",
        modulo="test_log",
        prueba="success"
    )

    log_warning(
        "Prueba de log WARNING ejecutada correctamente.",
        modulo="test_log",
        prueba="warning"
    )

    log_documentation(
        "Prueba de log DOC ejecutada correctamente.",
        modulo="test_log",
        prueba="documentation"
    )


def probar_log_error_controlado() -> None:
    """
    Prueba el registro de errores sin detener el script.
    """
    try:
        resultado = 10 / 0
        log_info("Resultado calculado.", resultado=resultado)

    except ZeroDivisionError as error:
        log_error(
            "Error controlado: división por cero detectada.",
            error=error,
            modulo="test_log",
            prueba="error_controlado"
        )


def probar_log_exception() -> None:
    """
    Prueba log_exception dentro de un bloque except.
    """
    try:
        datos = {"nombre": "CJ"}
        valor = datos["correo"]

        log_info("Valor obtenido.", valor=valor)

    except KeyError:
        log_exception(
            "Excepción capturada con log_exception.",
            modulo="test_log",
            prueba="exception_traceback"
        )


def probar_log_step_exitoso() -> None:
    """
    Prueba log_step cuando el proceso termina correctamente.
    """
    with log_step(
        "Proceso de prueba exitoso",
        modulo="test_log",
        tipo="success_step"
    ):
        numeros = [1, 2, 3, 4, 5]
        total = sum(numeros)

        log_info(
            "Suma calculada dentro del proceso.",
            numeros=numeros,
            total=total
        )


def probar_log_step_fallido() -> None:
    """
    Prueba log_step cuando ocurre un error.
    El error se captura para que el script pueda continuar.
    """
    try:
        with log_step(
            "Proceso de prueba fallido",
            modulo="test_log",
            tipo="failed_step"
        ):
            raise ValueError("Error intencional para probar log_step.")

    except ValueError:
        log_warning(
            "El error intencional fue capturado y el script continuó.",
            modulo="test_log",
            prueba="captura_error_intencional"
        )


def mostrar_configuracion_logger() -> None:
    """
    Muestra y registra la configuración actual del logger.
    """
    log_info(
        "Configuración actual del logger.",
        app_name=settings.app_name,
        app_env=settings.app_env,
        app_debug=settings.app_debug,
        log_dir=str(settings.log_dir),
        log_file=settings.log_file,
        log_file_path=get_log_file_path(),
        log_level=settings.log_level,
        log_console=settings.log_console,
        log_max_bytes=settings.log_max_bytes,
        log_backup_count=settings.log_backup_count
    )


def main() -> None:
    """
    Punto de entrada principal del script de prueba.
    """
    log_info("Iniciando prueba general del sistema de logs.")

    mostrar_configuracion_logger()
    probar_logs_basicos()
    probar_log_error_controlado()
    probar_log_exception()
    probar_log_step_exitoso()
    probar_log_step_fallido()

    log_critical(
        "Prueba de log CRITICAL ejecutada correctamente. No representa un fallo real.",
        modulo="test_log",
        prueba="critical_controlado"
    )

    log_success(
        "Prueba general del sistema de logs finalizada correctamente.",
        archivo_log=get_log_file_path()
    )

    print("\nRuta del archivo log:")
    print(get_log_file_path())


if __name__ == "__main__":
    main()