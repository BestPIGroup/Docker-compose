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

function formatarDataChaveAlertas(data) {
    return [
        String(data.getDate()).padStart(2, "0"),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getFullYear()).slice(-2)
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

function normalizarDataBusca(valor) {
    if (!valor) return null;

    const texto = String(valor).trim();
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dataIso) return new Date(Number(dataIso[1]), Number(dataIso[2]) - 1, Number(dataIso[3]));

    const dataBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (dataBr) return new Date(Number(dataBr[3]), Number(dataBr[2]) - 1, Number(dataBr[1]));

    const dataConvertida = new Date(texto);
    if (Number.isNaN(dataConvertida.getTime())) return null;
    return new Date(dataConvertida.getFullYear(), dataConvertida.getMonth(), dataConvertida.getDate());
}

function listarDatasDaBusca(filtros) {
    let inicio = normalizarDataBusca(filtros?.dataInicio);
    let fim = normalizarDataBusca(filtros?.dataFim);

    if (Number(filtros?.ultimosMinutos) > 0) {
        inicio = new Date(Date.now() - Number(filtros.ultimosMinutos) * 60 * 1000);
        fim = new Date();
    }

    if (!inicio && !fim) {
        return [dataAtualSaoPaulo()];
    }

    inicio = inicio || fim;
    fim = fim || inicio;

    if (inicio > fim) [inicio, fim] = [fim, inicio];

    const datas = [];
    const dataAtual = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const dataFinal = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());

    while (dataAtual <= dataFinal) {
        datas.push(new Date(dataAtual));
        dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return datas;
}

function montarChaveAlertas(mac, data) {
    return `logAlertas/${formatarDataChaveAlertas(data)}_${String(mac || "").trim()}.csv`;
}

async function buscarObjetoS3SeExistir(s3, bucket, key) {
    try {
        return await s3.getObject({ Bucket: bucket, Key: key }).promise();
    } catch (erro) {
        if (erro?.code === "NoSuchKey" || erro?.statusCode === 404) return null;
        throw erro;
    }
}

async function buscarRegistrosAlertas(mac, linhas, filtros) {
    if (!mac) throw new Error("MAC do servidor não informado");

    const s3 = configurarS3();
    const bucket = process.env.AWS_BUCKET_ALERTS_NAME;
    const datas = listarDatasDaBusca(filtros);
    let todosOsRegistros = [];

    for (const data of datas) {
        const key = montarChaveAlertas(mac, data);
        const resposta = await buscarObjetoS3SeExistir(s3, bucket, key);
        if (!resposta) continue;

        const conteudo = resposta.Body.toString("utf-8");
        const registros = filtrarLinhasDoServidor(conteudo, mac, Infinity, montarRegistroDaLinha);
        todosOsRegistros = todosOsRegistros.concat(registros);
    }

    todosOsRegistros.sort((a, b) => {
        const dataA = dataDoRegistro(a);
        const dataB = dataDoRegistro(b);
        if (!dataA || !dataB) return 0;
        return dataB - dataA;
    });

    const registrosFiltrados = filtrarPorPeriodo(todosOsRegistros, filtros);
    const limite = Number(linhas) > 0 ? Number(linhas) : Infinity;
    const resultado = montarResultado(mac, registrosFiltrados.slice(0, limite), true);

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
