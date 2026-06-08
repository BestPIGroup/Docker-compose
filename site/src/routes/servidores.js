const express = require("express");
const router = express.Router();
const servidoresController = require("../controllers/servidoresController");

router.post("/cadastrar_servidor", servidoresController.cadastrar_servidor);
router.get("/listar_servidores", servidoresController.listar_servidores);
router.get("/listar_servidores/:fk_unidade", servidoresController.listar_servidores);

module.exports = router;
