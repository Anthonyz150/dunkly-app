// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  // Mettez ici le même messagingSenderId que dans votre firebaseConfig
  messagingSenderId: "1:818015516210:web:ce103fb6fc3f298b9dae2b" 
});

const messaging = firebase.messaging();

// Gérer les messages quand l'application est en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('Message reçu en arrière-plan', payload);
  
  // Afficher la notification native du navigateur
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/favicon.ico' // Optionnel: votre icône
  });
});