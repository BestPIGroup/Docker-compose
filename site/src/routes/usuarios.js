var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

//Recebendo os dados do html e direcionando para a função cadastrar de usuarioController.js
router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
})

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});
router.post("/ver_usuario", function (req, res){
    usuarioController.ver_usuario(req,res);
}) 
router.post("/cadastrar_Func", function (req, res) {
    usuarioController.cadastrar_Func(req, res);
})

router.post("/cadastrar_slackJira", function (req, res) {
    usuarioController.cadastrar_slackJira(req, res);
})

router.get("/listar_funcionarios/:fk_responsavel", function (req, res) {
    usuarioController.listar_funcionarios(req, res);
});

router.delete("/excluir_funcionario", function (req, res) {
    usuarioController.excluir_funcionario(req, res);
});

module.exports = router;