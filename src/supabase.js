import { createClient } from '@supabase/supabase-js';

// TUS CREDENCIALES REALES DE SUPABASE
const supabaseUrl = 'https://ywrikfpnpszhtfhzcpmh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cmlrZnBucHN6aHRmaHpjcG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTgzODksImV4cCI6MjA4NjY5NDM4OX0.zU8s4vlxfPphlYxuljrh0JIZtuVtpLZ14kuzS4hrGGA';

// CONEXIÓN EXPORTADA
export const supabase = createClient(supabaseUrl, supabaseKey);