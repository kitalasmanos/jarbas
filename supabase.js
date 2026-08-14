const SUPABASE_URL = "https://unoynpwkpvmyzdoyyvov.supabase.co";

const SUPABASE_KEY = "sb_publishable_gH615f9gg0kVHqVTfcKDdw_NRPhHG0I";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function testarSupabase() {

    const { data, error } =
        await supabaseClient
        .from("pessoas")
        .insert([
            {
                nome: "Pessoa A"
            }
        ])
        .select();

    if (error) {

        alert(
            "Erro: " +
            error.message
        );

        return;
    }

    alert(
        "Pessoa criada com sucesso!"
    );

    console.log(data);
}

testarSupabase();
