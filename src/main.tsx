import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
                                                                            
                                                                                
                                                                          
import ComingSoonGate from './components/ComingSoonGate'

                                                                                      
                                                                                             
                                                                                 
const GA4_ID = import.meta.env.VITE_GA4_ID as string | undefined;
                                                                                  
                                                                               
                                                                           
                                                                                  
                                                                                
                                                                                 
function consentiuAnalytics(): boolean {
  try {
    const raw = localStorage.getItem('abil_cookies_v1');
    if (!raw) return false;
    const c = JSON.parse(raw) as { analytics?: boolean };
    return c.analytics === true;
  } catch { return false; }
}
if (GA4_ID && typeof document !== 'undefined' && consentiuAnalytics()) {
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() { w.dataLayer.push(arguments); };
                                                                                          
                                                                                            
                                                                         
  w.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });
                                                                                    
  try {
    const raw = localStorage.getItem('abil_cookies_v1');
    if (raw) {
      const c = JSON.parse(raw) as { analytics?: boolean; marketing?: boolean };
      w.gtag('consent', 'update', {
        analytics_storage: c.analytics ? 'granted' : 'denied',
        ad_storage: c.marketing ? 'granted' : 'denied',
        ad_user_data: c.marketing ? 'granted' : 'denied',
        ad_personalization: c.marketing ? 'granted' : 'denied',
      });
    }
  } catch {                                                  }
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
  document.head.appendChild(s);
  w.gtag('js', new Date());
  w.gtag('config', GA4_ID);
}

                                                                                                                                  
                                                                        
                                                                          
                                                                      
                                                                   
                                                                             
                                                                            
                        
function vigiarEcraBranco() {
  const CHAVE = 'abil_recarga_ecra_branco';
  window.setTimeout(() => {
    try {
      const root = document.getElementById('root');
      if (root && root.children.length > 0) { sessionStorage.removeItem(CHAVE); return; }
      if (sessionStorage.getItem(CHAVE)) return;                                  
      sessionStorage.setItem(CHAVE, '1');
      const u = new URL(window.location.href);
      u.searchParams.set('_v', String(Date.now()));
      window.location.replace(u.toString());
    } catch {            }
  }, 6000);
}
vigiarEcraBranco();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ComingSoonGate>
      <App />
    </ComingSoonGate>
  </StrictMode>,
)
