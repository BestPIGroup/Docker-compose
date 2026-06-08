const express = require("express");
const router = express.Router();
const limitesComponentesController = require("../controllers/limitesComponentesController");

router.post("/buscar", limitesComponentesController.buscarLimites);
router.put("/atualizar", limitesComponentesController.atualizarLimites);
router.post("/atualizar", limitesComponentesController.atualizarLimites);

module.exports = router;
