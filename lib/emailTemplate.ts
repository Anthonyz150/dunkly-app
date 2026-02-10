// lib/emailTemplate.ts

export const getNewsletterTemplate = (subject: string, content: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f6f6f6; padding-bottom: 40px; }
          .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #333333; border-radius: 8px; overflow: hidden; }
          
          /* Bannière Orange */
          .header { background-color: #1e293b; padding: 20px; text-align: center; }
          
          /* Corps du mail */
          .content { padding: 30px; font-size: 16px; line-height: 1.6; color: #444444; }
          .content h1 { color: #ff6600; font-size: 24px; margin-top: 0; }
          
          /* Footer Sombre */
          .footer { background-color: #1a1d21; color: #ffffff; text-align: center; padding: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <center class="wrapper">
          <table class="main" width="100%">
            <tr>
              <td class="header">
                <span style="color: #ff6600; font-size: 24px; font-weight: bold; font-family: sans-serif;">🏀 DUNKLY</span>
              </td>
            </tr>
            <tr>
              <td class="content">
                <h1>${subject}</h1>
                <p style="margin: 0 0 15px 0;">${content}</p>
              </td>
            </tr>
            <tr>
              <td class="footer">
                <p style="margin: 0 0 10px 0;">Dunkly App &copy; 2026</p>
                <p style="margin: 0;">Vous recevez cet e-mail car vous êtes abonné à Dunkly. Cet e-mail est envoyé par une adresse automatique, merci de ne pas y répondre.</p>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>
    `;
  };