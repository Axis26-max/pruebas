/**
 * Academia 8 Islas · Catálogo de ejercicios y generador de la semana de entrenamiento
 *
 * CATÁLOGO: cada ejercicio tiene un código fijo y SIEMPRE el mismo vídeo y/o la misma secuencia de imágenes.
 *   video: enlace de YouTube (Academia 8 Islas o P4P WORKOUTS) · img: viñetas de la secuencia (Imagenes.gs)
 * GENERADOR: Sesiones.semana(d, f, n) monta la semana n del plan a partir de las respuestas (d) y la ficha (f).
 *
 * Fuentes: diseño aprobado "Semana de entrenamiento"; Bompa y Buzzichelli, Periodización (2019): como máximo
 * 2 días de intensidad alta por semana (1 en principiantes durante la base), nunca seguidos si se puede, y días
 * suaves entre medias; semana del examen sin fuerza y con un solo estímulo corto (cese y afinamiento); Garage Strength / Sports Performance Bible (pliometría bilateral, contraste,
 * prevención por articulación); How to Get Faster (calentamiento de carrera). Sin olímpicos ni máximos; carga por RIR.
 */
var Sesiones = (function () {
  var AC = { l50: 'https://youtu.be/bnyMf3b_XE4', salto: 'https://youtu.be/mdRAvTK3JVI', nado: 'https://youtu.be/nx99UNZVnDw', m800: 'https://youtu.be/OFg1awoGugQ' };
  var YT = function (id) { return 'https://youtu.be/' + id; };

  var CATALOGO = {
    // Calentamiento y técnica de carrera
    trote:      { n: 'Trote suave' },
    rodillas:   { n: 'Skipping (rodillas arriba)', video: YT('QPfOZ0e30xg') },
    talgl:      { n: 'Talones al glúteo', img: ['talgl-1', 'talgl-2'], cap: ['Talón al glúteo, pierna derecha', 'Cambia de pierna, ritmo vivo'] },
    jacks:      { n: 'Jumping jacks', video: YT('5cGbc15CO1Q') },
    zancadas:   { n: 'Zancadas', video: YT('7SMzPn4LGjQ') },
    progresivos:{ n: 'Progresivos', video: AC.l50 + '?t=44', fuente: 'Academia' },
    // Técnica de las pruebas (vídeos de la Academia, en el minuto exacto)
    salidas:    { n: 'Salidas de pie', video: AC.l50 + '?t=34', fuente: 'Academia' },
    impulso:    { n: 'Carrera de impulso con batida', video: AC.salto + '?t=34', fuente: 'Academia' },
    saltoComp:  { n: 'Saltos completos al foso', video: AC.salto + '?t=40', fuente: 'Academia' },
    zambullida: { n: 'Salidas con zambullida', video: AC.nado + '?t=34', fuente: 'Academia' },
    crol:       { n: 'Técnica de crol', video: AC.nado + '?t=40', fuente: 'Academia' },
    llegada:    { n: 'Final a tope y llegada a la pared', video: AC.nado + '?t=46', fuente: 'Academia' },
    // Vuelta a la calma
    estCuad:    { n: 'Estiramiento de cuádriceps', video: YT('gH8js7uRU2M') },
    estGem:     { n: 'Estiramiento de gemelo en pared', img: ['gemelo-1'], cap: ['Pierna de atrás estirada, talón en el suelo, 20-30 s'] },
    estIsq:     { n: 'Estiramiento de isquiotibiales', img: ['isquio-1'], cap: ['Pierna estirada, puntera arriba, espalda recta, 20-30 s'] },
    estLumbar:  { n: 'Estiramiento lumbar con rotación', video: YT('m0dMNgaB8Rw') },
    // Fuerza: tren inferior
    bulgara:    { n: 'Sentadilla búlgara', img: ['bulgara-1', 'bulgara-2', 'bulgara-3', 'bulgara-4'], cap: ['Pie de atrás en el banco', 'Bajada vertical', 'Rodilla de atrás cerca del suelo', 'Empuje arriba'] },
    sentadilla: { n: 'Sentadilla', video: YT('6YPggJ4UEAY') },
    stepup:     { n: 'Subida al cajón (step-up)', video: YT('nAl0t57yPD4') },
    puente1:    { n: 'Puente de glúteo a una pierna', video: YT('nrLo5QCCfCc') },
    talones:    { n: 'Elevación de talones a una pierna', video: YT('6tqRg_tsi3o'), img: ['talones-1', 'talones-2', 'talones-3'], cap: ['Talón fuera del escalón', 'Subida', 'Arriba 1 s, bajar en 3 s'] },
    gemeloExc:  { n: 'Bajada lenta de gemelo en escalón', video: YT('ZY8Q7eO7OD0') },
    // Fuerza: tren superior (natación)
    dominadas:  { n: 'Dominadas (o asistidas con goma)', video: YT('iUNoLR0pYjY') },
    remo:       { n: 'Remo con mancuerna', video: YT('dwimbUbPabI') },
    flexiones:  { n: 'Flexiones', video: YT('5eSM88TFzAs') },
    // Potencia y pliometría
    pogo:       { n: 'Saltos pogo', img: ['pogo-1', 'pogo-2'], cap: ['De puntillas, rodillas casi rectas', 'Rebote corto y rápido'] },
    sqj:        { n: 'Sentadilla con salto', img: ['sqj-1', 'sqj-2', 'sqj-3', 'sqj-4'], cap: ['De pie', 'Media sentadilla, brazos atrás', 'Salto máximo', 'Caída suave'] },
    cajon:      { n: 'Salto al cajón', img: ['cajon-1', 'cajon-2', 'cajon-3', 'cajon-4'], cap: ['Frente al cajón', 'Brazos atrás, carga', 'En el aire', 'Caída en sentadilla'] },
    flexExpl:   { n: 'Flexiones explosivas', video: YT('KQYFEJpAFy4') },
    // Tronco
    plancha:    { n: 'Plancha frontal', video: YT('TvxNkmjdhMM') },
    planchaLat: { n: 'Plancha lateral', video: YT('9Q0D6xAyrOI'), img: ['plancha-1', 'plancha-2'], cap: ['Codo bajo el hombro', 'Cadera alta, mantener'] },
    lumbar:     { n: 'Extensión lumbar', video: YT('O8d8I7-qtGg') },
    vups:       { n: 'V-ups', video: YT('AJD6aPu5kw4') },
    // Prevención
    nordico:    { n: 'Curl nórdico', img: ['nordico-1', 'nordico-2', 'nordico-3'], cap: ['De rodillas, tobillos sujetos', 'Bajada con la cadera extendida', 'Caída a manos'] },
    cubana:     { n: 'Rotación cubana (hombro)', video: YT('RcQogAS5638') },
    aductores:  { n: 'Aductores: apretar balón', video: YT('xUW_thCLMiU') },
  };

  var BASES = {
    m800: { n: '800 m', lineas: ['Carrera de 800 m sobre superficie lisa, plana y dura. <b>Un solo intento.</b>', 'Mínima: <b>hombres 3\'00" · mujeres 3\'53"</b>.'], video: AC.m800 },
    nado: { n: '50 m libres', lineas: ['50 m estilo libre, con zambullida. <b>Un solo intento.</b>', 'Mínima: <b>hombres 50"0 · mujeres 1\'00"</b>.', '<span class="no">Nulo</span> si te paras o te agarras a las corcheras o al borde.'], video: AC.nado },
    l50:  { n: '50 m lisos', lineas: ['Salida <b>de pie</b>, sin tacos.', 'Mínima: <b>hombres 8"00 · mujeres 9"60</b>.', '<span class="no">Nula</span> si sales antes de la señal o pisas la línea.'], video: AC.l50 },
    salto:{ n: 'Salto de longitud', lineas: ['Con carrera. <b>Dos intentos</b>, 1 minuto para cada uno.', 'Mínima: <b>hombres 3,42 m · mujeres 2,85 m</b>.', '<span class="no">Nulo</span> si pisas la plastilina, pasas la línea o sales del foso hacia atrás.'], video: AC.salto },
  };

  var DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  var DIA_MS = 86400000;
  function masDias(d, n) { d = new Date(d); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); } // por calendario (cambio de hora)

  function it(ex, d, nombre) { return { ex: ex, d: d, nombre: nombre }; }
  function seg(s) { s = Math.round(s); return s >= 60 ? Math.floor(s / 60) + "'" + ('0' + (s % 60)).slice(-2) + '"' : s + '"'; }
  function segD(s) { var t = Math.round(s * 10); return t >= 600 ? Math.floor(t / 600) + "'" + ('0' + Math.floor((t % 600) / 10)).slice(-2) + '"' + (t % 10) : Math.floor(t / 10) + '"' + (t % 10); }

  /** Objetivo del mes (número) o, si no hay marca, la mínima con margen. */
  function meta(f, k, d) {
    var o = (f.objetivosMes || []).filter(function (x) { return x.k === k; })[0];
    if (o && o.v != null) return o.v;
    var min = (Calculo.MINIMAS[d.sexo] || Calculo.MINIMAS.Hombre)[k];
    return k === 'salto' ? min : min * 1.12;
  }

  function faseDe(f, n) {
    var x = (f.fases || []).filter(function (p) { return n >= p.ini && n <= p.fin; })[0];
    return x ? x.n : 'Afinamiento';
  }

  // ───── Plantillas de sesión ─────
  function calentamientoCarrera(min) {
    return { t: 'Calentamiento (' + (min >= 60 ? 15 : 10) + ' min)', items: [
      it('trote', min >= 60 ? '8 min a ritmo de charla' : '5 min a ritmo de charla'),
      it('rodillas', '2 × 30 m'), it('talgl', '2 × 30 m'), it('progresivos', '3 × 60 m, de suave a rápido'),
    ] };
  }
  function calma(extra) {
    var items = [it('trote', '5 min muy suave'), it('estCuad', '30 s por pierna'), it('estGem', '30 s por pierna'), it('estIsq', '30 s por pierna')];
    if (extra) items.push(it('estLumbar', '1 min'));
    return { t: 'Vuelta a la calma (10 min)', items: items };
  }

  function series800(fase, t800, ctx, ritmo) {
    var p = function (dist, fac) { return seg(t800 * dist / 800 * fac); };
    var red = ctx.min <= 30 ? 2 : ctx.min <= 45 ? 1 : 0, mas = ctx.min >= 90 ? 1 : 0;
    var lugar = ctx.pista ? 'Pista' : 'Terreno llano (mide con reloj GPS)';
    var principal, clave;
    if (!ritmo) {
      if (fase === 'Base') { principal = [it(null, (6 - red + mas) + ' × 200 m a ' + p(200, 1.06), 'Series de 200 m'), it(null, '1 min 30 s trotando muy suave', 'Recuperación entre series')]; clave = 'La primera serie no debe salirte más rápida que la última. Si las últimas se te hacen imposibles, has salido demasiado fuerte.'; }
      else if (fase === 'Específica') { principal = [it(null, (4 - Math.min(red, 2) + mas) + ' × 400 m a ' + p(400, 1.0), 'Series de 400 m'), it(null, '2 min trotando muy suave', 'Recuperación entre series')]; clave = 'Pasa por los 200 m de cada serie en ' + p(200, 1.0) + '. Ese es el reparto que buscamos el día de la prueba.'; }
      else { principal = [it(null, '3 × 300 m a ' + p(300, 0.98), 'Series de 300 m'), it(null, '3 min andando o trotando', 'Recuperación entre series')]; clave = 'Semanas de afinamiento: poco volumen y mucha calidad. Termina con sensación de que podrías hacer una serie más.'; }
      return { titulo: 'Series de 800 m', bases: 'm800', lugar: lugar, intensidad: fase === 'Base' ? 'media' : 'alta', principal: principal, clave: clave };
    }
    if (fase === 'Base') { principal = [it(null, (3 - Math.min(red, 1) + mas) + ' × 400 m a ' + p(400, 1.06), 'Series de 400 m'), it(null, '2 min trotando muy suave', 'Recuperación entre series')]; }
    else if (fase === 'Específica') { principal = [it(null, '2 × 600 m a ' + p(600, 1.0), 'Series de 600 m'), it(null, '3 min trotando muy suave', 'Recuperación entre series')]; }
    else { principal = [it(null, '1 × 600 m a ' + p(600, 1.0) + ' + 2 × 200 m rápidos', 'Ritmo de prueba'), it(null, '3 min entre bloques', 'Recuperación')]; }
    return { titulo: 'Ritmo de 800 m', lugar: lugar, intensidad: 'alta', principal: principal, clave: 'Mantén el mismo ritmo en todas las series. Mejor una serie uniforme que una rápida y otra hundida.' };
  }

  function natacion(fase, t50, ctx) {
    var red = ctx.min <= 30 ? 1 : 0;
    var principal;
    if (fase === 'Base') principal = [it('zambullida', '4 × 15 m rápidos, descanso 1 min'), it(null, (4 - red) + ' × 50 m a ' + segD(t50 + 8) + ', descanso 1 min 30 s', 'Series de 50 m')];
    else if (fase === 'Específica') principal = [it('zambullida', '4 × 15 m rápidos, descanso 1 min'), it(null, (6 - red * 2) + ' × 25 m a ' + segD(t50 / 2 + 1) + ', descanso 45 s', 'Series de 25 m'), it(null, '2 × 50 m a ' + segD(t50 + 3) + ', descanso 2 min', 'Series de 50 m')];
    else principal = [it('zambullida', '3 × 15 m'), it('llegada', '3 × 25 m a tope, descanso 1 min 30 s'), it(null, '1 × 50 m a ' + segD(t50 + 2), 'Simulacro de prueba')];
    return {
      titulo: 'Natación', bases: 'nado', lugar: 'Piscina' + (ctx.piscinaM ? ' ' + ctx.piscinaM + ' m' : ''), intensidad: fase === 'Base' ? 'media' : 'alta',
      bloques: [
        { t: 'Calentamiento (10 min)', items: [it(null, '200 m crol suave', 'Nado suave'), it('crol', '4 × 25 m centrándote en la técnica, descanso 20"')] },
        { t: 'Parte principal (' + (ctx.min >= 60 ? 30 : 20) + ' min)', items: principal },
        { t: 'Vuelta a la calma (5 min)', items: [it(null, '100 m crol o espalda', 'Nado suave')] },
      ],
      clave: 'En las salidas, zambúllete hacia delante, no hacia abajo, y aprovecha el deslizamiento antes de la primera brazada.',
    };
  }

  function fuerzaA(fase, ctx) {
    var carga = ctx.gimnasio ? '' : ' (sin gimnasio: con mochila con peso)';
    var items;
    if (fase === 'Base') items = [it('bulgara', '2 × 10 por pierna, descanso 90 s' + carga), it('cajon', '3 × 4, descanso 90 s'), it('talones', '2 × 15 por pierna'), it('nordico', '2 × 4, bajada lo más lenta posible'), it('planchaLat', '2 × 30 s por lado')];
    else if (fase === 'Específica') items = [it('bulgara', '3 × 6 por pierna, descanso 2 min' + carga), it('sqj', '4 × 4 justo después de cada serie de búlgara'), it('talones', '3 × 12 por pierna'), it('nordico', '3 × 4'), it('plancha', '3 × 40 s')];
    else items = [it('bulgara', '2 × 5 por pierna' + carga), it('pogo', '3 × 10'), it('planchaLat', '2 × 30 s por lado')];
    if (ctx.min <= 30) items = items.slice(0, 2); else if (ctx.min <= 45) items = items.slice(0, 3);
    return { t: 'Fuerza A · ' + (fase === 'Base' ? 'adaptación' : fase === 'Específica' ? 'fuerza y potencia' : 'mantenimiento'), rir: fase === 'Específica' ? 2 : 3, items: items };
  }

  function fuerzaB(fase, ctx) {
    var items = [it('dominadas', (fase === 'Específica' ? '3 × 6' : '2 × 8') + ', descanso 2 min'), it('remo', '3 × 10 por brazo'), it('flexiones', fase === 'Específica' ? '3 × 12' : '2 × 10'), it('cubana', '2 × 12, peso muy ligero'), it('vups', '2 × 12'), it('lumbar', '2 × 12'), it('aductores', '2 × 10 apretones de 5 s')];
    if (fase === 'Específica') items.splice(3, 0, it('flexExpl', '3 × 5'));
    if (ctx.min <= 45) items = items.slice(0, 4);
    return { t: 'Fuerza B · tren superior y tronco', rir: fase === 'Específica' ? 2 : 3, items: items };
  }

  function fuerzaBCorta(fase, ctx) {
    var items = [it('dominadas', (fase === 'Específica' ? '3 × 6' : '2 × 8') + ', descanso 2 min'), it('remo', '3 × 10 por brazo'), it('flexiones', fase === 'Específica' ? '3 × 12' : '2 × 10'), it('cubana', '2 × 12, peso muy ligero'), it('vups', '2 × 12')];
    if (ctx.min <= 45) items = items.slice(0, 3);
    return { t: 'Fuerza B · tren superior y tronco (al terminar)', rir: fase === 'Específica' ? 2 : 3, items: items };
  }

  /** Natación de día suave: técnica, salidas y nado cómodo (no cuenta como día duro). */
  function natacionTecnica(fase, t50, ctx) {
    var red = ctx.min <= 30 ? 1 : 0, afin = fase === 'Afinamiento';
    var principal = [it('crol', '4 × 25 m centrándote en la técnica, descanso 20"'), it('zambullida', (afin ? 3 : 4) + ' salidas con zambullida, sin forzar, cuidando la entrada al agua')];
    if (fase === 'Específica') principal.push(it('zambullida', '3 × 15 m rápidos tras la zambullida, descanso completo de 2 min'));
    principal.push(it(null, (afin ? 200 : red ? 200 : 300) + ' m de crol continuo y cómodo', 'Nado continuo'));
    return {
      titulo: 'Natación técnica', bases: 'nado', lugar: 'Piscina' + (ctx.piscinaM ? ' ' + ctx.piscinaM + ' m' : ''), intensidad: afin ? 'baja' : 'media',
      bloques: [
        { t: 'Calentamiento (10 min)', items: [it(null, '200 m crol suave', 'Nado suave')] },
        { t: 'Parte principal (' + (ctx.min >= 60 ? 30 : 20) + ' min)', items: principal },
        { t: 'Vuelta a la calma (5 min)', items: [it(null, '100 m crol o espalda', 'Nado suave')] },
      ],
      clave: 'Hoy es un día suave: técnica y nado cómodo. La velocidad, solo en las salidas cortas y con descanso completo.',
    };
  }

  /** Carrera continua a ritmo controlado (tempo): base aeróbica del 800 m en un día de carga media. */
  function tempo800(fase, ctx) {
    var min = ctx.min <= 30 ? 15 : ctx.min <= 45 ? 20 : 25;
    var lugar = ctx.pista ? 'Pista o parque' : 'Parque o terreno llano';
    if (fase === 'Afinamiento') return { titulo: 'Rodaje suave', lugar: lugar, intensidad: 'baja',
      principal: [it('trote', '12 min a ritmo de charla'), it('progresivos', '4 × 80 m, de suave a rápido, volviendo andando')],
      clave: 'Semanas de afinamiento: poco volumen. Sales con la sensación de haberte quedado corto, y eso es lo que buscamos.' };
    var principal = fase === 'Específica'
      ? [it(null, '2 × ' + (ctx.min <= 30 ? 7 : 10) + ' min a ritmo de tempo', 'Carrera continua (tempo)'), it(null, '3 min de trote muy suave entre medias', 'Recuperación')]
      : [it(null, min + ' min a ritmo cómodo pero exigente', 'Carrera continua (tempo)')];
    return { titulo: 'Tempo de carrera', lugar: lugar, intensidad: 'media', principal: principal,
      clave: 'Ritmo de tempo: puedes decir frases cortas, pero no conversar. Termina con sensación de poder seguir 10 minutos más. Es la base aeróbica del 800 m.' };
  }

  /** Día de compensación: rodaje suave y técnica de batida o de salida, sin cansancio. */
  function rodajeTecnica(fase, ctx) {
    var tecnica = ctx.foso || ctx.pista ? it('impulso', '6 × 6 apoyos marcando la batida, sin saltar') : it('salidas', '4 × 15 m al 70 %, cuidando la postura de salida');
    return { titulo: 'Rodaje suave y técnica', lugar: ctx.pista ? 'Pista o parque' : 'Parque', intensidad: 'baja',
      principal: [it('trote', (ctx.min <= 30 ? 15 : 20) + ' min a ritmo de charla'), tecnica],
      clave: 'Día suave para recuperar. La técnica, despacio y bien hecha.' };
  }

  function activacion() {
    return { titulo: 'Activación suave o descanso', lugar: 'Parque', intensidad: 'muy baja',
      bloques: [{ t: 'Sesión (20 min, opcional)', items: [it('trote', '12 min muy suave'), it('progresivos', '3 × 60 m, de suave a rápido'), it('salidas', '2 × 20 m suaves')] }],
      clave: 'Opcional. Si te notas cansado, descansa: llegar fresco al examen es lo que más cuenta. Duerme bien y no cambies tu forma de comer.' };
  }

  /** Semana del examen: un solo estímulo corto al principio, sin fuerza y los últimos 2 días casi de descanso. */
  function semanaExamen(d, f, ctx, dias, lunes, t800, t50) {
    var obj = new Date(f.objetivo.getFullYear(), f.objetivo.getMonth(), f.objetivo.getDate());
    var fin = f.finExamen ? new Date(f.finExamen.getFullYear(), f.finExamen.getMonth(), f.finExamen.getDate()) : obj;
    var pares = [], estimulo = false, nado = false;
    dias.forEach(function (dia) {
      var fecha = masDias(lunes, DIAS.indexOf(dia));
      var dia0 = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      var faltan = Math.round((obj - dia0) / DIA_MS);
      if (dia0 > fin) return;
      var s;
      if (faltan <= 0) {
        // Días de pruebas (del primer al último día de la convocatoria): cada alumno hace sus pruebas el día que le citen.
        s = { titulo: 'Periodo de pruebas: activación o descanso', lugar: 'Parque o lugar de la prueba', intensidad: 'muy baja',
          bloques: [{ t: 'Si hoy tienes pruebas: activación antes de empezar (15 min)', items: [it('trote', '6 min muy suave'), it('rodillas', '2 × 20 m'), it('progresivos', '3 × 60 m, de suave a rápido'), it('salidas', '2 × 20 m')] },
            { t: 'Si aún no te han citado: activación suave (20 min, opcional)', items: [it('trote', '12 min muy suave'), it('progresivos', '3 × 60 m, de suave a rápido')] }],
          clave: 'Semana de pruebas: no entrenes fuerte ni pruebes nada nuevo. Entre una prueba y la siguiente, abrígate, bebe agua y mantente activo con trote suave.' };
        pares.push({ dia: dia, s: s });
        return;
      }
      if (faltan >= 3 && !estimulo) {
        estimulo = true;
        s = { titulo: 'Último estímulo a ritmo de examen', bases: ['l50', 'salto', 'm800'], lugar: ctx.foso ? 'Pista con foso' : ctx.pista ? 'Pista' : 'Terreno llano', intensidad: 'alta',
          bloques: [calentamientoCarrera(60), { t: 'Parte principal (15 min)', items: [
            it('salidas', '2 × 30 m al 95 %, 4 min andando entre salidas'),
            it('impulso', '2 carreras completas marcando la batida, sin saltar'),
            it(null, '1 × 300 m a ritmo de examen (' + seg(t800 * 300 / 800) + ')', 'Ritmo de 800 m')] }, calma(false)],
          clave: 'Último estímulo antes del examen: corto e intenso. Termina con ganas de más.' };
      } else if (faltan >= 3 && ctx.piscina && !nado) {
        nado = true;
        s = { titulo: 'Natación suave y salidas', bases: 'nado', lugar: 'Piscina' + (ctx.piscinaM ? ' ' + ctx.piscinaM + ' m' : ''), intensidad: 'media',
          bloques: [{ t: 'Sesión (30 min)', items: [it(null, '300 m crol suave', 'Nado suave'), it('zambullida', '2 salidas con zambullida'),
            it(null, '2 × 25 m a ritmo de examen (' + segD(t50 / 2) + '), descanso 2 min', 'Ritmo de examen'), it(null, '100 m muy suave', 'Nado suave')] }],
          clave: 'Repasa la salida y la llegada a la pared. Nada de cansarse.' };
      } else if (faltan <= 2) {
        s = activacion();
      } else {
        s = { titulo: 'Rodaje suave', lugar: 'Parque', intensidad: 'baja',
          bloques: [{ t: 'Sesión (25 min)', items: [it('trote', '20 min a ritmo de charla'), it('estCuad', '30 s por pierna'), it('estIsq', '30 s por pierna')] }],
          clave: 'Solo para soltar las piernas. Esta semana ya no hay fuerza: llegas descansado al examen.' };
      }
      pares.push({ dia: dia, s: s });
    });
    return pares;
  }

  /**
   * Coloca las sesiones en los días del alumno: las de intensidad alta, lo más separadas posible
   * (y sin empezar la semana por una si se puede); el resto, en los huecos.
   */
  function colocar(lista, dias) {
    var dura = function (s) { return s.intensidad === 'alta' || s.intensidad === 'máxima'; };
    var duras = lista.filter(dura), resto = lista.filter(function (s) { return !dura(s); });
    var idx = dias.map(function (x) { return DIAS.indexOf(x); }), k = dias.length, huecos = [];
    if (duras.length >= 2 && k >= 2) {
      var mejor = null;
      for (var i = 0; i < k; i++) for (var j = i + 1; j < k; j++) {
        var g = idx[j] - idx[i], sc = Math.min(g, 7 - g) * 10 + (i > 0 ? 1 : 0);
        if (!mejor || sc > mejor.sc) mejor = { i: i, j: j, sc: sc };
      }
      huecos[mejor.i] = duras[0]; huecos[mejor.j] = duras[1];
      resto = duras.slice(2).concat(resto);
    } else if (duras.length === 1) {
      huecos[Math.min(1, k - 1)] = duras[0];
    }
    for (var n = 0; n < k; n++) if (!huecos[n] && resto.length) huecos[n] = resto.shift();
    return dias.map(function (dia, n) { return { dia: dia, s: huecos[n] }; }).filter(function (p) { return p.s; });
  }

  function velocidadSalto(fase, ctx, conFuerza) {
    var vel = fase === 'Base' ? '5 × 20 m · 2 min andando entre salidas' : fase === 'Específica' ? '6 × 30 m · 2 min 30 s entre salidas' : '4 × 30 m · recuperación completa';
    var salto = ctx.foso
      ? (fase === 'Base' ? [it('impulso', '4 × 6 apoyos, sin saltar al foso')] : [it('impulso', '4 × carrera completa marcando la batida'), it('saltoComp', (fase === 'Específica' ? 4 : 3) + ' saltos completos, descanso 3 min')])
      : [it('impulso', '5 × 6 apoyos marcando la batida (sin foso: no saltes, solo la batida)')];
    var s = {
      titulo: conFuerza ? 'Velocidad, salto y fuerza' : 'Velocidad y salto', bases: ['l50', 'salto'],
      lugar: (ctx.foso ? 'Pista con foso' : ctx.pista ? 'Pista' : 'Terreno llano') + (conFuerza ? (ctx.gimnasio ? ' y gimnasio' : ' y casa') : ''), intensidad: 'alta',
      bloques: [
        { t: 'Calentamiento (12 min)', items: [it('trote', '5 min'), it('rodillas', '2 × 30 m'), it('talgl', '2 × 30 m'), it('progresivos', '3 × 60 m')] },
        { t: 'Velocidad y salto (15 min)', items: [it('salidas', vel)].concat(salto) },
      ],
      clave: conFuerza ? 'Haz la velocidad y el salto antes que la fuerza, con las piernas frescas. Calidad antes que cantidad.' : 'Cada salida y cada batida, al 100 %. Si notas que pierdes velocidad, para: hoy cuenta la calidad.',
    };
    if (conFuerza) s.fuerza = fuerzaA(fase, ctx);
    return s;
  }

  function autotest(dia, d) {
    if (dia === 'A') return {
      titulo: 'Autotest · día A (pista)', lugar: 'Pista con foso', intensidad: 'máxima', bases: ['l50', 'salto', 'm800'],
      bloques: [
        { t: 'Calentamiento (20 min)', items: [it('trote', '10 min'), it('rodillas', '2 × 30 m'), it('talgl', '2 × 30 m'), it('progresivos', '4 × 60 m'), it('salidas', '2 × 20 m suaves')] },
        { t: 'Test (en este orden)', items: [it(null, '2 intentos con 5 min de descanso. Apunta el mejor. Si te cronometra una persona, suma +0,2 s.', '50 m lisos'), it(null, '2 intentos, medidos con cinta métrica desde la línea de batida.', 'Salto de longitud'), it(null, 'Descansa 15 min y corre 1 vez a tope. Apunta el tiempo.', '800 m')] },
        { t: 'Vuelta a la calma (10 min)', items: [it('trote', '5 min muy suave'), it('estCuad', '30 s por pierna'), it('estGem', '30 s por pierna')] },
      ],
      clave: 'Apunta las marcas en cuanto termines cada prueba y regístralas con el botón «Registrar mis marcas»: con ellas preparamos tu plan del mes siguiente.',
    };
    return {
      titulo: 'Autotest · día B (piscina)', lugar: 'Piscina', intensidad: 'máxima', bases: ['nado'],
      bloques: [
        { t: 'Calentamiento (15 min)', items: [it(null, '300 m crol suave', 'Nado suave'), it('crol', '4 × 25 m'), it('zambullida', '2 salidas suaves')] },
        { t: 'Test', items: [it(null, '1 intento con zambullida, a tope y sin pararte. Que te cronometre otra persona.', '50 m libres')] },
        { t: 'Vuelta a la calma (5 min)', items: [it(null, '200 m muy suave', 'Nado suave')] },
      ],
      clave: 'Igual que el día de la prueba: un solo intento. Toca la pared con la mano sin frenar.',
    };
  }

  /**
   * Semana n del plan (0 = semana de test inicial). opciones.autotest = true en la última semana de cada plan:
   * descarga y autotest de las cuatro pruebas para recalcular el plan siguiente.
   */
  function semana(d, f, n, opciones) {
    var ctx = {
      min: d.minutosSesion || 60, pista: !!(d.instalaciones && d.instalaciones.pista), foso: !!(d.instalaciones && d.instalaciones.foso),
      piscina: !!(d.instalaciones && d.instalaciones.piscina), gimnasio: !!(d.instalaciones && d.instalaciones.gimnasio), piscinaM: d.piscinaMetros,
    };
    var dias = (f.diasPlan && f.diasPlan.length) ? f.diasPlan : ['Lunes', 'Miércoles', 'Viernes'];
    var lunes = masDias(f.planIni, n === 0 ? -7 : (n - 1) * 7);
    var esTest = n === 0;
    var fase = esTest ? 'Test' : faseDe(f, n);
    var descarga = !esTest && !!(opciones && opciones.autotest);
    var t800 = meta(f, 'm800', d), t50 = meta(f, 'nado', d);
    var final = !esTest && !descarga && !f.provisional && n === f.semanas;
    var lista = [], pares = null;

    if (esTest || descarga) {
      lista = [autotest('A', d)];
      if (ctx.piscina) lista.push(autotest('B', d));
      var suave = { titulo: 'Rodaje suave', lugar: ctx.pista ? 'Pista o parque' : 'Parque', intensidad: 'baja',
        bloques: [{ t: 'Sesión (30 min)', items: [it('trote', '25 min a ritmo de charla'), it('estCuad', '30 s por pierna'), it('estIsq', '30 s por pierna')] }],
        clave: 'Semana de ' + (esTest ? 'test' : 'descarga') + ': llega descansado a los días de autotest.' };
      if (descarga && !ctx.piscina) lista.push({ titulo: 'Autotest · 50 m libres', lugar: 'Piscina (busca una para este día)', intensidad: 'máxima', bases: ['nado'],
        bloques: autotest('B', d).bloques, clave: 'Necesitamos tu marca de natación para ajustar el plan: busca una piscina para este día.' });
      while (lista.length < Math.min(dias.length, 3)) lista.splice(1, 0, suave);
    } else if (final) {
      pares = semanaExamen(d, f, ctx, dias, lunes, t800, t50);
    } else {
      // Semana tipo (Bompa): un día aláctico (velocidad, salto y fuerza), un día láctico (800 m o natación rápida)
      // y el resto de carga media o baja. Como máximo 2 días duros (1 en principiantes durante la base).
      var principiante = d.actividad === 'No';
      var maxDuras = principiante && fase === 'Base' ? 1 : 2;
      var prio = (f.prioridades || [])[0] || '800 m';
      var natIntensa = ctx.piscina && fase !== 'Base' && (/libres/.test(prio) ? n % 2 === 0 : n % 3 === 0);
      var vel = velocidadSalto(fase, ctx, true);
      var lact = natIntensa ? natacion(fase, t50, ctx) : series800(fase, t800, ctx, fase !== 'Base' && n % 2 === 0);
      var natMedia = ctx.piscina && !natIntensa ? natacionTecnica(fase, t50, ctx) : null;
      var tempo = tempo800(fase, ctx);
      var fb = { titulo: 'Fuerza B y técnica', lugar: ctx.gimnasio ? 'Gimnasio' : 'Casa', intensidad: 'media',
        bloques: [{ t: 'Calentamiento (8 min)', items: [it('jacks', '2 × 30 s'), it('zancadas', '2 × 8 por pierna'), it('sentadilla', '2 × 10 sin peso')] }],
        fuerza: fuerzaB(fase, ctx), clave: 'Técnica limpia en cada repetición. Si una repetición sale mal, para la serie.' };
      var k = dias.length;
      if (k <= 1) lista = [vel];
      else if (k === 2) lista = [vel, lact];
      else if (k === 3) lista = [vel, lact, natIntensa ? tempo : (natMedia || fb)];
      else if (k === 4) lista = natIntensa ? [vel, lact, tempo, fb] : [vel, lact, natMedia || fb, tempo];
      else lista = natIntensa ? [vel, lact, tempo, fb, rodajeTecnica(fase, ctx)]
        : natMedia ? [vel, lact, natMedia, tempo, fb] : [vel, lact, fb, tempo, rodajeTecnica(fase, ctx)];
      // Si hay más días duros de los permitidos, el día láctico pasa a su versión media.
      var duras = lista.filter(function (s) { return s.intensidad === 'alta'; }).length;
      if (duras > maxDuras && lista[1] === lact) lista[1] = natIntensa ? natacionTecnica(fase, t50, ctx) : tempo800(fase, ctx);
      // Toda semana lleva Fuerza A (piernas, con la velocidad) y Fuerza B (tren superior y tronco).
      // Si no hay un día dedicado a la Fuerza B, va al final de la sesión de tempo o, si no hay, de la de 800 m.
      if (lista.indexOf(fb) < 0) {
        var destino = lista.filter(function (s) { return s.titulo === 'Tempo de carrera' || s.titulo === 'Rodaje suave'; })[0]
          || lista.filter(function (s) { return s !== vel && !/^Natación/.test(s.titulo); })[0] || vel;
        if (destino !== vel) {
          destino.fuerza = fuerzaBCorta(fase, ctx);
          destino.titulo += ' + fuerza';
          destino.lugar += ctx.gimnasio ? ' y gimnasio' : ' y casa';
        }
      }
      lista.forEach(function (s) { if (!s.fuerza && s !== fb && !/^Natación/.test(s.titulo)) s.fuerza = { t: 'Tronco y prevención (10 min)', rir: 3, items: [it('planchaLat', '2 × 30 s por lado'), it('cubana', '2 × 12'), it('gemeloExc', '2 × 8 por pierna')] }; });
      pares = colocar(lista, dias);
      // Cese de la fuerza (Bompa): nada de fuerza en los 6 últimos días antes del examen.
      if (!f.provisional && fase === 'Afinamiento') pares.forEach(function (p) {
        var faltan = Math.round((f.objetivo - masDias(lunes, DIAS.indexOf(p.dia))) / DIA_MS);
        if (faltan > 6) return;
        if (faltan <= 2) { p.s = activacion(); return; } // los 2 últimos días antes del examen, nada intenso
        if (p.s === fb) p.s = rodajeTecnica(fase, ctx);
        else if (p.s.fuerza) { p.s.fuerza = null; p.s.titulo = p.s.titulo.replace(' + fuerza', ''); }
      });
    }
    if (!pares) pares = lista.slice(0, dias.length).map(function (s, i) { return { dia: dias[i], s: s }; });

    var sesiones = pares.map(function (p) {
      var s = p.s, idx = DIAS.indexOf(p.dia);
      var fecha = masDias(lunes, idx);
      var bloques = s.bloques ? s.bloques.slice() : [calentamientoCarrera(ctx.min), { t: 'Parte principal (' + (ctx.min >= 60 ? 35 : ctx.min >= 45 ? 25 : 15) + ' min)', items: s.principal }, calma(ctx.min >= 60)];
      return { dia: p.dia, fecha: fecha, titulo: s.titulo, lugar: s.lugar, min: ctx.min, intensidad: s.intensidad, bases: [].concat(s.bases || []), bloques: bloques, fuerza: s.fuerza || null, clave: s.clave };
    });
    var semanaTotal = f.semanas;
    return {
      n: n, fase: fase, test: esTest, descarga: descarga, lunes: lunes, domingo: masDias(lunes, 6),
      titulo: esTest ? 'Semana de test inicial' : final ? 'Semana del examen' : 'Semana ' + n + (f.provisional ? '' : ' de ' + semanaTotal) + ' · Fase ' + fase.toLowerCase() + (descarga ? ' (descarga y autotest)' : ''),
      sesiones: sesiones, horas: Math.round(sesiones.length * ctx.min / 60 * 10) / 10,
    };
  }

  return { semana: semana, CATALOGO: CATALOGO, BASES: BASES, DIAS: DIAS };
})();

if (typeof module !== 'undefined') module.exports = Sesiones;
