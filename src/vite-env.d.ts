/// <reference types="vite/client" />

                                                                             
                                                                                      
interface ImportMetaEnv {
                                                                   
  readonly VITE_GA4_ID?: string
  readonly VITE_GA4_PROPERTY_ID?: string
  readonly VITE_GOOGLE_OAUTH_CLIENT_ID?: string
                                                                
  readonly VITE_COMING_SOON_MODE?: string
  readonly VITE_COMING_SOON_PASSWORD?: string
  readonly VITE_ASSET_STORE?: string
  readonly VITE_ASSET_UPLOAD_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
