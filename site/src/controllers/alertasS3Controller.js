const alertasS3Model = require("../models/alertasS3Model");

async function buscarRegistrosAlertas(req, res) {
    const mac = req.body.MacServer || req.body.MacServers || req.body.mac;
    const linhas = req.body.QtdLinhas || req.body.linhas;
    const filtros = {
        dataInicio: req.body.dataInicio || req.body.DataInicio,
        dataFim: req.body.dataFim || req.body.DataFim,
        ultimosMinutos: req.body.ultimosMinutos || req.body.UltimosMinutos
    };

    if (mac === undefined) {
        res.status(400).send("Mac indefinido");
        return;
    }

    try {
        const resultado = await alertasS3Model.buscarRegistrosAlertas(mac, linhas, filtros);
        res.send(resultado);
    } catch (erro) {
        console.log(erro);
        console.log("Não foi possível ler o csv");
        res.status(500).json(erro);
    }
}

function buscarAlertasSalvos(req, res) {
    const mac = req.params.mac || req.query.mac;
    res.json(alertasS3Model.buscarAlertasSalvos(mac));
}

module.exports = {
    buscarRegistrosAlertas,
    buscarAlertasSalvos
};
