const express = require("express");
const router = express.Router();
const relatoriosS3Controller = require("../controllers/relatoriosS3Controller");

router.get(["/", "/listar", "/buscar_relatorios"], relatoriosS3Controller.listarRelatorios);
router.post(["/gerar-relatorio-geral", "/gerar_relatorio_geral", "/download-geral", "/baixar_relatorio_geral"], relatoriosS3Controller.gerarRelatorioGeral);
router.post(["/gerar-relatorio-servidor", "/gerar_relatorio_servidor"], relatoriosS3Controller.gerarRelatorioServidor);
router.get(["/download-geral-atual", "/baixar_relatorio_geral_atual"], relatoriosS3Controller.baixarRelatorioGeralAtual);
router.get(["/download-servidor-atual", "/baixar_relatorio_servidor_atual"], relatoriosS3Controller.baixarRelatorioServidorAtual);
router.get("/download", relatoriosS3Controller.baixarRelatorio);

module.exports = router;
