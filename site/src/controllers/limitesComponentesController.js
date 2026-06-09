const limitesComponentesModel = require("../models/limitesComponentesModel");

function pegarMac(req) {
    return req.body.mac || req.body.MacServer || req.params.mac;
}

function responderErro(res, erro) {
    console.log(erro);
    res.status(500).json(erro.sqlMessage || erro.message || erro);
}

async function buscarLimites(req, res) {
    const mac = pegarMac(req);

    if (!mac) {
        res.status(400).send("MAC do servidor não informado");
        return;
    }

    try {
        const resultado = await limitesComponentesModel.buscarLimitesPorMac(mac);
        res.json(resultado);
    } catch (erro) {
        responderErro(res, erro);
    }
}

async function atualizarLimites(req, res) {
    const mac = pegarMac(req);
    const componentes = req.body.componentes;

    if (!mac) {
        res.status(400).send("MAC do servidor não informado");
        return;
    }

    if (!Array.isArray(componentes)) {
        res.status(400).send("Componentes não informados");
        return;
    }

    try {
        const resultado = await limitesComponentesModel.atualizarLimitesPorMac(mac, componentes);
        res.json(resultado);
    } catch (erro) {
        responderErro(res, erro);
    }
}

async function inserirLimites(req, res) {
    const mac = pegarMac(req);
    const componentes = req.body.componentes;

    if (!mac) {
        res.status(400).send("MAC do servidor não informado");
        return;
    }

    if (!Array.isArray(componentes)) {
        res.status(400).send("Componentes não informados");
        return;
    }

    try {
        const resultado = await limitesComponentesModel.inserirLimitesPorMac(mac, componentes);
        res.json(resultado);
    } catch (erro) {
        responderErro(res, erro);
    }
}

module.exports = {
    buscarLimites,
    atualizarLimites,
    inserirLimites
};
