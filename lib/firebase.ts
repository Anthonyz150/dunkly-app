import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { supabase } from "./supabase";

const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "dunkly-app.firebaseapp.com",
  projectId: "dunkly-app",
  storageBucket: "dunkly-app.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// 1. Initialiser Firebase uniquement si ce n'est pas déjà fait
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Fonction pour obtenir le messaging uniquement côté client
const getMessagingInstance = async () => {
  // Vérifie si on est dans un navigateur
  if (typeof window === 'undefined') return null;
  
  // Vérifie si le navigateur supporte la messagerie
  const supported = await isSupported();
  if (!supported) return null;
  
  return getMessaging(app);
};

export const saveTokenToDatabase = async (userId: string) => {
  try {
    const messaging = await getMessagingInstance();
    
    // Si on est sur serveur ou navigateur non compatible, on arrête
    if (!messaging) {
      console.log('Firebase Messaging non supporté ou côté serveur');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const token = await getToken(messaging, { 
      vapidKey: 'BPq8P2jYJf5FjToGevKSyD4P6bm_vaQo7vA162jKSfcurX9Mhskp0ZWscojF7oDuAIVFAsa8fzLzGkYI_V_TUpc'
    });
    
    if (token) {
      const { error } = await supabase
        .from('user_tokens')
        .upsert({ user_id: userId, token: token }, { onConflict: 'token' });
      
      if (error) throw error;
      console.log('Token sauvegardé');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};