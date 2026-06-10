const AWS = require("aws-sdk");

const PREFIXO_RELATORIOS = "relatorios/";
const EXPIRACAO_DOWNLOAD_SEGUNDOS = 60;
const TIME_ZONE = "America/Sao_Paulo";

function configurarS3() {
    AWS.config.update({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    });

    return new AWS.S3({ apiVersion: "2006-03-01" });
}

function configurarLambda() {
    AWS.config.update({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    });

    return new AWS.Lambda({ apiVersion: "2015-03-31" });
}

function obterBucketRelatorios() {
    const bucket = process.env.AWS_BUCKET_REPORTS_NAME
        || process.env.AWS_BUCKET_ALERTS_NAME
        || process.env.AWS_BUCKET_NAME;

    if (!bucket) {
        throw new Error("Bucket de relatorios nao configurado");
    }

    return bucket;
}

function obterNomeLambdaRelatorioGeral() {
    const nomeLambda = process.env.AWS_LAMBDA_RELATORIO_GERAL_NAME
        || process.env.AWS_RELATORIO_GERAL_LAMBDA_NAME
        || process.env.AWS_LAMBDA_GERAR_RELATORIO_GERAL;

    if (!nomeLambda) {
        throw new Error("Lambda de relatorio geral nao configurada");
    }

    return nomeLambda;
}

function obterNomeLambdaRelatorioServidor() {
    const nomeLambda = process.env.AWS_LAMBDA_RELATORIO_SERVIDOR_NAME
        || process.env.AWS_RELATORIO_SERVIDOR_LAMBDA_NAME
        || process.env.AWS_LAMBDA_GERAR_RELATORIO_SERVIDOR
        || process.env.AWS_LAMBDA_RELATORIO_GERAL_NAME
        || process.env.AWS_RELATORIO_GERAL_LAMBDA_NAME
        || process.env.AWS_LAMBDA_GERAR_RELATORIO_GERAL;

    if (!nomeLambda) {
        throw new Error("Lambda de relatorio de servidor nao configurada");
    }

    return nomeLambda;
}

function obterNomeArquivo(key) {
    return String(key || "").split("/").filter(Boolean).pop() || "";
}

function removerExtensao(nomeArquivo) {
    return String(nomeArquivo || "").replace(/\.[^.]+$/, "");
}

function dataAtualSaoPaulo() {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date()).reduce((objeto, parte) => {
        objeto[parte.type] = parte.value;
        return objeto;
    }, {});

    return new Date(Number(partes.year), Number(partes.month) - 1, Number(partes.day));
}

function formatarDataArquivo(data) {
    return [
        String(data.getDate()).padStart(2, "0"),
        String(data.getMonth() + 1).padStart(2, "0"),
        data.getFullYear()
    ].join("-");
}

function formatarIdentificador(identificador) {
    const texto = String(identificador || "").trim();
    const macComHifen = /^([0-9A-Fa-f]{2}-){5}[0-9A-Fa-f]{2}$/.test(texto);

    return macComHifen ? texto.replace(/-/g, ":").toUpperCase() : texto;
}

function limparMacParaArquivo(macAddress) {
    const mac = String(macAddress || "").trim();
    if (!mac) throw new Error("MAC do servidor nao informado");

    return mac
        .replace(/:/g, "-")
        .replace(/[\\/]/g, "-")
        .replace(/\s+/g, "");
}

function extrairDadosDoNome(nomeArquivo) {
    const match = String(nomeArquivo || "").match(/^(\d{2})-(\d{2})-(\d{4})_(.+?)(?:\.[^.]+)?$/);
    if (!match) return null;

    const [, dia, mes, ano, restante] = match;
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));

    if (
        data.getFullYear() !== Number(ano)
        || data.getMonth() !== Number(mes) - 1
        || data.getDate() !== Number(dia)
    ) {
        return null;
    }

    const base = removerExtensao(restante);
    const ehDiario = /_diario$/i.test(base);
    const identificador = ehDiario ? base.replace(/_diario$/i, "") : base;
    const identificadorFormatado = formatarIdentificador(identificador);

    return {
        data: `${dia}/${mes}/${ano}`,
        dataRelatorio: `${ano}-${mes}-${dia}`,
        timestampRelatorio: data.getTime(),
        identificador: identificadorFormatado,
        tipo: ehDiario
            ? `Diario - ${identificadorFormatado}`
            : `Servidor - ${identificadorFormatado}`
    };
}

async function listarObjetosRelatorios(s3, bucket) {
    let token = null;
    const objetos = [];

    do {
        const resposta = await s3.listObjectsV2({
            Bucket: bucket,
            Prefix: PREFIXO_RELATORIOS,
            ContinuationToken: token || undefined
        }).promise();

        objetos.push(...(resposta.Contents || []));
        token = resposta.IsTruncated ? resposta.NextContinuationToken : null;
    } while (token);

    return objetos;
}

function montarRelatorio(objeto) {
    const key = objeto.Key;
    const nomeArquivo = obterNomeArquivo(key);
    const dadosNome = extrairDadosDoNome(nomeArquivo);

    if (!key || key === PREFIXO_RELATORIOS || !dadosNome) return null;

    return {
        key,
        nomeArquivo,
        data: dadosNome.data,
        dataRelatorio: dadosNome.dataRelatorio,
        timestampRelatorio: dadosNome.timestampRelatorio,
        tipo: dadosNome.tipo,
        identificador: dadosNome.identificador,
        tamanhoBytes: objeto.Size || 0,
        atualizadoEm: objeto.LastModified ? objeto.LastModified.toISOString() : null,
        downloadUrl: `/relatoriosS3/download?key=${encodeURIComponent(key)}`
    };
}

async function listarRelatorios() {
    const s3 = configurarS3();
    const bucket = obterBucketRelatorios();
    const objetos = await listarObjetosRelatorios(s3, bucket);

    const relatorios = objetos
        .map(montarRelatorio)
        .filter(Boolean)
        .sort((a, b) => {
            if (b.timestampRelatorio !== a.timestampRelatorio) {
                return b.timestampRelatorio - a.timestampRelatorio;
            }

            const atualizadoA = a.atualizadoEm ? new Date(a.atualizadoEm).getTime() : 0;
            const atualizadoB = b.atualizadoEm ? new Date(b.atualizadoEm).getTime() : 0;

            if (atualizadoB !== atualizadoA) return atualizadoB - atualizadoA;
            return a.nomeArquivo.localeCompare(b.nomeArquivo);
        })
        .map(({ timestampRelatorio, ...relatorio }) => relatorio);

    return {
        total: relatorios.length,
        relatorios,
        atualizadoEm: new Date().toISOString()
    };
}

function validarChaveRelatorio(key) {
    const chave = String(key || "").trim();
    const nomeArquivo = obterNomeArquivo(chave);

    if (
        !chave
        || !chave.startsWith(PREFIXO_RELATORIOS)
        || chave.includes("..")
        || !extrairDadosDoNome(nomeArquivo)
    ) {
        throw new Error("Relatorio invalido");
    }

    return chave;
}

function validarChaveRelatorioGeral(key) {
    const chave = String(key || "").trim();

    if (!chave || !chave.startsWith(PREFIXO_RELATORIOS) || chave.includes("..")) {
        throw new Error("Relatorio invalido");
    }

    return chave;
}

function montarKeyRelatorioGeralAtual(identificadorFallback) {
    const keyConfigurada = process.env.AWS_RELATORIO_GERAL_KEY;
    if (keyConfigurada) {
        const key = String(keyConfigurada).trim();
        return key.startsWith(PREFIXO_RELATORIOS) ? key : `${PREFIXO_RELATORIOS}${key}`;
    }

    const identificador = process.env.AWS_RELATORIO_GERAL_ID
        || process.env.AWS_CODIGO_UNIDADE
        || identificadorFallback;
    if (!identificador) return null;

    return `${PREFIXO_RELATORIOS}${formatarDataArquivo(dataAtualSaoPaulo())}_${identificador}_diario.pdf`;
}

function montarKeyRelatorioServidorAtual(macAddress) {
    return `${PREFIXO_RELATORIOS}${formatarDataArquivo(dataAtualSaoPaulo())}_${limparMacParaArquivo(macAddress)}.pdf`;
}

async function objetoExiste(s3, bucket, key) {
    try {
        await s3.headObject({ Bucket: bucket, Key: key }).promise();
        return true;
    } catch (erro) {
        if (erro?.code === "NotFound" || erro?.code === "NoSuchKey" || erro?.statusCode === 404) {
            return false;
        }

        throw erro;
    }
}

async function buscarKeyRelatorioGeralAtual(s3, bucket) {
    const keyConfigurada = montarKeyRelatorioGeralAtual();

    if (keyConfigurada && await objetoExiste(s3, bucket, keyConfigurada)) {
        return validarChaveRelatorioGeral(keyConfigurada);
    }

    const dataHoje = formatarDataArquivo(dataAtualSaoPaulo());
    const objetos = await listarObjetosRelatorios(s3, bucket);
    const relatorioGeralHoje = objetos
        .map(montarRelatorio)
        .filter(relatorio => {
            if (!relatorio) return false;

            return relatorio.nomeArquivo.startsWith(`${dataHoje}_`)
                && /_diario\.[^.]+$/i.test(relatorio.nomeArquivo);
        })
        .sort((a, b) => {
            const atualizadoA = a.atualizadoEm ? new Date(a.atualizadoEm).getTime() : 0;
            const atualizadoB = b.atualizadoEm ? new Date(b.atualizadoEm).getTime() : 0;

            if (atualizadoB !== atualizadoA) return atualizadoB - atualizadoA;
            return a.nomeArquivo.localeCompare(b.nomeArquivo);
        })[0];

    if (!relatorioGeralHoje) {
        throw new Error("Relatorio geral nao encontrado");
    }

    return relatorioGeralHoje.key;
}

async function buscarKeyRelatorioServidorAtual(s3, bucket, macAddress) {
    const keyEsperada = montarKeyRelatorioServidorAtual(macAddress);

    if (await objetoExiste(s3, bucket, keyEsperada)) {
        return validarChaveRelatorio(keyEsperada);
    }

    const dataHoje = formatarDataArquivo(dataAtualSaoPaulo());
    const macArquivo = limparMacParaArquivo(macAddress).toLowerCase();
    const objetos = await listarObjetosRelatorios(s3, bucket);
    const relatorioServidorHoje = objetos
        .map(montarRelatorio)
        .filter(relatorio => {
            if (!relatorio) return false;

            return relatorio.nomeArquivo.startsWith(`${dataHoje}_`)
                && !/_diario\.[^.]+$/i.test(relatorio.nomeArquivo)
                && removerExtensao(relatorio.nomeArquivo).toLowerCase().endsWith(`_${macArquivo}`);
        })
        .sort((a, b) => {
            const atualizadoA = a.atualizadoEm ? new Date(a.atualizadoEm).getTime() : 0;
            const atualizadoB = b.atualizadoEm ? new Date(b.atualizadoEm).getTime() : 0;

            if (atualizadoB !== atualizadoA) return atualizadoB - atualizadoA;
            return a.nomeArquivo.localeCompare(b.nomeArquivo);
        })[0];

    if (!relatorioServidorHoje) {
        throw new Error("Relatorio de servidor nao encontrado");
    }

    return relatorioServidorHoje.key;
}

function montarPayloadRelatorioGeral(dados = {}) {
    const dataAtual = dataAtualSaoPaulo();
    const idUnidade = dados.idUnidade || dados.ID_UNIDADE || dados.fkUnidade || null;

    return {
        acao: "gerar_relatorio_geral",
        tipo: "geral_diario",
        data: formatarDataArquivo(dataAtual),
        bucket: obterBucketRelatorios(),
        prefixo: PREFIXO_RELATORIOS,
        keyDestino: montarKeyRelatorioGeralAtual(idUnidade),
        idUnidade,
        idUsuario: dados.idUsuario || dados.ID_USUARIO || null,
        nomeUsuario: dados.nomeUsuario || dados.NOME_USUARIO || null
    };
}

function montarPayloadRelatorioServidor(dados = {}) {
    const dataAtual = dataAtualSaoPaulo();
    const macAddress = dados.macAddress || dados.mac || dados.MacServer || dados.MacAddress;

    if (!macAddress) {
        throw new Error("MAC do servidor nao informado");
    }

    return {
        acao: "gerar_relatorio_servidor",
        tipo: "servidor",
        tipoRelatorio: dados.tipoRelatorio || "servidor",
        data: formatarDataArquivo(dataAtual),
        bucket: obterBucketRelatorios(),
        prefixo: PREFIXO_RELATORIOS,
        keyDestino: montarKeyRelatorioServidorAtual(macAddress),
        macAddress,
        mac: macAddress,
        MacServer: macAddress,
        gerarAlerta: dados.gerarAlerta !== false,
        idUnidade: dados.idUnidade || dados.ID_UNIDADE || dados.fkUnidade || null,
        idUsuario: dados.idUsuario || dados.ID_USUARIO || null,
        nomeUsuario: dados.nomeUsuario || dados.NOME_USUARIO || null,
        nomeServidor: dados.nomeServidor || dados.alias || null
    };
}

function interpretarPayloadLambda(payload) {
    if (!payload) return null;

    const texto = Buffer.isBuffer(payload) ? payload.toString("utf-8") : String(payload);
    if (!texto) return null;

    try {
        return JSON.parse(texto);
    } catch (erro) {
        return texto;
    }
}

async function acionarGeracaoRelatorioGeral(dados = {}) {
    const lambda = configurarLambda();
    const functionName = obterNomeLambdaRelatorioGeral();
    const invocationType = process.env.AWS_RELATORIO_GERAL_LAMBDA_INVOCATION_TYPE || "Event";
    const payload = montarPayloadRelatorioGeral(dados);

    const resposta = await lambda.invoke({
        FunctionName: functionName,
        InvocationType: invocationType,
        Payload: JSON.stringify(payload)
    }).promise();

    if (resposta.FunctionError) {
        const erro = new Error("Lambda retornou erro ao gerar relatorio geral");
        erro.lambda = interpretarPayloadLambda(resposta.Payload);
        throw erro;
    }

    return {
        lambda: functionName,
        statusCode: resposta.StatusCode,
        payload,
        resposta: interpretarPayloadLambda(resposta.Payload)
    };
}

async function acionarGeracaoRelatorioServidor(dados = {}) {
    const lambda = configurarLambda();
    const functionName = obterNomeLambdaRelatorioServidor();
    const invocationType = process.env.AWS_RELATORIO_SERVIDOR_LAMBDA_INVOCATION_TYPE || "RequestResponse";
    const payload = montarPayloadRelatorioServidor(dados);

    const resposta = await lambda.invoke({
        FunctionName: functionName,
        InvocationType: invocationType,
        Payload: JSON.stringify(payload)
    }).promise();

    if (resposta.FunctionError) {
        const erro = new Error("Lambda retornou erro ao gerar relatorio do servidor");
        erro.lambda = interpretarPayloadLambda(resposta.Payload);
        throw erro;
    }

    return {
        lambda: functionName,
        statusCode: resposta.StatusCode,
        payload,
        resposta: interpretarPayloadLambda(resposta.Payload)
    };
}

async function gerarUrlDownload(key) {
    const chave = validarChaveRelatorio(key);
    const s3 = configurarS3();
    const bucket = obterBucketRelatorios();
    const nomeArquivo = obterNomeArquivo(chave).replace(/"/g, "");

    return s3.getSignedUrlPromise("getObject", {
        Bucket: bucket,
        Key: chave,
        Expires: EXPIRACAO_DOWNLOAD_SEGUNDOS,
        ResponseContentDisposition: `attachment; filename="${nomeArquivo}"`
    });
}

async function gerarUrlDownloadRelatorioGeralAtual() {
    const s3 = configurarS3();
    const bucket = obterBucketRelatorios();
    const chave = await buscarKeyRelatorioGeralAtual(s3, bucket);
    const nomeArquivo = obterNomeArquivo(chave).replace(/"/g, "");

    return s3.getSignedUrlPromise("getObject", {
        Bucket: bucket,
        Key: chave,
        Expires: EXPIRACAO_DOWNLOAD_SEGUNDOS,
        ResponseContentDisposition: `attachment; filename="${nomeArquivo}"`
    });
}

async function gerarUrlDownloadRelatorioServidorAtual(macAddress) {
    const s3 = configurarS3();
    const bucket = obterBucketRelatorios();
    const chave = await buscarKeyRelatorioServidorAtual(s3, bucket, macAddress);
    const nomeArquivo = obterNomeArquivo(chave).replace(/"/g, "");

    return s3.getSignedUrlPromise("getObject", {
        Bucket: bucket,
        Key: chave,
        Expires: EXPIRACAO_DOWNLOAD_SEGUNDOS,
        ResponseContentDisposition: `inline; filename="${nomeArquivo}"`,
        ResponseContentType: "application/pdf"
    });
}

module.exports = {
    listarRelatorios,
    acionarGeracaoRelatorioGeral,
    acionarGeracaoRelatorioServidor,
    gerarUrlDownload,
    gerarUrlDownloadRelatorioGeralAtual,
    gerarUrlDownloadRelatorioServidorAtual,
    extrairDadosDoNome
};
