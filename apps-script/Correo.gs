/**
 * Academia 8 Islas · Correo con la ficha inicial
 * htmlFichaCorreo(d, f, logoSrc) devuelve el HTML del correo.
 *   d: respuestas del cuestionario · f: Calculo.ficha(d) · logoSrc: 'cid:logo' en Apps Script
 * Maquetado con tablas y estilos en línea para que se vea bien en Gmail, Outlook y móvil.
 */
var Correo = (function () {
  var C = { navy: '#0d1b3e', gold: '#ecb33b', goldInk: '#7b5b12', ink: '#1b2236', muted: '#69718a', line: '#dfe3ec', soft: '#f1f3f8', bg: '#e8ebf2' };
  var PILL = {
    verde: ['#dff2e7', '#1f7a4d'],
    ambar: ['#fbeccb', '#7b5b12'],
    rojo: ['#f9dcda', '#b42318'],
  };
  var FASE = { 'Base': ['#cdd5ea', C.navy, C.navy], 'Específica': [C.navy, '#ffffff', '#c6cee3'], 'Afinamiento': [C.gold, C.navy, C.navy] };
  var FONT = "font-family:Barlow,'Segoe UI',Arial,sans-serif;";
  var HEAD = "font-family:'Barlow Condensed','Arial Narrow',Arial,sans-serif;font-weight:700;";

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function h2(t) { return '<h2 style="' + HEAD + 'font-size:24px;line-height:1.1;color:' + C.navy + ';margin:28px 0 10px">' + t + '</h2>'; }
  function kv(k, v) { return '<p style="margin:4px 0;font-size:15px;line-height:1.45;color:' + C.ink + '"><span style="color:' + C.muted + '">' + k + ':</span> ' + v + '</p>'; }
  function h3(t) { return '<p style="margin:16px 0 6px;padding-bottom:4px;border-bottom:1px solid ' + C.line + ';font-weight:600;font-size:15px;color:' + C.navy + '">' + t + '</p>'; }

  function htmlFichaCorreo(d, f, logoSrc) {
    var L = Calculo.lista;
    var inst = [['pista', 'pista'], ['foso', 'foso de arena'], ['piscina', 'piscina' + (d.piscinaMetros ? ' de ' + d.piscinaMetros + ' m' : '')], ['gimnasio', 'gimnasio']]
      .filter(function (x) { return d.instalaciones && d.instalaciones[x[0]]; })
      .map(function (x) { return x[1] + ' (' + d.instalaciones[x[0]] + ' días/semana)'; });
    var lesiones = (d.lesiones || []).filter(function (x) { return x !== 'Ninguna'; });
    var nombre = esc(String(d.nombre || '').split(' ')[0]);

    var filas = f.pruebas.map(function (r) {
      var p = PILL[r.color];
      return '<tr>' +
        '<td style="padding:9px 8px;border-bottom:1px solid ' + C.line + ';font-weight:600">' + r.n + '</td>' +
        '<td style="padding:9px 8px;border-bottom:1px solid ' + C.line + ';text-align:right;font-weight:600;white-space:nowrap">' + Calculo.formato(r.k, r.valida) + '</td>' +
        '<td style="padding:9px 8px;border-bottom:1px solid ' + C.line + ';text-align:right">' + r.frente + '</td>' +
        '<td style="padding:9px 8px;border-bottom:1px solid ' + C.line + '"><span style="display:inline-block;background:' + p[0] + ';color:' + p[1] + ';border-radius:999px;padding:3px 10px;font-size:13px;font-weight:600">' + r.estado + '</span></td>' +
        '</tr>';
    }).join('');

    var fases = f.fases.map(function (x) {
      var c = FASE[x.n];
      return '<td width="' + Math.round(100 * x.semanas / Math.max(1, f.semanas)) + '%" style="background:' + c[0] + ';color:' + c[1] + ';padding:10px 12px;vertical-align:top">' +
        '<div style="font-weight:600;font-size:15px">' + x.n + '</div><div style="font-size:12.5px;color:' + c[2] + '">Sem. ' + x.ini + '-' + x.fin + ', ' + x.meses + '</div></td>';
    }).join('<td width="4" style="font-size:0;line-height:0">&nbsp;</td>');

    var avisos = f.avisos.length
      ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px"><tr><td style="border-left:4px solid ' + C.gold + ';background:#fff8e6;padding:10px 14px;font-size:15px;color:' + C.ink + '"><b>A tener en cuenta</b>' +
        f.avisos.map(function (a) { return '<p style="margin:6px 0 0">' + a + '</p>'; }).join('') + '</td></tr></table>'
      : '';

    var test = f.test
      ? '<p style="background:' + C.soft + ';border-radius:8px;padding:10px 14px;margin:10px 0 0;font-size:15px"><b>Semana de test inicial, ' + f.testTexto + '.</b> Alguna marca falta, es estimada o no sabemos si es reciente: la primera semana repites las pruebas con nuestro protocolo y el plan se ajusta a esos resultados.</p>'
      : '';

    return '' +
      '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600&family=Barlow+Condensed:wght@700&display=swap" rel="stylesheet"></head>' +
      '<body style="margin:0;padding:0;background:' + C.bg + '">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.bg + '"><tr><td align="center" style="padding:20px 10px">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border-radius:6px;' + FONT + 'color:' + C.ink + '">' +
      // Cabecera
      '<tr><td style="background:' + C.navy + ';border-bottom:6px solid ' + C.gold + ';padding:20px 24px;border-radius:6px 6px 0 0">' +
        '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
        '<td style="padding-right:16px;vertical-align:middle"><img src="' + logoSrc + '" width="64" alt="Academia 8 Islas" style="display:block;border:0"></td>' +
        '<td style="vertical-align:middle"><div style="' + HEAD + 'font-size:28px;line-height:1.05;color:#ffffff">Ficha inicial</div>' +
        '<div style="' + FONT + 'font-size:15px;color:#c6cee3;margin-top:4px">' + esc(d.nombre) + '</div></td>' +
        '</tr></table></td></tr>' +
      // Cuerpo
      '<tr><td style="padding:8px 24px 24px">' +
        '<p style="font-size:16px;line-height:1.5;margin:16px 0 0">Hola, ' + nombre + '. Gracias por completar el cuestionario. Esta es tu ficha inicial: con ella empieza tu plan de entrenamiento para las pruebas físicas.</p>' +
        h2('Test de entrada') +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse">' +
          '<tr style="color:' + C.muted + '"><td style="padding:6px 8px;border-bottom:1px solid ' + C.navy + '">Prueba</td><td style="padding:6px 8px;border-bottom:1px solid ' + C.navy + ';text-align:right">Tu marca</td><td style="padding:6px 8px;border-bottom:1px solid ' + C.navy + ';text-align:right">Frente a mínima</td><td style="padding:6px 8px;border-bottom:1px solid ' + C.navy + '">Estado</td></tr>' +
          filas + '</table>' +
        '<p style="font-size:13px;color:' + C.muted + ';margin:6px 0 0">Los tiempos de 50 m lisos cronometrados a mano incluyen +0,2 s de corrección.</p>' +
        h2('Tu plan, a partir de estos datos') +
        '<p style="font-size:15px;color:' + C.muted + ';margin:0">' + f.textoPlazo + '</p>' +
        test +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 4px;border-radius:8px"><tr>' + fases + '</tr></table>' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
          '<td width="50%" style="vertical-align:top;padding-right:12px">' +
            h3('Prioridades') + '<p style="margin:4px 0;font-size:15px">' + f.prioridades.map(function (p, i) { return (i + 1) + '. ' + p; }).join('<br>') + '</p>' +
            h3('Estructura semanal') + '<p style="margin:4px 0;font-size:15px">' + f.diasPlan.length + ' sesiones de ' + f.minutos + ' minutos: ' + L(f.diasPlan.map(function (x) { return x.toLowerCase(); })) + '</p>' +
          '</td>' +
          '<td width="50%" style="vertical-align:top;padding-left:12px">' +
            h3('Objetivos para el primer mes') + f.objetivosMes.map(function (o) { return '<p style="margin:4px 0;font-size:15px">' + o.n + ': <b>' + o.texto + '</b></p>'; }).join('') +
          '</td></tr></table>' +
        avisos +
        (d.municipio ? h2('Dónde entrenar cerca de ti') +
          '<p style="font-size:15px;margin:0 0 10px">Busca en el mapa las instalaciones más cercanas a ' + esc(d.municipio) + ':</p>' +
          [['pista de atletismo', 'Pistas de atletismo'], ['piscina', 'Piscinas'], ['gimnasio', 'Gimnasios']].map(function (x) {
            return '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(x[0] + ' ' + d.municipio) + '" style="display:inline-block;margin:0 8px 8px 0;background:#ffffff;color:' + C.navy + ';border:2px solid ' + C.navy + ';border-radius:7px;padding:7px 13px;font-weight:600;font-size:14px;text-decoration:none">&#128205; ' + x[1] + '</a>';
          }).join('') : '') +
        h2('Tus datos') +
        kv('Baremo', d.sexo === 'Mujer' ? 'Mujeres' : 'Hombres') +
        (f.imc != null ? kv('IMC', String(f.imc).replace('.', ',') + (f.imcDentro ? ', dentro del rango de las bases' : ', fuera del rango de las bases') + ' (calculado al momento; ni tu altura ni tu peso se guardan)') : '') +
        kv('Días disponibles', f.disponibilidad || '—') +
        kv('Instalaciones', inst.length ? L(inst) : 'ninguna') +
        kv('Consentimiento lesiones', d.consentimientoLesiones ? 'dado. ' + (lesiones.length ? 'Pruebas afectadas: ' + L(lesiones) + '.' : 'Ninguna prueba afectada.') : 'no dado') +
        '<p style="font-size:15px;line-height:1.5;margin:22px 0 0">En un correo aparte te llega tu plan de entrenamiento para las próximas semanas. Si algún dato no es correcto, responde a este correo y lo corregimos.</p>' +
        '<p style="font-size:13px;line-height:1.45;color:' + C.muted + ';margin:22px 0 0;padding-top:12px;border-top:1px solid ' + C.line + '">Este plan es orientativo y no sustituye la valoración médica. Si durante el entrenamiento notas dolor en el pecho, mareos o falta de aire anormal, detente y consulta con un médico.</p>' +
      '</td></tr>' +
      // Lema
      '<tr><td style="background:' + C.navy + ';padding:16px 24px;border-radius:0 0 6px 6px;text-align:center">' +
        '<div style="' + FONT + 'font-size:13px;letter-spacing:.06em;color:#c6cee3">CUANDO TODO VAYA MAL…</div>' +
        '<div style="' + HEAD + 'font-size:26px;color:' + C.gold + ';margin-top:2px">SIGUE ADELANTE</div>' +
        '<div style="' + FONT + 'font-size:12px;color:#c6cee3;margin-top:8px">Academia 8 Islas</div>' +
      '</td></tr>' +
      '</table></td></tr></table></body></html>';
  }

  // ───── Plan mensual y seguimiento semanal ─────
  var DIAS_C = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  var MESES_C = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fechaC(dt) { return dt.getDate() + ' de ' + MESES_C[dt.getMonth()]; }
  function boton(url, texto, oro) {
    return '<a href="' + url + '" style="display:inline-block;background:' + (oro ? C.gold : '#ffffff') + ';color:' + C.navy + ';border:2px solid ' + (oro ? C.gold : C.navy) + ';border-radius:7px;padding:8px 14px;font-weight:600;font-size:14px;text-decoration:none">' + texto + '</a>';
  }
  function cabecera(titulo, sub1, sub2) {
    // Estilos repetidos en una sola hoja (Gmail los admite en <head>): mantiene el plan por debajo del límite de 102 KB
    var css = '<style>.r td{border-bottom:1px solid ' + C.line + ';vertical-align:top;padding:7px 0}.r .n{font-size:15px;width:42%}' +
      '.r .d{font-size:14.5px;color:#3a4152;padding:7px 8px}.r .l{text-align:right}.r a{color:' + C.navy + ';font-weight:600;font-size:13px;white-space:nowrap}' +
      '.v{font-size:12px;color:' + C.muted + '}.ims{padding:6px 0 4px!important;font-size:0}.im{display:inline-block;width:128px;vertical-align:top;margin:0 8px 8px 0}' +
      '.im img{display:block;border-radius:6px;border:0}.im div{font-size:11.5px;line-height:1.3;color:' + C.ink + ';margin-top:3px}' +
      '.b{margin:14px 0 2px;font-weight:600;font-size:15px;color:' + C.goldInk + '}.k{background:' + C.soft + ';border-radius:8px;padding:9px 13px;font-size:14.5px;margin:12px 0 0}</style>';
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + css + '</head>' +
      '<body style="margin:0;padding:0;background:' + C.bg + '"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.bg + '"><tr><td align="center" style="padding:20px 10px">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;background:#ffffff;border-radius:6px;' + FONT + 'color:' + C.ink + '">' +
      '<tr><td style="background:' + C.navy + ';border-bottom:6px solid ' + C.gold + ';padding:20px 24px;border-radius:6px 6px 0 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="padding-right:16px;vertical-align:middle"><img src="cid:logo" width="64" alt="Academia 8 Islas" style="display:block;border:0"></td>' +
      '<td style="vertical-align:middle"><div style="' + HEAD + 'font-size:28px;line-height:1.05;color:#ffffff">' + titulo + '</div>' +
      '<div style="font-size:15px;color:#c6cee3;margin-top:4px">' + sub1 + '</div>' + (sub2 ? '<div style="font-size:14px;color:' + C.gold + ';margin-top:2px">' + sub2 + '</div>' : '') +
      '</td></tr></table></td></tr><tr><td style="padding:10px 24px 24px">';
  }
  function pie(urlMolestia) {
    return (urlMolestia ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px"><tr><td style="background:' + C.navy + ';color:#ffffff;border-radius:10px;padding:18px 20px">' +
        '<div style="' + HEAD + 'font-size:22px;color:' + C.gold + '">¿Alguna molestia o algo que cambiar?</div>' +
        '<div style="font-size:15px;color:#d5dbea;margin:6px 0 12px">Si notas alguna molestia, no puedes hacer una sesión o necesitas cambiar días u horarios, avísanos y ajustamos tu plan.</div>' +
        boton(urlMolestia, 'Tengo una molestia o quiero cambiar algo', true) +
      '</td></tr></table>' : '') +
      '<p style="font-size:15px;margin:20px 0 0">Un saludo,<br><b>Equipo de Academia 8 Islas</b></p>' +
      '<p style="font-size:13px;line-height:1.45;color:' + C.muted + ';margin:18px 0 0;padding-top:12px;border-top:1px solid ' + C.line + '">Este plan es orientativo y no sustituye la valoración médica. Si durante el entrenamiento notas dolor en el pecho, mareos o falta de aire anormal, detente y consulta con un médico.</p>' +
      '</td></tr><tr><td style="background:' + C.navy + ';padding:16px 24px;border-radius:0 0 6px 6px;text-align:center"><div style="font-size:13px;letter-spacing:.06em;color:#c6cee3">CUANDO TODO VAYA MAL…</div>' +
      '<div style="' + HEAD + 'font-size:26px;color:' + C.gold + ';margin-top:2px">SIGUE ADELANTE</div></td></tr></table></td></tr></table></body></html>';
  }

  /**
   * Cuerpo de una semana. El estado es compartido entre las semanas del mismo correo:
   * las imágenes, los vídeos y las bases de cada ejercicio se muestran la primera vez que aparecen
   * (siempre los mismos); después se remite a esa semana para no repetir.
   */
  function cuerpoSemana(sem, est, imgSrc) {
    var CAT = Sesiones.CATALOGO, BAS = Sesiones.BASES;
    var etiqueta = sem.test ? 'la semana de test' : 'la semana ' + sem.n;
    var porDia = {}; sem.sesiones.forEach(function (s) { porDia[s.dia] = s; });
    var celdas = Sesiones.DIAS.map(function (dia, i) {
      var s = porDia[dia], dt = new Date(sem.lunes.getFullYear(), sem.lunes.getMonth(), sem.lunes.getDate() + i);
      return '<td width="14%" style="background:' + (s ? C.navy : C.soft) + ';color:' + (s ? '#ffffff' : C.muted) + ';border-radius:6px;padding:7px 6px;vertical-align:top;font-size:12px">' +
        '<div style="font-weight:600;color:' + (s ? C.gold : C.muted) + '">' + DIAS_C[i] + ' ' + dt.getDate() + '</div>' +
        '<div style="font-weight:600;font-size:13px;margin-top:2px">' + (s ? s.titulo : 'Descanso') + '</div></td>';
    }).join('<td width="4" style="font-size:0">&nbsp;</td>');

    function fila(item) {
      var ex = item.ex ? CAT[item.ex] : null, n = item.nombre || (ex ? ex.n : '');
      var conMedios = ex && (ex.video || ex.img), visto = conMedios && est.mostrados[item.ex];
      var enlace = ex && ex.video ? '<a href="' + ex.video + '">' + (ex.fuente === 'Academia' ? 'Ver técnica' : 'Ver vídeo') + '</a>' : '';
      var s = '<tr class="r"><td class="n">' + n + (visto && ex.img ? '<div class="v">Imágenes en ' + visto + '</div>' : '') + '</td>' +
        '<td class="d">' + item.d + '</td><td class="l">' + enlace + '</td></tr>';
      if (ex && ex.img && !visto) {
        s += '<tr class="r"><td colspan="3" class="ims">' +
          ex.img.map(function (k, i) { est.usadas[k] = true; return '<div class="im"><img src="' + imgSrc(k) + '" width="128" height="96" alt="' + esc(ex.cap[i]) + '">' +
            '<div><b>' + (i + 1) + '.</b> ' + ex.cap[i] + '</div></div>'; }).join('') + '</td></tr>';
      }
      if (conMedios && !visto) est.mostrados[item.ex] = etiqueta;
      return s;
    }
    function bloque(b) {
      return '<p class="b">' + b.t + '</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + b.items.map(fila).join('') + '</table>';
    }
    function bases(k) {
      var b = BAS[k];
      return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 4px"><tr><td style="border:1px solid ' + C.line + ';border-left:5px solid ' + C.gold + ';border-radius:8px;padding:10px 14px">' +
        '<div style="font-size:11.5px;letter-spacing:.06em;font-weight:600;color:' + C.goldInk + '">BASES DE LA PRUEBA</div>' +
        '<div style="' + HEAD + 'font-size:20px;color:' + C.navy + ';margin:2px 0 4px">' + b.n + '</div>' +
        b.lineas.map(function (l) { return '<div style="font-size:14.5px;margin:2px 0">• ' + l.replace('class="no"', 'style="color:#b42318;font-weight:600"') + '</div>'; }).join('') +
        '<div style="margin-top:8px">' + (b.video ? boton(b.video, '&#9654; Vídeo de la Academia', true) : '<span style="font-size:13px;color:' + C.muted + '">El vídeo de la Academia de esta prueba estará disponible próximamente.</span>') + '</div>' +
        '</td></tr></table>';
    }
    var sesiones = sem.sesiones.map(function (s) {
      var bs = s.bases.filter(function (k) { if (est.bases[k]) return false; est.bases[k] = true; return true; });
      var h = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0"><tr><td style="border:1px solid ' + C.line + ';border-radius:10px;padding:14px 16px">' +
        '<div style="border-bottom:1px solid ' + C.line + ';padding-bottom:6px"><span style="' + HEAD + 'font-size:24px;color:' + C.navy + '">' + s.dia + ' ' + s.fecha.getDate() + '</span> ' +
        '<span style="font-weight:600;font-size:16px;margin-left:6px">' + s.titulo + '</span><br><span style="color:' + C.muted + ';font-size:14px">' + s.lugar + ' · ' + s.min + ' min · intensidad ' + s.intensidad + '</span></div>' +
        bs.map(bases).join('') + s.bloques.map(bloque).join('');
      if (s.fuerza) {
        h += '<p class="b">' + s.fuerza.t + '</p>' +
          '<p class="k" style="margin:4px 0"><b>RIR ' + s.fuerza.rir + ':</b> termina cada serie sintiendo que podrías hacer ' + s.fuerza.rir + ' repeticiones más.</p>' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + s.fuerza.items.map(fila).join('') + '</table>';
      }
      return h + '<p class="k"><b>Clave de la sesión:</b> ' + s.clave + '</p></td></tr></table>';
    }).join('');
    return '<p style="margin:26px 0 4px;' + HEAD + 'font-size:24px;color:' + C.navy + ';border-top:3px solid ' + C.gold + ';padding-top:12px">' + sem.titulo + '</p>' +
      '<p style="margin:0 0 8px;font-size:14px;color:' + C.muted + '">Del ' + fechaC(sem.lunes) + ' al ' + fechaC(sem.domingo) + ' · ' + sem.sesiones.length + ' sesiones, unas ' + String(sem.horas).replace('.', ',') + ' horas</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' + celdas + '</tr></table>' + sesiones;
  }

  var defImg = function (k) { return 'cid:img_' + k.replace(/-/g, '_'); };
  function cajaMarcas(urlMarcas) {
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0"><tr><td style="border:2px solid ' + C.gold + ';background:#fff8e6;border-radius:10px;padding:14px 16px">' +
      '<div style="' + HEAD + 'font-size:22px;color:' + C.navy + '">Semana de autotest</div>' +
      '<div style="font-size:15px;margin:6px 0 12px">Esta semana repites las cuatro pruebas. Cuando las tengas, regístralas aquí: con tus marcas preparamos tu informe y tu plan del mes siguiente.</div>' +
      boton(urlMarcas, 'Registrar mis marcas', true) + '</td></tr></table>';
  }

  /**
   * Primer día de cada plan mensual: resumen de las semanas del mes y la primera semana en detalle.
   * Devuelve { html, imagenes }.
   */
  function htmlInicioPlan(d, f, semanas, urlAviso, urlMarcas, imgSrc, siguienteMes) {
    var est = { usadas: {}, mostrados: {}, bases: {} };
    var nombre = esc(String(d.nombre || '').split(' ')[0]);
    var primera = semanas[0], ultima = semanas[semanas.length - 1];
    var resumen = semanas.map(function (s) {
      var dias = s.sesiones.map(function (x) { return '<b>' + x.dia.slice(0, 3) + ' ' + x.fecha.getDate() + ':</b> ' + x.titulo; }).join(' · ');
      return '<tr><td style="padding:8px 10px 8px 0;border-bottom:1px solid ' + C.line + ';vertical-align:top;white-space:nowrap;font-weight:600;color:' + C.navy + '">' + (s.test ? 'Test' : 'Semana ' + s.n) +
        '<div style="font-weight:400;font-size:12.5px;color:' + C.muted + '">' + fechaC(s.lunes) + '</div></td>' +
        '<td style="padding:8px 0;border-bottom:1px solid ' + C.line + ';font-size:14px">' + (s.descarga ? '<span style="color:' + C.goldInk + ';font-weight:600">Descarga y autotest. </span>' : s.test ? '<span style="color:' + C.goldInk + ';font-weight:600">Test inicial. </span>' : '') + dias + '</td></tr>';
    }).join('');
    var obj = (f.objetivosMes || []).map(function (o) { return '<td style="padding:8px;background:' + C.soft + ';border-radius:8px;text-align:center;font-size:13px">' + o.n + '<div style="' + HEAD + 'font-size:20px;color:' + C.navy + '">' + o.texto.replace(' (mantener)', '') + '</div></td>'; }).join('<td width="6"></td>');
    var html = cabecera(siguienteMes ? 'Tu plan del mes siguiente' : 'Tu plan de entrenamiento', esc(d.nombre), 'Del ' + fechaC(primera.lunes) + ' al ' + fechaC(ultima.domingo)) +
      '<p style="font-size:16px;line-height:1.5;margin:14px 0 0">Hola, ' + nombre + '. ' + (siguienteMes ? 'Con tus marcas del autotest hemos ajustado tu plan para las próximas semanas.' : 'Aquí tienes tu plan para las próximas semanas, preparado a partir de tu cuestionario.') + '</p>' +
      '<p style="margin:20px 0 8px;' + HEAD + 'font-size:22px;color:' + C.navy + '">Tus objetivos este mes</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' + obj + '</tr></table>' +
      '<p style="margin:22px 0 6px;' + HEAD + 'font-size:22px;color:' + C.navy + '">Resumen del mes</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14.5px">' + resumen + '</table>' +
      '<p style="font-size:15px;line-height:1.5;margin:14px 0 0;background:' + C.soft + ';border-radius:8px;padding:10px 14px">Debajo tienes <b>tu primera semana en detalle</b>. <b>Entre el viernes y el domingo de cada semana recibirás el detalle de la semana siguiente</b>, con sus vídeos y sus imágenes. La última semana del mes repetimos las pruebas para medir tu evolución y ajustar el plan.</p>' +
      cuerpoSemana(primera, est, imgSrc || defImg) + (primera.descarga && urlMarcas ? cajaMarcas(urlMarcas) : '') + pie(urlAviso);
    return { html: html, imagenes: Object.keys(est.usadas) };
  }

  /** Viernes: detalle de la semana siguiente. Devuelve { html, imagenes }. */
  function htmlSemanaDetalle(d, sem, urlAviso, urlMarcas, imgSrc) {
    var est = { usadas: {}, mostrados: {}, bases: {} };
    var nombre = esc(String(d.nombre || '').split(' ')[0]);
    var html = cabecera('Tu semana de entrenamiento', esc(d.nombre) + ' · ' + sem.titulo, 'Del ' + fechaC(sem.lunes) + ' al ' + fechaC(sem.domingo)) +
      '<p style="font-size:16px;line-height:1.5;margin:14px 0 0">Hola, ' + nombre + '. ' +
      (sem.descarga ? 'Llega la última semana del mes: bajamos la carga y repetimos las pruebas para ver tu evolución.' : 'Aquí tienes tu semana. Respeta los ritmos y los descansos: ahí está la mejora.') + '</p>' +
      (sem.descarga && urlMarcas ? cajaMarcas(urlMarcas) : '') +
      cuerpoSemana(sem, est, imgSrc || defImg) + pie(urlAviso);
    return { html: html, imagenes: Object.keys(est.usadas) };
  }

  /** Recordatorio para registrar las marcas del autotest. */
  function htmlRecordatorioMarcas(d, urlMarcas) {
    var nombre = esc(String(d.nombre || '').split(' ')[0]);
    return cabecera('Registra tus marcas', esc(d.nombre), 'Autotest del mes') +
      '<p style="font-size:16px;line-height:1.5;margin:14px 0 0">Hola, ' + nombre + '. Todavía no hemos recibido tus marcas del autotest.</p>' +
      '<p style="font-size:15px;line-height:1.5;margin:10px 0 0">Para preparar tu plan del mes siguiente necesitamos tu marca actual de <b>las cuatro pruebas</b>: 50 m lisos, 800 m, salto de longitud y 50 m libres. Si todavía no las has hecho, hazlas cuanto antes siguiendo el protocolo de la semana de autotest.</p>' +
      '<p style="margin:16px 0">' + boton(urlMarcas, 'Registrar mis marcas', true) + '</p>' +
      '<p style="font-size:14px;color:' + C.muted + ';margin:0">Mientras tanto, mantén dos o tres sesiones suaves por semana para no perder lo ganado.</p>' + pie('');
  }

  /** Informe mensual (diseño "Informe mensual"): antes/ahora frente a mínima y objetivo, recorrido y objetivos del mes siguiente. */
  function htmlInforme(d, fAntes, fAhora, fInicio, mesTexto) {
    var nombre = esc(String(d.nombre || '').split(' ')[0]);
    var PILL = { verde: ['#dff2e7', '#1f7a4d'], ambar: ['#fbeccb', '#7b5b12'], rojo: ['#f9dcda', '#b42318'] };
    var antes = {}, inicio = {}; fAntes.pruebas.forEach(function (r) { antes[r.k] = r; }); fInicio.pruebas.forEach(function (r) { inicio[r.k] = r; });
    var aprobadas = fAhora.pruebas.filter(function (r) { return r.color === 'verde' || r.estado === 'Aprobado, sin margen'; }).length;
    var mejoran = fAhora.pruebas.filter(function (r) { var a = antes[r.k]; return a.valida != null && r.valida != null && (r.tiempo ? r.valida < a.valida : r.valida > a.valida); }).length;
    var prio = fAhora.prioridades[0];
    var filas = fAhora.pruebas.map(function (r) {
      var p = PILL[r.color];
      return '<tr><td style="padding:9px 6px;border-bottom:1px solid ' + C.line + ';font-weight:600">' + r.n + '</td>' +
        '<td style="padding:9px 6px;border-bottom:1px solid ' + C.line + ';text-align:right;color:' + C.muted + '">' + Calculo.formato(r.k, antes[r.k].valida) + '</td>' +
        '<td style="padding:9px 6px;border-bottom:1px solid ' + C.line + ';text-align:right;font-weight:600">' + Calculo.formato(r.k, r.valida) + '</td>' +
        '<td style="padding:9px 6px;border-bottom:1px solid ' + C.line + ';text-align:right">' + Calculo.formato(r.k, r.minima) + '</td>' +
        '<td style="padding:9px 6px;border-bottom:1px solid ' + C.line + ';text-align:right">' + Calculo.formato(r.k, r.objetivo) + '</td>' +
        '<td style="padding:9px 6px;border-bottom:1px solid ' + C.line + '"><span style="display:inline-block;background:' + p[0] + ';color:' + p[1] + ';border-radius:999px;padding:3px 9px;font-size:12.5px;font-weight:600">' + r.estado + '</span></td></tr>';
    }).join('');
    var barras = fAhora.pruebas.map(function (r) {
      var i0 = inicio[r.k].valida, v = r.valida, o = r.objetivo;
      var pct = i0 == null || v == null || i0 === o ? 0 : Math.max(0, Math.min(100, Math.round((v - i0) / (o - i0) * 100)));
      return '<tr><td style="padding:8px 10px 8px 0;font-weight:600;width:130px;vertical-align:top">' + r.n + '<div style="font-weight:400;font-size:12.5px;color:' + C.muted + '">' + (pct >= 100 ? 'Objetivo alcanzado' : pct + ' % recorrido') + '</div></td>' +
        '<td style="padding:8px 0;vertical-align:top"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
        (pct > 0 ? '<td width="' + pct + '%" style="background:' + C.navy + ';height:10px;border-radius:5px 0 0 5px;font-size:0">&nbsp;</td>' : '') +
        (pct < 100 ? '<td style="background:#e4e8f1;height:10px;border-radius:' + (pct > 0 ? '0 5px 5px 0' : '5px') + ';font-size:0">&nbsp;</td>' : '') + '</tr></table>' +
        '<div style="font-size:12.5px;color:' + C.muted + ';margin-top:3px">Inicio ' + Calculo.formato(r.k, i0) + ' · Ahora <b style="color:' + C.ink + '">' + Calculo.formato(r.k, v) + '</b> · Objetivo ' + Calculo.formato(r.k, o) + '</div></td></tr>';
    }).join('');
    var objetivos = fAhora.objetivosMes.map(function (o) { return '<p style="margin:4px 0;font-size:15px">' + o.n + ': <b>' + o.texto + '</b></p>'; }).join('');
    return cabecera('Informe mensual de pruebas físicas', esc(d.nombre), 'Evaluación de ' + mesTexto) +
      '<p style="font-size:16px;line-height:1.5;margin:14px 0 0;background:' + C.soft + ';border-radius:8px;padding:12px 14px">Hola, ' + nombre + '. Este mes mejoras en <b>' + mejoran + ' de 4 pruebas</b> y ya superas la mínima en <b>' + aprobadas + '</b>. Tu prioridad ahora: <b>' + prio + '</b>.</p>' +
      '<p style="margin:20px 0 6px;' + HEAD + 'font-size:22px;color:' + C.navy + '">Tu semáforo</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse"><tr style="color:' + C.muted + ';font-size:13px">' +
      '<td style="padding:6px;border-bottom:1px solid ' + C.navy + '">Prueba</td><td style="padding:6px;border-bottom:1px solid ' + C.navy + ';text-align:right">Mes anterior</td><td style="padding:6px;border-bottom:1px solid ' + C.navy + ';text-align:right">Este mes</td><td style="padding:6px;border-bottom:1px solid ' + C.navy + ';text-align:right">Mínima</td><td style="padding:6px;border-bottom:1px solid ' + C.navy + ';text-align:right">Objetivo</td><td style="padding:6px;border-bottom:1px solid ' + C.navy + '">Estado</td></tr>' +
      filas + '</table>' +
      '<p style="font-size:13px;color:' + C.muted + ';margin:6px 0 0">Los tiempos de 50 m lisos cronometrados a mano incluyen +0,2 s de corrección.</p>' +
      '<p style="margin:22px 0 6px;' + HEAD + 'font-size:22px;color:' + C.navy + '">Recorrido hacia tu objetivo</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + barras + '</table>' +
      '<p style="margin:22px 0 6px;' + HEAD + 'font-size:22px;color:' + C.navy + '">Tus objetivos para el mes que empieza</p>' + objetivos +
      '<p style="font-size:15px;line-height:1.5;margin:16px 0 0">En un correo aparte te llega tu plan del mes, ajustado a estas marcas.</p>' + pie('');
  }

  /** Recomendación tras un aviso de molestia o cambio (texto sencillo, sin adornos). */
  function htmlRecomendacion(nombre, rec, urlReanudar) {
    return '<div style="' + FONT + 'font-size:15px;line-height:1.55;color:' + C.ink + ';max-width:560px">' +
      '<p>Hola, ' + esc(String(nombre || '').split(' ')[0]) + ':</p>' +
      '<p style="' + (rec.urgente ? 'border-left:4px solid #b42318;background:#fdf0ef;' : 'border-left:4px solid ' + C.gold + ';background:#fff8e6;') + 'padding:10px 14px;border-radius:4px"><b>' + rec.titulo + '.</b><br>' + rec.texto + '</p>' +
      (urlReanudar ? '<p style="margin:16px 0">Cuando tengas el visto bueno del profesional:</p><p>' + boton(urlReanudar, 'Ya puedo volver a entrenar', true) + '</p>' : '') +
      '<p>Un saludo,<br><b>Equipo de Academia 8 Islas</b></p></div>';
  }

  /** Acuse de recibo inmediato (corto y personal). */
  function htmlAcuse(d) {
    var nombre = esc(String(d.nombre || '').split(' ')[0]);
    return '<div style="' + FONT + 'font-size:15px;line-height:1.55;color:' + C.ink + ';max-width:560px">' +
      '<p>Hola, ' + nombre + ':</p>' +
      '<p>¡Hemos recibido tu cuestionario! Gracias por tomarte el tiempo.</p>' +
      '<p>En cuanto los compañeros preparen tu plan de entrenamiento, te lo hacemos llegar a este correo.</p>' +
      '<p>Si mientras tanto quieres contarnos algo, responde a este correo.</p>' +
      '<p>Un abrazo,<br><b>Equipo de Academia 8 Islas</b></p></div>';
  }

  return { htmlFichaCorreo: htmlFichaCorreo, htmlInicioPlan: htmlInicioPlan, htmlSemanaDetalle: htmlSemanaDetalle, htmlRecordatorioMarcas: htmlRecordatorioMarcas, htmlInforme: htmlInforme, htmlRecomendacion: htmlRecomendacion, htmlAcuse: htmlAcuse };
})();

if (typeof module !== 'undefined') module.exports = Correo;