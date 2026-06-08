var conexaoS3Model = require("../models/dashProcessosModel");

function buscarRegistros(req, res) {
    var mac = req.body.MacServer;
    var linhas = req.body.QtdLinhas;

    if (mac == undefined) {
        res.status(400).json({ erro: "Mac indefinido" });
    } else if (linhas == undefined) {
        res.status(400).json({ erro: "Quantidade de linhas indefinida" });
    } else {
        conexaoS3Model.buscarRegistros(mac, linhas)
            .then(function (resultado) {
                  console.log("Resultado vindo do model:", resultado);
                res.status(200).json(resultado);
            })
            .catch(function (erro) {
                console.log("Não foi possível ler o csv", erro);
                res.status(500).json({
                    erro: "Não foi possível ler o csv",
                    detalhe: erro.message
                });
            });
    }
}

module.exports = {
    buscarRegistros
}