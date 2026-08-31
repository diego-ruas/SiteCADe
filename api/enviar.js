// Recebe os dois formulários do site (participar / falar) e envia um e-mail via Resend.
// Sem dependências: chama a API REST do Resend direto com fetch (runtime Node da Vercel já tem).
//
// Variáveis de ambiente (configurar no painel da Vercel > Project > Settings > Environment Variables):
//   RESEND_API_KEY  (obrigatória) — chave secreta do Resend, nunca commitar.
//   RESEND_TO       (opcional) — e-mail de destino. Padrão: cadesignufpel@gmail.com
//   RESEND_FROM     (opcional) — remetente. Padrão: CADe UFPel <onboarding@resend.dev>
//                    (troque para um endereço @cade.diegoruas.com.br assim que o domínio
//                    estiver verificado no Resend — melhora entregabilidade e evita spam).

const PADRAO_PARA = 'cadesignufpel@gmail.com';
const PADRAO_DE = 'CADe UFPel <onboarding@resend.dev>';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function campo(rotulo, valor) {
  if (!valor) return '';
  return `<p><b>${escapeHtml(rotulo)}:</b> ${escapeHtml(valor).replace(/\n/g, '<br>')}</p>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, erro: 'Método não permitido' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[api/enviar] RESEND_API_KEY não configurada');
    res.status(500).json({ ok: false, erro: 'Envio de e-mail não configurado no servidor' });
    return;
  }

  const body = req.body || {};
  const formulario = body.formulario;

  // honeypot: campo invisível pro usuário real, se vier preenchido é bot — finge sucesso e não envia
  if (body.empresa) {
    res.status(200).json({ ok: true });
    return;
  }

  let assunto, html;

  if (formulario === 'participar') {
    const { nome, email, semestre, area } = body;
    if (!nome || !email) {
      res.status(400).json({ ok: false, erro: 'Nome e e-mail são obrigatórios' });
      return;
    }
    assunto = `[CADe] Quero participar — ${nome}`;
    html = [
      '<h2>Novo interesse em participar do CADe</h2>',
      campo('Nome', nome),
      campo('E-mail', email),
      campo('Semestre', semestre),
      campo('Onde quer ajudar', area)
    ].join('');
  } else if (formulario === 'falar') {
    const { tipo, assunto: assuntoMsg, mensagem, anonimo, contato } = body;
    if (!assuntoMsg || !mensagem) {
      res.status(400).json({ ok: false, erro: 'Assunto e mensagem são obrigatórios' });
      return;
    }
    const tipoRotulo = { reclamacao: 'Reclamação', sugestao: 'Sugestão', elogio: 'Elogio', oportunidade: 'Oportunidade' }[tipo] || tipo || 'Não informado';
    assunto = `[CADe] ${tipoRotulo} — ${assuntoMsg}`;
    html = [
      '<h2>Nova mensagem pelo site do CADe</h2>',
      campo('Tipo', tipoRotulo),
      campo('Assunto', assuntoMsg),
      campo('Mensagem', mensagem),
      anonimo ? '<p><b>Envio anônimo</b> — sem nome nem contato.</p>' : campo('Contato', contato || 'não informado')
    ].join('');
  } else {
    res.status(400).json({ ok: false, erro: 'Formulário desconhecido' });
    return;
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || PADRAO_DE,
        to: [process.env.RESEND_TO || PADRAO_PARA],
        subject: assunto,
        html
      })
    });

    if (!resp.ok) {
      const detalhe = await resp.text();
      console.error('[api/enviar] Resend respondeu', resp.status, detalhe);
      res.status(502).json({ ok: false, erro: 'Falha ao enviar o e-mail' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/enviar] erro de rede', err);
    res.status(502).json({ ok: false, erro: 'Falha ao enviar o e-mail' });
  }
};
