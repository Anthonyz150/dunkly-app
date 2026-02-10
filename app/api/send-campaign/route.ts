import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
// 1. IMPORTATION : Importer le template mis à jour
import { getNewsletterTemplate } from '@/lib/emailTemplate'; 

// Initialiser Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Nécessaire pour lire les tables
);

export async function POST(req: Request) {
  try {
    const { subject, body } = await req.json();

    // 1. Récupérer tous les e-mails abonnés
    const { data: subscribers, error: dbError } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('email');

    if (dbError) throw dbError;
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: "Aucun abonné." });
    }

    const emailList = subscribers.map((sub: any) => sub.email);

    // 2. Configurer Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 3. Générer le HTML final en utilisant le template (passage du sujet et du corps)
    const finalHtml = getNewsletterTemplate(subject, body);

    // 4. Envoyer les e-mails avec le HTML stylisé
    const mailOptions = {
      from: `"Dunkly App" <${process.env.EMAIL_USER}>`,
      to: emailList, 
      subject: subject,
      html: finalHtml, 
      // --- MODIFICATION ICI : Ajout du Reply-To ---
      replyTo: "ne-pas-repondre@dunkly.app", 
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, count: emailList.length });
  } catch (error: any) {
    console.error("Erreur envoi:", error);
    return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
  }
}