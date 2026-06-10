const AWS = require("aws-sdk");

const PREFIXO_RELATORIOS = "relatorios/";
const PREFIXO_GATILHOS_RELATORIOS_SERVIDOR_PADRAO = "triggerRelatorio/";
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

function normalizarPrefixoS3(prefixo, padrao) {
    const texto = String(prefixo || padrao || "").trim();
    if (!texto) return "";

    return texto.endsWith("/") ? texto : `${texto}/`;
}

function obterPrefixoGatilhosRelatorioServidor() {
    return normalizarPrefixoS3(
        process.env.AWS_RELATORIO_SERVIDOR_TRIGGER_PREFIX
            || process.env.AWS_RELATORIOS_TRIGGER_PREFIX
            || process.env.AWS_RELATORIOS_GATILHO_PREFIX,
        PREFIXO_GATILHOS_RELATORIOS_SERVIDOR_PADRAO
    );
}

function obterPrefixoGatilhosRelatorioGeral() {
    return normalizarPrefixoS3(
        process.env.AWS_RELATORIO_GERAL_TRIGGER_PREFIX
            || process.env.AWS_RELATORIOS_TRIGGER_PREFIX
            || process.env.AWS_RELATORIOS_GATILHO_PREFIX,
        PREFIXO_GATILHOS_RELATORIOS_SERVIDOR_PADRAO
    );
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

function limparMacParaGatilho(macAddress) {
    const mac = String(macAddress || "").trim();
    if (!mac) throw new Error("MAC do servidor nao informado");

    return mac
        .replace(/[\\/]/g, "-")
        .replace(/\s+/g, "");
}

function limparIdentificadorParaGatilho(identificador) {
    const texto = String(identificador || "").trim();
    if (!texto) throw new Error("Identificador do relatorio geral nao informado");

    return texto
        .replace(/[\\/]/g, "-")
        .replace(/\s+/g, "");
}

function normalizarMacParaComparacao(macAddress) {
    return String(macAddress || "").trim().replace(/-/g, ":").toLowerCase();
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
        downloadUrl: `/relatorios/download?key=${encodeURIComponent(key)}`
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

async function buscarDadosObjeto(s3, bucket, key) {
    try {
        return await s3.headObject({ Bucket: bucket, Key: key }).promise();
    } catch (erro) {
        if (erro?.code === "NotFound" || erro?.code === "NoSuchKey" || erro?.statusCode === 404) {
            return null;
        }

        throw erro;
    }
}

function timestampFiltroRelatorio(valor) {
    if (!valor) return null;

    const timestamp = new Date(valor).getTime();
    if (Number.isNaN(timestamp)) return null;

    return Math.floor(timestamp / 1000) * 1000;
}

function relatorioFoiGeradoDepois(relatorio, geradoDepoisDeMs) {
    if (!geradoDepoisDeMs) return true;
    if (!relatorio?.atualizadoEm) return false;

    const atualizadoEmMs = new Date(relatorio.atualizadoEm).getTime();
    return !Number.isNaN(atualizadoEmMs) && atualizadoEmMs >= geradoDepoisDeMs;
}

function relatorioPertenceAoMac(relatorio, macAddress) {
    if (!relatorio) return false;

    const macArquivo = limparMacParaArquivo(macAddress).toLowerCase();
    const macComparacao = normalizarMacParaComparacao(macAddress);
    const nomeSemExtensao = removerExtensao(relatorio.nomeArquivo).toLowerCase();
    const identificador = normalizarMacParaComparacao(relatorio.identificador);

    return !/_diario\.[^.]+$/i.test(relatorio.nomeArquivo)
        && (
            nomeSemExtensao.endsWith(`_${macArquivo}`)
            || identificador === macComparacao
        );
}

function normalizarIdentificadorRelatorio(valor) {
    return String(valor || "").trim().toLowerCase();
}

function relatorioGeralPertenceAoIdentificador(relatorio, identificador) {
    if (!relatorio || !/_diario\.[^.]+$/i.test(relatorio.nomeArquivo)) return false;
    if (!identificador) return true;

    return normalizarIdentificadorRelatorio(relatorio.identificador)
        === normalizarIdentificadorRelatorio(identificador);
}

async function buscarKeyRelatorioGeralAtual(s3, bucket, opcoes = {}) {
    const identificador = opcoes.identificador || null;
    const geradoDepoisDeMs = timestampFiltroRelatorio(opcoes.geradoDepoisDe);
    const keyConfigurada = montarKeyRelatorioGeralAtual(identificador);
    const objetoConfigurado = keyConfigurada ? await buscarDadosObjeto(s3, bucket, keyConfigurada) : null;

    if (objetoConfigurado && relatorioFoiGeradoDepois({
        atualizadoEm: objetoConfigurado.LastModified ? objetoConfigurado.LastModified.toISOString() : null
    }, geradoDepoisDeMs)) {
        return validarChaveRelatorioGeral(keyConfigurada);
    }

    const dataHoje = formatarDataArquivo(dataAtualSaoPaulo());
    const objetos = await listarObjetosRelatorios(s3, bucket);
    const relatorioGeral = objetos
        .map(montarRelatorio)
        .filter(relatorio => {
            if (!relatorio) return false;

            const relatorioDoEscopo = geradoDepoisDeMs
                ? relatorioGeralPertenceAoIdentificador(relatorio, identificador)
                : relatorio.nomeArquivo.startsWith(`${dataHoje}_`)
                    && relatorioGeralPertenceAoIdentificador(relatorio, identificador);

            return relatorioDoEscopo && relatorioFoiGeradoDepois(relatorio, geradoDepoisDeMs);
        })
        .sort((a, b) => {
            const atualizadoA = a.atualizadoEm ? new Date(a.atualizadoEm).getTime() : 0;
            const atualizadoB = b.atualizadoEm ? new Date(b.atualizadoEm).getTime() : 0;

            if (atualizadoB !== atualizadoA) return atualizadoB - atualizadoA;
            return a.nomeArquivo.localeCompare(b.nomeArquivo);
        })[0];

    if (!relatorioGeral) {
        throw new Error("Relatorio geral nao encontrado");
    }

    return relatorioGeral.key;
}

async function buscarKeyRelatorioServidorAtual(s3, bucket, macAddress, opcoes = {}) {
    const keyEsperada = montarKeyRelatorioServidorAtual(macAddress);
    const geradoDepoisDeMs = timestampFiltroRelatorio(opcoes.geradoDepoisDe);
    const objetoEsperado = await buscarDadosObjeto(s3, bucket, keyEsperada);

    if (objetoEsperado && relatorioFoiGeradoDepois({
        atualizadoEm: objetoEsperado.LastModified ? objetoEsperado.LastModified.toISOString() : null
    }, geradoDepoisDeMs)) {
        return validarChaveRelatorio(keyEsperada);
    }

    const objetos = await listarObjetosRelatorios(s3, bucket);
    const relatorioServidor = objetos
        .map(montarRelatorio)
        .filter(relatorio => {
            return relatorioPertenceAoMac(relatorio, macAddress)
                && relatorioFoiGeradoDepois(relatorio, geradoDepoisDeMs);
        })
        .sort((a, b) => {
            const atualizadoA = a.atualizadoEm ? new Date(a.atualizadoEm).getTime() : 0;
            const atualizadoB = b.atualizadoEm ? new Date(b.atualizadoEm).getTime() : 0;

            if (atualizadoB !== atualizadoA) return atualizadoB - atualizadoA;
            return a.nomeArquivo.localeCompare(b.nomeArquivo);
        })[0];

    if (!relatorioServidor) {
        throw new Error("Relatorio de servidor nao encontrado");
    }

    return relatorioServidor.key;
}

function montarPayloadRelatorioGeral(dados = {}) {
    const dataAtual = dataAtualSaoPaulo();
    const idUnidade = dados.idUnidade || dados.ID_UNIDADE || dados.fkUnidade || null;
    const identificador = dados.identificador
        || dados.numeroIdentificador
        || dados.idUnidade
        || dados.ID_UNIDADE
        || dados.fkUnidade
        || process.env.AWS_RELATORIO_GERAL_ID
        || process.env.AWS_CODIGO_UNIDADE
        || null;

    return {
        acao: "gerar_relatorio_geral",
        tipo: "geral_diario",
        data: formatarDataArquivo(dataAtual),
        bucket: obterBucketRelatorios(),
        prefixo: PREFIXO_RELATORIOS,
        keyDestino: montarKeyRelatorioGeralAtual(identificador),
        identificador,
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
        macAddressServidor: macAddress,
        macServidor: macAddress,
        mac: macAddress,
        MacServer: macAddress,
        gerarAlerta: dados.gerarAlerta !== false,
        idUnidade: dados.idUnidade || dados.ID_UNIDADE || dados.fkUnidade || null,
        idUsuario: dados.idUsuario || dados.ID_USUARIO || null,
        nomeUsuario: dados.nomeUsuario || dados.NOME_USUARIO || null,
        nomeServidor: dados.nomeServidor || dados.alias || null
    };
}

function montarKeyGatilhoRelatorioServidor(macAddress) {
    return `${obterPrefixoGatilhosRelatorioServidor()}${limparMacParaGatilho(macAddress)}.json`;
}

function montarKeyGatilhoRelatorioGeral(identificador) {
    return `${obterPrefixoGatilhosRelatorioGeral()}geral_${limparIdentificadorParaGatilho(identificador)}.json`;
}

async function solicitarGeracaoRelatorioGeralPorS3(dados = {}) {
    const s3 = configurarS3();
    const bucket = obterBucketRelatorios();
    const payload = montarPayloadRelatorioGeral(dados);
    const keyGatilho = montarKeyGatilhoRelatorioGeral(payload.identificador);
    const solicitadoEm = new Date().toISOString();

    await s3.putObject({
        Bucket: bucket,
        Key: keyGatilho,
        Body: "{}",
        ContentType: "application/json",
        Metadata: {
            identificador: String(payload.identificador),
            solicitadoem: solicitadoEm
        }
    }).promise();

    return {
        bucket,
        keyGatilho,
        prefixoGatilho: obterPrefixoGatilhosRelatorioGeral(),
        identificador: payload.identificador,
        keyDestinoEsperada: payload.keyDestino,
        solicitadoEm
    };
}

async function solicitarGeracaoRelatorioServidorPorS3(dados = {}) {
    const s3 = configurarS3();
    const bucket = obterBucketRelatorios();
    const payload = montarPayloadRelatorioServidor(dados);
    const keyGatilho = montarKeyGatilhoRelatorioServidor(payload.macAddress);
    const solicitadoEm = new Date().toISOString();

    await s3.putObject({
        Bucket: bucket,
        Key: keyGatilho,
        Body: "{}",
        ContentType: "application/json",
        Metadata: {
            macaddress: payload.macAddress,
            solicitadoem: solicitadoEm
        }
    }).promise();

    return {
        bucket,
        keyGatilho,
        prefixoGatilho: obterPrefixoGatilhosRelatorioServidor(),
        macAddress: payload.macAddress,
        keyDestinoEsperada: payload.keyDestino,
        solicitadoEm
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

async function gerarUrlDownloadRelatorioGeralAtual(opcoes = {}) {
    const s3 = configurarS3();
    const bucket = obterBucketRelatorios();
    const chave = await buscarKeyRelatorioGeralAtual(s3, bucket, opcoes);
    const nomeArquivo = obterNomeArquivo(chave).replace(/"/g, "");

    return s3.getSignedUrlPromise("getObject", {
        Bucket: bucket,
        Key: chave,
        Expires: EXPIRACAO_DOWNLOAD_SEGUNDOS,
        ResponseContentDisposition: `attachment; filename="${nomeArquivo}"`
    });
}

async function gerarUrlDownloadRelatorioServidorAtual(macAddress, opcoes = {}) {
    const s3 = configurarS3();
    const bucket = obterBucketRelatorios();
    const chave = await buscarKeyRelatorioServidorAtual(s3, bucket, macAddress, opcoes);
    const nomeArquivo = obterNomeArquivo(chave).replace(/"/g, "");

    return s3.getSignedUrlPromise("getObject", {
        Bucket: bucket,
        Key: chave,
        Expires: EXPIRACAO_DOWNLOAD_SEGUNDOS,
        ResponseContentDisposition: `attachment; filename="${nomeArquivo}"`,
        ResponseContentType: "application/pdf"
    });
}

module.exports = {
    listarRelatorios,
    solicitarGeracaoRelatorioGeralPorS3,
    solicitarGeracaoRelatorioServidorPorS3,
    acionarGeracaoRelatorioGeral,
    acionarGeracaoRelatorioServidor,
    gerarUrlDownload,
    gerarUrlDownloadRelatorioGeralAtual,
    gerarUrlDownloadRelatorioServidorAtual,
    extrairDadosDoNome
};
