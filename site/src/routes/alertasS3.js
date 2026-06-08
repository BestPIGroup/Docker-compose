const express = require("express");
const router = express.Router();
const alertasS3Controller = require("../controllers/alertasS3Controller");

router.post("/buscar_registros_alertas", alertasS3Controller.buscarRegistrosAlertas);
router.post("/buscar_alertas_filtrados", alertasS3Controller.buscarRegistrosAlertas);
router.get("/salvos", alertasS3Controller.buscarAlertasSalvos);
router.get("/salvos/:mac", alertasS3Controller.buscarAlertasSalvos);

module.exports = router;
