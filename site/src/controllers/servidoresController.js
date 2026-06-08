const servidoresModel = require("../models/servidoresModel");

async function cadastrar_servidor(req, res) {
    const mac = req.body.MacServer;
    const status = req.body.statusServer;
    const fk_unidade = req.body.fk_unidadeServer;
    const alias = req.body.aliasServer;

    if (mac === undefined) {
        res.status(400).send("Seu Mac está undefined!");
        return;
    }

    if (status === undefined) {
        res.status(400).send("Seu status está undefined!");
        return;
    }

    if (alias === undefined) {
        res.status(400).send("Seu alias está undefined!");
        return;
    }

    try {
        await servidoresModel.cadastrar_servidor(alias, mac, status, fk_unidade);
        const resultado = await servidoresModel.cadastrar_componentes_servidor(mac);
        res.json(resultado);
    } catch (erro) {
        console.log(erro);
        console.log("\nHouve um erro ao realizar o cadastro do servidor! Erro: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage || erro);
    }
}

async function listar_servidores(req, res) {
    const fk_unidade = req.params.fk_unidade || req.query.fk_unidade || req.body?.fk_unidade;

    try {
        const resultado = await servidoresModel.listar_servidores(fk_unidade);
        res.json(resultado);
    } catch (erro) {
        console.log(erro);
        console.log("\nHouve um erro ao buscar os servidores! Erro: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage || erro);
    }
}

module.exports = {
    cadastrar_servidor,
    listar_servidores
};
