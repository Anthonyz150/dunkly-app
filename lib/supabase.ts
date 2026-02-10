import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jpudcvzrjqzdlhitxnbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwdWRjdnpyanF6ZGxoaXR4bmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDQ1OTksImV4cCI6MjA4NTcyMDU5OX0.bXHHsEogjmMeI-zDvxvmiH1KnF_JinJ_NR94Or9dS_E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Il faut que ce nom soit le même dans les deux projets
    storageKey: 'dunkly-auth-token', 
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});