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
                    cpuPercent : parseFloat(rowSep[3]) || 0,
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

function buscarLimites(mac) {
    console.log("ACESSEI O MODEL DA UNIDADE ...");
    var instrucaoSql = `SELECT * FROM componente_servidor WHERE servidor.endereco_mac = ${mac} AND (id_componente = 1 OR id_componente = 3)
    JOIN servidor on componente_servidor.id_servidor=servidor.id_servidor;`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarLimites,
    buscarRegistros
};