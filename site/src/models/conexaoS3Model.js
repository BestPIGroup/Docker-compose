const AWS = require("aws-sdk");
const fs = require('fs');
const readline = require('readline');

async function buscarRegistros(mac, linhas) {

    console.log(AWS)

    try {

        const s3 = new AWS.S3({
            region: process.env.AWS_REGION,
            apiVersion: "2006-03-01"
        });

        const resposta = await s3.getObject({

            Bucket: process.env.AWS_BUCKET_NAME,
            Key: process.env.AWS_BUCKET_KEY

        }).promise();

        const conteudo = resposta.Body.toString("utf-8");

        var rows = conteudo.split('\n');

        var respostaLista = []

        var count = 0

        for (var i = rows.length - 1; i >= 0; i--) {

            rowSep = rows[i].split(";");

            if (rowSep[0] == mac) {

                respostaLista.push(rows[i].split(";"))
                count++;

            }

            if (count == linhas) {

                break;

            }

        }

        console.log(respostaLista);
        return (respostaLista);

    } catch (error) {

        console.error(error);

    }

}

module.exports = {
    buscarRegistros,
    separarLinhaCsv,
    filtrarPorPeriodo,
    colunasClient
};
