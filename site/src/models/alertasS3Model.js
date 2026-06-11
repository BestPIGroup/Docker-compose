const AWS = require("aws-sdk");

const alertasPorServidor = {};
const leiturasPorServidor = {};
const macsArquivosAlertasCompartilhados = [
    "4c:44:5b:f2:74:61",
    "bc:cd:99:c2:86:34"
];

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
    "mediana_net_recv",
    "ligacoes"
];

const aliasesColunasLeitura = {
    IDMAC: "idMac",
    ID_MAC: "idMac",
    MAC: "idMac",
    MACADRESS: "idMac",
    MACADDRESS: "idMac",
    USER: "usuarios",
    USUARIO: "usuarios",
    USUARIOS: "usuarios",
    TIMESTAMP: "timestamp",
    LIGACOES: "ligacoes",
    LIGACAO: "ligacoes"
};

function normalizarNomeColuna(coluna) {
    return String(coluna || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase();
}

function nomePadraoColuna(coluna) {
    const nomeNormalizado = normalizarNomeColuna(coluna);
    const colunaClient = colunasClient.find(item => normalizarNomeColuna(item) === nomeNormalizado);
    return aliasesColunasLeitura[nomeNormalizado] || colunaClient || String(coluna || "").trim();
}

function obterCabecalhoLeituras(linhasCsv) {
    const linhaCabecalho = linhasCsv.find(linha => {
        const texto = normalizarNomeColuna(linha);
        return texto.includes("TIMESTAMP") && /(ID_MAC|IDMAC|MAC)/.test(texto);
    });

    return linhaCabecalho ? String(linhaCabecalho).split(";").map(coluna => coluna.trim()) : [];
}

function montarCamposLeitura(valores, cabecalho = []) {
    const campos = colunasClient.reduce((objeto, coluna, indice) => {
        objeto[coluna] = valores[indice] || "";
        return objeto;
    }, {});

    if (!Array.isArray(cabecalho) || cabecalho.length === 0) return campos;

    cabecalho.forEach((coluna, indice) => {
        const valor = valores[indice] || "";
        campos[nomePadraoColuna(coluna)] = valor;
        campos[String(coluna || "").trim()] = valor;
    });

    return campos;
}

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
    if (!data || !hora) return null;

    return {
        timestamp: dadosLinha.timestamp,
        data,
        hora,
        mac: dadosLinha.mac,
        mensagens: extrairMensagens(dadosLinha.mensagensTexto),
        linhaOriginal: dadosLinha.linhaOriginal
    };
}

function montarRegistroDaLinha(linha) {
    const dadosLinha = separarLinhaCsv(linha);
    return dadosLinha ? montarRegistro(dadosLinha) : null;
}

function montarLeitura(linha, cabecalho = []) {
    const valores = String(linha || "").trim().split(";");
    if (valores.length < 3) return null;

    const campos = montarCamposLeitura(valores, cabecalho);

    if (!campos.idMac || campos.idMac === "idMac") return null;

    const { data, hora } = separarDataHora(campos.timestamp);
    if (!data || !hora) return null;
    const ligacoes = Number(String(campos.ligacoes || campos.Ligacoes || campos["Ligações"] || "0").replace(",", "."));

    return {
        mac: campos.idMac,
        timestamp: campos.timestamp,
        data,
        hora,
        ligacoes: Number.isFinite(ligacoes) ? ligacoes : 0,
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

function anoCompleto(ano) {
    const texto = String(ano || "");
    return texto.length === 2 ? Number(`20${texto}`) : Number(texto);
}

function dataLocalDoFiltro(valor, fimDoDia = false) {
    if (!valor) return null;

    const texto = String(valor).trim();
    const horario = fimDoDia ? [23, 59, 59, 999] : [0, 0, 0, 0];
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);

    if (dataIso) {
        return new Date(
            Number(dataIso[1]),
            Number(dataIso[2]) - 1,
            Number(dataIso[3]),
            dataIso[4] ? Number(dataIso[4]) : horario[0],
            dataIso[5] ? Number(dataIso[5]) : horario[1],
            dataIso[6] ? Number(dataIso[6]) : horario[2],
            dataIso[4] ? 0 : horario[3]
        );
    }

    const dataBr = texto.match(/^(\d{2})[/-](\d{2})[/-](\d{2}|\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);

    if (dataBr) {
        return new Date(
            anoCompleto(dataBr[3]),
            Number(dataBr[2]) - 1,
            Number(dataBr[1]),
            dataBr[4] ? Number(dataBr[4]) : horario[0],
            dataBr[5] ? Number(dataBr[5]) : horario[1],
            dataBr[6] ? Number(dataBr[6]) : horario[2],
            dataBr[4] ? 0 : horario[3]
        );
    }

    const dataConvertida = new Date(texto);
    return Number.isNaN(dataConvertida.getTime()) ? null : dataConvertida;
}

function filtrarPorPeriodo(registros, filtros) {
    if (!filtros) return registros;

    let inicio = dataLocalDoFiltro(filtros.dataInicio);
    let fim = dataLocalDoFiltro(filtros.dataFim, true);

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

function montarResultado(mac, registros, incluirComponentes = false) {
    const resultado = {
        mac,
        total: registros.length,
        registros,
        atualizadoEm: new Date().toISOString()
    };

    if (incluirComponentes) resultado.porComponente = contarPorComponente(registros);

    return resultado;
}

function filtrarLinhasDoServidor(conteudo, mac, linhas, montarItem) {
    const limite = Number(linhas) > 0 ? Number(linhas) : Infinity;
    const registros = [];
    const linhasCsv = String(conteudo || "").split(/\r?\n/);
    const cabecalhoLeituras = montarItem === montarLeitura ? obterCabecalhoLeituras(linhasCsv) : [];
    const macComparacao = String(mac || "").trim().toLowerCase();

    for (let indice = linhasCsv.length - 1; indice >= 0; indice--) {
        const registro = montarItem(linhasCsv[indice], cabecalhoLeituras);
        const macRegistro = String(registro?.mac || "").trim().toLowerCase();
        if (!registro || macRegistro !== macComparacao) continue;

        registros.push(registro);
        if (registros.length >= limite) break;
    }

    return registros;
}

function formatarDataArquivoAlertas(data) {
    const ano = String(data.getFullYear()).slice(-2);

    return [
        String(data.getDate()).padStart(2, "0"),
        String(data.getMonth() + 1).padStart(2, "0"),
        ano
    ].join("-");
}

function dataAtualSaoPaulo() {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date()).reduce((objeto, parte) => {
        objeto[parte.type] = parte.value;
        return objeto;
    }, {});

    return new Date(Number(partes.year), Number(partes.month) - 1, Number(partes.day));
}

function normalizarDataArquivoAlertas(valor) {
    if (!valor) return dataAtualSaoPaulo();

    const texto = String(valor).trim();
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dataIso) return new Date(Number(dataIso[1]), Number(dataIso[2]) - 1, Number(dataIso[3]));

    const dataBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (dataBr) return new Date(Number(dataBr[3]), Number(dataBr[2]) - 1, Number(dataBr[1]));

    const dataArquivo = texto.match(/^(\d{2})-(\d{2})-(\d{2}|\d{4})/);
    if (dataArquivo) {
        const ano = dataArquivo[3].length === 2 ? Number(`20${dataArquivo[3]}`) : Number(dataArquivo[3]);
        return new Date(ano, Number(dataArquivo[2]) - 1, Number(dataArquivo[1]));
    }

    const dataConvertida = new Date(texto);
    if (!Number.isNaN(dataConvertida.getTime())) {
        return new Date(dataConvertida.getFullYear(), dataConvertida.getMonth(), dataConvertida.getDate());
    }

    return dataAtualSaoPaulo();
}

function montarChaveAlertas(mac, filtros) {
    const data = normalizarDataArquivoAlertas(filtros?.dataInicio || filtros?.dataFim || filtros?.data);
    return montarChaveAlertasPorData(mac, data);
}

function montarChaveAlertasPorData(mac, data) {
    const dataFormatada = formatarDataArquivoAlertas(data);
    return `logAlertas/${dataFormatada}_${String(mac || "").trim()}.csv`;
}

function subtrairDias(data, dias) {
    const novaData = new Date(data);
    novaData.setDate(novaData.getDate() - dias);
    return novaData;
}

function filtroTemDataAlertas(filtros) {
    return Boolean(
        filtros?.dataInicio ||
        filtros?.dataFim ||
        filtros?.data ||
        Number(filtros?.ultimosMinutos) > 0
    );
}

function listarDatasBuscaAlertas(filtros) {
    const dataBase = normalizarDataArquivoAlertas(filtros?.dataInicio || filtros?.dataFim || filtros?.data);

    if (filtroTemDataAlertas(filtros)) return [dataBase];

    return Array.from({ length: 8 }, (_, indice) => subtrairDias(dataBase, indice));
}

function normalizarMac(mac) {
    return String(mac || "").trim().toLowerCase().replace(/-/g, ":");
}

function listarMacsBuscaAlertas(mac) {
    return Array.from(new Set([
        normalizarMac(mac),
        ...macsArquivosAlertasCompartilhados.map(normalizarMac)
    ].filter(Boolean)));
}

async function buscarObjetoS3SeExistir(s3, bucket, key) {
    try {
        return await s3.getObject({ Bucket: bucket, Key: key }).promise();
    } catch (erro) {
        if (erro?.code === "NoSuchKey" || erro?.name === "NoSuchKey" || erro?.statusCode === 404) return null;
        throw erro;
    }
}

function agruparRegistrosPorMac(registros, macs) {
    const grupos = macs.reduce((objeto, mac) => {
        objeto[mac] = [];
        return objeto;
    }, {});

    registros.forEach(registro => {
        const macRegistro = normalizarMac(registro?.mac);
        if (!grupos[macRegistro]) grupos[macRegistro] = [];
        grupos[macRegistro].push(registro);
    });

    return grupos;
}

function limitarRegistros(registros, linhas) {
    const limite = Number(linhas) > 0 ? Number(linhas) : Infinity;
    return Number.isFinite(limite) ? registros.slice(0, limite) : registros;
}

function montarResultadoAlertasPorMac(macSolicitado, registros, macs, linhas) {
    const registrosPorMac = agruparRegistrosPorMac(registros, macs);
    const registrosLimitadosPorMac = Object.keys(registrosPorMac).reduce((objeto, mac) => {
        objeto[mac] = limitarRegistros(registrosPorMac[mac], linhas);
        return objeto;
    }, {});
    const macNormalizado = normalizarMac(macSolicitado);
    const registrosDoMac = registrosLimitadosPorMac[macNormalizado] || [];
    const resultado = montarResultado(macSolicitado, registrosDoMac, true);

    resultado.totalGeral = Object.values(registrosLimitadosPorMac).reduce((total, lista) => total + lista.length, 0);
    resultado.registrosPorMac = registrosLimitadosPorMac;
    resultado.porMac = Object.keys(registrosLimitadosPorMac).reduce((objeto, mac) => {
        objeto[mac] = montarResultado(mac, registrosLimitadosPorMac[mac], true);
        return objeto;
    }, {});

    return resultado;
}

async function buscarRegistrosAlertas(mac, linhas, filtros) {
    if (!mac) throw new Error("MAC do servidor não informado");

    const s3 = configurarS3();
    const bucket = process.env.AWS_BUCKET_ALERTS_NAME;
    const macsBusca = listarMacsBuscaAlertas(mac);
    const datasBusca = listarDatasBuscaAlertas(filtros);
    const buscaTemDataExplicita = filtroTemDataAlertas(filtros);
    let todosOsRegistros = [];

    for (const dataArquivo of datasBusca) {
        let registrosDaData = [];

        for (const macArquivo of macsBusca) {
            const key = montarChaveAlertasPorData(macArquivo, dataArquivo);
            const resposta = await buscarObjetoS3SeExistir(s3, bucket, key);

            console.log("Arquivo de alertas buscado:", key, resposta ? "encontrado" : "nao encontrado");

            if (!resposta) continue;

            const conteudoArquivo = resposta.Body.toString("utf-8");
            const registrosArquivo = String(conteudoArquivo || "")
                .split(/\r?\n/)
                .map(montarRegistroDaLinha)
                .filter(Boolean);

            registrosDaData = registrosDaData.concat(registrosArquivo);
        }

        todosOsRegistros = todosOsRegistros.concat(registrosDaData);
        if (!buscaTemDataExplicita && registrosDaData.length > 0) break;
    }

    console.log("MAC buscado:", mac);
    const registrosFiltrados = filtrarPorPeriodo(todosOsRegistros, filtros);
    registrosFiltrados.sort((a, b) => {
        const dataA = dataDoRegistro(a);
        const dataB = dataDoRegistro(b);
        if (!dataA || !dataB) return 0;
        return dataB - dataA;
    });

    const resultado = montarResultadoAlertasPorMac(mac, registrosFiltrados, macsBusca, linhas);

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
    const registros = filtrarPorPeriodo(filtrarLinhasDoServidor(conteudo, mac, linhas, montarLeitura), filtros);
    const resultado = montarResultado(mac, registros);

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
    filtrarPorPeriodo
};
