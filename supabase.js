const SUPABASE_URL = "https://unoynpwkpvmyzdoywyov.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_gH615f9gg0kVHqVTfcKDdw_NRPhHG0I";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function carregarPessoas() {

    const { data, error } =
        await supabaseClient
            .from("pessoas")
            .select("*")
            .order("nome");

if (error) {

    console.error(error);

    alert(
        "ERRO: " + error.message
    );

    return;
    }

    console.log(
        "Pessoas:",
        data
    );

    alert(
        "Encontradas " +
        data.length +
        " pessoas"
    );
}

carregarPessoas();
