// CONFIGURAÇÃO DA PELUCHINHA ACESSÓRIOS
// 1) Crie um projeto em https://supabase.com/
// 2) Abra este arquivo e substitua os dois valores abaixo.
// 3) Nunca coloque a SERVICE_ROLE KEY aqui. Use somente a chave anon/publishable.

window.PELUCHINHA_CONFIG = {
  SUPABASE_URL: "https://mirmckwkfeanbzuwidqy.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcm1ja3drZmVhbmJ6dXdpZHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4OTk3NjUsImV4cCI6MjEwNjQ3NTc2NX0.JA--rf_28d4DXo6uxx-IYfcJri9jX1lIzB2gfdwYecE"
};

window.supabaseClient = null;
if (
  window.PELUCHINHA_CONFIG.SUPABASE_URL.startsWith("http") &&
  !window.PELUCHINHA_CONFIG.SUPABASE_URL.includes("COLE_AQUI") &&
  !window.PELUCHINHA_CONFIG.SUPABASE_ANON_KEY.includes("COLE_AQUI")
) {
  window.supabaseClient = window.supabase.createClient(
    window.PELUCHINHA_CONFIG.SUPABASE_URL,
    window.PELUCHINHA_CONFIG.SUPABASE_ANON_KEY
  );
}