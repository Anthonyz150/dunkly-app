"use client";

export default function Loading() {
  return (
    /* On force le fond gris ici avec !important ou via le style inline 
       pour éviter le flash noir au chargement des pages.
    */
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      backgroundColor: '#f4f4f4', // FORCE LE GRIS
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999
    }}>
      <div className="ball-loader" style={{ fontSize: '4rem', animation: 'bounce 0.6s infinite alternate' }}>🏀</div>
      <h2 style={{ color: '#e65100', marginTop: '20px', fontFamily: 'sans-serif', fontWeight: '900' }}>DUNKLY CHARGE...</h2>
      
      <style jsx>{`
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-40px); }
        }
      `}</style>
    </div>
  );
}