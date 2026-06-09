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
            const cpuPercent = [];
            const ctxSwitches = [];
            const topProcessCpu = [];
            const totalProcessos = [];
            let lastTop3 = [];

            resultado.forEach((row, index) => {
                const ts = row.timestamp;
                const hora = ts ? ts.substring(11, 16) : "";
                labels.push(hora);

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

            const alertasCpu = resultado.filter(r => r.cpuAlerta === 'Alerta').length;

            let ultimoAlertaMinutos = null;
            for (let i = resultado.length - 1; i >= 0; i--) {
                if (resultado[i].cpuAlerta === 'Alerta') {
                    const timestampAlerta = resultado[i].timestamp;
                    const partes = timestampAlerta.split(' ');
                    if (partes.length === 2) {
                        const dataPartes = partes[0].split('/');
                        const horaPartes = partes[1].split(':');
                        const dia = parseInt(dataPartes[0], 10);
                        const mes = parseInt(dataPartes[1], 10) - 1;
                        const ano = parseInt(dataPartes[2], 10);
                        const hora = parseInt(horaPartes[0], 10);
                        const minuto = parseInt(horaPartes[1], 10);
                        const segundo = parseInt(horaPartes[2], 10);
                        const dataAlerta = new Date(ano, mes, dia, hora, minuto, segundo);
                        const agora = new Date();
                        const diffMs = agora - dataAlerta;
                        ultimoAlertaMinutos = Math.floor(diffMs / 60000);
                    }
                    break;
                }
            }

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
                alertas_cpu: {
                    quantidade: alertasCpu
                },
                ultimo_alerta: {
                    minutos: ultimoAlertaMinutos
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
    var mac = req.body.mac;

    if (!mac) {
        return res.status(400).send("MAC do servidor não fornecido");
    }

    dash_cpuModel.buscarLimites(mac)
        .then(function (resultado) {
            const limites = {};
            resultado.forEach(row => {
                if (row.id_componente == 1) {        
                    limites.cpu = Number(row.limite_componente);         
                } else if (row.id_componente == 3) {  
                    limites.cs = Number(row.limite_componente);
                }
            });
            res.json(limites);   
        })
        .catch(function (erro) {
            console.log("Erro na busca dos limites: ", erro);
            res.status(500).json({ erro: erro.sqlMessage || "Erro interno" });
        });
}

module.exports = {
    buscarLimites,
    buscarRegistros
};