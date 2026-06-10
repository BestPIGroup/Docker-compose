var dash_cpuModel = require("../models/dash_cpuModel");

function parseTop3(str) {
    if (!str || typeof str !== 'string') return [];
    const jsonStr = str.replace(/'/g, '"');
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        return [];
    }
}

function buscarRegistros(req, res) {
    var mac = req.body.MacServer;
    var linhas = req.body.QtdLinhas;

    if (!mac) {
        res.status(400).send("Mac indefinido");
        return;
    }
    if (!linhas) {
        res.status(400).send("Quantidade de linhas indefinida");
        return;
    }

    dash_cpuModel.buscarRegistros(mac, linhas)
        .then(function (resultado) {
            resultado.reverse();

            const labels = [];
            const labelsHora = [];
            const cpuPercent = [];
            const ctxSwitches = [];
            const topProcessCpu = [];
            const totalProcessos = [];
            let lastTop3 = [];

            resultado.forEach((row, index) => {
                const ts = row.timestamp;
                labels.push(ts || "");
                labelsHora.push(ts ? ts.substring(11, 16) : "");

                const cpu = row.cpuPercent || 0;
                cpuPercent.push(cpu);

                const cs = row.cpuCtxSwitches || 0;
                ctxSwitches.push(Number((cs / 1000).toFixed(1)));

                let top3Array = parseTop3(row.top3ProcessosCpu);
                const maxCpu = top3Array.length > 0 ? Math.max(...top3Array.map(p => p[2])) : 0;
                topProcessCpu.push(maxCpu);

                const processos = row.totalProcessos || 0;
                totalProcessos.push(processos);

                if (index === resultado.length - 1) {
                    lastTop3 = top3Array.map(p => ({
                        pid: p[0],
                        nome: p[1],
                        uso: p[2]
                    }));
                }
            });

            const slice30min = arr => arr.slice(-6);
            const pico30cpu = slice30min(cpuPercent).length > 0 ? Math.max(...slice30min(cpuPercent)) : 0;
            const pico30cs = slice30min(ctxSwitches).length > 0 ? Math.max(...slice30min(ctxSwitches)) : 0;
            const pico30proc = slice30min(totalProcessos).length > 0 ? Math.max(...slice30min(totalProcessos)) : 0;

            const media = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
            const media3hCpu = media(cpuPercent);
            const media3hCs = media(ctxSwitches);
            const media3hProc = media(totalProcessos);

            res.json({
                labels,
                labels_hora: labelsHora,
                cpu_percent: cpuPercent,
                ctx_switches: ctxSwitches,
                top_process_cpu: topProcessCpu,
                total_processos: totalProcessos,
                top_3_processos: lastTop3,
                picos_30min: {
                    cpu: pico30cpu,
                    cs: pico30cs,
                    processos: pico30proc
                },
                medias_3h: {
                    cpu: media3hCpu,
                    cs: media3hCs,
                    processos: media3hProc
                },
                timestamp_servidor: resultado.length > 0 ? resultado[resultado.length - 1].timestamp : ""
            });
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json({ erro: "Erro ao processar dados" });
        });
}

function buscarLimites(req, res) {
    var mac = req.body.MacServer;

    if (!mac) {
        return res.status(400).send("MAC do servidor não fornecido");
    }

    dash_cpuModel.buscarLimitesPorMac(mac)
        .then(function (resultado) {
            const limites = {};
            resultado.forEach(row => {
                const componenteId = row.id_componente;
                const valorLimite = Number(row.limite_componente);
                if (componenteId == 1) {
                    limites.cpu = valorLimite;
                } else if (componenteId == 3) {
                    limites.cs = valorLimite;
                }
            });
            res.json(limites);
        })
        .catch(function (erro) {
            console.error("Erro ao buscar limites:", erro);
            res.status(500).json({ erro: erro.message || "Erro interno" });
        });
}

module.exports = {
    buscarLimites,
    buscarRegistros
};
