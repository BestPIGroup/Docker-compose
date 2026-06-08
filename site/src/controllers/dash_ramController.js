var conexaoS3Model = require("../models/dash_ramModel");

function buscarRegistros(req,res){

    var mac = req.body.MacServer;
    var linhas = req.body.QtdLinhas;

    if (mac == undefined){
        res.status(400).send("Mac indefinido");
    }else if(linhas == undefined){
        res.status(400).send("Quantidade de linhas indefinida");
    }else{

        conexaoS3Model.buscarRegistros(mac,linhas)
            .then(

                function(resultado){

                    res.send(resultado);

                }

            ).catch(

                function(erro){

                    console.log(erro);
                    console.log("Não foi possível ler o csv");
                    res.status(500).json(erro);

                }

            )

    }

}

module.exports = {
    buscarRegistros
}