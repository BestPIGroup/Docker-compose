const express = require("express");
const router = express.Router();
const alertasS3Controller = require("../controllers/alertasS3Controller");

router.post("/buscar_registros_alertas", alertasS3Controller.buscarRegistrosAlertas);
router.post("/buscar_alertas_filtrados", alertasS3Controller.buscarRegistrosAlertas);
router.post("/buscar_leituras", alertasS3Controller.buscarLeiturasNormais);
router.post("/buscar_leituras_normais", alertasS3Controller.buscarLeiturasNormais);
router.get("/salvos", alertasS3Controller.buscarAlertasSalvos);
router.get("/salvos/:mac", alertasS3Controller.buscarAlertasSalvos);
router.get("/leituras_salvas", alertasS3Controller.buscarLeiturasSalvas);
router.get("/leituras_salvas/:mac", alertasS3Controller.buscarLeiturasSalvas);

module.exports = router;
