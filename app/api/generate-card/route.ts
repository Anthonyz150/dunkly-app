import { NextResponse } from 'next/server';
import { createSigner } from 'fast-jwt'; // <-- C'est ça qu'il faut utiliser
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // --- Récupération des credentials ---
        let credentials;
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
            credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        } else {
            const jsonPath = path.resolve(process.cwd(), 'cle-service.json');
            credentials = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        }

        // --- Définition du Payload du JWT ---
        const payload = {
            iss: credentials.client_email,
            aud: "google",
            typ: "savetowallet",
            payload: {
                genericObjects: [{
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