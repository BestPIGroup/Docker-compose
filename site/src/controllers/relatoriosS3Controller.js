const relatoriosS3Model = require("../models/relatoriosS3Model");

function responderErro(res, erro, texto) {
    console.log(erro);
    console.log(texto);
    res.status(500).json({ erro: texto });
}

function obterMacRelatorioServidor(dados = {}) {
    return dados.macAddress || dados.mac || dados.MacServer || dados.MacAddress;
}

async function listarRelatorios(req, res) {
    try {
        const resultado = await relatoriosS3Model.listarRelatorios();
        res.json(resultado);
    } catch (erro) {
        responderErro(res, erro, "Nao foi possivel listar os relatorios");
    }
}

async function baixarRelatorio(req, res) {
    const key = req.query.key;

    if (!key) {
        res.status(400).send("Relatorio indefinido");
        return;
    }

    try {
        const url = await relatoriosS3Model.gerarUrlDownload(key);
        res.redirect(url);
    } catch (erro) {
        if (erro.message === "Relatorio invalido") {
            res.status(400).send("Relatorio invalido");
            return;
        }

        responderErro(res, erro, "Nao foi possivel gerar o download do relatorio");
    }
}

async function baixarRelatorioGeralAtual(req, res) {
    const identificador = req.query.identificador || req.query.idUnidade || req.query.ID_UNIDADE || req.query.fkUnidade;
    const geradoDepoisDe = req.query.geradoDepoisDe || req.query.solicitadoEm || req.query.after;

    try {
        const url = await relatoriosS3Model.gerarUrlDownloadRelatorioGeralAtual({ identificador, geradoDepoisDe });

        if (req.query.json === "1" || req.query.formato === "json") {
            res.json({ downloadUrl: url });
            return;
        }

        res.redirect(url);
    } catch (erro) {
        if (erro.message === "Relatorio geral nao encontrado") {
            res.status(404).send("Relatorio geral de hoje ainda nao encontrado");
            return;
        }

        if (erro.message === "Relatorio invalido") {
            res.status(400).send("Relatorio invalido");
            return;
        }

        responderErro(res, erro, "Nao foi possivel gerar o download do relatorio geral");
    }
}

async function gerarRelatorioGeral(req, res) {
    try {
        const resultado = await relatoriosS3Model.solicitarGeracaoRelatorioGeralPorS3(req.body || {});

        res.status(202).json({
            mensagem: "Geracao do relatorio geral solicitada pelo S3",
            downloadPendente: true,
            resultado
        });
    } catch (erro) {
        if (erro.message === "Identificador do relatorio geral nao informado") {
            res.status(400).json({ erro: "Identificador do relatorio geral nao informado" });
            return;
        }

        if (erro.message === "Lambda de relatorio geral nao configurada") {
            res.status(500).json({ erro: "Lambda de relatorio geral nao configurada" });
            return;
        }

        responderErro(res, erro, "Nao foi possivel solicitar a geracao do relatorio geral");
    }
}

async function gerarRelatorioServidor(req, res) {
    try {
        const dados = req.body || {};
        const macAddress = obterMacRelatorioServidor(dados);
        const resultado = await relatoriosS3Model.solicitarGeracaoRelatorioServidorPorS3(dados);

        res.status(202).json({
            mensagem: "Geracao do relatorio do servidor solicitada pelo S3",
            macAddress,
            downloadPendente: true,
            resultado
        });
    } catch (erro) {
        if (erro.message === "MAC do servidor nao informado") {
            res.status(400).json({ erro: "MAC do servidor nao informado" });
            return;
        }

        if (erro.message === "Lambda de relatorio de servidor nao configurada") {
            res.status(500).json({ erro: "Lambda de relatorio de servidor nao configurada" });
            return;
        }

        responderErro(res, erro, "Nao foi possivel solicitar a geracao do relatorio do servidor");
    }
}

async function baixarRelatorioServidorAtual(req, res) {
    const macAddress = req.query.macAddress || req.query.mac || req.query.MacServer;
    const geradoDepoisDe = req.query.geradoDepoisDe || req.query.solicitadoEm || req.query.after;

    if (!macAddress) {
        res.status(400).send("MAC do servidor nao informado");
        return;
    }

    try {
        const url = await relatoriosS3Model.gerarUrlDownloadRelatorioServidorAtual(macAddress, { geradoDepoisDe });

        if (req.query.json === "1" || req.query.formato === "json") {
            res.json({ downloadUrl: url });
            return;
        }

        res.redirect(url);
    } catch (erro) {
        if (erro.message === "Relatorio de servidor nao encontrado") {
            res.status(404).send("Relatorio do servidor ainda nao encontrado");
            return;
        }

        if (erro.message === "Relatorio invalido" || erro.message === "MAC do servidor nao informado") {
            res.status(400).send(erro.message);
            return;
        }

        responderErro(res, erro, "Nao foi possivel gerar o download do relatorio do servidor");
    }
}

module.exports = {
    listarRelatorios,
    baixarRelatorio,
    baixarRelatorioGeralAtual,
    gerarRelatorioGeral,
    gerarRelatorioServidor,
    baixarRelatorioServidorAtual
};
