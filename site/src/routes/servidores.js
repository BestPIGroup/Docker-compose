const express = require("express");
const router = express.Router();
const servidoresController = require("../controllers/servidoresController");

router.post("/cadastrar_servidor", servidoresController.cadastrar_servidor);
router.get("/listar_servidores", servidoresController.listar_servidores);
router.get("/listar_servidores/:fk_unidade", servidoresController.listar_servidores);

router.post("/cadastrar_servidor",  function (req, res) {
    servidoresController.cadastrar_servidor(req, res);
})

router.post("/buscar_servidores", function(req,res){
    servidoresController.buscar_servidores(req,res);
})

router.post("/buscar_limites", function(req,res){
    servidoresController.buscar_limites(req,res);
})

module.exports = router;
