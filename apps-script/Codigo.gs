/**
 * Academia 8 Islas · Cuestionario, ficha inicial, plan mensual, semana de cada viernes y autotest
 *
 * Archivos del proyecto de Apps Script:
 *   Codigo.gs (este) · Calculo.gs · Sesiones.gs · Correo.gs · Logo.gs · Imagenes.gs
 *   Cuestionario.html · Aviso.html · Marcas.html
 *
 * Funciona solo, sin que nadie de la academia tenga que intervenir:
 *   1. Cuestionario → acuse de recibo al momento.
 *   2. A los dos días (9:00-21:00): ficha inicial + resumen del plan del mes + primera semana en detalle.
 *   3. Cada viernes: el detalle de la semana siguiente (vídeos, imágenes y botón de molestias).
 *   4. Última semana de cada plan: descarga y autotest. El alumno registra sus 4 marcas (Marcas.html);
 *      a las pocas horas recibe su informe mensual y el plan del mes siguiente recalculado.
 *      Sin marcas no hay plan nuevo: recibe recordatorios.
 *   5. Molestias (Aviso.html): recomendación prudente automática (parar y consultar a fisio o traumatólogo);
 *      si es seria, el plan se pausa y el alumno lo reanuda con el botón «Ya puedo volver a entrenar».
 *      Solo se avisa a la academia si marca una señal de alarma.
 *   6. Cambio de días u horarios (Aviso.html): el plan se rehace solo con los nuevos días.
 *   7. Fecha del examen (hoja Ajustes): pruebas previstas del 1 al 4 de junio de 2027. Cada alumno empieza el
 *      lunes siguiente a recibir su plan y termina el viernes 4 de junio: fases, afinamiento y último autotest
 *      (14 días antes del 1 de junio como mínimo) se calculan desde el día en que se incorpora. Si la fecha
 *      cambia, se corrige en la hoja y cada plan se reajusta en su siguiente envío.
 *   8. Recta final: tras el último autotest, el plan de afinamiento y la semana del examen llegan aunque el
 *      alumno no haya registrado sus marcas (con las que ya tenemos), para que nadie se quede sin él.
 * Un temporizador revisa la hoja "Seguimiento" cada hora (se instala una vez con instalarAutomatizaciones).
 *
 * Publicación: Implementar → Administrar las implementaciones → lápiz → Nueva versión.
 */

const AJUSTES = {
  remitente: 'Academia 8 Islas',
  urlWeb: 'https://axis26-max.github.io/pruebas/', // web pública (GitHub Pages) con las páginas; vacío = usar las de Apps Script
  urlWebApp: 'https://script.google.com/macros/s/AKfycbzLHjIWWOFcees8gpbKrwIVqvzaqKJmZZijuF4sYjWlkrPLwpHvSX1L1L61qVqk1UIT/exec',
  copiaAcademia: false,    // true = la academia recibe copia oculta de todos los correos
  horasHastaPlan: 48,      // el primer plan llega a los dos días del cuestionario
  horaMin: 9, horaMax: 21, // horario de envío
  viernesHoraMin: 10, viernesHoraMax: 19, // la semana siguiente sale el viernes entre estas horas
  semanasPorPlan: 4,       // cada plan mensual son 4 semanas (la última, de autotest)
  maxRecordatorios: 4,     // recordatorios de marcas cada 2 días; después, uno por semana
  hoja: 'Alumnos', hojaSeguimiento: 'Seguimiento', hojaAvisos: 'Avisos', hojaAjustes: 'Ajustes',
};
const COL = { alta: 1, nombre: 2, correo: 3, estado: 4, envio: 5, ref: 6, semana: 7, planHasta: 8, datos: 9, incidencias: 10, id: 11, recordatorios: 12 };
const DIA = 86400000;

function doGet(e) {
  const p = (e && e.parameter) || {};
  const vista = function (archivo, id, titulo) {
    const fila = buscarFila_(id), t = HtmlService.createTemplateFromFile(archivo);
    t.id = id; t.nombre = fila ? fila.valores[COL.nombre - 1] : '';
    return t.evaluate().setTitle(titulo + ' · Academia 8 Islas').addMetaTag('viewport', 'width=device-width, initial-scale=1');
  };
  if (p.aviso) return vista('Aviso', p.aviso, 'Avisar de una molestia o un cambio');
  if (p.marcas) return vista('Marcas', p.marcas, 'Registrar mis marcas');
  if (p.reanudar) return HtmlService.createHtmlOutput(paginaSimple_(reanudar_(p.reanudar))).setTitle('Academia 8 Islas').addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return HtmlService.createHtmlOutputFromFile('Cuestionario').setTitle('Cuestionario inicial · Academia 8 Islas').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Entrada para la web pública (GitHub Pages): las páginas envían { accion, args } y reciben { ok, resultado | error }.
 * Así las páginas no se abren dentro de Google y funcionan en cualquier móvil, con o sin cuentas de Google.
 */
function doPost(e) {
  let r;
  try {
    const p = JSON.parse(e.postData.contents);
    const acciones = {
      procesarCuestionario: procesarCuestionario,
      registrarAviso: registrarAviso,
      registrarMarcas: registrarMarcas,
      reanudar: function (id) { return { texto: reanudar_(id) }; },
      nombre: function (id) { const f = buscarFila_(id); return { nombre: f ? f.valores[COL.nombre - 1] : '' }; },
    };
    if (!acciones[p.accion]) throw new Error('Acción no válida.');
    r = { ok: true, resultado: acciones[p.accion].apply(null, p.args || []) };
  } catch (err) {
    r = { ok: false, error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
}

/** Recibe el cuestionario. Altura y peso nunca llegan aquí; el IMC tampoco se guarda. */
function procesarCuestionario(d) {
  cargarAjustes_();
  if (!d || !d.email || !d.declaracion || !d.proteccionDatos || !d.veraces) throw new Error('Faltan datos obligatorios.');
  if (!(d.marcas || []).every(function (m) { return m.marca && !m.nunca; })) throw new Error('Necesitamos una marca de referencia de las cuatro pruebas.');
  delete d.imc;
  d.marcasIniciales = d.marcas;
  const ahora = new Date();
  const fPrev = Calculo.ficha(d, new Date(ahora.getTime() + AJUSTES.horasHastaPlan * 3600000));
  if (!fPrev.provisional && fPrev.planIni > fPrev.finExamen) throw new Error('La preparación para las pruebas físicas de esta convocatoria (' + fPrev.textoExamen + ') ya ha terminado. Escríbenos y te avisamos para la próxima.');
  if (d.demo) { demo_(d); return { ok: true, demo: true }; } // enlace ...exec?demo=1: recorrido completo al momento
  guardarFila_(d, Calculo.ficha(d, ahora));
  hojaSeguimiento_().appendRow([ahora, d.nombre, d.email, 'pendiente', programar_(new Date(ahora.getTime() + AJUSTES.horasHastaPlan * 3600000)),
    '', '', '', JSON.stringify(d), '', Utilities.getUuid(), 0]);
  enviar_(d.email, 'Hemos recibido tu cuestionario', Correo.htmlAcuse(d), [], false);
  return { ok: true };
}

/** Lo ejecuta el temporizador cada hora. */
function procesarPendientes() {
  cargarAjustes_();
  const hoja = hojaSeguimiento_(), filas = hoja.getDataRange().getValues(), ahora = new Date();
  for (let i = 1; i < filas.length; i++) {
    const r = filas[i], estado = r[COL.estado - 1], cuando = r[COL.envio - 1];
    if (!cuando || ahora < new Date(cuando) || ['pausado', 'terminado', 'inactivo'].indexOf(estado) >= 0) continue;
    const fila = i + 1, id = r[COL.id - 1], set = function (col, v) { hoja.getRange(fila, col).setValue(v); };
    try {
      const d = JSON.parse(r[COL.datos - 1]);
      if (estado === 'pendiente') {
        const f = Calculo.ficha(d, ahora), n0 = f.test ? 0 : 1, fin = finBloque_(f, 1);
        d.planIni = Utilities.formatDate(f.planIni, Session.getScriptTimeZone(), 'yyyy-MM-dd'); d.conTest = !!f.test; set(COL.datos, JSON.stringify(d)); // fija el inicio del plan
        enviar_(d.email, 'Tu ficha inicial · Academia 8 Islas', Correo.htmlFichaCorreo(d, f, 'cid:logo'), []);
        enviarInicioPlan_(d, f, n0, fin, id, false);
        set(COL.estado, 'activo'); set(COL.ref, ahora); set(COL.semana, n0); set(COL.planHasta, fin); set(COL.envio, viernesAntes_(f, n0 + 1));
      } else if (estado === 'activo') {
        const f = Calculo.ficha(d, new Date(r[COL.ref - 1]), d.bloqueDesde || undefined), planHasta = ajustarBloque_(f, Number(r[COL.planHasta - 1]), desdeDe_(d, f));
        if (planHasta !== Number(r[COL.planHasta - 1])) set(COL.planHasta, planHasta);
        const w = Math.max(Number(r[COL.semana - 1]) + 1, semanaProxima_(f, ahora));
        if (w > f.semanas) { set(COL.estado, 'terminado'); continue; }
        if (w <= planHasta) {
          const sem = Sesiones.semana(d, f, w, { autotest: w === autotestDe_(f, desdeDe_(d, f), planHasta) }), c = Correo.htmlSemanaDetalle(d, sem, urlDe_('aviso', id), urlDe_('marcas', id));
          enviar_(d.email, (sem.descarga ? 'Tu semana de autotest' : 'Tu semana ' + w + ' de entrenamiento') + ' · Academia 8 Islas', c.html, c.imagenes);
          set(COL.semana, w); set(COL.envio, viernesAntes_(f, w + 1));
        } else {
          enviar_(d.email, 'Registra tus marcas del autotest · Academia 8 Islas', Correo.htmlRecordatorioMarcas(d, urlDe_('marcas', id)), []);
          set(COL.estado, 'esperando marcas'); set(COL.recordatorios, 1); set(COL.envio, programar_(new Date(ahora.getTime() + 2 * DIA)));
        }
      } else if (estado === 'esperando marcas') {
        // Recta final: tras el último autotest, el afinamiento y la semana del examen no esperan a las marcas.
        const ref = new Date(r[COL.ref - 1]), planHasta = Number(r[COL.planHasta - 1]), f = Calculo.ficha(d, ref, d.bloqueDesde || undefined);
        if (!f.provisional && planHasta >= f.ultimoTest && planHasta < f.semanas) {
          const inicio = Math.max(planHasta + 1, semanaProxima_(f, ahora));
          if (inicio > f.semanas) { set(COL.estado, 'terminado'); continue; }
          const fNew = Calculo.ficha(d, ref, inicio);
          d.bloqueDesde = inicio;
          enviarInicioPlan_(d, fNew, inicio, fNew.semanas, id, true);
          set(COL.datos, JSON.stringify(d)); set(COL.estado, 'activo'); set(COL.semana, inicio); set(COL.planHasta, fNew.semanas); set(COL.recordatorios, 0); set(COL.envio, viernesAntes_(fNew, inicio + 1));
          continue;
        }
        const n = Number(r[COL.recordatorios - 1]) + 1;
        if (n > AJUSTES.maxRecordatorios + 6) { set(COL.estado, 'inactivo'); continue; } // ≈2 meses sin marcas: se deja de escribir
        enviar_(d.email, 'Recuerda registrar tus marcas · Academia 8 Islas', Correo.htmlRecordatorioMarcas(d, urlDe_('marcas', id)), []);
        set(COL.recordatorios, n); set(COL.envio, programar_(new Date(ahora.getTime() + (n < AJUSTES.maxRecordatorios ? 2 : 7) * DIA)));
      } else if (estado === 'marcas recibidas' && d.soloInforme) {
        const ref = new Date(r[COL.ref - 1]), dPrev = Object.assign({}, d, { marcas: d.marcasPrevias }), dIni = Object.assign({}, d, { marcas: d.marcasIniciales });
        enviar_(d.email, 'Tu informe mensual · Pruebas físicas SVA · Academia 8 Islas', Correo.htmlInforme(d, Calculo.ficha(dPrev, ref, d.bloqueDesde || undefined), Calculo.ficha(d, ref, d.bloqueDesde || undefined), Calculo.ficha(dIni, ref), mesEs_(ahora)), []);
        const envio = d.envioTras ? new Date(d.envioTras) : ahora;
        delete d.soloInforme; delete d.envioTras;
        set(COL.datos, JSON.stringify(d)); set(COL.estado, 'activo'); set(COL.envio, envio);
      } else if (estado === 'marcas recibidas') {
        const ref = new Date(r[COL.ref - 1]), planHasta = Number(r[COL.planHasta - 1]);
        const dPrev = Object.assign({}, d, { marcas: d.marcasPrevias }), dIni = Object.assign({}, d, { marcas: d.marcasIniciales });
        const fBase = Calculo.ficha(d, ref), inicio = Math.max(planHasta + 1, semanaProxima_(fBase, ahora));
        const fPrev = Calculo.ficha(dPrev, ref, d.bloqueDesde || undefined), fIni = Calculo.ficha(dIni, ref);
        const fNew = Calculo.ficha(d, ref, inicio);
        enviar_(d.email, 'Tu informe mensual · Pruebas físicas SVA · Academia 8 Islas', Correo.htmlInforme(d, fPrev, fNew, fIni, mesEs_(ahora)), []);
        if (inicio > fNew.semanas) { set(COL.estado, 'terminado'); continue; }
        const fin = finBloque_(fNew, inicio);
        d.bloqueDesde = inicio;
        enviarInicioPlan_(d, fNew, inicio, fin, id, true);
        set(COL.datos, JSON.stringify(d)); set(COL.estado, d.esPrueba ? 'terminado' : 'activo'); set(COL.semana, inicio); set(COL.planHasta, fin); set(COL.envio, viernesAntes_(fNew, inicio + 1));
      }
    } catch (e) {
      set(COL.incidencias, 'Error ' + Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'dd/MM HH:mm') + ': ' + e.message);
    }
  }
}

/** Instala (una sola vez) el temporizador que revisa la hoja cada hora. */
function instalarAutomatizaciones() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'procesarPendientes') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('procesarPendientes').timeBased().everyHours(1).create();
  Logger.log('Temporizador instalado: procesarPendientes cada hora.');
}

// ───── Marcas del autotest ─────
/** Lo llama Marcas.html. */
function registrarMarcas(id, marcas) {
  const fila = buscarFila_(id);
  if (!fila) throw new Error('No encontramos tu plan. Responde a nuestro último correo y te ayudamos.');
  if (!marcas || marcas.length !== 4 || !marcas.every(function (m) { return m.marca && m.medicion && m.fecha; })) throw new Error('Necesitamos las cuatro marcas.');
  cargarAjustes_();
  const d = JSON.parse(fila.valores[COL.datos - 1]);
  // Marcas que llegan cuando ya tiene el plan de la recta final: solo se envía el informe y el plan sigue igual.
  if (fila.valores[COL.estado - 1] === 'activo') {
    const f = Calculo.ficha(d, new Date(fila.valores[COL.ref - 1]), d.bloqueDesde || undefined);
    if (!f.provisional && Number(fila.valores[COL.planHasta - 1]) >= f.semanas) { d.soloInforme = true; d.envioTras = fila.valores[COL.envio - 1]; }
  }
  d.marcasPrevias = d.marcas; d.marcas = marcas;
  (d.historial = d.historial || []).push({ fecha: new Date().toISOString().slice(0, 10), marcas: marcas });
  const hoja = hojaSeguimiento_();
  hoja.getRange(fila.fila, COL.datos).setValue(JSON.stringify(d));
  hoja.getRange(fila.fila, COL.estado).setValue('marcas recibidas');
  hoja.getRange(fila.fila, COL.envio).setValue(programar_(new Date(Date.now() + (2 + Math.random() * 2) * 3600000)));
  return { ok: true };
}

// ───── Avisos: molestias y cambios de días ─────
/** Lo llama Aviso.html. Devuelve la recomendación que ve el alumno. */
function registrarAviso(id, a) {
  cargarAjustes_();
  const fila = buscarFila_(id);
  if (!fila) throw new Error('No encontramos tu plan. Responde a nuestro último correo y te ayudamos.');
  const nombre = fila.valores[COL.nombre - 1], email = fila.valores[COL.correo - 1], hoja = hojaSeguimiento_();
  const ahora = new Date(), nota = function (t) { hoja.getRange(fila.fila, COL.incidencias).setValue('Aviso ' + Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'dd/MM HH:mm') + ': ' + t); };
  if (a.tipo === 'Cambiar días u horarios') {
    const d = JSON.parse(fila.valores[COL.datos - 1]);
    d.franjas = a.franjas; d.minutosSesion = a.minutos || d.minutosSesion;
    hoja.getRange(fila.fila, COL.datos).setValue(JSON.stringify(d));
    hojaAvisos_().appendRow([ahora, nombre, email, a.tipo, '', '', '', '', (a.franjas || []).join('; ') + ' · ' + a.minutos + ' min. ' + (a.texto || ''), 'Plan rehecho con los nuevos días', 'No']);
    nota('cambio de días');
    // Reenvía la semana en curso con los nuevos días (si aún le quedan días por delante)
    const estado = fila.valores[COL.estado - 1], w = Number(fila.valores[COL.semana - 1]);
    if (estado === 'activo' && w) {
      const f = Calculo.ficha(d, new Date(fila.valores[COL.ref - 1]), d.bloqueDesde || undefined);
      const sem = Sesiones.semana(d, f, w, { autotest: w === autotestDe_(f, desdeDe_(d, f), ajustarBloque_(f, Number(fila.valores[COL.planHasta - 1]), desdeDe_(d, f))) });
      if (sem.domingo.getTime() + DIA > ahora.getTime()) {
        const c = Correo.htmlSemanaDetalle(d, sem, urlDe_('aviso', id), urlDe_('marcas', id));
        enviar_(email, 'Tu semana actualizada con tus nuevos días · Academia 8 Islas', c.html, c.imagenes);
      }
    }
    return { urgente: false, titulo: 'Plan actualizado', texto: 'Hemos rehecho tu plan con tus nuevos días y horarios. Te acabamos de enviar la semana actualizada y las siguientes llegarán ya con estos días.' };
  }
  const rec = recomendacion_(a);
  hojaAvisos_().appendRow([ahora, nombre, email, a.tipo, a.zona, a.dolor, a.impide, (a.alarmas || []).join(', '), a.texto, rec.titulo, rec.pausa ? 'Sí' : 'No']);
  const pausa = rec.pausa && ['activo', 'esperando marcas'].indexOf(fila.valores[COL.estado - 1]) >= 0;
  if (pausa) hoja.getRange(fila.fila, COL.estado).setValue('pausado');
  nota(a.tipo + (a.zona ? ' · ' + a.zona : '') + (pausa ? ' · PLAN PAUSADO' : ''));
  enviar_(email, rec.titulo + ' · Academia 8 Islas', Correo.htmlRecomendacion(nombre, rec, rec.pausa ? urlDe_('reanudar', id) : ''), [], false);
  if (rec.urgente) MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(), name: AJUSTES.remitente, subject: '⚠️ Señal de alarma · ' + nombre,
    htmlBody: '<p><b>' + nombre + '</b> (' + email + ') ha marcado una señal de alarma: <b>' + a.alarmas.join(', ') + '</b>.</p><p>Zona: ' + (a.zona || '—') + ' · Dolor: ' + a.dolor + '/10 · Comentario: ' + (a.texto || '—') + '</p><p>Se le ha recomendado parar y acudir hoy a un servicio médico, y su plan está en pausa.</p>',
  });
  return { urgente: rec.urgente, titulo: rec.titulo, texto: rec.texto };
}

/** Respuesta prudente y siempre igual. No es un diagnóstico: ante cualquier molestia, parar y consultar. */
function recomendacion_(a) {
  const pie = ' Esta recomendación es general y no sustituye la valoración de un profesional sanitario.';
  if ((a.alarmas || []).length) return { urgente: true, pausa: true, titulo: 'Para el entrenamiento y busca atención médica hoy',
    texto: 'Has marcado: ' + a.alarmas.join(', ').toLowerCase() + '. Detén cualquier entrenamiento y acude hoy a un servicio médico o a urgencias (si es grave, llama al 112). Hemos puesto tu plan en pausa; cuando un médico te dé el visto bueno, pulsa «Ya puedo volver a entrenar» en este correo.' + pie };
  const pausa = Number(a.dolor) >= 5 || a.impide === 'Sí';
  return { urgente: false, pausa: pausa, titulo: pausa ? 'Para de entrenar hasta que te valore un profesional' : 'Para los ejercicios que cargan esa zona',
    texto: 'Gracias por avisarnos. Para evitar que la molestia en ' + String(a.zona).toLowerCase() + ' vaya a más, deja de hacer los ejercicios y las pruebas que cargan esa zona hasta que te valore un fisioterapeuta o un traumatólogo. ' +
      (pausa ? 'Por lo que nos cuentas, hemos puesto tu plan en pausa: no entrenes hasta tener esa valoración. Cuando tengas el visto bueno, pulsa «Ya puedo volver a entrenar» en este correo y seguimos.' : 'Puedes seguir con las sesiones que no te produzcan ningún dolor; si alguna te duele, para. Si la molestia no mejora, vuelve a avisarnos.') + pie };
}

/** Botón «Ya puedo volver a entrenar»: reactiva el plan y en menos de una hora le llega su semana. */
function reanudar_(id) {
  cargarAjustes_();
  const fila = buscarFila_(id);
  if (!fila) return 'No encontramos tu plan. Responde a nuestro último correo y te ayudamos.';
  if (fila.valores[COL.estado - 1] !== 'pausado') return 'Tu plan ya está activo. Sigue con tu semana de entrenamiento.';
  const hoja = hojaSeguimiento_(), d = JSON.parse(fila.valores[COL.datos - 1]);
  const f = Calculo.ficha(d, new Date(fila.valores[COL.ref - 1]), d.bloqueDesde || undefined);
  hoja.getRange(fila.fila, COL.estado).setValue('activo');
  hoja.getRange(fila.fila, COL.semana).setValue(semanaProxima_(f, new Date()) - 1);
  hoja.getRange(fila.fila, COL.envio).setValue(new Date());
  return '¡Nos alegramos de que puedas volver! En menos de una hora te llegará tu semana de entrenamiento. Empieza suave y, si vuelve la molestia, para y avísanos.';
}

// ───── Bloques mensuales y autotest ─────
/**
 * Última semana del bloque que empieza en «inicio». Con fecha de examen, los bloques se ajustan para que el último
 * autotest caiga en la última semana que termina 14 días antes del examen (f.ultimoTest); después, un último bloque
 * sin autotest (afinamiento y semana del examen).
 */
function finBloque_(f, inicio) {
  const normal = inicio + AJUSTES.semanasPorPlan - 1;
  if (f.provisional) return normal;
  const hastaTest = f.ultimoTest - inicio + 1;
  if (hastaTest < 3) return f.semanas;
  if (hastaTest <= AJUSTES.semanasPorPlan + 2) return f.ultimoTest;
  return normal;
}
/** Si la fecha del examen se publica o cambia a mitad de un bloque, el bloque se recorta (examen antes o test a 14 días). */
function ajustarBloque_(f, planHasta, desde) {
  if (f.provisional || !planHasta) return planHasta;
  let ph = Math.min(planHasta, f.semanas);
  if (ph > f.ultimoTest && f.ultimoTest - desde >= 2) ph = f.ultimoTest;
  return ph;
}
/** Semana de autotest del bloque: la última, salvo que caiga a menos de 14 días del examen (0 = sin autotest). */
function autotestDe_(f, desde, hasta) {
  const a = Math.min(hasta, f.provisional ? Infinity : f.ultimoTest);
  return a - desde >= 2 ? a : 0;
}
function desdeDe_(d, f) { return d.bloqueDesde || (f.test ? 0 : 1); }

// ───── Ajustes (hoja «Ajustes») ─────
/** Lee la fecha del examen de la hoja Ajustes. Vacía = plan provisional de 6 meses para cada alumno. */
function cargarAjustes_() {
  const hoja = hoja_(AJUSTES.hojaAjustes, ['Ajuste', 'Valor', 'Cómo se usa']);
  if (hoja.getLastRow() < 2) hoja.appendRow(['Fecha del examen (primer día de pruebas)', '01/06/2027', 'Formato dd/mm/aaaa. El afinamiento y el último autotest se calculan con esta fecha. Si cambia, corrígela: los planes se ajustan solos en su siguiente envío. Vacía = plan provisional de 6 meses.']);
  if (hoja.getLastRow() < 3) {
    if (!String(hoja.getRange(2, 2).getValue()).trim()) hoja.getRange(2, 2).setValue('01/06/2027');
    hoja.appendRow(['Último día de pruebas', '04/06/2027', 'Formato dd/mm/aaaa. El plan termina este día. Si las pruebas son un solo día, pon la misma fecha que arriba.']);
  }
  const zona = libro_().getSpreadsheetTimeZone();
  const leer = function (fila) {
    const v = hoja.getRange(fila, 2).getValue();
    if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, zona, 'yyyy-MM-dd'); // la hoja suele convertir 01/06/2027 en fecha
    const m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(String(v).trim());
    return m ? m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2) : '';
  };
  const fecha = leer(2);
  Calculo.CONFIG.fechaExamen = fecha;
  Calculo.CONFIG.fechaFin = fecha ? (leer(3) || fecha) : '';
  return fecha;
}

// ───── Envíos ─────
function enviarInicioPlan_(d, f, desde, hasta, id, siguienteMes) {
  const semanas = [];
  const at = autotestDe_(f, desde, hasta);
  for (let n = desde; n <= hasta; n++) semanas.push(Sesiones.semana(d, f, n, { autotest: n === at }));
  const c = Correo.htmlInicioPlan(d, f, semanas, urlDe_('aviso', id), urlDe_('marcas', id), null, siguienteMes);
  enviar_(d.email, (siguienteMes ? 'Tu plan del mes siguiente' : 'Tu plan de entrenamiento') + ' · Academia 8 Islas', c.html, c.imagenes);
}
function urlDe_(accion, id) {
  if (!id) return '';
  if (AJUSTES.urlWeb) return AJUSTES.urlWeb + accion + '.html?id=' + encodeURIComponent(id);
  return AJUSTES.urlWebApp + '?' + accion + '=' + encodeURIComponent(id);
}
function enviar_(para, asunto, html, imagenes, conLogo) {
  const inline = {};
  if (conLogo !== false) inline.logo = Utilities.newBlob(Utilities.base64Decode(LOGO_PNG_B64), 'image/png', 'logo.png');
  (imagenes || []).forEach(function (k) {
    if (IMAGENES[k]) inline['img_' + k.replace(/-/g, '_')] = Utilities.newBlob(Utilities.base64Decode(IMAGENES[k]), 'image/png', k + '.png');
  });
  const correo = { to: para, subject: asunto, htmlBody: html, inlineImages: inline, name: AJUSTES.remitente };
  if (AJUSTES.copiaAcademia) correo.bcc = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(correo);
}
function paginaSimple_(texto) {
  return '<div style="font-family:Barlow,Arial,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#1b2236">' +
    '<div style="background:#0d1b3e;color:#fff;border-bottom:6px solid #ecb33b;padding:16px 20px;border-radius:6px 6px 0 0;font-size:22px;font-weight:700">Academia 8 Islas</div>' +
    '<div style="background:#fff;border:1px solid #dfe3ec;border-top:0;border-radius:0 0 6px 6px;padding:18px 20px;font-size:16px;line-height:1.5">' + texto + '</div></div>';
}

// ───── Fechas ─────
/** Ajusta una fecha al horario de envío con minutos variables, para que no parezca automático. */
function programar_(fecha) {
  const f = new Date(fecha);
  if (f.getHours() < AJUSTES.horaMin) f.setHours(AJUSTES.horaMin, 0, 0, 0);
  if (f.getHours() >= AJUSTES.horaMax) { f.setDate(f.getDate() + 1); f.setHours(AJUSTES.horaMin, 0, 0, 0); }
  f.setMinutes(Math.floor(Math.random() * 50) + 5);
  return f;
}
/** Viernes anterior al lunes en que empieza la semana n, a una hora variable entre las 10 y las 19. */
function viernesAntes_(f, n) {
  const p = new Date(f.planIni), v = new Date(p.getFullYear(), p.getMonth(), p.getDate() + (n - 1) * 7 - 3); // por calendario (cambio de hora)
  v.setHours(AJUSTES.viernesHoraMin + Math.floor(Math.random() * (AJUSTES.viernesHoraMax - AJUSTES.viernesHoraMin)), Math.floor(Math.random() * 55), 0, 0);
  return v;
}
/** Semana del plan cuyo detalle toca: la que empieza el lunes que viene (de viernes a domingo) o la actual. */
function semanaProxima_(f, fecha) {
  const dia = fecha.getDay(), dias = Math.round((new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) - new Date(f.planIni)) / DIA);
  const base = Math.floor(dias / 7) + 1;
  return (dia === 5 || dia === 6 || dia === 0) ? base + 1 : base;
}
function mesEs_(fecha) { return ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][fecha.getMonth()] + ' de ' + fecha.getFullYear(); }

// ───── Hojas ─────
function libro_() {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('HOJA_ID');
  let libro = null;
  if (id) { try { libro = SpreadsheetApp.openById(id); } catch (e) { libro = null; } }
  if (!libro) { libro = SpreadsheetApp.create('Academia 8 Islas · Alumnos pruebas físicas'); props.setProperty('HOJA_ID', libro.getId()); }
  return libro;
}
function hoja_(nombre, cabecera) {
  const libro = libro_();
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) { hoja = libro.insertSheet(nombre); hoja.appendRow(cabecera); hoja.setFrozenRows(1); }
  return hoja;
}
function hojaSeguimiento_() {
  return hoja_(AJUSTES.hojaSeguimiento, ['Alta', 'Nombre', 'Correo', 'Estado', 'Próximo envío', 'Inicio del plan', 'Última semana enviada', 'Planificado hasta la semana', 'Datos (no editar)', 'Incidencias', 'ID (no editar)', 'Recordatorios']);
}
function hojaAvisos_() {
  return hoja_(AJUSTES.hojaAvisos, ['Fecha', 'Nombre', 'Correo', 'Tipo', 'Zona', 'Dolor (0-10)', '¿Le impide entrenar?', 'Señales de alarma', 'Comentario', 'Respuesta enviada', 'Plan pausado']);
}
function buscarFila_(id) {
  const filas = hojaSeguimiento_().getDataRange().getValues();
  for (let i = 1; i < filas.length; i++) if (filas[i][COL.id - 1] === id) return { fila: i + 1, valores: filas[i] };
  return null;
}
function guardarFila_(d, f) {
  const libro = libro_();
  let hoja = libro.getSheetByName(AJUSTES.hoja);
  if (!hoja) {
    hoja = libro.getSheets()[0].setName(AJUSTES.hoja);
    hoja.appendRow(['Fecha', 'Nombre', 'Correo', 'Nacimiento', 'Municipio', 'Baremo', 'Actividad', 'Deporte', 'Atletismo',
      'Consentimiento lesiones', 'Lesiones', 'Recuperación', 'Crol', 'Metros seguidos', 'De cabeza', 'Franjas', 'Min/sesión',
      'Pista días', 'Foso días', 'Piscina días', 'Gimnasio días', 'Piscina m', 'Material',
      '50 m lisos', '800 m', 'Salto', '50 m libres', 'Estado 50 m', 'Estado 800 m', 'Estado salto', 'Estado natación',
      'Semana de test', 'Prioridades', 'Le preocupa', 'Comentario']);
    hoja.setFrozenRows(1);
  }
  const marca = function (prueba) { const m = (d.marcas || []).filter(function (x) { return x.prueba === prueba; })[0]; return !m ? '' : m.marca + ' · ' + m.medicion + (m.fecha ? ' · ' + m.fecha : ''); };
  const estado = function (k) { return f.pruebas.filter(function (x) { return x.k === k; })[0].estado; };
  hoja.appendRow([new Date(), d.nombre, d.email, d.nacimiento, d.municipio, d.sexo, d.actividad, d.deporte, d.atletismo,
    d.consentimientoLesiones ? 'Sí' : 'No', (d.lesiones || []).join(', '), d.recuperacion, d.crol, d.metrosSeguidos, d.deCabeza,
    (d.franjas || []).join('; '), d.minutosSesion, d.instalaciones.pista, d.instalaciones.foso, d.instalaciones.piscina, d.instalaciones.gimnasio,
    d.piscinaMetros, (d.material || []).join(', '), marca('50 m lisos'), marca('800 m'), marca('Salto de longitud'), marca('50 m libres'),
    estado('l50'), estado('m800'), estado('salto'), estado('nado'), f.test ? 'Sí' : 'No', f.prioridades.join(' > '), d.preocupa, d.comentario]);
}

// ───── Pruebas ─────
function ejemplo_() {
  const mes = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MM/yyyy');
  return {
    nombre: 'Marco Aurelio (prueba)', email: Session.getEffectiveUser().getEmail(), nacimiento: '1999-04-12', municipio: 'La Laguna', sexo: 'Hombre',
    actividad: '1-2 días por semana', deporte: 'Fútbol aficionado', atletismo: 'Nunca', declaracion: true, consentimientoLesiones: true, lesiones: ['Ninguna'], recuperacion: '',
    crol: 'Sí, con soltura', metrosSeguidos: 400, deCabeza: 'Sí, sin problema', franjas: ['Lunes|Tarde', 'Martes|Tarde', 'Jueves|Tarde', 'Sábado|Mañana'], minutosSesion: 60,
    instalaciones: { pista: 2, foso: 2, piscina: 1, gimnasio: 2 }, piscinaMetros: '25', material: ['Reloj GPS o app de carrera'],
    marcas: [
      { prueba: '50 m lisos', marca: '8,20', medicion: 'Cronometrada por otra persona', fecha: mes },
      { prueba: '800 m', marca: '3:40', medicion: 'Con reloj o app', fecha: mes },
      { prueba: 'Salto de longitud', marca: '3,15', medicion: 'Con cinta métrica', fecha: mes },
      { prueba: '50 m libres', marca: '52,0', medicion: 'Cronometrada por otra persona', fecha: mes },
    ],
    preocupa: '800 m', comentario: '', proteccionDatos: true, veraces: true,
  };
}
/** Prueba sin esperar: te envía ahora todos los correos de ejemplo (no toca la hoja). */
function probarPlanAhora() {
  cargarAjustes_();
  const d = ejemplo_(), f = Calculo.ficha(d, new Date());
  enviar_(d.email, '[Prueba 1/6] Acuse de recibo', Correo.htmlAcuse(d), [], false);
  enviar_(d.email, '[Prueba 2/6] Ficha inicial', Correo.htmlFichaCorreo(d, f, 'cid:logo'), []);
  const semanas = [1, 2, 3, 4].map(function (n) { return Sesiones.semana(d, f, n, { autotest: n === 4 }); });
  let c = Correo.htmlInicioPlan(d, f, semanas, AJUSTES.urlWebApp + '?aviso=prueba', AJUSTES.urlWebApp + '?marcas=prueba', null, false);
  enviar_(d.email, '[Prueba 3/6] Plan del mes + semana 1', c.html, c.imagenes);
  c = Correo.htmlSemanaDetalle(d, semanas[3], AJUSTES.urlWebApp + '?aviso=prueba', AJUSTES.urlWebApp + '?marcas=prueba');
  enviar_(d.email, '[Prueba 4/6] Semana del viernes (autotest)', c.html, c.imagenes);
  const d2 = Object.assign({}, d, { marcas: d.marcas.map(function (m) { return Object.assign({}, m, { marca: { '50 m lisos': '7,95', '800 m': '3:24', 'Salto de longitud': '3,32', '50 m libres': '49,5' }[m.prueba] }); }) });
  enviar_(d.email, '[Prueba 5/6] Informe mensual', Correo.htmlInforme(d2, f, Calculo.ficha(d2, new Date(), 5), f, mesEs_(new Date())), []);
  enviar_(d.email, '[Prueba 6/6] Respuesta a una molestia', Correo.htmlRecomendacion(d.nombre, recomendacion_({ tipo: 'Molestia o dolor', zona: 'Rodilla', dolor: 6, impide: 'No', alarmas: [] }), AJUSTES.urlWebApp + '?reanudar=prueba'), [], false);
  Logger.log('Enviados 6 correos de ejemplo a ' + d.email);
}
/**
 * Demostración: envía al momento todos los correos que recibe un alumno, cada uno con un aviso de cuándo
 * lo recibiría de verdad. Se usa con el enlace ...exec?demo=1 (con los datos del cuestionario) o desde
 * el editor con probarParaSocio (datos de ejemplo). Los botones de molestias y de marcas funcionan.
 */
const CORREO_PRUEBA = 'academia8islas@gmail.com';
function probarParaSocio() {
  const d = ejemplo_(); d.email = CORREO_PRUEBA; d.nombre = 'Marco Aurelio (prueba)';
  demo_(d);
}
function demo_(d) {
  cargarAjustes_();
  const ahora = new Date(), f = Calculo.ficha(d, ahora), id = Utilities.getUuid();
  d.marcasIniciales = d.marcas; d.esPrueba = true;
  // Fila de prueba para que los botones funcionen (el temporizador no la toca hasta que se registren marcas)
  hojaSeguimiento_().appendRow([ahora, d.nombre, d.email, 'prueba', '', ahora, 3, 4, JSON.stringify(d), 'Demostración', id, 0]);
  const aviso = function (html, texto, n) {
    const b = '<div style="background:#fff3c4;border:2px dashed #ecb33b;color:#0d1b3e;font-family:Arial,sans-serif;font-size:15px;padding:12px 16px;margin:0 0 12px;border-radius:8px"><b>PRUEBA ' + n + '/9 ·</b> ' + texto + '</div>';
    return /<body[^>]*>/.test(html) ? html.replace(/(<body[^>]*>)/, '$1' + '<div style="max-width:700px;margin:12px auto 0;padding:0 10px">' + b + '</div>') : b + html;
  };
  const env = function (n, asunto, html, imgs, logo, texto) { enviar_(d.email, '[Prueba ' + n + '/9] ' + asunto, aviso(html, texto, n), imgs, logo); };
  const ua = urlDe_('aviso', id), um = urlDe_('marcas', id);
  const semanas = [1, 2, 3, 4].map(function (n) { return Sesiones.semana(d, f, n, { autotest: n === 4 }); });

  env(1, 'Hemos recibido tu cuestionario', Correo.htmlAcuse(d), [], false, 'Lo recibes <b>al momento</b> de enviar el cuestionario.');
  env(2, 'Tu ficha inicial', Correo.htmlFichaCorreo(d, f, 'cid:logo'), [], true, 'Lo recibes <b>2 días después</b> del cuestionario, junto al plan.');
  let c = Correo.htmlInicioPlan(d, f, semanas, ua, um, null, false);
  env(3, 'Tu plan de entrenamiento', c.html, c.imagenes, true, 'Lo recibes <b>2 días después</b> del cuestionario: resumen del mes y la primera semana en detalle.');
  c = Correo.htmlSemanaDetalle(d, semanas[1], ua, um);
  env(4, 'Tu semana 2 de entrenamiento', c.html, c.imagenes, true, 'Lo recibes <b>el viernes de la primera semana</b> (entre viernes y domingo llega siempre la semana siguiente).');
  c = Correo.htmlSemanaDetalle(d, semanas[3], ua, um);
  env(5, 'Tu semana de autotest', c.html, c.imagenes, true, 'Lo recibes <b>el viernes de la tercera semana</b>: la última semana del mes repites las pruebas. Prueba el botón «Registrar mis marcas».');
  env(6, 'Registra tus marcas del autotest', Correo.htmlRecordatorioMarcas(d, um), [], true, 'Solo si <b>al terminar el mes no ha registrado sus marcas</b>. Se repite cada 2 días.');
  // Marcas de ejemplo para el informe: sus marcas mejoradas un 3 %
  const pad = function (x) { x = String(x); return x.length < 2 ? '0' + x : x; };
  const mejor = function (r) {
    const v = r.tiempo ? r.valida * 0.97 : r.valida * 1.03;
    if (r.k === 'l50') return (v - 0.2).toFixed(2).replace('.', ','); // se volverá a sumar el +0,2 del cronometraje manual
    if (r.k === 'salto') return v.toFixed(2).replace('.', ',');
    if (r.k === 'm800') { const s = Math.round(v); return Math.floor(s / 60) + ':' + pad(s % 60); }
    const t = Math.round(v * 10) / 10;
    return t < 60 ? t.toFixed(1).replace('.', ',') : Math.floor(t / 60) + ':' + pad(Math.floor(t % 60)) + ',' + Math.round((t * 10) % 10);
  };
  const d2 = Object.assign({}, d, { marcas: f.pruebas.map(function (r) {
    return { prueba: r.n, nunca: false, marca: mejor(r), medicion: r.k === 'salto' ? 'Con cinta métrica' : 'Con reloj o app', fecha: Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'MM/yyyy') };
  }) });
  const fNew = Calculo.ficha(d2, ahora, 5);
  env(7, 'Tu informe mensual', Correo.htmlInforme(d2, f, fNew, f, mesEs_(ahora)), [], true, 'Lo recibes <b>unas horas después de registrar tus marcas</b> del autotest (aquí, con tus marcas mejoradas un 3 % como ejemplo).');
  const sig = [5, 6, 7, 8].map(function (n) { return Sesiones.semana(d2, fNew, n, { autotest: n === 8 }); });
  c = Correo.htmlInicioPlan(d2, fNew, sig, ua, um, null, true);
  env(8, 'Tu plan del mes siguiente', c.html, c.imagenes, true, 'Lo recibes <b>junto al informe</b>: el plan del mes siguiente, recalculado con tus nuevas marcas.');
  env(9, 'Para los ejercicios que cargan esa zona', Correo.htmlRecomendacion(d.nombre, recomendacion_({ tipo: 'Molestia o dolor', zona: 'Rodilla', dolor: 3, impide: 'No', alarmas: [] }), ''), [], false,
    'Lo recibes <b>al momento</b> si pulsa «Tengo una molestia o quiero cambiar algo». Pruébalo desde el botón del correo 3 o 4.');
  Logger.log('Enviados 9 correos de prueba a ' + d.email);
}

/** Adelanta a "ahora" el siguiente envío de todos los alumnos (útil para pruebas) y lo procesa. */
function enviarPendientesYa() {
  const hoja = hojaSeguimiento_(), filas = hoja.getDataRange().getValues();
  for (let i = 1; i < filas.length; i++) if (['pendiente', 'marcas recibidas'].indexOf(filas[i][COL.estado - 1]) >= 0) hoja.getRange(i + 1, COL.envio).setValue(new Date());
  procesarPendientes();
}
