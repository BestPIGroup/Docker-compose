const AWS = require("aws-sdk");
const database = require("../database/config");

async function buscarRegistros(mac, linhas) {
    try {
        AWS.config.update({
            region: process.env.AWS_REGION,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN
        });

        const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

        const resposta = await s3.getObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: process.env.AWS_BUCKET_KEY
        }).promise();

        const conteudo = resposta.Body.toString("utf-8");
        const rows = conteudo.split("\n");

        const respostaLista = [];
        let count = 0;
        const macDigitado = mac.trim().toLowerCase();
        const qtdLinhas = Number(linhas);

        for (let i = rows.length - 1; i >= 0; i--) {
            if (rows[i].trim() === "") continue;

            const rowSep = rows[i].split(";");
            const macCsv = rowSep[0]?.trim().toLowerCase();
            if (macCsv === "idmac") continue;
            if (macCsv === macDigitado) {
                respostaLista.push({
                    idMac: rowSep[0],
                    usuario: rowSep[1],
                    timestamp: rowSep[2],
                    cpuPercent: parseFloat(rowSep[3]) || 0,
                    cpuCtxSwitches: Number(rowSep[5]),
                    top3ProcessosCpu: rowSep[6],
                    totalProcessos: Number(rowSep[8]),
                    cpuAlerta: rowSep[22]?.trim() || ""
                });
                count++;
            }
            if (count >= qtdLinhas) break;
        }

        return respostaLista;

    } catch (error) {
        console.error("Erro no S3:", error);
        throw error;
    }
}

async function buscarLimitesPorMac(mac) {
    const sqlServidor = `SELECT id_servidor FROM servidor WHERE endereco_mac = '${mac}'`;
    const servidorResult = await database.executar(sqlServidor);

    if (!servidorResult || servidorResult.length === 0) {
        throw new Error("Servidor não encontrado para o MAC informado");
    }

    const idServidor = servidorResult[0].id_servidor;
    const sqlLimites = `SELECT * FROM componente_servidor WHERE id_servidor = ${idServidor} AND (id_componente = 1 OR id_componente = 3)`;
    return database.executar(sqlLimites);
}

module.exports = {
    buscarLimitesPorMac,
    buscarRegistros
};