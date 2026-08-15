/* =====================================
   GESTOR FINANCEIRO 2.0
===================================== */
alert("TESTE APP.JS");

const STORAGE_KEY = "gestor-financeiro-v2";
const STORAGE_KEY = "gestor-financeiro-v2";

let dados = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || {
    orcamento: 0,
    movimentos: []
};

let graficoCategorias = null;


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

    return Number(valor || 0).toLocaleString(
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


/* =====================================
   DASHBOARD
===================================== */

function calcularTotais() {

    let receitas = 0;
    let despesas = 0;

    dados.movimentos.forEach(movimento => {

        if (movimento.tipo === "receita") {

            receitas += Number(
                movimento.valor
            );

        } else {

            despesas += Number(
                movimento.valor
            );

        }

    });

    return {
        receitas,
        despesas,
        saldo: receitas - despesas
    };

}


function atualizarDashboard() {

    const totais =
        calcularTotais();

    document.getElementById(
        "saldoAtual"
    ).textContent =
        euro(totais.saldo);

    document.getElementById(
        "totalReceitas"
    ).textContent =
        euro(totais.receitas);

    document.getElementById(
        "totalDespesas"
    ).textContent =
        euro(totais.despesas);

    const restante =
        dados.orcamento -
        totais.despesas;

    document.getElementById(
        "orcamentoRestante"
    ).textContent =
        euro(restante);

}


/* =====================================
   DATA
===================================== */

function prepararDatas() {

    const dataMovimento =
        document.getElementById(
            "dataMovimento"
        );

    const dataDivida =
        document.getElementById(
            "dataDivida"
        );

    if (
        dataMovimento &&
        !dataMovimento.value
    ) {
        dataMovimento.value =
            hojeISO();
    }

    if (
        dataDivida &&
        !dataDivida.value
    ) {
        dataDivida.value =
            hojeISO();
    }

}


/* =====================================
   MOVIMENTOS
===================================== */

function adicionarMovimento() {

    const tipo =
        document.getElementById(
            "tipo"
        ).value;

    const categoria =
        document.getElementById(
            "categoria"
        ).value;

    const descricao =
        document.getElementById(
            "descricao"
        ).value.trim();

    const valor =
        Number(
            document.getElementById(
                "valor"
            ).value
        );

    const data =
        document.getElementById(
            "dataMovimento"
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

    if (!data) {

        alert(
            "Selecione uma data."
        );

        return;
    }

    dados.movimentos.push({

        id: Date.now(),

        tipo,
        categoria,
        descricao,
        valor,
        data

    });

    guardarDados();

    document.getElementById(
        "descricao"
    ).value = "";

    document.getElementById(
        "valor"
    ).value = "";

    atualizarTudo();

}


function editarMovimento(id) {

    const movimento =
        dados.movimentos.find(
            item => item.id === id
        );

    if (!movimento) return;

    const descricao =
        prompt(
            "Descrição:",
            movimento.descricao
        );

    if (descricao === null) {
        return;
    }

    const valor =
        Number(
            prompt(
                "Valor (€):",
                movimento.valor
            )
        );

    if (
        !Number.isFinite(valor) ||
        valor <= 0
    ) {

        alert(
            "Valor inválido."
        );

        return;
    }

    movimento.descricao =
        descricao.trim() ||
        movimento.descricao;

    movimento.valor =
        valor;

    guardarDados();

    atualizarTudo();

}


function apagarMovimento(id) {

    const confirmar =
        confirm(
            "Pretende eliminar este movimento?"
        );

    if (!confirmar) {
        return;
    }

    dados.movimentos =
        dados.movimentos.filter(
            item => item.id !== id
        );

    guardarDados();

    atualizarTudo();

}


/* =====================================
   FILTROS
===================================== */

function obterMovimentosFiltrados() {

    const pesquisa =
        (
            document.getElementById(
                "pesquisa"
            )?.value || ""
        )
        .trim()
        .toLowerCase();

    const categoria =
        document.getElementById(
            "filtroCategoria"
        )?.value || "";

    const mes =
        document.getElementById(
            "filtroMes"
        )?.value || "";

    return dados.movimentos.filter(
        movimento => {

            const correspondePesquisa =
                !pesquisa ||
                movimento.descricao
                    .toLowerCase()
                    .includes(pesquisa);

            const correspondeCategoria =
                !categoria ||
                movimento.categoria === categoria;

            const correspondeMes =
                !mes ||
                movimento.data.startsWith(
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


function atualizarFiltroCategorias() {

    const select =
        document.getElementById(
            "filtroCategoria"
        );

    if (!select) return;

    const categoriaAtual =
        select.value;

    const categorias =
        [
            ...new Set(
                dados.movimentos.map(
                    movimento =>
                        movimento.categoria
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
            categoriaAtual
        )
    ) {

        select.value =
            categoriaAtual;

    }

}


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
   HISTÓRICO
===================================== */

function renderTabela() {

    const tbody =
        document.getElementById(
            "tabelaMovimentos"
        );

    if (!tbody) return;

    const movimentos =
        obterMovimentosFiltrados()
            .slice()
            .sort(
                (a, b) =>
                    b.data.localeCompare(a.data)
            );

    tbody.innerHTML = "";

    if (
        movimentos.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    Não existem movimentos.
                </td>
            </tr>
        `;

        return;
    }

    movimentos.forEach(
        movimento => {

            const tr =
                document.createElement(
                    "tr"
                );

            const sinal =
                movimento.tipo === "receita"
                    ? "+"
                    : "-";

            tr.innerHTML = `
                <td>
                    ${movimento.data}
                </td>

                <td>
                    ${
                        movimento.tipo === "receita"
                            ? "Receita"
                            : "Despesa"
                    }
                </td>

                <td>
                    ${movimento.categoria}
                </td>

                <td>
                    ${escapeHTML(
                        movimento.descricao
                    )}
                </td>

                <td class="${
                    movimento.tipo === "receita"
                        ? "receita-text"
                        : "despesa-text"
                }">
                    ${sinal}${euro(
                        movimento.valor
                    )}
                </td>

                <td>
                    <button
                        type="button"
                        onclick="editarMovimento(${movimento.id})">
                        Editar
                    </button>

                    <button
                        type="button"
                        onclick="apagarMovimento(${movimento.id})">
                        Apagar
                    </button>
                </td>
            `;

            tbody.appendChild(tr);

        }
    );

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
   ORÇAMENTO
===================================== */

function guardarOrcamento() {

    const valor =
        Number(
            document.getElementById(
                "orcamentoMensal"
            ).value
        );

    if (
        !Number.isFinite(valor) ||
        valor < 0
    ) {

        alert(
            "Introduza um orçamento válido."
        );

        return;
    }

    dados.orcamento =
        valor;

    guardarDados();

    atualizarOrcamento();

    atualizarDashboard();

    alert(
        "Orçamento guardado."
    );

}


function atualizarOrcamento() {

    const barra =
        document.getElementById(
            "progressBar"
        );

    const texto =
        document.getElementById(
            "percentagemOrcamento"
        );

    if (!barra || !texto) {
        return;
    }

    const despesas =
        calcularTotais().despesas;

    if (
        dados.orcamento <= 0
    ) {

        barra.style.width =
            "0%";

        barra.style.background =
            "#16a34a";

        texto.textContent =
            "Sem orçamento definido";

        return;
    }

    const percentagem =
        Math.min(
            (
                despesas /
                dados.orcamento
            ) * 100,
            100
        );

    barra.style.width =
        percentagem + "%";

    if (
        percentagem < 75
    ) {

        barra.style.background =
            "#16a34a";

    } else if (
        percentagem < 90
    ) {

        barra.style.background =
            "#f59e0b";

    } else {

        barra.style.background =
            "#dc2626";

    }

    texto.textContent =
        percentagem.toFixed(1) +
        "% utilizado";

}


/* =====================================
   RESUMO POR CATEGORIA
===================================== */

function atualizarResumoCategorias() {

    const container =
        document.getElementById(
            "resumoCategorias"
        );

    if (!container) return;

    const movimentos =
        obterMovimentosFiltrados();

    const resumo = {};

    movimentos.forEach(
        movimento => {

            if (
                movimento.tipo !== "despesa"
            ) {
                return;
            }

            resumo[movimento.categoria] =
                (
                    resumo[
                        movimento.categoria
                    ] || 0
                ) +
                Number(
                    movimento.valor
                );

        }
    );

    const categorias =
        Object.entries(
            resumo
        ).sort(
            (a, b) => b[1] - a[1]
        );

    if (
        categorias.length === 0
    ) {

        container.innerHTML =
            "Sem despesas registadas.";

        return;
    }

    container.innerHTML = "";

    categorias.forEach(
        ([categoria, valor]) => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "resumo-item";

            div.innerHTML = `
                <strong>
                    ${escapeHTML(categoria)}
                </strong>

                —
                ${euro(valor)}
            `;

            container.appendChild(div);

        }
    );

}


/* =====================================
   GRÁFICO
===================================== */

function atualizarGrafico() {

    const canvas =
        document.getElementById(
            "graficoCategorias"
        );

    if (!canvas) {
        return;
    }

    if (
        typeof Chart === "undefined"
    ) {

        return;
    }

    const movimentos =
        obterMovimentosFiltrados();

    const resumo = {};

    movimentos.forEach(
        movimento => {

            if (
                movimento.tipo !== "despesa"
            ) {
                return;
            }

            resumo[movimento.categoria] =
                (
                    resumo[
                        movimento.categoria
                    ] || 0
                ) +
                Number(
                    movimento.valor
                );

        }
    );

    const labels =
        Object.keys(resumo);

    const valores =
        Object.values(resumo);

    if (
        graficoCategorias
    ) {

        graficoCategorias.destroy();

        graficoCategorias =
            null;
    }

    if (
        labels.length === 0
    ) {

        return;
    }

    graficoCategorias =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "pie",

                data: {
                    labels,

                    datasets: [
                        {
                            data: valores
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: true,

                    plugins: {

                        legend: {
                            position: "bottom"
                        }

                    }

                }

            }
        );

}


/* =====================================
   SUPABASE — PESSOAS
===================================== */

async function carregarPessoasDividas() {

    const pagador =
        document.getElementById(
            "pagadorDivida"
        );

    const devedor =
        document.getElementById(
            "devedorDivida"
        );

    if (
        !pagador ||
        !devedor
    ) {
        return;
    }

    pagador.innerHTML =
        '<option value="">A carregar pessoas...</option>';

    devedor.innerHTML =
        '<option value="">A carregar pessoas...</option>';

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
            "Erro ao carregar pessoas:",
            error
        );

        pagador.innerHTML =
            '<option value="">Erro ao carregar</option>';

        devedor.innerHTML =
            '<option value="">Erro ao carregar</option>';

        return;
    }

    pagador.innerHTML =
        '<option value="">Selecionar pessoa</option>';

    devedor.innerHTML =
        '<option value="">Selecionar pessoa</option>';

    data.forEach(
        pessoa => {

            const nome =
                escapeHTML(
                    pessoa.nome
                );

            pagador.innerHTML += `
                <option value="${pessoa.id}">
                    ${nome}
                </option>
            `;

            devedor.innerHTML += `
                <option value="${pessoa.id}">
                    ${nome}
                </option>
            `;

        }
    );

}


/* =====================================
   REGISTAR DESPESA + DÍVIDA
===================================== */

async function registarDivida() {

    const pagadorId =
        Number(
            document.getElementById(
                "pagadorDivida"
            ).value
        );

    const devedorId =
        Number(
            document.getElementById(
                "devedorDivida"
            ).value
        );

    const descricao =
        document.getElementById(
            "descricaoDivida"
        ).value.trim();

    const valorTotal =
        Number(
            document.getElementById(
                "valorTotalDivida"
            ).value
        );

    const valorDevido =
        Number(
            document.getElementById(
                "valorDevido"
            ).value
        );

    const data =
        document.getElementById(
            "dataDivida"
        ).value;

    if (
        !pagadorId ||
        !devedorId
    ) {

        alert(
            "Selecione quem pagou e quem deve."
        );

        return;
    }

    if (
        pagadorId === devedorId
    ) {

        alert(
            "Quem pagou e quem deve têm de ser pessoas diferentes."
        );

        return;
    }

    if (!descricao) {

        alert(
            "Introduza uma descrição."
        );

        return;
    }

    if (
        !Number.isFinite(valorTotal) ||
        valorTotal <= 0
    ) {

        alert(
            "Introduza um valor total válido."
        );

        return;
    }

    if (
        !Number.isFinite(valorDevido) ||
        valorDevido <= 0 ||
        valorDevido > valorTotal
    ) {

        alert(
            "O valor devido tem de ser maior que 0 e não pode ultrapassar o valor total."
        );

        return;
    }

    if (!data) {

        alert(
            "Selecione uma data."
        );

        return;
    }


    /* ================================
       1. Criar despesa partilhada
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
                    descricao,
                    valor: valorTotal,
                    pagador_id: pagadorId,
                    data
                }
            ])
            .select("id")
            .single();

    if (erroDespesa) {

        console.error(
            "Erro ao criar despesa:",
            erroDespesa
        );

        alert(
            "Erro ao criar despesa:\n\n" +
            erroDespesa.message
        );

        return;
    }


    /* ================================
       2. Criar dívida
    ================================= */

    const {
        error: erroDivida
    } =
        await supabaseClient
            .from("dividas")
            .insert([
                {
                    despesa_id: despesa.id,
                    devedor_id: devedorId,
                    credor_id: pagadorId,
                    valor: valorDevido,
                    liquidado: false
                }
            ]);

    if (erroDivida) {

        console.error(
            "Erro ao criar dívida:",
            erroDivida
        );

        alert(
            "A despesa foi criada, mas a dívida não foi criada:\n\n" +
            erroDivida.message
        );

        return;
    }


    /* ================================
       3. Limpar formulário
    ================================= */

    document.getElementById(
        "descricaoDivida"
    ).value = "";

    document.getElementById(
        "valorTotalDivida"
    ).value = "";

    document.getElementById(
        "valorDevido"
    ).value = "";

    alert(
        "Dívida registada com sucesso!"
    );

    await carregarSaldos();

}


/* =====================================
   SUPABASE — SALDOS
===================================== */

async function carregarSaldos() {

    const container =
        document.getElementById("listaDividas");

    if (!container) {
        return;
    }

    container.textContent =
        "A consultar o Supabase...";

    const { data, error } =
        await supabaseClient
            .from("dividas")
            .select(
                "id, valor, devedor_id, credor_id, liquidado"
            )
            .eq("liquidado", false);

    if (error) {

        console.error(error);

        container.textContent =
            "ERRO: " + error.message;

        return;
    }

    if (!data || data.length === 0) {

        container.textContent =
            "Não existem dívidas pendentes.";

        return;
    }

    container.innerHTML =
        `<strong>${data.length} dívida(s) encontrada(s)</strong>`;

    data.forEach(divida => {

        const item =
            document.createElement("div");

        item.className =
            "resumo-item";

        item.textContent =
            `ID ${divida.id} — ${euro(divida.valor)} — devedor ${divida.devedor_id} — credor ${divida.credor_id}`;

        container.appendChild(item);

    });

}

        container.innerHTML = "";

        let encontrou = false;

        Object.values(pares).forEach(
            par => {

                let devedor;
                let credor;
                let valor;

                if (par.saldo > 0) {

                    devedor = par.pessoaA;
                    credor = par.pessoaB;
                    valor = par.saldo;

                } else if (par.saldo < 0) {

                    devedor = par.pessoaB;
                    credor = par.pessoaA;
                    valor =
                        Math.abs(par.saldo);

                } else {
                    return;
                }

                encontrou = true;

                const div =
                    document.createElement("div");

                div.className =
                    "resumo-item";

                div.textContent =
                    `${nomes[devedor] || "Desconhecido"} deve ${euro(valor)} a ${nomes[credor] || "Desconhecido"}`;

                container.appendChild(div);
            }
        );

        if (!encontrou) {
            container.textContent =
                "Não existem saldos pendentes.";
        }

    } catch (erro) {

        console.error(erro);

        container.innerHTML =
            `<strong>ERRO:</strong><br>${erro.message}`;

    }
}
    /* =================================
       SALDOS LÍQUIDOS
    ================================= */

    const pares = {};


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

            const valor =
                Number(
                    divida.valor
                );

            const ids = [
                devedor,
                credor
            ].sort(
                (a, b) => a - b
            );

            const chave =
                ids[0] +
                "-" +
                ids[1];

            if (!pares[chave]) {

                pares[chave] = {
                    pessoaA: ids[0],
                    pessoaB: ids[1],
                    saldo: 0
                };

            }

            if (
                devedor === ids[0]
            ) {

                pares[chave].saldo +=
                    valor;

            } else {

                pares[chave].saldo -=
                    valor;

            }

        }
    );


    /* =================================
       MOSTRAR SALDOS
    ================================= */

    container.innerHTML = "";

    let encontrou =
        false;


    Object.values(pares)
        .forEach(
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

                } else if (
                    par.saldo < 0
                ) {

                    devedor =
                        par.pessoaB;

                    credor =
                        par.pessoaA;

                    valor =
                        Math.abs(
                            par.saldo
                        );

                } else {

                    return;
                }


                encontrou =
                    true;


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
                `;

                container.appendChild(
                    div
                );

            }
        );


    if (!encontrou) {

        container.innerHTML =
            "Não existem saldos pendentes.";

    }

}


/* =====================================
   LIQUIDAR DÍVIDA
===================================== */

async function liquidarDivida(id) {

    const confirmar =
        confirm(
            "Marcar esta dívida como paga?"
        );

    if (!confirmar) {
        return;
    }

    const {
        error
    } =
        await supabaseClient
            .from("dividas")
            .update({
                liquidado: true
            })
            .eq(
                "id",
                id
            );

    if (error) {

        alert(
            "Erro: " +
            error.message
        );

        return;
    }

    await carregarSaldos();

}


/* =====================================
   EXPORTAR JSON
===================================== */

function exportarJSON() {

    const backup = {
        exportadoEm:
            new Date().toISOString(),

        orcamento:
            dados.orcamento,

        movimentos:
            dados.movimentos
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

    descarregarBlob(
        blob,
        "gestor-financeiro.json"
    );

}


/* =====================================
   EXPORTAR CSV
===================================== */

function exportarCSV() {

    const linhas = [
        [
            "Data",
            "Tipo",
            "Categoria",
            "Descrição",
            "Valor"
        ]
    ];

    dados.movimentos.forEach(
        movimento => {

            linhas.push([
                movimento.data,
                movimento.tipo,
                movimento.categoria,
                movimento.descricao,
                movimento.valor
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
                                    valor
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

    descarregarBlob(
        blob,
        "gestor-financeiro.csv"
    );

}


/* =====================================
   IMPORTAR JSON
===================================== */

function importarJSON() {

    const ficheiro =
        document.getElementById(
            "importFile"
        ).files[0];

    if (!ficheiro) {

        alert(
            "Selecione um ficheiro JSON."
        );

        return;
    }

    const reader =
        new FileReader();

    reader.onload =
        event => {

            try {

                const backup =
                    JSON.parse(
                        event.target.result
                    );

                if (
                    !Array.isArray(
                        backup.movimentos
                    )
                ) {

                    throw new Error(
                        "Formato de backup inválido."
                    );

                }

                dados = {

                    orcamento:
                        Number(
                            backup.orcamento || 0
                        ),

                    movimentos:
                        backup.movimentos

                };

                guardarDados();

                const campo =
                    document.getElementById(
                        "orcamentoMensal"
                    );

                if (campo) {

                    campo.value =
                        dados.orcamento || "";

                }

                atualizarTudo();

                alert(
                    "Backup importado com sucesso."
                );

            } catch (erro) {

                alert(
                    "Não foi possível importar o backup:\n\n" +
                    erro.message
                );

            }

        };

    reader.readAsText(
        ficheiro
    );

}

function descarregarBlob(
    blob,
    nome
) {

    const url =
        URL.createObjectURL(
            blob
        );

    const a =
        document.createElement(
            "a"
        );

    a.href = url;

    a.download = nome;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(
        url
    );

}


/* =====================================
   ATUALIZAR TUDO
===================================== */

function atualizarTudo() {

    atualizarDashboard();

    atualizarOrcamento();

    atualizarFiltroCategorias();

    renderTabela();

    atualizarResumoCategorias();

    atualizarGrafico();

}


/* =====================================
   INICIALIZAÇÃO
===================================== */

async function iniciarAplicacao() {

    alert("APP.JS A FUNCIONAR");

    prepararDatas();

    const orcamento =
        document.getElementById("orcamentoMensal");

    if (orcamento) {
        orcamento.value =
            dados.orcamento || "";
    }

    configurarFiltros();

    atualizarTudo();

    alert("VOU CARREGAR PESSOAS");

    await carregarPessoasDividas();

    alert("PESSOAS CARREGADAS");

    await carregarSaldos();

    alert("SALDOS CARREGADOS");
}


document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacao
);
