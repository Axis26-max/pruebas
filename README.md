# Pruebas físicas SVA · Academia 8 Islas

Sistema automático de planes de entrenamiento para las pruebas físicas de Agentes del Servicio de Vigilancia Aduanera. El alumno rellena un cuestionario y, sin intervención de la academia, recibe por correo su ficha inicial, su plan semana a semana, autotests mensuales con informe y la semana del examen.

- Cuestionario publicado: https://axis26-max.github.io/pruebas/
- Demostración (envía al momento los 9 correos de un alumno, sin crear alumno real): https://axis26-max.github.io/pruebas/?demo=1

## Arquitectura

```
Moodle (recurso URL o iframe)
        │
        ▼
GitHub Pages (este repositorio, raíz)          Google Apps Script (carpeta apps-script/)
index.html    cuestionario        ──POST──▶    Web App (doPost)  ──▶  Hoja de Google «Academia 8 Islas · Alumnos pruebas físicas»
aviso.html    molestias / cambios                    │                    pestañas: Alumnos · Seguimiento · Avisos · Ajustes
marcas.html   marcas del autotest                    │
reanudar.html volver tras una pausa                  └── temporizador cada hora (procesarPendientes) ──▶ correos (MailApp)
```

- Las páginas son HTML estático, sin dependencias. Envían `{ accion, args }` por POST a la URL del Web App (constante `API` en cada página) y reciben `{ ok, resultado | error }`.
- El Web App es público («Cualquier usuario») y se ejecuta como la cuenta academia8islas@gmail.com.
- Los enlaces de los correos apuntan a `aviso.html`, `marcas.html` y `reanudar.html` de GitHub Pages (`AJUSTES.urlWeb` en `Codigo.gs`). **No renombrar estos archivos.**

## Archivos

| Raíz (GitHub Pages) | Uso |
|---|---|
| `index.html` | Cuestionario inicial. Lleva una copia de `Calculo.gs` entre `<!--CALCULO-INICIO-->` y `<!--CALCULO-FIN-->` para la vista previa de la ficha. |
| `aviso.html` · `marcas.html` · `reanudar.html` | Páginas enlazadas desde los correos (`?id=` del alumno). |

| `apps-script/` (proyecto de Apps Script) | Uso |
|---|---|
| `Codigo.gs` | Entrada (`doGet`, `doPost`), temporizador, estados del alumno, envíos, hoja Ajustes, pruebas (`probarPlanAhora`, `probarParaSocio`). |
| `Calculo.gs` | Funciones puras: ficha inicial, semáforo, fases (Bompa), fechas del plan. |
| `Sesiones.gs` | Construcción de cada semana y sesión. |
| `Correo.gs` | Plantillas HTML de los correos. |
| `Cuestionario.html` · `Aviso.html` · `Marcas.html` | Mismas páginas servidas desde Apps Script (alternativa a GitHub Pages). |
| `Logo.gs` · `Imagenes.gs` | Logo e imágenes de ejercicios en base64 (se adjuntan a los correos). |

## Despliegue de cambios

**Apps Script** (script.google.com, cuenta academia8islas@gmail.com): pegar cada archivo en el del mismo nombre, guardar y publicar con *Implementar → Administrar las implementaciones → lápiz → Nueva versión → Implementar*. Editar la implementación existente (no crear una nueva) para que la URL del Web App no cambie.

**Web**: subir los HTML a la raíz de este repositorio. GitHub Pages publica en 1-2 minutos.

Si se cambia `Calculo.gs`, copiar también su contenido entre los marcadores `CALCULO` de `index.html` y de `apps-script/Cuestionario.html`.

Primera instalación en un proyecto nuevo: ejecutar una vez `instalarAutomatizaciones` (temporizador horario) y después `probarPlanAhora` (6 correos de ejemplo a la cuenta).

## Integración en Moodle

- Recomendado: recurso **URL** → `https://axis26-max.github.io/pruebas/` → Apariencia: *Mostrar en ventana nueva*.
- Alternativa: iframe en un recurso *Página* (GitHub Pages no bloquea el embebido). En móvil se ve mejor en ventana nueva.
- Para probar, usar siempre `?demo=1`. Sin él se crea un alumno real y empiezan los envíos.

## Ajustes (hoja «Ajustes»)

| Celda | Valor | Uso |
|---|---|---|
| B2 | `01/06/2027` | Primer día de pruebas. El afinamiento y el último autotest (al menos 14 días antes) se calculan con esta fecha. Vacía = plan provisional de 26 semanas. |
| B3 | `04/06/2027` | Último día de pruebas: el plan termina ese día. |

Cambiar la fecha no requiere tocar código ni volver a publicar: cada plan se reajusta en su siguiente envío.

## Reglas del plan

- Empieza siempre el lunes siguiente a recibir el plan (llega 48 h después del cuestionario, entre 9:00 y 21:00) y termina el último día de pruebas.
- Semana de test inicial si alguna marca es estimada o antigua, salvo que queden menos de 7 semanas.
- Bloques de 4 semanas con autotest en la última; el último autotest, en la última semana que termina al menos 14 días antes del examen.
- Fases (Bompa): base 25 % (33 % principiantes) → específica → afinamiento (2 últimas semanas). Máximo 2 días duros por semana; sin fuerza los 6 últimos días; nada intenso los 2 últimos.
- Si el alumno no registra marcas del último autotest, el plan final se envía igualmente.
- Inscripciones con el primer lunes posterior al último día de pruebas: se rechazan con un aviso.

## Calendario de correos

| Cuándo | Correo |
|---|---|
| Al enviar el cuestionario | Acuse de recibo |
| A los 2 días | Ficha inicial + plan del mes (primera semana en detalle) |
| Cada viernes, 10:00-19:00 | Detalle de la semana siguiente |
| Viernes antes de la 4.ª semana | Semana de autotest |
| Al terminar el autotest | Recordatorio de marcas (cada 2 días; luego semanal) |
| 2-4 h después de registrar marcas | Informe mensual + plan del mes siguiente |
| Al marcar una molestia | Recomendación prudente; pausa del plan si es seria; aviso a la academia solo con señales de alarma |

## Datos personales

Altura y peso no salen del navegador (solo se calcula el IMC). La hoja guarda nombre, correo, marcas, disponibilidad y respuestas del cuestionario. No subir a este repositorio exportaciones de la hoja.
