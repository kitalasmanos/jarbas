/* =====================================
   GESTOR FINANCEIRO 50/50
===================================== */

const STORAGE_KEY = "gestor-financeiro-50-50";

let dados = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || {
    movimentos: []
};

let grafico = null;


/* =====================================
   UTILIDADES
===================================== */

function guardarDados() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(dados)
    );

}


function euro(valor) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-PT",
        {
            style: "currency",
            currency: "EUR"
        }
    );

}


function hojeISO() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


function escapeHTML(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =====================================
   PESSOAS
===================================== */

async function carregarPessoas() {

    const select =
        document.getElementById(
            "pagador"
        );

    if (!select) {
        return [];
    }

    select.innerHTML =
        '<option value="">A carregar...</option>';

    const {
        data,
        error
    } =
        await supabaseClient
            .from("pessoas")
            .select("id, nome")
            .order("nome");

    if (error) {

        console.error(
            error
        );

        select.innerHTML =
            '<option value="">Erro ao carregar</option>';

        return [];

    }

    select.innerHTML =
        '<option value="">Selecionar pessoa</option>';

    data.forEach(
        pessoa => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                pessoa.id;

            option.textContent =
                pessoa.nome;

            select.appendChild(
                option
            );

        }
    );

    return data;

}


/* =====================================
   PAGADOR → OUTRA PESSOA
===================================== */

function obterOutroId(
    pessoas,
    pagadorId
) {

    const pessoa =
        pessoas.find(
            p =>
                Number(p.id) ===
                Number(pagadorId)
        );

    if (!pessoa) {
        return null;
    }

    const outraPessoa =
        pessoas.find(
            p =>
                Number(p.id) !==
                Number(pagadorId)
        );

    return outraPessoa
        ? Number(outraPessoa.id)
        : null;

}


/* =====================================
   REGISTAR DESPESA
===================================== */

async function registarDespesa() {

    const descricao =
        document.getElementById(
            "descricao"
        ).value.trim();

    const categoria =
        document.getElementById(
            "categoria"
        ).value;

    const valor =
        Number(
            document.getElementById(
                "valor"
            ).value
        );

    const pagadorId =
        Number(
            document.getElementById(
                "pagador"
            ).value
        );

    const data =
        document.getElementById(
            "dataDespesa"
        ).value;


    if (!descricao) {

        alert(
            "Introduza uma descrição."
        );

        return;
    }


    if (
        !Number.isFinite(valor) ||
        valor <= 0
    ) {

        alert(
            "Introduza um valor válido."
        );

        return;
    }


    if (!pagadorId) {

        alert(
            "Selecione quem pagou."
        );

        return;
    }


    if (!data) {

        alert(
            "Selecione uma data."
        );

        return;
    }


    /* =================================
       CARREGAR AS PESSOAS
    ================================= */

    const {
        data: pessoas,
        error: erroPessoas
    } =
        await supabaseClient
            .from("pessoas")
            .select("id, nome")
            .order("nome");


    if (erroPessoas) {

        alert(
            "Erro ao carregar pessoas:\n" +
            erroPessoas.message
        );

        return;
    }


    if (
        pessoas.length !== 2
    ) {

        alert(
            "O sistema 50/50 precisa de exatamente 2 pessoas."
        );

        return;
    }


    const devedorId =
        obterOutroId(
            pessoas,
            pagadorId
        );


    if (!devedorId) {

        alert(
            "Não foi possível determinar a outra pessoa."
        );

        return;
    }


    /* =================================
       CALCULAR METADE
    ================================= */

    const valorDevido =
        Math.round(
            (
                valor / 2
            ) * 100
        ) / 100;


    /* =================================
       CRIAR DESPESA PARTILHADA
    ================================= */

    const {
        data: despesa,
        error: erroDespesa
    } =
        await supabaseClient
            .from(
                "despesas_partilhadas"
            )
            .insert([
                {
                    descricao:
                        descricao,

                    valor:
                        valor,

                    pagador_id:
                        pagadorId,

                    data:
                        data
                }
            ])
            .select("id")
            .single();


    if (erroDespesa) {

        console.error(
            erroDespesa
        );

        alert(
            "Erro ao criar despesa:\n\n" +
            erroDespesa.message
        );

        return;
    }


    /* =================================
       CRIAR DÍVIDA 50/50
    ================================= */

    const {
        error: erroDivida
    } =
        await supabaseClient
            .from("dividas")
            .insert([
                {
                    despesa_id:
                        despesa.id,

                    devedor_id:
                        devedorId,

                    credor_id:
                        pagadorId,

                    valor:
                        valorDevido,

                    valor_pago:
                        0,

                    liquidado:
                        false
                }
            ]);


    if (erroDivida) {

        console.error(
            erroDivida
        );

        alert(
            "A despesa foi criada, mas a dívida não foi criada:\n\n" +
            erroDivida.message
        );

        return;
    }


    /* =================================
       LIMPAR FORMULÁRIO
    ================================= */

    document.getElementById(
        "descricao"
    ).value = "";

    document.getElementById(
        "valor"
    ).value = "";


    alert(
        "Despesa registada com sucesso!"
    );


    await atualizarTudo();


}


/* =====================================
   HISTÓRICO
===================================== */

async function carregarDespesas() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "despesas_partilhadas"
            )
            .select(
                "id, descricao, valor, pagador_id, data"
            )
            .order(
                "data",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            error
        );

        return [];

    }

    return data || [];

}


async function carregarNomesPessoas() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "pessoas"
            )
            .select(
                "id, nome"
            );


    if (error) {

        console.error(
            error
        );

        return {};

    }


    const nomes = {};

    data.forEach(
        pessoa => {

            nomes[pessoa.id] =
                pessoa.nome;

        }
    );

    return nomes;

}


/* =====================================
   FILTROS
===================================== */

function obterFiltroPesquisa() {

    return (
        document.getElementById(
            "pesquisa"
        )?.value ||
        ""
    )
        .trim()
        .toLowerCase();

}


function obterFiltroCategoria() {

    return (
        document.getElementById(
            "filtroCategoria"
        )?.value ||
        ""
    );

}


function obterFiltroMes() {

    return (
        document.getElementById(
            "filtroMes"
        )?.value ||
        ""
    );

}


function filtrarDespesas(
    despesas,
    nomes
) {

    const pesquisa =
        obterFiltroPesquisa();

    const categoria =
        obterFiltroCategoria();

    const mes =
        obterFiltroMes();


    /*
       A categoria está guardada
       apenas no histórico local.
    */

    return despesas.filter(
        despesa => {

            const correspondePesquisa =
                !pesquisa ||
                despesa.descricao
                    .toLowerCase()
                    .includes(
                        pesquisa
                    );


            const movimento =
                dados.movimentos.find(
                    item =>
                        item.supabase_id ===
                        despesa.id
                );


            const correspondeCategoria =
                !categoria ||
                (
                    movimento &&
                    movimento.categoria ===
                    categoria
                );


            const correspondeMes =
                !mes ||
                String(
                    despesa.data
                ).startsWith(
                    mes
                );


            return (
                correspondePesquisa &&
                correspondeCategoria &&
                correspondeMes
            );

        }
    );

}


/* =====================================
   HISTÓRICO
===================================== */

async function renderTabela() {

    const tbody =
        document.getElementById(
            "tabelaDespesas"
        );


    if (!tbody) {
        return;
    }


    const despesas =
        await carregarDespesas();

    const nomes =
        await carregarNomesPessoas();


    atualizarCategoriasFiltro(
        despesas
    );


    const filtradas =
        filtrarDespesas(
            despesas,
            nomes
        );


    tbody.innerHTML = "";


    if (
        filtradas.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    Não existem despesas.
                </td>
            </tr>
        `;

        return;
    }


    filtradas.forEach(
        despesa => {

            const tr =
                document.createElement(
                    "tr"
                );


            const pagador =
                nomes[
                    despesa.pagador_id
                ] ||
                "Desconhecido";


            /*
               A despesa é sempre 50/50.
            */

            const metade =
                Number(
                    despesa.valor
                ) / 2;


            tr.innerHTML = `
                <td>
                    ${escapeHTML(
                        despesa.data
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        despesa.descricao
                    )}
                </td>

                <td>
                    ${
                        obterCategoriaDespesa(
                            despesa.id
                        )
                    }
                </td>

                <td>
                    ${euro(
                        despesa.valor
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        pagador
                    )}
                </td>

                <td>
                    ${euro(
                        metade
                    )}
                </td>
            `;


            tbody.appendChild(
                tr
            );

        }
    );

}


/* =====================================
   CATEGORIAS
===================================== */

function obterCategoriaDespesa(
    id
) {

    const movimento =
        dados.movimentos.find(
            item =>
                item.supabase_id ===
                id
        );

    return movimento
        ? escapeHTML(
            movimento.categoria
        )
        : "Outros";

}


function atualizarCategoriasFiltro(
    despesas
) {

    const select =
        document.getElementById(
            "filtroCategoria"
        );

    if (!select) {
        return;
    }


    const atual =
        select.value;


    const categorias =
        [
            ...new Set(
                despesas.map(
                    despesa =>
                        obterCategoriaDespesa(
                            despesa.id
                        )
                )
            )
        ]
        .sort();


    select.innerHTML =
        '<option value="">Todas</option>';


    categorias.forEach(
        categoria => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                categoria;

            option.textContent =
                categoria;

            select.appendChild(
                option
            );

        }
    );


    if (
        categorias.includes(
            atual
        )
    ) {

        select.value =
            atual;

    }

}


/* =====================================
   SALDO LÍQUIDO
===================================== */

async function atualizarSaldo() {

    const container =
        document.getElementById(
            "saldoPessoas"
        );


    if (!container) {
        return;
    }


    container.textContent =
        "A carregar saldo...";


    const {
        data: dividas,
        error: erroDividas
    } =
        await supabaseClient
            .from("dividas")
            .select(
                "id, valor, valor_pago, liquidado, devedor_id, credor_id"
            )
            .eq(
                "liquidado",
                false
            );


    if (erroDividas) {

        console.error(
            erroDividas
        );

        container.textContent =
            "Erro ao carregar saldo: " +
            erroDividas.message;

        return;
    }


    const nomes =
        await carregarNomesPessoas();


    const saldos = {};


    dividas.forEach(
        divida => {

            const devedor =
                Number(
                    divida.devedor_id
                );

            const credor =
                Number(
                    divida.credor_id
                );

            const emFalta =
                Math.max(
                    0,
                    Number(
                        divida.valor
                    ) -
                    Number(
                        divida.valor_pago ||
                        0
                    )
                );


            if (
                emFalta <= 0
            ) {
                return;
            }


            /*
               Chave independente da direção.
            */

            const ids = [
                devedor,
                credor
            ].sort(
                (a, b) =>
                    a - b
            );


            const chave =
                `${ids[0]}-${ids[1]}`;


            if (
                !saldos[chave]
            ) {

                saldos[chave] = {
                    pessoaA:
                        ids[0],

                    pessoaB:
                        ids[1],

                    saldo:
                        0
                };

            }


            if (
                devedor ===
                ids[0]
            ) {

                saldos[chave].saldo +=
                    emFalta;

            } else {

                saldos[chave].saldo -=
                    emFalta;

            }

        }
    );


    const pares =
        Object.values(
            saldos
        )
        .filter(
            par =>
                Math.abs(
                    par.saldo
                ) > 0.004
        );


    if (
        pares.length === 0
    ) {

        container.innerHTML =
            "Neste momento, ninguém deve nada.";

        return;
    }


    container.innerHTML = "";


    pares.forEach(
        par => {

            let devedor;
            let credor;
            let valor;


            if (
                par.saldo > 0
            ) {

                devedor =
                    par.pessoaA;

                credor =
                    par.pessoaB;

                valor =
                    par.saldo;

            } else {

                devedor =
                    par.pessoaB;

                credor =
                    par.pessoaA;

                valor =
                    Math.abs(
                        par.saldo
                    );

            }


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "resumo-item";


            div.innerHTML = `
                <strong>
                    ${escapeHTML(
                        nomes[devedor] ||
                        "Desconhecido"
                    )}

                    deve
                    ${euro(valor)}

                    a

                    ${escapeHTML(
                        nomes[credor] ||
                        "Desconhecido"
                    )}
                </strong>

                <br>

                <small>
                    Saldo líquido entre os dois.
                </small>

                <br>

                <button
                    type="button"
                    onclick="registarPagamento(
                        ${devedor},
                        ${credor},
                        ${valor}
                    )"
                >
                    Registar pagamento
                </button>
            `;


            container.appendChild(
                div
            );

        }
    );

}


/* =====================================
   REGISTAR PAGAMENTO
===================================== */

async function registarPagamento(
    devedorId,
    credorId,
    saldoAtual
) {

    const resposta =
        prompt(
            `Saldo atual: ${euro(
                saldoAtual
            )}\n\nQuanto foi pago?`
        );


    if (
        resposta === null
    ) {
        return;
    }


    const valorPagamento =
        Number(
            resposta
                .replace(
                    ",",
                    "."
                )
        );


    if (
        !Number.isFinite(
            valorPagamento
        ) ||
        valorPagamento <= 0
    ) {

        alert(
            "Introduza um valor válido."
        );

        return;
    }


    if (
        valorPagamento >
        saldoAtual
    ) {

        alert(
            "O pagamento não pode ser superior ao saldo."
        );

        return;
    }


    /*
       Procuramos todas as dívidas
       dessa direção.
    */

    const {
        data: dividas,
        error
    } =
        await supabaseClient
            .from("dividas")
            .select(
                "id, valor, valor_pago, liquidado, devedor_id, credor_id"
            )
            .eq(
                "liquidado",
                false
            );


    if (error) {

        alert(
            "Erro ao carregar dívidas:\n" +
            error.message
        );

        return;
    }


    let restante =
        valorPagamento;


    /*
       Pagamos primeiro as dívidas
       do mesmo devedor/credor.
    */

    for (
        const divida of dividas
    ) {

        if (
            restante <= 0
        ) {
            break;
        }


        if (
            Number(
                divida.devedor_id
            ) !==
            Number(devedorId) ||
            Number(
                divida.credor_id
            ) !==
            Number(credorId)
        ) {

            continue;
        }


        const atual =
            Number(
                divida.valor_pago ||
                0
            );


        const falta =
            Number(
                divida.valor
            ) -
            atual;


        const aplicar =
            Math.min(
                restante,
                falta
            );


        const novoValorPago =
            atual +
            aplicar;


        const liquidado =
            novoValorPago >=
            Number(
                divida.valor
            );


        const {
            error: erroUpdate
        } =
            await supabaseClient
                .from("dividas")
                .update({

                    valor_pago:
                        novoValorPago,

                    liquidado:
                        liquidado

                })
                .eq(
                    "id",
                    divida.id
                );


        if (
            erroUpdate
        ) {

            alert(
                "Erro ao registar pagamento:\n" +
                erroUpdate.message
            );

            return;
        }


        restante -=
            aplicar;

    }


    alert(
        "Pagamento registado com sucesso."
    );


    await atualizarTudo();

}


/* =====================================
   GRÁFICO
===================================== */

async function atualizarGrafico() {

    const canvas =
        document.getElementById(
            "graficoCategorias"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    const despesas =
        await carregarDespesas();


    const valores = {};


    despesas.forEach(
        despesa => {

            const categoria =
                obterCategoriaDespesa(
                    despesa.id
                );


            valores[categoria] =
                (
                    valores[categoria] ||
                    0
                ) +
                Number(
                    despesa.valor
                );

        }
    );


    const labels =
        Object.keys(
            valores
        );


    const data =
        Object.values(
            valores
        );


    if (grafico) {

        grafico.destroy();

        grafico = null;

    }


    if (
        !labels.length
    ) {

        return;
    }


    grafico =
        new Chart(
            canvas.getContext("2d"),
            {

                type:
                    "pie",

                data: {

                    labels,

                    datasets: [
                        {
                            data
                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    }

                }

            }
        );

}


/* =====================================
   RESUMO
===================================== */

async function atualizarResumo() {

    const totalDespesasElemento =
        document.getElementById(
            "totalDespesas"
        );

    const totalPagoHugoElemento =
        document.getElementById(
            "totalPagoHugo"
        );

    const totalPagoNataliaElemento =
        document.getElementById(
            "totalPagoNatalia"
        );

    const saldoElemento =
        document.getElementById(
            "saldoAtual"
        );


    if (
        !totalDespesasElemento ||
        !totalPagoHugoElemento ||
        !totalPagoNataliaElemento ||
        !saldoElemento
    ) {
        return;
    }


    totalDespesasElemento.textContent =
        "A carregar...";

    totalPagoHugoElemento.textContent =
        "A carregar...";

    totalPagoNataliaElemento.textContent =
        "A carregar...";

    saldoElemento.textContent =
        "A calcular...";


    /* =================================
       DESPESAS
    ================================= */

    const {
        data: despesas,
        error: erroDespesas
    } =
        await supabaseClient
            .from("despesas_partilhadas")
            .select(
                "id, valor, pagador_id"
            );


    if (erroDespesas) {

        console.error(
            erroDespesas
        );

        totalDespesasElemento.textContent =
            "Erro";

        totalPagoHugoElemento.textContent =
            "Erro";

        totalPagoNataliaElemento.textContent =
            "Erro";

        saldoElemento.textContent =
            "Erro";

        return;
    }


    /* =================================
       PESSOAS
    ================================= */

    const {
        data: pessoas,
        error: erroPessoas
    } =
        await supabaseClient
            .from("pessoas")
            .select(
                "id, nome"
            );


    if (erroPessoas) {

        console.error(
            erroPessoas
        );

        return;
    }


    const nomes = {};

    pessoas.forEach(
        pessoa => {

            nomes[
                Number(pessoa.id)
            ] = pessoa.nome;

        }
    );


    let totalDespesas = 0;

    let totalHugo = 0;

    let totalNatalia = 0;


    despesas.forEach(
        despesa => {

            const valor =
                Number(
                    despesa.valor
                );


            totalDespesas +=
                valor;


            const nomePagador =
                nomes[
                    Number(
                        despesa.pagador_id
                    )
                ];


            if (
                nomePagador &&
                nomePagador.toLowerCase()
                    .includes("hugo")
            ) {

                totalHugo +=
                    valor;

            }


            if (
                nomePagador &&
                nomePagador.toLowerCase()
                    .includes("natalia")
            ) {

                totalNatalia +=
                    valor;

            }

        }
    );


    /* =================================
       SALDO ENTRE HUGO E NATALIA
    ================================= */

    const {
        data: dividas,
        error: erroDividas
    } =
        await supabaseClient
            .from("dividas")
            .select(
                "valor, valor_pago, devedor_id, credor_id, liquidado"
            );


    if (erroDividas) {

        console.error(
            erroDividas
        );

        saldoElemento.textContent =
            "Erro";

    } else {

        const saldos = {};

        (dividas || [])
            .forEach(
                divida => {

                    const valorEmFalta =
                        Math.max(
                            0,
                            Number(
                                divida.valor
                            ) -
                            Number(
                                divida.valor_pago ||
                                0
                            )
                        );


                    if (
                        valorEmFalta <= 0
                    ) {
                        return;
                    }


                    const devedor =
                        Number(
                            divida.devedor_id
                        );

                    const credor =
                        Number(
                            divida.credor_id
                        );


                    const chave =
                        "hugo-natalia";


                    if (
                        !saldos[chave]
                    ) {

                        saldos[chave] =
                            {
                                hugoDeveNatalia:
                                    0,

                                nataliaDeveHugo:
                                    0
                            };

                    }


                    const nomeDevedor =
                        (
                            nomes[
                                devedor
                            ] ||
                            ""
                        )
                            .toLowerCase();


                    if (
                        nomeDevedor
                            .includes("hugo")
                    ) {

                        saldos[chave]
                            .hugoDeveNatalia +=
                            valorEmFalta;

                    } else {

                        saldos[chave]
                            .nataliaDeveHugo +=
                            valorEmFalta;

                    }

                }
            );


        const saldoHugo =
            saldos["hugo-natalia"]
                ?.hugoDeveNatalia ||
            0;

        const saldoNatalia =
            saldos["hugo-natalia"]
                ?.nataliaDeveHugo ||
            0;


        const saldoLiquido =
            saldoNatalia -
            saldoHugo;


        if (
            Math.abs(
                saldoLiquido
            ) < 0.005
        ) {

            saldoElemento.textContent =
                "Ninguém deve nada";

        } else if (
            saldoLiquido > 0
        ) {

            saldoElemento.textContent =
                `Natalia deve ${
                    euro(
                        saldoLiquido
                    )
                } a Hugo`;

        } else {

            saldoElemento.textContent =
                `Hugo deve ${
                    euro(
                        Math.abs(
                            saldoLiquido
                        )
                    )
                } a Natalia`;

        }

    }


    totalDespesasElemento.textContent =
        euro(
            totalDespesas
        );

    totalPagoHugoElemento.textContent =
        euro(
            totalHugo
        );

    totalPagoNataliaElemento.textContent =
        euro(
            totalNatalia
        );

}


/* =====================================
   FILTROS
===================================== */

function configurarFiltros() {

    const pesquisa =
        document.getElementById(
            "pesquisa"
        );

    const categoria =
        document.getElementById(
            "filtroCategoria"
        );

    const mes =
        document.getElementById(
            "filtroMes"
        );


    if (pesquisa) {

        pesquisa.addEventListener(
            "input",
            atualizarTudo
        );

    }


    if (categoria) {

        categoria.addEventListener(
            "change",
            atualizarTudo
        );

    }


    if (mes) {

        mes.addEventListener(
            "change",
            atualizarTudo
        );

    }

}


function limparFiltros() {

    document.getElementById(
        "pesquisa"
    ).value = "";

    document.getElementById(
        "filtroCategoria"
    ).value = "";

    document.getElementById(
        "filtroMes"
    ).value = "";

    atualizarTudo();

}


/* =====================================
   ATUALIZAR TUDO
===================================== */

async function atualizarTudo() {

    await atualizarResumo();

    await renderTabela();

    await atualizarSaldo();

    await atualizarGrafico();

}


/* =====================================
   EXPORTAÇÃO
===================================== */

function exportarJSON() {

    const ficheiro =
        new Blob(
            [
                JSON.stringify(
                    dados,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            ficheiro
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        "gestor-financeiro.json";

    link.click();


    URL.revokeObjectURL(
        url
    );

}


function exportarCSV() {

    const linhas = [
        [
            "Data",
            "Descrição",
            "Categoria",
            "Valor",
            "Pagou",
            "Parte"
        ]
    ];


    dados.movimentos.forEach(
        movimento => {

            linhas.push([
                movimento.data,
                movimento.descricao,
                movimento.categoria,
                movimento.valor,
                movimento.pagadorNome,
                movimento.metade
            ]);

        }
    );


    const csv =
        linhas
            .map(
                linha =>
                    linha
                        .map(
                            valor =>
                                `"${String(
                                    valor ||
                                    ""
                                ).replaceAll(
                                    '"',
                                    '""'
                                )}"`
                        )
                        .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [
                "\uFEFF" +
                csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        "despesas-50-50.csv";

    link.click();


    URL.revokeObjectURL(
        url
    );

}


/* =====================================
   INICIALIZAÇÃO
===================================== */

async function iniciarAplicacao() {

    const data =
        document.getElementById(
            "dataDespesa"
        );

    if (data) {
        data.value =
            hojeISO();
    }


    configurarFiltros();


    await carregarPessoas();


    await atualizarTudo();

}


/* =====================================
   START
===================================== */

document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacao
);
