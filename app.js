/* =====================================
   GESTOR FINANCEIRO
   APP.JS - PARTE 1
===================================== */

const STORAGE_KEY = "gestor-financeiro-v1";

let dados = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || {
    orcamento: 0,
    movimentos: []
};

/* =====================================
   GUARDAR DADOS
===================================== */

function guardarDados() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(dados)
    );

}

/* =====================================
   FORMATAR VALOR €
===================================== */

function euro(valor) {

    return Number(valor).toLocaleString(
        "pt-PT", {
            style: "currency",
            currency: "EUR"
        }
    );

}

/* =====================================
   DATA DE HOJE
===================================== */

function definirDataHoje() {

    const hoje =
        new Date()
        .toISOString()
        .split("T")[0];

    document.getElementById(
        "dataMovimento"
    ).value = hoje;

}

/* =====================================
   ADICIONAR MOVIMENTO
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
        parseFloat(
            document.getElementById(
                "valor"
            ).value
        );

    const data =
        document.getElementById(
            "dataMovimento"
        ).value;

    if (
        descricao === "" ||
        isNaN(valor) ||
        valor <= 0
    ) {

        alert(
            "Preencha todos os campos."
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

    limparFormulario();

    atualizarTudo();

}

/* =====================================
   LIMPAR FORMULÁRIO
===================================== */

function limparFormulario() {

    document.getElementById(
        "descricao"
    ).value = "";

    document.getElementById(
        "valor"
    ).value = "";

}

/* =====================================
   CALCULAR TOTAIS
===================================== */

function calcularTotais() {

    let receitas = 0;
    let despesas = 0;

    dados.movimentos.forEach(m => {

        if (
            m.tipo === "receita"
        ) {

            receitas +=
                Number(m.valor);

        } else {

            despesas +=
                Number(m.valor);

        }

    });

    return {

        receitas,

        despesas,

        saldo: receitas - despesas

    };

}

/* =====================================
   DASHBOARD
===================================== */

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
   HISTÓRICO
===================================== */

function renderTabela(
    lista = dados.movimentos
) {

    const tbody =
        document.getElementById(
            "tabelaMovimentos"
        );

    tbody.innerHTML = "";

    lista
        .slice()
        .reverse()
        .forEach(m => {

            const tr =
                document.createElement(
                    "tr"
                );

            tr.innerHTML = `

            <td>${m.data}</td>

            <td>
                ${m.tipo}
            </td>

            <td>
                ${m.categoria}
            </td>

            <td>
                ${m.descricao}
            </td>

            <td class="${
                m.tipo === "receita"
                ? "receita-text"
                : "despesa-text"
            }">

                ${euro(m.valor)}

            </td>

            <td>

                <button
                    onclick="editarMovimento(${m.id})">

                    Editar

                </button>

                <button
                    onclick="apagarMovimento(${m.id})">

                    Apagar

                </button>

            </td>

        `;

            tbody.appendChild(tr);

        });

}

/* =====================================
   FILTROS
===================================== */

function filtrarMovimentos() {

    const texto =
        document
        .getElementById(
            "pesquisa"
        )
        .value
        .toLowerCase();

    const categoria =
        document.getElementById(
            "filtroCategoria"
        ).value;

    const filtrados =
        dados.movimentos.filter(m => {

            const matchTexto =
                m.descricao
                .toLowerCase()
                .includes(texto);

            const matchCategoria =
                categoria === "" ||
                m.categoria === categoria;

            return (
                matchTexto &&
                matchCategoria
            );

        });

    renderTabela(
        filtrados
    );

}

/* =====================================
   PREENCHER FILTRO
===================================== */

function preencherCategorias() {

    const select =
        document.getElementById(
            "filtroCategoria"
        );

    const categorias = [
        ...new Set(
            dados.movimentos.map(
                m => m.categoria
            )
        )
    ];

    categorias.forEach(cat => {

        const option =
            document.createElement(
                "option"
            );

        option.value = cat;
        option.textContent = cat;

        select.appendChild(
            option
        );

    });

}

/* =====================================
   RESUMO CATEGORIAS
===================================== */

function atualizarResumoCategorias() {

    const resumo = {};

    dados.movimentos.forEach(m => {

        if (
            m.tipo === "despesa"
        ) {

            resumo[m.categoria] =
                (resumo[m.categoria] || 0) +
                Number(m.valor);

        }

    });

    const container =
        document.getElementById(
            "resumoCategorias"
        );

    container.innerHTML = "";

    Object.keys(resumo)
        .sort()
        .forEach(cat => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "resumo-item";

            div.innerHTML = `

                <strong>
                    ${cat}
                </strong>

                - ${euro(
                    resumo[cat]
                )}

            `;

            container.appendChild(
                div
            );

        });

}

/* =====================================
   ATUALIZAR TUDO
===================================== */

function atualizarTudo() {

    atualizarDashboard();

    renderTabela();

    atualizarResumoCategorias();

    atualizarGrafico();

}

/* =====================================
   EDITAR MOVIMENTO
===================================== */

function editarMovimento(id) {

    const movimento =
        dados.movimentos.find(
            m => m.id === id
        );

    if (!movimento) return;

    const novaDescricao =
        prompt(
            "Descrição:",
            movimento.descricao
        );

    if (
        novaDescricao === null
    ) return;

    const novoValor =
        parseFloat(
            prompt(
                "Valor (€):",
                movimento.valor
            )
        );

    if (
        isNaN(novoValor) ||
        novoValor <= 0
    ) {

        alert(
            "Valor inválido."
        );

        return;

    }

    movimento.descricao =
        novaDescricao;

    movimento.valor =
        novoValor;

    guardarDados();

    atualizarTudo();

}

/* =====================================
   APAGAR MOVIMENTO
===================================== */

function apagarMovimento(id) {

    const confirmar =
        confirm(
            "Eliminar este movimento?"
        );

    if (!confirmar) return;

    dados.movimentos =
        dados.movimentos.filter(
            m => m.id !== id
        );

    guardarDados();

    atualizarTudo();

}

/* =====================================
   ORÇAMENTO
===================================== */

function guardarOrcamento() {

    const valor =
        parseFloat(
            document.getElementById(
                "orcamentoMensal"
            ).value
        );

    if (
        isNaN(valor) ||
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

    alert(
        "Orçamento guardado."
    );

}

function atualizarOrcamento() {

    const despesas =
        calcularTotais()
        .despesas;

    const orcamento =
        dados.orcamento;

    const barra =
        document.getElementById(
            "progressBar"
        );

    const texto =
        document.getElementById(
            "percentagemOrcamento"
        );

    if (orcamento <= 0) {

        barra.style.width = "0%";

        texto.textContent =
            "Sem orçamento definido";

        return;

    }

    const percentagem =
        Math.min(
            (
                despesas /
                orcamento
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
   EXPORTAR JSON
===================================== */

function exportarJSON() {

    const blob =
        new Blob(
            [
                JSON.stringify(
                    dados,
                    null,
                    2
                )
            ], {
                type: "application/json"
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

    a.href = url;

    a.download =
        "gestor-financeiro.json";

    a.click();

    URL.revokeObjectURL(
        url
    );

}

/* =====================================
   EXPORTAR CSV
===================================== */

function exportarCSV() {

    let csv =
        "Data,Tipo,Categoria,Descricao,Valor\n";

    dados.movimentos.forEach(
        m => {

            csv +=
                `${m.data},${m.tipo},${m.categoria},"${m.descricao}",${m.valor}\n`;

        }
    );

    const blob =
        new Blob(
            [csv], {
                type: "text/csv;charset=utf-8;"
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

    a.href = url;

    a.download =
        "gestor-financeiro.csv";

    a.click();

    URL.revokeObjectURL(
        url
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
            "Selecione um ficheiro."
        );

        return;

    }

    const leitor =
        new FileReader();

    leitor.onload =
        function(e) {

            try {

                dados =
                    JSON.parse(
                        e.target.result
                    );

                guardarDados();

                atualizarTudo();

                atualizarOrcamento();

                alert(
                    "Backup importado."
                );

            } catch {

                alert(
                    "Ficheiro inválido."
                );

            }

        };

    leitor.readAsText(
        ficheiro
    );

}

/* =====================================
   INICIALIZAÇÃO
===================================== */

function iniciarAplicacao() {

    definirDataHoje();

    document.getElementById(
            "orcamentoMensal"
        ).value =
        dados.orcamento || "";

    preencherCategorias();

    atualizarTudo();

    atualizarOrcamento();

}

document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacao
);

/* =====================================
   FILTRO MENSAL
===================================== */

let grafico = null;

function aplicarFiltroMes() {

    const mes =
        document.getElementById(
            "filtroMes"
        ).value;

    if (!mes) {

        renderTabela(
            dados.movimentos
        );

        atualizarGrafico(
            dados.movimentos
        );

        return;
    }

    const lista =
        dados.movimentos.filter(
            m => m.data.startsWith(mes)
        );

    renderTabela(lista);

    atualizarGrafico(lista);

}

/* =====================================
   GRÁFICO CATEGORIAS
===================================== */

function atualizarGrafico(
    lista = dados.movimentos
) {

    const totais = {};

    lista.forEach(m => {

        if (
            m.tipo === "despesa"
        ) {

            totais[m.categoria] =
                (totais[m.categoria] || 0) +
                Number(m.valor);

        }

    });

    const labels =
        Object.keys(totais);

    const valores =
        Object.values(totais);

    const canvas =
        document.getElementById(
            "graficoCategorias"
        );

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    if (grafico) {

        grafico.destroy();

    }

    grafico = new Chart(
        ctx, {
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
   PESSOAS - SUPABASE
===================================== */

async function carregarPessoasDividas() {

    const { data, error } =
        await supabaseClient
            .from("pessoas")
            .select("id, nome")
            .order("nome");

    if (error) {

        console.error(
            "Erro ao carregar pessoas:",
            error
        );

        alert(
            "Erro ao carregar pessoas: " +
            error.message
        );

        return;
    }

    const pagador =
        document.getElementById(
            "pagadorDivida"
        );

    const devedor =
        document.getElementById(
            "devedorDivida"
        );

    if (!pagador || !devedor) {
        return;
    }

    pagador.innerHTML =
        '<option value="">Selecionar pessoa</option>';

    devedor.innerHTML =
        '<option value="">Selecionar pessoa</option>';

    data.forEach(pessoa => {

        const optionPagador =
            document.createElement(
                "option"
            );

        optionPagador.value =
            pessoa.id;

        optionPagador.textContent =
            pessoa.nome;

        pagador.appendChild(
            optionPagador
        );


        const optionDevedor =
            document.createElement(
                "option"
            );

        optionDevedor.value =
            pessoa.id;

        optionDevedor.textContent =
            pessoa.nome;

        devedor.appendChild(
            optionDevedor
        );

    });

}


/* =====================================
   DATA DA DÍVIDA
===================================== */

function definirDataDivida() {

    const campo =
        document.getElementById(
            "dataDivida"
        );

    if (!campo) return;

    const hoje =
        new Date()
        .toISOString()
        .split("T")[0];

    campo.value = hoje;

}


/* =====================================
   INICIALIZAR SISTEMA DE DÍVIDAS
===================================== */

async function iniciarSistemaDividas() {

    definirDataDivida();

    await carregarPessoasDividas();

    await carregarDividas();

}


/* =====================================
   INICIAR QUANDO A PÁGINA CARREGAR
===================================== */

document.addEventListener(
    "DOMContentLoaded",
    iniciarSistemaDividas
);

/* =====================================
   REGISTAR DÍVIDA
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
        parseFloat(
            document.getElementById(
                "valorTotalDivida"
            ).value
        );

    const valorDevido =
        parseFloat(
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
        !devedorId ||
        pagadorId === devedorId ||
        !descricao ||
        isNaN(valorTotal) ||
        valorTotal <= 0 ||
        isNaN(valorDevido) ||
        valorDevido <= 0 ||
        valorDevido > valorTotal ||
        !data
    ) {
        alert(
            "Preencha corretamente os campos."
        );
        return;
    }

    /* -----------------------------
       1. Criar despesa partilhada
    ----------------------------- */

    const {
        data: despesa,
        error: erroDespesa
    } =
        await supabaseClient
            .from("despesas_partilhadas")
            .insert([
                {
                    descricao: descricao,
                    valor: valorTotal,
                    pagador_id: pagadorId,
                    data: data
                }
            ])
            .select()
            .single();

    if (erroDespesa) {

        console.error(erroDespesa);

        alert(
            "Erro ao criar despesa:\n" +
            erroDespesa.message
        );

        return;
    }

    /* -----------------------------
       2. Criar dívida
    ----------------------------- */

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

        console.error(erroDivida);

        alert(
            "A despesa foi criada, mas houve um erro ao criar a dívida:\n" +
            erroDivida.message
        );

        return;
    }

    alert(
        "Dívida registada com sucesso!"
    );

    document.getElementById(
        "descricaoDivida"
    ).value = "";

    document.getElementById(
        "valorTotalDivida"
    ).value = "";

    document.getElementById(
        "valorDevido"
    ).value = "";

    await carregarDividas();

}

/* =====================================
   CARREGAR DÍVIDAS
===================================== */

```javascript
async function carregarDividas() {

    const {
        data: dividas,
        error
    } = await supabaseClient
        .from("dividas")
        .select(
            "id, valor, liquidado, devedor_id, credor_id, despesa_id"
        )
        .eq("liquidado", false);

    const container =
        document.getElementById("listaDividas");

    if (error) {

        console.error(error);

        container.innerHTML =
            "Erro ao carregar dívidas: " +
            error.message;

        return;
    }

    if (!dividas || dividas.length === 0) {

        container.innerHTML =
            "Não existem dívidas pendentes.";

        return;
    }

    /* =====================================
       CARREGAR NOMES DAS PESSOAS
    ===================================== */

    const { data: pessoas, error: erroPessoas } =
        await supabaseClient
            .from("pessoas")
            .select("id, nome");

    if (erroPessoas) {

        console.error(erroPessoas);

        container.innerHTML =
            "Erro ao carregar pessoas.";

        return;
    }

    const nomes = {};

    pessoas.forEach(pessoa => {
        nomes[pessoa.id] = pessoa.nome;
    });

    /* =====================================
       CALCULAR SALDO LÍQUIDO
    ===================================== */

    const saldos = {};

    dividas.forEach(divida => {

        const devedor = divida.devedor_id;
        const credor = divida.credor_id;
        const valor = Number(divida.valor);

        /*
         * Criamos uma chave única para o par
         * de pessoas, independentemente da direção.
         */

        const ids = [
            Number(devedor),
            Number(credor)
        ].sort((a, b) => a - b);

        const chave =
            ids[0] + "-" + ids[1];

        if (!saldos[chave]) {

            saldos[chave] = {
                pessoaA: ids[0],
                pessoaB: ids[1],
                saldo: 0
            };

        }

        /*
         * Se pessoa A deve a B:
         * saldo positivo = A deve a B
         */

        if (Number(devedor) === ids[0]) {

            saldos[chave].saldo += valor;

        } else {

            saldos[chave].saldo -= valor;

        }

    });

    /* =====================================
       MOSTRAR RESULTADO
    ===================================== */

    container.innerHTML = "";

    let encontrouSaldo = false;

    Object.values(saldos).forEach(item => {

        /*
         * Se o saldo for positivo:
         * pessoaA deve à pessoaB
         *
         * Se for negativo:
         * pessoaB deve à pessoaA
         */

        let devedor;
        let credor;
        let valor;

        if (item.saldo > 0) {

            devedor = item.pessoaA;
            credor = item.pessoaB;
            valor = item.saldo;

        } else if (item.saldo < 0) {

            devedor = item.pessoaB;
            credor = item.pessoaA;
            valor = Math.abs(item.saldo);

        } else {

            return;
        }

        encontrouSaldo = true;

        const div =
            document.createElement("div");

        div.className =
            "resumo-item";

        div.innerHTML = `
            <strong>
                ${nomes[devedor] || "Desconhecido"}
                deve
                ${euro(valor)}
                a
                ${nomes[credor] || "Desconhecido"}
            </strong>
        `;

        container.appendChild(div);

    });

    if (!encontrouSaldo) {

        container.innerHTML =
            "Não existem saldos pendentes.";

    }

}
```

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
            .eq("id", id);

    if (error) {

        alert(
            "Erro: " +
            error.message
        );

        return;
    }

    await carregarDividas();

}
