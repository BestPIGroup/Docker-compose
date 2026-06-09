const express = require("express");
const router = express.Router();
const limitesComponentesController = require("../controllers/limitesComponentesController");

router.post("/buscar", limitesComponentesController.buscarLimites);
router.route("/atualizar")
    .put(limitesComponentesController.atualizarLimites)
    .post(limitesComponentesController.atualizarLimites);
router.post("/inserir", limitesComponentesController.inserirLimites);

module.exports = router;
