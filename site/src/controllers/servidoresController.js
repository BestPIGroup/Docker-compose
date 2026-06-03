var servidoresModel = require("../models/servidoresModel");

function cadastrar_servidor(req, res) {

    var Mac = req.body.MacServer;
    var status = req.body.statusServer;
    var fk_unidade = req.body.fk_unidadeServer;
    var alias = req.body.aliasServer;

    if (Mac == undefined) {
        res.status(400).send("Seu Mac está undefined!");
    } else if (status == undefined) {
        res.status(400).send("Seu status está undefined!");
    }else if (alias == undefined){
        res.status(400).send("Seu status está undefined!");
    } else {
        servidoresModel.cadastrar_servidor(alias,Mac, status, fk_unidade)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro do servidor! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}
module.exports = {
    cadastrar_servidor
}