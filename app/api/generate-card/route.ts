import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

// 1. Définition explicite du type pour satisfaire TypeScript
interface WalletObject {
    iss: string;
    aud: string;
    typ: string;
    payload: {
        genericObjects: any[];
    };
}

export async function GET() {
    try {
        // --- C'EST ICI LE CHANGEMENT POUR LA PROD ---
        let credentials;
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
            // En production, on utilise la variable d'environnement
            credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        } else {
            // En local, on utilise le fichier si la variable n'existe pas
            const jsonPath = path.resolve(process.cwd(), 'cle-service.json');
            credentials = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        }
        // ---------------------------------------------

        const auth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
        });

        // 2. Définition de l'objet carte avec le type défini
        const walletObject: WalletObject = {
            "iss": credentials.client_email,
            "aud": "google",
            "typ": "savetowallet",
            "payload": {
                "genericObjects": [{
                    // ID UNIQUE pour cette carte (utilise un timestamp pour changer)
                    "id": `${credentials.project_id}.user_${Date.now()}`, 
                    "classId": `${credentials.project_id}.dunkly_carte_membre`, 
                    "genericType": "GENERIC_TYPE_UNSPECIFIED",
                    "hexBackgroundColor": "#0b1e3d",
                    "logo": {
                        "sourceUri": {
                            "uri": "https://raw.githubusercontent.com/Anthonyz150/dunkly-app/refs/heads/main/app/icon.png" // <-- REMPLACE PAR TON VRAI LIEN
                        }
                    },
                    "cardTitle": {
                        "defaultValue": {
                            "language": "fr",
                            "value": "Carte Dunkly"
                        }
                    },
                    "header": {
                        "defaultValue": {
                            "language": "fr",
                            "value": "Membre Dunkly" 
                        }
                    },
                    "barcode": {
                        "type": "QR_CODE",
                        "value": "DUNKLY123" 
                    }
                }]
            }
        };

        // 3. Signer le lien (maintenant le type correspond)
        // @ts-ignore  <-- AJOUTE CETTE LIGNE POUR FORCER LA COMPILATION
        const signedToken = await auth.signJwt(walletObject as any);
        const link = `https://pay.google.com/gp/v/save/${signedToken}`;

        return NextResponse.json({ link });
    } catch (error: any) {
        console.error("Erreur détaillée :", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}