// Lê oportunidades publicadas em uma planilha Google CSV, sem dependências.
// Configure SHEET_OPORTUNIDADES_CSV em Vercel > Project > Settings > Environment Variables.

const INSTAGRAM = 'https://www.instagram.com/cadesignufpel';
const CORES = { verde: true, amarelo: true, ciano: true };
const PUBLICADOS = { sim: true, s: true, x: true, true: true, 1: true };

// Remove espaço e aspas que sobram ao colar valores no painel da Vercel.
function limparEnv(valor) {
  return String(valor || '').trim().replace(/^["']|["']$/g, '');
}

function parseCsv(texto) {
  var fonte = String(texto || '').replace(/^\uFEFF/, '');
  var linhas = [];
  var linha = [];
  var campo = '';
  var emAspas = false;

  for (var i = 0; i < fonte.length; i++) {
    var caractere = fonte.charAt(i);

    if (caractere === '"') {
      if (emAspas && fonte.charAt(i + 1) === '"') {
        campo += '"';
        i++;
      } else if (emAspas) {
        emAspas = false;
      } else if (campo === '') {
        emAspas = true;
      } else {
        campo += caractere;
      }
    } else if (!emAspas && caractere === ',') {
      linha.push(campo);
      campo = '';
    } else if (!emAspas && (caractere === '\n' || caractere === '\r')) {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = '';
      if (caractere === '\r' && fonte.charAt(i + 1) === '\n') i++;
    } else {
      campo += caractere;
    }
  }

  if (campo !== '' || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }

  return linhas;
}

function slug(titulo) {
  return String(titulo || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function textoDaCelula(linha, indices, nome) {
  var indice = indices[nome];
  return indice == null ? '' : String(linha[indice] || '').trim();
}

function dataChave(valor) {
  var match = /^(?:(\d{4})-(\d{2})-(\d{2})|(\d{2})\/(\d{2})\/(\d{4}))$/.exec(String(valor || '').trim());
  if (!match) return null;

  var ano = Number(match[1] || match[6]);
  var mes = Number(match[2] || match[5]);
  var dia = Number(match[3] || match[4]);
  var data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
  return String(ano * 10000 + mes * 100 + dia);
}

function hojeEmSaoPaulo(hoje) {
  if (typeof hoje === 'string') return dataChave(hoje);
  var data = hoje instanceof Date ? hoje : new Date();
  var partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(data);
  var valores = {};
  partes.forEach(function(parte) { valores[parte.type] = parte.value; });
  return valores.year + valores.month + valores.day;
}

function normalizar(linhas, hoje) {
  if (!Array.isArray(linhas) || !linhas.length) return [];

  var indices = {};
  linhas[0].forEach(function(celula, indice) {
    var nome = String(celula || '').trim().toLowerCase();
    if (nome && indices[nome] == null) indices[nome] = indice;
  });

  var referencia = hojeEmSaoPaulo(hoje);
  var usados = {};
  var itens = [];

  for (var i = 1; i < linhas.length && itens.length < 12; i++) {
    var linha = linhas[i];
    if (!Array.isArray(linha)) continue;
    if (!PUBLICADOS[textoDaCelula(linha, indices, 'publicado').toLowerCase()]) continue;

    var titulo = textoDaCelula(linha, indices, 'titulo').slice(0, 140);
    if (!titulo) continue;

    var expira = dataChave(textoDaCelula(linha, indices, 'expira'));
    if (expira && referencia && expira < referencia) continue;

    var cor = textoDaCelula(linha, indices, 'cor').toLowerCase();
    if (!CORES[cor]) cor = 'verde';

    var tag = textoDaCelula(linha, indices, 'tag').slice(0, 24).toUpperCase() || 'OPORTUNIDADE';
    var resumo = textoDaCelula(linha, indices, 'resumo');
    var texto = textoDaCelula(linha, indices, 'texto').slice(0, 1200) || resumo;
    var cta = textoDaCelula(linha, indices, 'cta') || 'Quero essa oportunidade';
    var link = textoDaCelula(linha, indices, 'link');
    if (!/^https?:\/\//i.test(link) && !/^mailto:/i.test(link)) link = INSTAGRAM;

    var base = slug(titulo) || 'oportunidade';
    var id = base;
    var numero = 2;
    while (usados[id]) {
      id = base + '-' + numero;
      numero++;
    }
    usados[id] = true;

    itens.push({
      id: id, tag: tag, cor: cor, titulo: titulo, resumo: resumo,
      texto: texto, cta: cta, link: link
    });
  }

  return itens;
}

function responder(res, status, corpo, cache) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(corpo));
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    responder(res, 405, { erro: 'Método não permitido' }, 'no-store');
    return;
  }

  var url = limparEnv(process.env.SHEET_OPORTUNIDADES_CSV);
  if (!/^https?:\/\//i.test(url)) {
    responder(res, 200, { oportunidades: [], fonte: 'nao-configurada' }, 'no-store');
    return;
  }

  var controle = typeof AbortController === 'function' ? new AbortController() : null;
  var limite = setTimeout(function() {
    if (controle) controle.abort();
  }, 8000);

  try {
    var resposta = await fetch(url, controle ? { signal: controle.signal } : {});
    if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
    var oportunidades = normalizar(parseCsv(await resposta.text()), new Date());
    responder(res, 200, { atualizado: new Date().toISOString(), oportunidades: oportunidades },
      'public, s-maxage=300, stale-while-revalidate=86400');
  } catch (_) {
    responder(res, 502, { erro: 'Não foi possível ler a planilha' }, 'no-store');
  } finally {
    clearTimeout(limite);
  }
};

module.exports.parseCsv = parseCsv;
module.exports.normalizar = normalizar;
module.exports.slug = slug;
