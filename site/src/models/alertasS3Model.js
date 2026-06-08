const AWS = require("aws-sdk");

const alertasPorServidor = {};
const leiturasPorServidor = {};

const colunasClient = [
    "idMac",
    "usuarios",
    "timestamp",
    "cpu_percent",
    "cpu_time_user",
    "cpu_ctx_switches",
    "top_3_processos_cpu",
    "top_3_processos_disco",
    "total_processos",
    "virtual_memory_usage",
    "disk_read_mbps",
    "disk_percent",
    "disk_write_mbps",
    "net_kbps_sent",
    "net_kbps_recv",
    "net_packets_sent",
    "net_packets_recv",
    "net_dropin",
    "net_dropout",
    "usuarios_logados",
    "virtual_memory_status",
    "cpu_percent_status",
    "disk_percent_status",
    "net_errors",
    "total_arquivos_abertos",
    "mediana_net_sent",
    "mediana_net_recv"
];

function configurarS3() {
    AWS.config.update({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    });

    return new AWS.S3({ apiVersion: "2006-03-01" });
}

function separarLinhaCsv(linha) {
    const partes = String(linha || "").trim().split(";");
    if (partes.length < 3) return null;

    return {
        timestamp: partes[0].trim(),
        mac: partes[1].trim(),
        mensagensTexto: partes.slice(2).join(";").trim(),
        linhaOriginal: linha
    };
}

function separarDataHora(timestamp) {
    const [data = "", hora = ""] = String(timestamp || "").split(" ");
    return { data, hora };
}

function separarDataHoraClient(timestamp) {
    const texto = String(timestamp || "").trim();
    if (!texto) return { data: "", hora: "" };

    if (/^\d{2}\/\d{2}\/\d{4}/.test(texto)) {
        const [data = "", hora = "00:00:00"] = texto.split(/\s+/);
        return { data, hora };
    }

    const dataConvertida = new Date(texto);
    if (Number.isNaN(dataConvertida.getTime())) return { data: "", hora: "" };

    return {
        data: `${String(dataConvertida.getDate()).padStart(2, "0")}/${String(dataConvertida.getMonth() + 1).padStart(2, "0")}/${dataConvertida.getFullYear()}`,
        hora: `${String(dataConvertida.getHours()).padStart(2, "0")}:${String(dataConvertida.getMinutes()).padStart(2, "0")}:${String(dataConvertida.getSeconds()).padStart(2, "0")}`
    };
}

function limparTexto(valor) {
    return String(valor || "")
        .replace(/^\s*\[?\s*/, "")
        .replace(/\s*\]?\s*$/, "")
        .replace(/^['"]|['"]$/g, "")
        .trim();
}

function extrairMensagens(mensagensTexto) {
    const blocos = String(mensagensTexto || "").match(/\{[^}]+\}/g) || [];

    return blocos.map(bloco => {
        const conteudo = bloco.replace(/[{}]/g, "");
        const separador = conteudo.indexOf(":");

        if (separador === -1) {
            return { componente: "GERAL", mensagem: limparTexto(conteudo) };
        }

        return {
            componente: limparTexto(conteudo.slice(0, separador)).toUpperCase(),
            mensagem: limparTexto(conteudo.slice(separador + 1))
        };
    }).filter(alerta => alerta.mensagem);
}

function montarRegistro(dadosLinha) {
    const { data, hora } = separarDataHora(dadosLinha.timestamp);

    return {
        timestamp: dadosLinha.timestamp,
        data,
        hora,
        mac: dadosLinha.mac,
        mensagens: extrairMensagens(dadosLinha.mensagensTexto),
        linhaOriginal: dadosLinha.linhaOriginal
    };
}

function montarLeitura(linha) {
    const valores = String(linha || "").trim().split(";");
    if (valores.length < 3) return null;

    const campos = colunasClient.reduce((objeto, coluna, indice) => {
        objeto[coluna] = valores[indice] || "";
        return objeto;
    }, {});

    if (!campos.idMac || campos.idMac === "idMac") return null;

    const { data, hora } = separarDataHoraClient(campos.timestamp);
    if (!data || !hora) return null;

    return {
        mac: campos.idMac,
        timestamp: campos.timestamp,
        data,
        hora,
        campos,
        valores,
        linhaOriginal: linha
    };
}

function contarPorComponente(registros) {
    return registros.reduce((contagem, registro) => {
        registro.mensagens.forEach(alerta => {
            contagem[alerta.componente] = (contagem[alerta.componente] || 0) + 1;
        });
        return contagem;
    }, {});
}

function dataDoRegistro(registro) {
    const [dia, mes, ano] = String(registro.data || "").split("/").map(Number);
    const [hora = 0, minuto = 0, segundo = 0] = String(registro.hora || "00:00:00").split(":").map(Number);
    if (!dia || !mes || !ano) return null;
    return new Date(ano, mes - 1, dia, hora, minuto, segundo);
}

function filtrarPorPeriodo(registros, filtros) {
    if (!filtros) return registros;

    let inicio = filtros.dataInicio ? new Date(filtros.dataInicio) : null;
    let fim = filtros.dataFim ? new Date(filtros.dataFim) : null;

    if (Number(filtros.ultimosMinutos) > 0) {
        inicio = new Date(Date.now() - Number(filtros.ultimosMinutos) * 60 * 1000);
        fim = new Date();
    }

    if (!inicio && !fim) return registros;

    return registros.filter(registro => {
        const data = dataDoRegistro(registro);
        if (!data) return false;
        if (inicio && data < inicio) return false;
        if (fim && data > fim) return false;
        return true;
    });
}

function montarResultado(mac, registros) {
    return {
        mac,
        total: registros.length,
        registros,
        porComponente: contarPorComponente(registros),
        atualizadoEm: new Date().toISOString()
    };
}

function montarResultadoLeituras(mac, registros) {
    return {
        mac,
        total: registros.length,
        registros,
        atualizadoEm: new Date().toISOString()
    };
}

function filtrarRegistros(conteudo, mac, linhas) {
    const limite = Number(linhas) > 0 ? Number(linhas) : Infinity;
    const registros = [];
    const linhasCsv = String(conteudo || "").split(/\r?\n/);

    for (let indice = linhasCsv.length - 1; indice >= 0; indice--) {
        const dadosLinha = separarLinhaCsv(linhasCsv[indice]);
        if (!dadosLinha || dadosLinha.mac !== mac) continue;

        registros.push(montarRegistro(dadosLinha));
        if (registros.length >= limite) break;
    }

    return registros;
}

function filtrarLeituras(conteudo, mac, linhas) {
    const limite = Number(linhas) > 0 ? Number(linhas) : Infinity;
    const registros = [];
    const linhasCsv = String(conteudo || "").split(/\r?\n/);

    for (let indice = linhasCsv.length - 1; indice >= 0; indice--) {
        const registro = montarLeitura(linhasCsv[indice]);
        if (!registro || registro.mac !== mac) continue;

        registros.push(registro);
        if (registros.length >= limite) break;
    }

    return registros;
}

async function buscarRegistrosAlertas(mac, linhas, filtros) {
    if (!mac) throw new Error("MAC do servidor não informado");

    const s3 = configurarS3();
    const resposta = await s3.getObject({
        Bucket: process.env.AWS_BUCKET_ALERTS_NAME,
        Key: process.env.AWS_BUCKET_ALERTS_KEY
    }).promise();

    const conteudo = resposta.Body.toString("utf-8");
    const registros = filtrarPorPeriodo(filtrarRegistros(conteudo, mac, linhas), filtros);
    const resultado = montarResultado(mac, registros);

    alertasPorServidor[mac] = resultado;
    return resultado;
}

async function buscarLeiturasNormais(mac, linhas, filtros) {
    if (!mac) throw new Error("MAC do servidor não informado");

    const s3 = configurarS3();
    const resposta = await s3.getObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: process.env.AWS_BUCKET_KEY
    }).promise();

    const conteudo = resposta.Body.toString("utf-8");
    const registros = filtrarPorPeriodo(filtrarLeituras(conteudo, mac, linhas), filtros);
    const resultado = montarResultadoLeituras(mac, registros);

    leiturasPorServidor[mac] = resultado;
    return resultado;
}

function buscarAlertasSalvos(mac) {
    if (mac) return alertasPorServidor[mac] || null;
    return alertasPorServidor;
}

function buscarLeiturasSalvas(mac) {
    if (mac) return leiturasPorServidor[mac] || null;
    return leiturasPorServidor;
}

module.exports = {
    buscarRegistrosAlertas,
    buscarLeiturasNormais,
    buscarAlertasSalvos,
    buscarLeiturasSalvas,
    separarLinhaCsv,
    montarLeitura,
    extrairMensagens,
    filtrarPorPeriodo,
    colunasClient
};
