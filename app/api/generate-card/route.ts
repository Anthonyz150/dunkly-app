import { NextResponse } from 'next/server';
import { createSigner } from 'fast-jwt';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) { // 1. Changement pour POST
    try {
        // 2. Récupérer les données envoyées par le front
        const body = await request.json();
        const { prenom, nom } = body;

        // --- Récupération des credentials ---
        let credentials;
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
            credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        } else {
            const jsonPath = path.resolve(process.cwd(), 'cle-service.json');
            credentials = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        }

        // --- Définition du Payload du JWT personnalisé ---
        const payload = {
            iss: credentials.client_email,
            aud: "google",
            typ: "savetowallet",
            payload: {
                genericObjects: [{
                    // ID unique basé sur le temps pour éviter les conflits
                    "id": `${credentials.project_id}.user_${Date.now()}`, 
                    "classId": `${credentials.project_id}.dunkly_carte_membre`, 
                    "genericType": "GENERIC_TYPE_UNSPECIFIED",
                    "hexBackgroundColor": "#0b1e3d",
                    "logo": {
                        "sourceUri": {
                            "uri": "https://raw.githubusercontent.com/Anthonyz150/dunkly-app/refs/heads/main/app/icon.png"
                        }
                    },
                    "cardTitle": {
                        "defaultValue": {
                            "language": "fr",
                            "value": `Carte ${prenom} ${nom}` // 3. Nom personnalisé ici
                        }
                    },
                    "header": {
                        "defaultValue": {
                            "language": "fr",
                            "value": `Membre ${prenom}` // 4. Prénom personnalisé ici
                        }
                    },
                    "barcode": {
                        "type": "QR_CODE",
                        "value": "DUNKLY123" 
                    }
                }]
            }
        };

        // --- Signature avec fast-jwt ---
        const signer = createSigner({ 
            key: credentials.private_key, 
            algorithm: 'RS256'
        });
        
        const signedToken = signer(payload);
        const link = `https://pay.google.com/gp/v/save/${signedToken}`;

        return NextResponse.json({ link });
    } catch (error: any) {
        console.error("Erreur détaillée :", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}