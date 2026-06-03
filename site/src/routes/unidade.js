var express = require("express");
var router = express.Router();

var unidadeController = require("../controllers/unidadeController");

router.post("/cadastrar_unidade", function (req, res) {
    unidadeController.cadastrar_unidade(req, res);
})

router.post("/verificar_unidade", function(req,res){
    unidadeController.verificar_unidade(req,res)
})

router.post("/ver_unidade", function(req,res){
    unidadeController.ver_unidade(req,res)
})

module.exports = router;