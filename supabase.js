const SUPABASE_URL = "https://unoynpwkpvmyzdoywyov.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_gH615f9gg0kVHqVTfcKDdw_NRPhHG0I";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase ligado com sucesso");
