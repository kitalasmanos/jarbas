const SUPABASE_URL = "https://unoynpwkpvmyzdoyyvov.supabase.co";

const SUPABASE_KEY = "A_TUA_CHAVE";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

alert("SUPABASE LIGADO");
