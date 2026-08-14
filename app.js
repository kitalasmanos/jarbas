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