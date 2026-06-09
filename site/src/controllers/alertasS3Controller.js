const alertasS3Model = require("../models/alertasS3Model");

function montarDadosDaBusca(req) {
    return {
        mac: req.body.MacServer || req.body.MacServers || req.body.mac,
        linhas: req.body.QtdLinhas || req.body.linhas,
        filtros: {
            dataInicio: req.body.dataInicio || req.body.DataInicio,
            dataFim: req.body.dataFim || req.body.DataFim,
            ultimosMinutos: req.body.ultimosMinutos || req.body.UltimosMinutos
        }
    };
}

function responderErro(res, erro, texto) {
    console.log(erro);
    console.log(texto);
    res.status(500).json(erro);
}

async function buscarDados(req, res, funcaoModel, textoErro) {
    const { mac, linhas, filtros } = montarDadosDaBusca(req);

    if (mac === undefined) {
        res.status(400).send("Mac indefinido");
        return;
    }

    try {
        const resultado = await funcaoModel(mac, linhas, filtros);
        res.send(resultado);
    } catch (erro) {
        responderErro(res, erro, textoErro);
    }
}

function buscarRegistrosAlertas(req, res) {
    return buscarDados(req, res, alertasS3Model.buscarRegistrosAlertas, "Não foi possível ler o csv de alertas");
}

function buscarLeiturasNormais(req, res) {
    return buscarDados(req, res, alertasS3Model.buscarLeiturasNormais, "Não foi possível ler o csv de leituras");
}

function buscarAlertasSalvos(req, res) {
    const mac = req.params.mac || req.query.mac;
    res.json(alertasS3Model.buscarAlertasSalvos(mac));
}

function buscarLeiturasSalvas(req, res) {
    const mac = req.params.mac || req.query.mac;
    res.json(alertasS3Model.buscarLeiturasSalvas(mac));
}

module.exports = {
    buscarRegistrosAlertas,
    buscarLeiturasNormais,
    buscarAlertasSalvos,
    buscarLeiturasSalvas
};
