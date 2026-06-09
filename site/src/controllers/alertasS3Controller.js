const alertasS3Model = require("../models/alertasS3Model");

function montarDadosDaBusca(req) {
    const dados = {
        ...(req.query || {}),
        ...(req.body || {})
    };
    return {
        mac: dados.MacServer || dados.MacServers || dados.mac,
        linhas: dados.QtdLinhas || dados.linhas,
        filtros: {
            dataInicio: dados.dataInicio || dados.DataInicio,
            dataFim: dados.dataFim || dados.DataFim,
            ultimosMinutos: dados.ultimosMinutos || dados.UltimosMinutos
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
