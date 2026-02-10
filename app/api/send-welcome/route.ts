import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, username } = await req.json();

    // 1. Vérification des variables d'environnement
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Configuration e-mail manquante");
    }

    // 2. Configuration du transporteur
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 3. Options de l'e-mail (Contenu HTML)
    const mailOptions = {
      from: `"Dunkly App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Bienvenue chez Dunkly App ! 🏀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center;">
            <span style="font-size: 50px;">🏀</span>
            <h1 style="color: #1e293b;">DUNKLY <span style="color: #F97316;">APP</span></h1>
          </div>
          <p style="font-size: 16px; color: #334155;">Salut <strong>${username}</strong> !</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
            Ton compte a bien été créé. Bienvenue dans la communauté ! Prêt à marquer des paniers ?
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://votre-site.com" style="background-color: #F97316; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accéder à mon espace</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            Ceci est un message automatique, merci de ne pas y répondre.
          </p>
        </div>
      `,
    };

    // 4. Envoi de l'e-mail
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur Nodemailer:", error);
    return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
  }
}