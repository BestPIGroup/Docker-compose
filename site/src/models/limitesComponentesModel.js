const database = require("../database/config");

const componentesDoModal = [
    { chave: "CPU", nome: "CPU", id: 1 },
    { chave: "PROCESSOS", nome: "Processos", id: 7 },
    { chave: "RAM", nome: "RAM", id: 3 },
    { chave: "DISCO", nome: "Disco", id: 6 },
    { chave: "REDE", nome: "Rede", id: 8 },
    { chave: "RANSOMWARE", nome: "Ransomware", id: 20 },
    { chave: "DDOS", nome: "DDoS", id: 21 },
    { chave: "MALWARE", nome: "Malware", id: 22 }
];

function limparValorSql(valor) {
    return String(valor || "").replace(/'/g, "''");
}

function limparNumero(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function limparBooleano(valor) {
    return valor === true || valor === 1 || valor === "1" ? 1 : 0;
}

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
}

function buscarComponente(nomeOuId) {
    const texto = normalizarTexto(nomeOuId);
    return componentesDoModal.find(componente =>
        componente.id === Number(nomeOuId) ||
        componente.chave === texto ||
        normalizarTexto(componente.nome) === texto
    );
}

function montarResposta(mac, linhas) {
    return {
        mac,
        componentes: componentesDoModal.map(componente => {
            const linha = linhas.find(item => Number(item.idComponente) === componente.id);

            return {
                idComponente: componente.id,
                chave: componente.chave,
                nome: componente.nome,
                limite: linha ? Number(linha.limite) : null,
                exibir: linha ? Number(linha.exibir) === 1 : false
            };
        })
    };
}

async function buscarLimitesPorMac(mac) {
    if (!mac) throw new Error("MAC do servidor não informado");

    const macLimpo = limparValorSql(mac);
    const ids = componentesDoModal.map(componente => componente.id).join(",");
    const instrucaoSql = `
        SELECT
            cs.id_componente AS idComponente,
            cs.limite_componente AS limite,
            cs.exibir
        FROM componente_servidor cs
        INNER JOIN servidor s ON s.id_servidor = cs.id_servidor
        WHERE s.endereco_mac = '${macLimpo}'
          AND cs.id_componente IN (${ids})
        ORDER BY cs.id_componente;
    `;

    const linhas = await database.executar(instrucaoSql);
    return montarResposta(mac, linhas);
}

async function atualizarLimitesPorMac(mac, componentes) {
    if (!mac) throw new Error("MAC do servidor não informado");
    if (!Array.isArray(componentes)) throw new Error("Componentes não informados");

    const macLimpo = limparValorSql(mac);

    for (const item of componentes) {
        const componente = buscarComponente(item.chave || item.nome || item.idComponente);
        const limite = limparNumero(item.limite);
        if (!componente || limite === null) continue;

        const exibir = limparBooleano(item.exibir);
        const instrucaoSql = `
            UPDATE componente_servidor cs
            INNER JOIN servidor s ON s.id_servidor = cs.id_servidor
            SET
                cs.limite_componente = ${limite},
                cs.exibir = ${exibir}
            WHERE s.endereco_mac = '${macLimpo}'
              AND cs.id_componente = ${componente.id};
        `;

        const resultado = await database.executar(instrucaoSql);

        if (resultado.affectedRows === 0) {
            const instrucaoInsert = `
                INSERT INTO componente_servidor(id_servidor, id_componente, limite_componente, exibir)
                SELECT
                    s.id_servidor,
                    ${componente.id},
                    ${limite},
                    ${exibir}
                FROM servidor s
                WHERE s.endereco_mac = '${macLimpo}';
            `;

            await database.executar(instrucaoInsert);
        }
    }

    return buscarLimitesPorMac(mac);
}

module.exports = {
    buscarLimitesPorMac,
    atualizarLimitesPorMac,
    componentesDoModal
};
