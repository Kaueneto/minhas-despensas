
//serviço de email pra envio de convites - usando resend
interface ConviteEmailParams {
  destinatarioEmail: string
  nomeRemetente: string
  nomeDespensa: string
  token: string
}

interface EmailResult {
  success: boolean
  error: string | null
}

// modelo do email de convite
function gerarHtmlConvite({ nomeRemetente, nomeDespensa, token }: Omit<ConviteEmailParams, 'destinatarioEmail'>): string {
  const linkConvite = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/convite/${token}`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Convite</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 32px 24px; text-align: center;">
      
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px; font-weight: 600; text-align: center;">
                    Você recebeu um convite!
                  </h2>
                  
                  <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                    <strong style="color: #3B82F6;">${nomeRemetente}</strong> convidou você para participar da despensa:
                  </p>
                  
                  <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                      "${nomeDespensa}"
                    </p>
                  </div>
                  
                  <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                    Com a Despensa App, vocês podem gerenciar itens, criar listas de compras e organizar a despensa juntos!
                  </p>
                  
                  <!-- Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${linkConvite}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                          Aceitar Convite
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                    Este convite expira em 7 dias.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Se você não esperava este email, pode ignorá-lo com segurança.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

// funcao para enviar email de convite
export async function enviarEmailConvite(params: ConviteEmailParams): Promise<EmailResult> {
  const { destinatarioEmail, nomeRemetente, nomeDespensa, token } = params
  
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada. Email não enviado.')
    // retorna sucesso mesmo sem enviar para não bloquear o fluxo de convite
    return { success: true, error: null }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Despensa App <convites@seudominio.com>', // Altere para seu domínio verificado no Resend
        to: [destinatarioEmail],
        subject: `${nomeRemetente} convidou você para a despensa "${nomeDespensa}"`,
        html: gerarHtmlConvite({ nomeRemetente, nomeDespensa, token })
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Erro ao enviar email:', errorData)
      return { success: false, error: 'Falha ao enviar email de convite' }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error: 'Erro de conexão ao enviar email' }
  }
}

// template de texto simples
export function gerarTextoConvite({ nomeRemetente, nomeDespensa, token }: Omit<ConviteEmailParams, 'destinatarioEmail'>): string {
  const linkConvite = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/convite/${token}`
  
  return `
Olá!

${nomeRemetente} convidou você para participar da despensa "${nomeDespensa}" no Despensa App.

Com a Despensa App, vocês podem gerenciar itens, criar listas de compras e organizar a despensa juntos!

Clique no link abaixo para aceitar o convite:
${linkConvite}

Este convite expira em 7 dias.

Se você não esperava este email, pode ignorá-lo com segurança.

---
Despensa App
  `.trim()
}
