        } else {
            pares[chave].saldo -= valor;
            pares[chave].idsBDeveA.push(divida.id);
        }
    });

    container.innerHTML = "";
    let encontrou = false;
    Object.values(pares).forEach(par => {
        if (Math.abs(par.saldo) <= 0.005) return;
        const aDeve = par.saldo > 0;
        const devedor = aDeve ? par.pessoaA : par.pessoaB;
        const credor = aDeve ? par.pessoaB : par.pessoaA;
        const valor = Math.abs(par.saldo);
        const ids = aDeve ? par.idsADeveB : par.idsBDeveA;
        encontrou = true;
        const div = document.createElement("div");
        div.className = "resumo-item";
        div.innerHTML = `
            <strong>${escapeHTML(nomes[devedor] || "Desconhecido")} deve ${euro(valor)} a ${escapeHTML(nomes[credor] || "Desconhecido")}</strong>
            <button type="button">Registar pagamento</button>`;
        div.querySelector("button").addEventListener("click", () => registarPagamento(devedor, credor, ids, valor));
        container.appendChild(div);
    });
    if (!encontrou) container.textContent = "Não existem saldos pendentes.";
}

async function liquidarDivida(id) {
    if (!verificarSupabase() || !confirm("Marcar esta dívida como paga?")) return;
    const { error } = await supabaseClient.from("dividas").update({ liquidado: true }).eq("id", id);
    if (error) return alert(`Erro: ${error.message}`);
    await carregarSaldos();
}

function descarregarBlob(blob, nome) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function exportarJSON() {
    const backup = { exportadoEm: new Date().toISOString(), orcamento: dados.orcamento, movimentos: dados.movimentos };
    descarregarBlob(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }), "gestor-financeiro.json");
}

function exportarCSV() {
    const linhas = [["Data", "Tipo", "Categoria", "Descrição", "Valor"], ...dados.movimentos.map(m => [m.data, m.tipo, m.categoria, m.descricao, m.valor])];
    const csv = linhas.map(linha => linha.map(valor => `"${String(valor).replaceAll('"', '""')}"`).join(",")).join("\n");
    descarregarBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), "gestor-financeiro.csv");
}

function importarJSON() {
    const ficheiro = document.getElementById("importFile")?.files[0];
    if (!ficheiro) return alert("Selecione um ficheiro JSON.");
    const reader = new FileReader();
    reader.onload = event => {
        try {
            const backup = JSON.parse(event.target.result);
            if (!Array.isArray(backup.movimentos)) throw new Error("Formato de backup inválido.");
            dados = { orcamento: Number(backup.orcamento) || 0, movimentos: backup.movimentos };
            guardarDados();
            const campo = document.getElementById("orcamentoMensal");
            if (campo) campo.value = dados.orcamento || "";
            atualizarTudo();
            alert("Backup importado com sucesso.");
        } catch (erro) {
            alert(`Não foi possível importar o backup:\n\n${erro.message}`);
        }
    };
    reader.readAsText(ficheiro);
}

function atualizarTudo() {
    atualizarDashboard();
    atualizarOrcamento();
    atualizarFiltroCategorias();
    renderTabela();
    atualizarResumoCategorias();
    atualizarGrafico();
}

async function iniciarAplicacao() {
    prepararDatas();
    const orcamento = document.getElementById("orcamentoMensal");
    if (orcamento) orcamento.value = dados.orcamento || "";
    configurarFiltros();
    atualizarTudo();
    if (typeof supabaseClient !== "undefined") {
        await carregarPessoasDividas();
        await carregarSaldos();
    }
}

document.addEventListener("DOMContentLoaded", iniciarAplicacao);
