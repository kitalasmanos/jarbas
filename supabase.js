const SUPABASE_URL = "https://unoynpwkpvmyzdoyyvov.supabase.co";
const SUPABASE_KEY = "A_TUA_CHAVE";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

alert("Script carregado");

async function testar() {

    alert("A testar Supabase");

    const resultado =
        await supabaseClient
            .from("pessoas")
            .select("*");

    alert(
        JSON.stringify(resultado)
    );
}

testar();
