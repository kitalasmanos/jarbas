const SUPABASE_URL =
    "https://unoynpwkpvmyzdoywyov.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_gH615f9gg0kVHqVTfcKDdw_NRPhHG0I";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

async function testeSupabase() {

    const resultado =
        await supabaseClient
            .from("pessoas")
            .select("*");

    if (resultado.error) {

        alert(
            "ERRO:\n\n" +
            resultado.error.message
        );

        console.error(
            resultado.error
        );

        return;
    }

    alert(
        "FUNCIONOU!\n\n" +
        "Pessoas encontradas: " +
        resultado.data.length
    );

    console.log(
        resultado.data
    );
}

testeSupabase();
