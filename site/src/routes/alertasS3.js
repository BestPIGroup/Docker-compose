const express = require("express");
const router = express.Router();
const alertasS3Controller = require("../controllers/alertasS3Controller");

router.get(["/buscar_registros_alertas", "/buscar_alertas_filtrados"], alertasS3Controller.buscarRegistrosAlertas);
router.post(["/buscar_registros_alertas", "/buscar_alertas_filtrados"], alertasS3Controller.buscarRegistrosAlertas);
router.get(["/buscar_leituras", "/buscar_leituras_normais"], alertasS3Controller.buscarLeiturasNormais);
router.post(["/buscar_leituras", "/buscar_leituras_normais"], alertasS3Controller.buscarLeiturasNormais);
router.get(["/salvos", "/salvos/:mac"], alertasS3Controller.buscarAlertasSalvos);
router.get(["/leituras_salvas", "/leituras_salvas/:mac"], alertasS3Controller.buscarLeiturasSalvas);

module.exports = router;
