// models/ransomwareModel.js
const AWS = require("aws-sdk");

async function buscarDadosRansomware(mac) {

    const s3 = new AWS.S3({
        region: process.env.AWS_REGION,
        apiVersion: "2006-03-01"
    });

    const resposta = await s3.getObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: "client/ransomware.json",
    }).promise();

    const json = JSON.parse(resposta.Body.toString("utf-8"));

    if (!mac) return json;

    const dados = json[mac];
    if (!dados) return null;

    return dados;
}

module.exports = { buscarDadosRansomware };