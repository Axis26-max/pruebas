/**
 * Academia 8 Islas · Cálculo de la ficha inicial
 * Funciones puras: sirven igual en la página (vista de prueba) y en Apps Script (Calculo.gs).
 *
 * Reglas acordadas:
 *  - Mínimas BOE 31/12/2025. Objetivo final = mínima mejorada un 10 %.
 *  - Semáforo: verde (≥ objetivo); ámbar (entre mínima y objetivo, o hasta 5 % por debajo de la mínima);
 *    rojo (resto o nunca realizada).
 *  - 50 m lisos cronometrado a mano: +0,2 s.
 *  - Sin marca, marca estimada o de hace más de un mes → semana de test inicial.
 *  - Fases (Bompa, Periodización 2019): base (25-33 % de la preparación, más en principiantes) → específica →
 *    afinamiento (los últimos 8-14 días antes del examen).
 *  - Mientras no se publique la fecha del examen (fechaExamen vacía): plan provisional de 26 semanas desde la
 *    inscripción de cada alumno, solo base y específica; la específica se alarga mientras no haya fecha.
 *  - Con fecha: el último test completo, en la última semana que termina al menos 14 días antes del examen.
 *  - Convocatoria 2027: pruebas previstas del martes 1 al viernes 4 de junio. El plan empieza siempre en lunes,
 *    desde el lunes siguiente a la incorporación de cada alumno, y termina el viernes 4 de junio.
 *    El afinamiento se calcula con el primer día de pruebas (1 de junio), por prudencia.
 *  - Si quedan menos de 7 semanas, no hay semana de test inicial: se parte de las marcas del cuestionario.
 */
var Calculo = (function () {
  var CONFIG = {
    fechaExamen: '2027-06-01',   // primer día de pruebas 'aaaa-mm-dd'; vacío = plan provisional (en Apps Script se lee de la hoja Ajustes)
    fechaFin: '2027-06-04',      // último día de pruebas: el plan termina ese día (en Apps Script, hoja Ajustes)
    semanasProvisional: 26,      // 6 meses desde la inscripción mientras no haya fecha
    imcMin: 18.5, imcMax: 29.9,  // rango de IMC de las bases de la convocatoria · CONFIRMAR y actualizar si cambian
    margenCerca: 0.05,
    mejoraObjetivo: 0.10,
    ritmoPrimerMes: 1.2,         // el primer mes se avanza algo más rápido que la media
  };
  var MINIMAS = {
    Hombre: { l50: 8.00, m800: 180, salto: 3.42, nado: 50.0 },
    Mujer:  { l50: 9.60, m800: 233, salto: 2.85, nado: 60.0 },
  };
  var PRUEBAS = [
    { k: 'l50',   n: '50 m lisos',        tiempo: true,  paso: 0.05 },
    { k: 'm800',  n: '800 m',             tiempo: true,  paso: 1 },
    { k: 'salto', n: 'Salto de longitud', tiempo: false, paso: 0.01 },
    { k: 'nado',  n: '50 m libres',       tiempo: true,  paso: 0.1 },
  ];
  var DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIA_MS = 86400000;

  function num(s) {
    s = String(s == null ? '' : s).trim().replace(',', '.');
    if (!s) return null;
    if (s.indexOf(':') >= 0) { var p = s.split(':'); return (+p[0]) * 60 + parseFloat(p[1]); }
    var v = parseFloat(s); return isNaN(v) ? null : v;
  }
  function redondea(v, paso) { return Math.round(v / paso) * paso; }
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }

  function formato(k, v) {
    if (v == null || isNaN(v)) return '—';
    if (k === 'salto') return v.toFixed(2).replace('.', ',') + ' m';
    if (k === 'l50') { var c = Math.round(v * 100); return Math.floor(c / 100) + '"' + pad(c % 100, 2); }
    if (k === 'm800') { var s = Math.round(v); return Math.floor(s / 60) + "'" + pad(s % 60, 2) + '"'; }
    var t = Math.round(v * 10); // nado
    if (t < 600) return Math.floor(t / 10) + '"' + (t % 10);
    return Math.floor(t / 600) + "'" + pad(Math.floor((t % 600) / 10), 2) + '"' + (t % 10);
  }

  function lista(xs) { return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1]; }
  // Fechas por calendario (no por milisegundos): así el cambio de hora de marzo y octubre no mueve los días.
  function lunesSiguiente(d) { var w = (d.getDay() + 6) % 7; return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 - w); }
  function suma(d, dias) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias); }
  function fechaLarga(d) { return d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear(); }
  function rangoFechas(a, b) {
    if (a.getMonth() === b.getMonth()) return 'del ' + a.getDate() + ' al ' + fechaLarga(b);
    return 'del ' + a.getDate() + ' de ' + MESES[a.getMonth()] + ' al ' + fechaLarga(b);
  }
  function rangoMeses(a, b) {
    return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear() ? MESES[a.getMonth()] : MESES[a.getMonth()] + ' a ' + MESES[b.getMonth()];
  }
  function mesesDesde(mmaaaa, hoy) {
    var m = /^(\d{1,2})\/(\d{4})$/.exec(String(mmaaaa || '').trim()); if (!m) return 99;
    return (hoy.getFullYear() - +m[2]) * 12 + (hoy.getMonth() + 1 - +m[1]);
  }

  /** Evalúa una prueba: marca válida, frente a la mínima y semáforo. */
  function evaluar(p, entrada, minimas) {
    var min = minimas[p.k];
    var obj = redondea(p.tiempo ? min * (1 - CONFIG.mejoraObjetivo) : min * (1 + CONFIG.mejoraObjetivo), p.k === 'm800' ? 1 : 0.01);
    var r = { k: p.k, n: p.n, tiempo: p.tiempo, minima: min, objetivo: obj, entrada: entrada };
    var v = entrada && !entrada.nunca ? num(entrada.marca) : null;
    var manual = p.k === 'l50' && entrada && /Cronometrada|reloj/i.test(entrada.medicion || '');
    r.medicion = !entrada || entrada.nunca ? 'Nunca realizada' : entrada.medicion === 'Estimada' ? 'Estimada' : manual ? 'Manual (+0,2 s)'
      : p.k === 'salto' ? 'Cinta métrica'
      : /reloj/i.test(entrada.medicion) ? 'Reloj o app' : 'Otra persona';
    if (v == null) { r.valida = null; r.color = 'rojo'; r.estado = 'Sin marca'; r.frente = '—'; r.deficit = 1; return r; }
    if (manual) v = Math.round((v + 0.2) * 100) / 100;
    r.valida = v;
    var mejor = function (x) { return p.tiempo ? v <= x + 1e-9 : v >= x - 1e-9; };
    r.deficit = p.tiempo ? (v - min) / min : (min - v) / min;
    if (p.k === 'salto') {
      var cm = Math.round((v - min) * 100);
      r.frente = cm === 0 ? 'Justo en la mínima' : Math.abs(cm) + ' cm ' + (cm < 0 ? 'por debajo' : 'por encima');
    } else {
      var pct = Math.abs(r.deficit * 100).toFixed(1).replace('.', ',');
      r.frente = Math.abs(r.deficit) < 0.0005 ? 'Justo en la mínima' : pct + ' % ' + (r.deficit > 0 ? 'más lento' : 'más rápido');
    }
    if (mejor(obj)) { r.color = 'verde'; r.estado = 'Objetivo alcanzado'; }
    else if (mejor(min)) { r.color = 'ambar'; r.estado = 'Aprobado, sin margen'; }
    else if (r.deficit <= CONFIG.margenCerca + 1e-9) { r.color = 'ambar'; r.estado = 'Cerca'; }
    else { r.color = 'rojo'; r.estado = 'Lejos'; }
    return r;
  }

  function disponibilidad(franjas) {
    var porDia = {};
    (franjas || []).forEach(function (f) { var x = f.split('|'); (porDia[x[0]] = porDia[x[0]] || []).push(x[1]); });
    var dias = DIAS.filter(function (d) { return porDia[d]; });
    var txtFranja = { 'Mañana': 'por la mañana', 'Mediodía': 'a mediodía', 'Tarde': 'por la tarde', 'Noche': 'por la noche' };
    var grupos = [], idx = {};
    dias.forEach(function (d) {
      var key = porDia[d].join('+');
      if (!(key in idx)) { idx[key] = grupos.length; grupos.push({ key: key, dias: [] }); }
      grupos[idx[key]].dias.push(d.toLowerCase());
    });
    var texto = grupos.map(function (g) { return lista(g.dias) + ' ' + lista(g.key.split('+').map(function (f) { return txtFranja[f]; })); }).join('; ');
    return { dias: dias, texto: texto };
  }

  function elegirDias(dias) {
    if (dias.length <= 5) return dias.slice();
    var out = []; for (var i = 0; i < 5; i++) out.push(dias[Math.round(i * (dias.length - 1) / 4)]);
    return out;
  }

  /**
   * Reparto de fases (Bompa, cap. 8): la base es el 25 % de la preparación (33 % en principiantes), con un mínimo
   * de 2 semanas; se calcula sobre 24 semanas como máximo, para que no se alargue si la fecha llega tarde.
   * afin: semanas de afinamiento (0 mientras no haya fecha).
   */
  function fases(semanas, afin, principiante) {
    var prep = Math.max(0, semanas - afin), ref = Math.min(prep, 24);
    var base = semanas < 6 ? 0 : Math.max(2, Math.round(ref * (principiante ? 0.33 : 0.25)));
    base = Math.min(base, Math.max(0, prep - 2));
    var esp = prep - base;
    return [
      { n: 'Base', ini: 1, fin: base },
      { n: 'Específica', ini: base + 1, fin: base + esp },
      { n: 'Afinamiento', ini: base + esp + 1, fin: semanas },
    ].filter(function (f) { return f.fin >= f.ini; });
  }

  /** Calcula la ficha inicial completa a partir de las respuestas del cuestionario. */
  // semanaDesde: en los planes siguientes, semana del plan desde la que se calculan los objetivos (con las marcas nuevas).
  function ficha(d, hoy, semanaDesde) {
    hoy = hoy || new Date();
    var minimas = MINIMAS[d.sexo] || MINIMAS.Hombre;
    var marcas = {}; (d.marcas || []).forEach(function (m) { marcas[m.prueba] = m; });
    var pruebas = PRUEBAS.map(function (p) { return evaluar(p, marcas[p.n], minimas); });

    var needTest = pruebas.some(function (r) {
      var e = r.entrada; return !e || e.nunca || e.medicion === 'Estimada' || mesesDesde(e.fecha, hoy) > 1;
    });
    var inicio = lunesSiguiente(hoy);
    if (needTest && CONFIG.fechaExamen && (new Date(CONFIG.fechaExamen + 'T00:00:00') - inicio) / DIA_MS < 7 * 7) needTest = false; // poco margen: sin semana de test
    // El inicio del plan queda fijado al enviar el primer plan (d.planIni): las marcas nuevas no lo mueven.
    if (d.planIni) { needTest = !!d.conTest; var fijo = new Date(d.planIni + 'T00:00:00'); inicio = needTest ? suma(fijo, -7) : fijo; }
    var test = needTest ? { ini: inicio, fin: suma(inicio, 6) } : null;
    var planIni = needTest ? suma(inicio, 7) : inicio;
    var provisional = !CONFIG.fechaExamen, objetivo, fin, semanas, afin = 0, ultimoTest = Infinity;
    if (provisional) {
      // Sin fecha publicada: 26 semanas; si el plan sigue sin fecha, se va alargando bloque a bloque.
      semanas = Math.max(CONFIG.semanasProvisional, (semanaDesde || 0) + 8);
      objetivo = suma(planIni, semanas * 7);
    } else {
      objetivo = new Date(CONFIG.fechaExamen + 'T00:00:00');
      fin = CONFIG.fechaFin ? new Date(CONFIG.fechaFin + 'T00:00:00') : objetivo;
      if (fin < objetivo) fin = objetivo;
      var dias = Math.round((objetivo - planIni) / DIA_MS);
      semanas = Math.max(0, Math.ceil(dias / 7));                               // incluye la semana del examen si no es lunes
      var afinIni = Math.max(1, Math.ceil((dias - 14) / 7) + 1);                // primera semana que empieza a 14 días o menos
      afin = Math.max(0, semanas - afinIni + 1);
      ultimoTest = Math.floor((dias - 13) / 7);                                 // última semana que termina 14 días antes o más
    }
    var principiante = d.actividad === 'No';
    var fs = fases(semanas, afin, principiante).map(function (f) {
      var a = suma(planIni, (f.ini - 1) * 7), b = suma(planIni, f.fin * 7 - 1);
      f.meses = rangoMeses(a, b); f.semanas = f.fin - f.ini + 1; return f;
    });

    var orden = pruebas.slice().sort(function (a, b) {
      if (b.deficit !== a.deficit) return b.deficit - a.deficit;
      return (b.n.indexOf(d.preocupa) >= 0 ? 1 : 0) - (a.n.indexOf(d.preocupa) >= 0 ? 1 : 0);
    });

    var disp = disponibilidad(d.franjas);
    var diasPlan = elegirDias(disp.dias);
    var meses = Math.max(1, (semanas - (semanaDesde ? semanaDesde - 1 : 0)) / 4.345);
    var ritmo = semanaDesde ? 1 : CONFIG.ritmoPrimerMes;
    var objetivosMes = pruebas.map(function (r) {
      var p = PRUEBAS.filter(function (x) { return x.k === r.k; })[0];
      if (r.valida == null) return { k: r.k, n: r.n, v: null, texto: 'Se fija tras el test inicial' };
      if (r.color === 'verde') return { k: r.k, n: r.n, v: r.objetivo, texto: (r.tiempo ? '≤ ' : '≥ ') + formato(r.k, r.objetivo) + ' (mantener)' };
      var paso = (r.objetivo - r.valida) / meses * ritmo;
      var meta = redondea(r.valida + paso, p.paso);
      if (r.tiempo ? meta < r.objetivo : meta > r.objetivo) meta = r.objetivo;
      return { k: r.k, n: r.n, v: meta, texto: formato(r.k, meta) };
    });

    var avisos = [];
    if (d.imc != null && (d.imc < CONFIG.imcMin || d.imc > CONFIG.imcMax)) avisos.push('Tu IMC está fuera del rango que exigen las bases de la convocatoria. Revísalo con un médico antes de presentarte.');
    if (d.crol === 'No' || d.metrosSeguidos < 50) avisos.push('Todavía no nadas 50 m seguidos a crol: el plan empieza con técnica de natación desde la primera semana.');
    if (d.deCabeza === 'No' || /miedo/.test(d.deCabeza || '')) avisos.push('Necesitas trabajar la salida de cabeza: la prueba exige zambullida.');
    if ((d.lesiones || []).filter(function (x) { return x !== 'Ninguna'; }).length) avisos.push('Has indicado molestias en: ' + lista(d.lesiones.filter(function (x) { return x !== 'Ninguna'; })) + '. Consulta con un profesional sanitario antes de entrenar esas pruebas.');
    if (diasPlan.length < 3) avisos.push('Con menos de 3 días por semana el progreso será más lento. Si puedes, añade algún día más.');
    if (!(d.instalaciones && d.instalaciones.piscina)) avisos.push('No tienes acceso a piscina: necesitarás al menos una sesión semanal de natación.');

    return {
      nombre: d.nombre, sexo: d.sexo, hoy: hoy,
      edad: d.nacimiento ? Math.floor((hoy - new Date(d.nacimiento + 'T00:00:00')) / (365.25 * DIA_MS)) : null,
      imc: d.imc, imcDentro: d.imc != null && d.imc >= CONFIG.imcMin && d.imc <= CONFIG.imcMax,
      pruebas: pruebas, test: test, testTexto: test ? rangoFechas(test.ini, test.fin) : '',
      semanas: semanas, fases: fs, fechaObjetivo: fechaLarga(objetivo), planIni: planIni,
      provisional: provisional, objetivo: objetivo, finExamen: fin || objetivo, ultimoTest: ultimoTest,
      textoExamen: provisional ? '' : (+fin === +objetivo ? 'el ' + fechaLarga(objetivo) : rangoFechas(objetivo, fin)),
      textoPlazo: provisional
        ? 'Plan provisional de ' + semanas + ' semanas: la fecha del examen aún no se ha publicado. Cuando salga, ajustamos el final del plan para que llegues en tu mejor momento.'
        : semanas + (semanas === 1 ? ' semana' : ' semanas') + ', ' + (planIni.getFullYear() === fin.getFullYear() ? rangoFechas(planIni, fin) : 'del ' + fechaLarga(planIni) + ' al ' + fechaLarga(fin)) + '. Pruebas físicas previstas ' + (+fin === +objetivo ? 'el ' + fechaLarga(objetivo) : rangoFechas(objetivo, fin)) + '.',
      prioridades: orden.map(function (r) { return r.n; }),
      disponibilidad: disp.texto, diasPlan: diasPlan, minutos: d.minutosSesion,
      objetivosMes: objetivosMes, avisos: avisos,
      formato: formato,
    };
  }

  return { ficha: ficha, formato: formato, lista: lista, CONFIG: CONFIG, MINIMAS: MINIMAS };
})();

if (typeof module !== 'undefined') module.exports = Calculo;
