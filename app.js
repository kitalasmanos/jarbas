/* =====================================
   GESTOR FINANCEIRO
===================================== */

const STORAGE_KEY =
    "gestor-financeiro-dados";

let dados =
    JSON.parse(
        localStorage.getItem(
            STORAGE_KEY
        )
    ) || {
        categoriasLocais: {}
    };

let grafico = null;


/* =====================================
   UTILIDADES
===================================== */

function guardarDadosLocais() {

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

    return String(
        valor ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =====================================
   DATAS / FECHO MENSAL
===================================== */

function obterMesAtual() {

    return new Date()
        .toISOString()
        .slice(0, 7);

}


function obterMesSeguinte(mes) {

    const partes =
        String(mes)
            .split("-")
            .map(Number);

    const ano =
        partes[0];

    const numeroMes =
        partes[1];

    const data =
        new Date(
            ano,
            numeroMes,
            1
        );

    const novoAno =
        data.getFullYear();

    const novoMes =
        String(
            data.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    return `${novoAno}-${novoMes}`;

}


/* =====================================
   PESSOAS
===================================== */

async function obterPessoas() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("pessoas")
            .select(
                "id, nome"
            )
            .order(
                "nome"
            );

    if (error) {

        throw new Error(
            error.message
        );

    }

    return data || [];

}


async function carregarPagadores() {

    const select =
        document.getElementById(
            "pagador"
        );

    if (!select) {
        return;
    }

    try {

        const pessoas =
            await obterPessoas();

        select.innerHTML =
            '<option value="">Selecionar pessoa</option>';

        pessoas.forEach(
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

    } catch (error) {

        console.error(
            error
        );

        select.innerHTML =
            '<option value="">Erro ao carregar pessoas</option>';

    }

}


/* =====================================
   DATA DA DESPESA
===================================== */

function prepararData() {

    const input =
        document.getElementById(
            "dataDespesa"
        );

    if (
        input &&
        !input.value
    ) {

        input.value =
            hojeISO();

    }

}


/* =====================================
   REGISTAR DESPESA
===================================== */

async function registarDespesa() {

    const tipo =
        document.getElementById(
            "tipoDespesa"
        ).value;

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

    try {

        const pessoas =
            await obterPessoas();

        if (
            pessoas.length !== 2
        ) {

            alert(
                "A aplicação necessita de exatamente duas pessoas."
            );

            return;
        }

        const outraPessoa =
            pessoas.find(
                pessoa =>
                    Number(
                        pessoa.id
                    ) !== pagadorId
            );

        if (!outraPessoa) {

            alert(
                "Não foi possível determinar a outra pessoa."
            );

            return;
        }

        const partilhada =
            tipo === "partilhada";


        /* =================================
           CRIAR DESPESA
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
                            data,

                        partilhada:
                            partilhada
                    }
                ])
                .select(
                    "id"
                )
                .single();


        if (erroDespesa) {

            throw new Error(
                "Erro ao criar despesa: " +
                erroDespesa.message
            );

        }


        /* =================================
           CATEGORIA
        ================================= */

        dados.categoriasLocais =
            dados.categoriasLocais ||
            {};

        dados.categoriasLocais[
            despesa.id
        ] =
            categoria;

        guardarDadosLocais();


        /* =================================
           CRIAR DÍVIDA SE PARTILHADA
        ================================= */

        if (
            partilhada
        ) {

            const valorDevido =
                Math.round(
                    (
                        valor / 2
                    ) * 100
                ) / 100;

            const {
                error: erroDivida
            } =
                await supabaseClient
                    .from(
                        "dividas"
                    )
                    .insert([
                        {
                            despesa_id:
                                despesa.id,

                            devedor_id:
                                outraPessoa.id,

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

            if (
                erroDivida
            ) {

                throw new Error(
                    "A despesa foi criada, mas a dívida falhou: " +
                    erroDivida.message
                );

            }

        }


        document.getElementById(
            "descricao"
        ).value = "";

        document.getElementById(
            "valor"
        ).value = "";


        alert(
            partilhada
                ? "Despesa partilhada registada com sucesso!"
                : "Despesa pessoal registada com sucesso!"
        );


        await atualizarTudo();


    } catch (error) {

        console.error(
            error
        );

        alert(
            error.message
        );

    }

}


/* =====================================
   DESPESAS
===================================== */

async function obterDespesas() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "despesas_partilhadas"
            )
            .select(
                "id, descricao, valor, pagador_id, data, partilhada"
            )
            .order(
                "data",
                {
                    ascending:
                        false
                }
            )
            .order(
                "id",
                {
                    ascending:
                        false
                }
            );

    if (error) {

        throw new Error(
            error.message
        );

    }

    return data || [];

}


async function eliminarDespesa(id) {

    const confirmar =
        confirm(
            "Tem a certeza que pretende eliminar esta despesa?"
        );

    if (!confirmar) {
        return;
    }

    try {

        const {
            error: erroDivida
        } =
            await supabaseClient
                .from(
                    "dividas"
                )
                .delete()
                .eq(
                    "despesa_id",
                    id
                );

        if (
            erroDivida
        ) {

            throw new Error(
                "Erro ao eliminar a dívida: " +
                erroDivida.message
            );

        }


        const {
            error: erroDespesa
        } =
            await supabaseClient
                .from(
                    "despesas_partilhadas"
                )
                .delete()
                .eq(
                    "id",
                    id
                );

        if (
            erroDespesa
        ) {

            throw new Error(
                "Erro ao eliminar a despesa: " +
                erroDespesa.message
            );

        }


        if (
            dados.categoriasLocais
        ) {

            delete dados
                .categoriasLocais[id];

            guardarDadosLocais();

        }


        await atualizarTudo();


        alert(
            "Despesa eliminada com sucesso."
        );


    } catch (error) {

        console.error(
            error
        );

        alert(
            "Não foi possível eliminar:\n\n" +
            error.message
        );

    }

}


/* =====================================
   CATEGORIAS
===================================== */

function obterCategoria(id) {

    return (
        dados
            .categoriasLocais?.[id] ||
        "Outros"
    );

}


function atualizarFiltroCategorias(
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
                        obterCategoria(
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
   HISTÓRICO
===================================== */

async function renderHistorico() {

    const tbody =
        document.getElementById(
            "tabelaDespesas"
        );

    if (!tbody) {
        return;
    }

    try {

        const despesas =
            await obterDespesas();

        const pessoas =
            await obterPessoas();

        const nomes = {};

        pessoas.forEach(
            pessoa => {

                nomes[
                    pessoa.id
                ] =
                    pessoa.nome;

            }
        );


        atualizarFiltroCategorias(
            despesas
        );


        const pesquisa =
            document
                .getElementById(
                    "pesquisa"
                )
                .value
                .trim()
                .toLowerCase();


        const categoriaFiltro =
            document.getElementById(
                "filtroCategoria"
            ).value;


        const mesFiltro =
            document.getElementById(
                "filtroMes"
            ).value;


        const despesasFiltradas =
            despesas.filter(
                despesa => {

                    const categoria =
                        obterCategoria(
                            despesa.id
                        );

                    const matchPesquisa =
                        !pesquisa ||
                        despesa.descricao
                            .toLowerCase()
                            .includes(
                                pesquisa
                            );

                    const matchCategoria =
                        !categoriaFiltro ||
                        categoria ===
                        categoriaFiltro;

                    const matchMes =
                        !mesFiltro ||
                        String(
                            despesa.data
                        ).startsWith(
                            mesFiltro
                        );

                    return (
                        matchPesquisa &&
                        matchCategoria &&
                        matchMes
                    );

                }
            );


        tbody.innerHTML = "";


        if (
            despesasFiltradas.length ===
            0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        Não existem despesas.
                    </td>
                </tr>
            `;

            return;
        }


        despesasFiltradas.forEach(
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


                const tipo =
                    despesa.partilhada
                        ? "Partilhada 50/50"
                        : "Pessoal";


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
                        ${escapeHTML(
                            obterCategoria(
                                despesa.id
                            )
                        )}
                    </td>

                    <td>
                        ${tipo}
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

                        <button
                            type="button"
                            onclick="eliminarDespesa(
                                ${despesa.id}
                            )"
                        >
                            Eliminar
                        </button>

                    </td>
                `;


                tbody.appendChild(
                    tr
                );

            }
        );


    } catch (error) {

        console.error(
            error
        );

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Erro ao carregar despesas:
                    ${escapeHTML(
                        error.message
                    )}
                </td>
            </tr>
        `;

    }

}


/* =====================================
   SALDO
===================================== */

async function atualizarSaldo() {

    const container =
        document.getElementById(
            "saldoPessoas"
        );

    if (!container) {
        return;
    }

    try {

        const {
            data: dividas,
            error
        } =
            await supabaseClient
                .from(
                    "dividas"
                )
                .select(
                    "id, valor, valor_pago, devedor_id, credor_id, liquidado"
                )
                .eq(
                    "liquidado",
                    false
                );


        if (error) {

            throw new Error(
                error.message
            );

        }


        const pessoas =
            await obterPessoas();

        const nomes = {};

        pessoas.forEach(
            pessoa => {

                nomes[
                    pessoa.id
                ] =
                    pessoa.nome;

            }
        );


        const pares = {};


        (dividas || [])
            .forEach(
                divida => {

                    const devedor =
                        Number(
                            divida.devedor_id
                        );

                    const credor =
                        Number(
                            divida.credor_id
                        );

                    const falta =
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
                        falta <=
                        0
                    ) {
                        return;
                    }


                    const ids = [
                        devedor,
                        credor
                    ].sort(
                        (
                            a,
                            b
                        ) => a - b
                    );


                    const chave =
                        `${ids[0]}-${ids[1]}`;


                    if (
                        !pares[chave]
                    ) {

                        pares[chave] = {
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

                        pares[chave].saldo +=
                            falta;

                    } else {

                        pares[chave].saldo -=
                            falta;

                    }

                }
            );


        const resultados =
            Object.values(
                pares
            )
            .filter(
                par =>
                    Math.abs(
                        par.saldo
                    ) >
                    0.004
            );


        if (
            resultados.length ===
            0
        ) {

            container.innerHTML =
                "<strong>Ninguém deve nada neste momento.</strong>";

            return;

        }


        container.innerHTML = "";


        resultados.forEach(
            par => {

                let devedor;
                let credor;
                let valor;


                if (
                    par.saldo >
                    0
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
                            nomes[
                                devedor
                            ] ||
                            "Desconhecido"
                        )}
                        deve
                        ${euro(
                            valor
                        )}
                        a
                        ${escapeHTML(
                            nomes[
                                credor
                            ] ||
                            "Desconhecido"
                        )}
                    </strong>

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


    } catch (error) {

        console.error(
            error
        );

        container.textContent =
            "Erro ao calcular saldo: " +
            error.message;

    }

}


/* =====================================
   PAGAMENTO
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
            )}\n\nValor pago:`
        );

    if (
        resposta ===
        null
    ) {
        return;
    }


    const valorPagamento =
        Number(
            resposta.replace(
                ",",
                "."
            )
        );


    if (
        !Number.isFinite(
            valorPagamento
        ) ||
        valorPagamento <=
        0
    ) {

        alert(
            "Valor de pagamento inválido."
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


    try {

        const {
            data: dividas,
            error
        } =
            await supabaseClient
                .from(
                    "dividas"
                )
                .select(
                    "id, valor, valor_pago, devedor_id, credor_id"
                )
                .eq(
                    "liquidado",
                    false
                );


        if (error) {

            throw new Error(
                error.message
            );

        }


        let restante =
            valorPagamento;


        for (
            const divida
            of dividas
        ) {

            if (
                restante <=
                0
            ) {
                break;
            }


            if (
                Number(
                    divida.devedor_id
                ) !==
                Number(
                    devedorId
                ) ||
                Number(
                    divida.credor_id
                ) !==
                Number(
                    credorId
                )
            ) {
                continue;
            }


            const pago =
                Number(
                    divida.valor_pago ||
                    0
                );

            const falta =
                Math.max(
                    0,
                    Number(
                        divida.valor
                    ) -
                    pago
                );


            if (
                falta <=
                0
            ) {
                continue;
            }


            const aplicar =
                Math.min(
                    restante,
                    falta
                );


            const novoValorPago =
                pago +
                aplicar;


            const liquidado =
                novoValorPago >=
                Number(
                    divida.valor
                );


            const {
                error:
                    erroUpdate
            } =
                await supabaseClient
                    .from(
                        "dividas"
                    )
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

                throw new Error(
                    erroUpdate.message
                );

            }


            restante -=
                aplicar;

        }


        alert(
            "Pagamento registado com sucesso."
        );


        await atualizarTudo();


    } catch (error) {

        console.error(
            error
        );

        alert(
            "Erro ao registar pagamento:\n\n" +
            error.message
        );

    }

}


/* =====================================
   DASHBOARD
===================================== */

async function atualizarDashboard() {

    try {

        const despesas =
            await obterDespesas();

        const pessoas =
            await obterPessoas();


        const nomes = {};

        pessoas.forEach(
            pessoa => {

                nomes[
                    pessoa.id
                ] =
                    pessoa.nome;

            }
        );


        let total =
            0;

        let hugo =
            0;

        let natalia =
            0;


        despesas.forEach(
            despesa => {

                const valor =
                    Number(
                        despesa.valor
                    );


                total +=
                    valor;


                const nome =
                    (
                        nomes[
                            despesa.pagador_id
                        ] ||
                        ""
                    ).toLowerCase();


                if (
                    nome.includes(
                        "hugo"
                    )
                ) {

                    hugo +=
                        valor;

                }


                if (
                    nome.includes(
                        "natalia"
                    )
                ) {

                    natalia +=
                        valor;

                }

            }
        );


        document.getElementById(
            "totalDespesas"
        ).textContent =
            euro(
                total
            );


        document.getElementById(
            "totalPagoHugo"
        ).textContent =
            euro(
                hugo
            );


        document.getElementById(
            "totalPagoNatalia"
        ).textContent =
            euro(
                natalia
            );


        const {
            data: dividas
        } =
            await supabaseClient
                .from(
                    "dividas"
                )
                .select(
                    "valor, valor_pago, devedor_id, credor_id"
                )
                .eq(
                    "liquidado",
                    false
                );


        const saldos = {};


        (
            dividas ||
            []
        )
        .forEach(
            divida => {

                const devedor =
                    Number(
                        divida.devedor_id
                    );

                const credor =
                    Number(
                        divida.credor_id
                    );

                const falta =
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
                    falta <=
                    0
                ) {
                    return;
                }


                const ids = [
                    devedor,
                    credor
                ].sort(
                    (
                        a,
                        b
                    ) => a - b
                );


                const chave =
                    `${ids[0]}-${ids[1]}`;


                if (
                    !saldos[
                        chave
                    ]
                ) {

                    saldos[
                        chave
                    ] = {

                        a:
                            ids[0],

                        b:
                            ids[1],

                        saldo:
                            0

                    };

                }


                if (
                    devedor ===
                    ids[0]
                ) {

                    saldos[
                        chave
                    ].saldo +=
                        falta;

                } else {

                    saldos[
                        chave
                    ].saldo -=
                        falta;

                }

            }
        );


        const saldoAtual =
            document.getElementById(
                "saldoAtual"
            );


        const primeiroSaldo =
            Object.values(
                saldos
            )[0];


        if (
            !primeiroSaldo ||
            Math.abs(
                primeiroSaldo.saldo
            ) <
            0.005
        ) {

            saldoAtual.textContent =
                "Ninguém deve nada";

        } else {

            const nomeA =
                nomes[
                    primeiroSaldo.a
                ] ||
                "Pessoa A";

            const nomeB =
                nomes[
                    primeiroSaldo.b
                ] ||
                "Pessoa B";


            if (
                primeiroSaldo.saldo >
                0
            ) {

                saldoAtual.textContent =
                    `${nomeA} deve ${
                        euro(
                            primeiroSaldo.saldo
                        )
                    } a ${nomeB}`;

            } else {

                saldoAtual.textContent =
                    `${nomeB} deve ${
                        euro(
                            Math.abs(
                                primeiroSaldo.saldo
                            )
                        )
                    } a ${nomeA}`;

            }

        }


    } catch (error) {

        console.error(
            error
        );

    }

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
        typeof Chart ===
        "undefined"
    ) {

        return;
    }


    const despesas =
        await obterDespesas();


    const resumo = {};


    despesas.forEach(
        despesa => {

            const categoria =
                obterCategoria(
                    despesa.id
                );


            resumo[
                categoria
            ] =
                (
                    resumo[
                        categoria
                    ] ||
                    0
                ) +
                Number(
                    despesa.valor
                );

        }
    );


    const labels =
        Object.keys(
            resumo
        );


    const valores =
        Object.values(
            resumo
        );


    if (
        grafico
    ) {

        grafico.destroy();

        grafico =
            null;

    }


    if (
        labels.length ===
        0
    ) {

        return;
    }


    grafico =
        new Chart(
            canvas.getContext(
                "2d"
            ),
            {

                type:
                    "pie",

                data: {

                    labels:
                        labels,

                    datasets: [
                        {
                            data:
                                valores
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
            renderHistorico
        );

    }


    if (categoria) {

        categoria.addEventListener(
            "change",
            renderHistorico
        );

    }


    if (mes) {

        mes.addEventListener(
            "change",
            renderHistorico
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

    renderHistorico();

}


/* =====================================
   FECHO MENSAL
===================================== */

async function obterResumoMensal(
    mes
) {

    const despesas =
        await obterDespesas();

    const pessoas =
        await obterPessoas();

    const nomes = {};


    pessoas.forEach(
        pessoa => {

            nomes[
                pessoa.id
            ] =
                pessoa.nome;

        }
    );


    const despesasMes =
        despesas.filter(
            despesa =>
                String(
                    despesa.data
                ).startsWith(
                    mes
                )
        );


    let total =
        0;

    let totalHugo =
        0;

    let totalNatalia =
        0;

    let partilhadas =
        0;

    let pessoaisHugo =
        0;

    let pessoaisNatalia =
        0;


    despesasMes.forEach(
        despesa => {

            const valor =
                Number(
                    despesa.valor
                );

            total +=
                valor;


            const nomePagador =
                (
                    nomes[
                        despesa.pagador_id
                    ] ||
                    ""
                ).toLowerCase();


            if (
                nomePagador.includes(
                    "hugo"
                )
            ) {

                totalHugo +=
                    valor;

            }


            if (
                nomePagador.includes(
                    "natalia"
                )
            ) {

                totalNatalia +=
                    valor;

            }


            if (
                despesa.partilhada
            ) {

                partilhadas +=
                    valor;

            } else if (
                nomePagador.includes(
                    "hugo"
                )
            ) {

                pessoaisHugo +=
                    valor;

            } else if (
                nomePagador.includes(
                    "natalia"
                )
            ) {

                pessoaisNatalia +=
                    valor;

            }

        }
    );


    /* =================================
       SALDO ATUAL
    ================================= */

    const {
        data: dividas,
        error
    } =
        await supabaseClient
            .from(
                "dividas"
            )
            .select(
                "valor, valor_pago, devedor_id, credor_id, liquidado"
            )
            .eq(
                "liquidado",
                false
            );


    if (error) {

        throw new Error(
            error.message
        );

    }


    let nataliaDeveHugo =
        0;

    let hugoDeveNatalia =
        0;


    (
        dividas ||
        []
    )
    .forEach(
        divida => {

            const falta =
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
                falta <=
                0
            ) {

                return;

            }


            const pessoa =
                pessoas.find(
                    item =>
                        Number(
                            item.id
                        ) ===
                        Number(
                            divida.devedor_id
                        )
                );


            const nome =
                (
                    pessoa?.nome ||
                    ""
                ).toLowerCase();


            if (
                nome.includes(
                    "natalia"
                )
            ) {

                nataliaDeveHugo +=
                    falta;

            } else if (
                nome.includes(
                    "hugo"
                )
            ) {

                hugoDeveNatalia +=
                    falta;

            }

        }
    );


    let textoSaldo;


    const saldo =
        nataliaDeveHugo -
        hugoDeveNatalia;


    if (
        Math.abs(
            saldo
        ) < 0.005
    ) {

        textoSaldo =
            "Ninguém deve nada.";

    } else if (
        saldo > 0
    ) {

        textoSaldo =
            `Natalia deve ${
                euro(saldo)
            } a Hugo.`;

    } else {

        textoSaldo =
            `Hugo deve ${
                euro(
                    Math.abs(
                        saldo
                    )
                )
            } a Natalia.`;

    }


    return {

        mes,

        despesas:
            despesasMes,

        total,

        totalHugo,

        totalNatalia,

        partilhadas,

        pessoaisHugo,

        pessoaisNatalia,

        textoSaldo

    };

}


async function fecharMesAtual() {

    const filtro =
        document.getElementById(
            "filtroMes"
        );


    const mes =
        filtro?.value ||
        obterMesAtual();


    const confirmar =
        confirm(
            `Fechar o mês ${mes}?\n\n` +
            `Será preparado um resumo para email.`
        );


    if (!confirmar) {
        return;
    }


    try {

        const resumo =
            await obterResumoMensal(
                mes
            );


        const despesasTexto =
            resumo.despesas
                .map(
                    despesa =>
                        `- ${despesa.data} | ` +
                        `${despesa.descricao} | ` +
                        `${euro(
                            despesa.valor
                        )}`
                )
                .join(
                    "\n"
                );


        const assunto =
            `Gestor Financeiro - Fecho ${mes}`;


        const corpo = `
Resumo financeiro - ${mes}

Total de despesas:
${euro(resumo.total)}

Hugo pagou:
${euro(resumo.totalHugo)}

Natalia pagou:
${euro(resumo.totalNatalia)}

Despesas partilhadas:
${euro(resumo.partilhadas)}

Despesas pessoais do Hugo:
${euro(resumo.pessoaisHugo)}

Despesas pessoais da Natalia:
${euro(resumo.pessoaisNatalia)}

Saldo atual:
${resumo.textoSaldo}

DESPESAS DO MÊS
${despesasTexto || "Sem despesas registadas."}

Fecho gerado pelo Gestor Financeiro.
        `.trim();


        const mailto =
            `mailto:?subject=${encodeURIComponent(
                assunto
            )}&body=${encodeURIComponent(
                corpo
            )}`;


        window.location.href =
            mailto;


        const mesSeguinte =
            obterMesSeguinte(
                mes
            );


        if (filtro) {

            filtro.value =
                mesSeguinte;

        }


        await renderHistorico();


    } catch (error) {

        console.error(
            error
        );

        alert(
            "Erro ao fechar o mês:\n\n" +
            error.message
        );

    }

}


/* =====================================
   ATUALIZAR TUDO
===================================== */

async function atualizarTudo() {

    await atualizarDashboard();

    await renderHistorico();

    await atualizarSaldo();

    await atualizarGrafico();

}


/* =====================================
   EXPORTAÇÃO
===================================== */

async function exportarJSON() {

    try {

        const despesas =
            await obterDespesas();

        const nomes =
            await carregarNomes();


        const backup = {

            exportadoEm:
                new Date()
                    .toISOString(),

            despesas,

            nomes

        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        backup,
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
                blob
            );


        const a =
            document.createElement(
                "a"
            );


        a.href =
            url;

        a.download =
            "gestor-financeiro.json";


        document.body.appendChild(
            a
        );

        a.click();

        a.remove();


        URL.revokeObjectURL(
            url
        );


    } catch (error) {

        alert(
            error.message
        );

    }

}


async function carregarNomes() {

    const pessoas =
        await obterPessoas();

    const nomes = {};


    pessoas.forEach(
        pessoa => {

            nomes[
                pessoa.id
            ] =
                pessoa.nome;

        }
    );


    return nomes;

}


async function exportarCSV() {

    try {

        const despesas =
            await obterDespesas();

        const nomes =
            await carregarNomes();


        const linhas = [

            [
                "Data",
                "Descrição",
                "Categoria",
                "Tipo",
                "Valor",
                "Pagou"
            ]

        ];


        despesas.forEach(
            despesa => {

                linhas.push([

                    despesa.data,

                    despesa.descricao,

                    obterCategoria(
                        despesa.id
                    ),

                    despesa.partilhada
                        ? "Partilhada 50/50"
                        : "Pessoal",

                    despesa.valor,

                    nomes[
                        despesa.pagador_id
                    ] ||
                    ""

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
                                        valor ??
                                        ""
                                    ).replaceAll(
                                        '"',
                                        '""'
                                    )}"`
                            )
                            .join(
                                ","
                            )
                )
                .join(
                    "\n"
                );


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


        const a =
            document.createElement(
                "a"
            );


        a.href =
            url;

        a.download =
            "gestor-financeiro.csv";


        document.body.appendChild(
            a
        );

        a.click();

        a.remove();


        URL.revokeObjectURL(
            url
        );


    } catch (error) {

        alert(
            error.message
        );

    }

}


/* =====================================
   INICIALIZAÇÃO
===================================== */

async function iniciarAplicacao() {

    prepararData();

    configurarFiltros();

    await carregarPagadores();

    await atualizarTudo();

}


document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacao
);
