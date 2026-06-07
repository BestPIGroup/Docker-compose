// controllers/ransomwareController.js
const ransomwareModel = require("../models/ransomwareModel");

function buscarDadosRansomware(req, res) {

    console.log("QtdLinhas recebida:", req.body.QtdLinhas);
    
    const mac = req.body.MacServer;

    ransomwareModel.buscarDadosRansomware(mac)
        .then(function (resultado) {

            if (resultado === null) {
                return res.status(404).json({ erro: "MAC não encontrado no ransomware.json" });
            }

            res.json(resultado);

        })
        .catch(function (erro) {
            console.error("[ransomwareController]", erro);
            res.status(500).json({ erro: "Não foi possível carregar os dados de ransomware" });
        });
}

module.exports = { buscarDadosRansomware };
