var database = require("../database/config")

function autenticar(email, senha, matricula) {
    console.log("cheguei ao model")
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", email, senha, matricula)
    var instrucaoSql = `SELECT id_usuario,fk_unidade,nome, email, senha, telefone, funcao, identificador, case when fk_responsavel is null then "Gestor" else "Analista" end as fk_responsavel FROM usuario WHERE email = '${email}' AND senha = '${senha}' AND identificador = '${matricula}';`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// Coloque os mesmos parâmetros aqui. Vá para a var instrucaoSql
function cadastrar(nome, email, senha, telefone, funcao, matricula, fk_unidade) {

    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, senha, telefone, funcao, matricula);
    
    // Insira exatamente a query do banco aqui, lembrando da nomenclatura exata nos valores
    //  e na ordem de inserção dos dados.
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, telefone, funcao, identificador, fk_unidade) VALUES ('${nome}', '${email}', '${senha}', '${telefone}', '${funcao}', '${matricula}','${fk_unidade}');
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrar_Func(nome, email, senha, telefone, funcao, matricula, fk_unidade,fk_responsavel, id_unidade_slackJira, token_api, email_jira, url_jira, key_url_jira, webhook_slack) {

    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, senha, telefone, funcao, matricula, fk_unidade,fk_responsavel);
    
    // Insira exatamente a query do banco aqui, lembrando da nomenclatura exata nos valores
    //  e na ordem de inserção dos dados.
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, telefone, funcao, identificador, fk_unidade,fk_responsavel) VALUES ('${nome}', '${email}', '${senha}', '${telefone}', '${funcao}', '${matricula}','${fk_unidade}','${fk_responsavel}');
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrar_slackJira(id_unidade_slackJira, token_api, email_jira, url_jira, key_url_jira, webhook_slack) {

    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", id_unidade_slackJira, token_api, email_jira, url_jira, key_url_jira, webhook_slack);
    
    // Insira exatamente a query do banco aqui, lembrando da nomenclatura exata nos valores
    //  e na ordem de inserção dos dados.
    var instrucaoSql = `
        INSERT INTO slackJira(id_unidade_slackJira, token_api, email_jira, url_jira, key_url_jira, webhook_slack) VALUES ('${id_unidade_slackJira}', '${token_api}', '${email_jira}', '${url_jira}', '${key_url_jira}', '${webhook_slack}');
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function ver_usuario(id_usuario, email){
    console.log("cheguei ao model")
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", id_usuario,email)
    var instrucaoSql = `SELECT * FROM usuario WHERE id_usuario = '${id_usuario}' AND email = '${email}' ;`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
    
}

function listar_funcionarios(fk_responsavel) {
    var instrucaoSql = `
        SELECT idUsuario AS id_usuario, nome, email, funcao FROM usuario
            WHERE fkResponsavel = '${fk_responsavel}'
                ORDER BY nome;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function excluir_funcionario(id_usuario, fk_responsavel) {
    var instrucaoSql = `
        DELETE FROM usuario
        WHERE idUsuario = '${id_usuario}'
          AND fkResponsavel = '${fk_responsavel}';
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar,
    ver_usuario,
    cadastrar_Func,
    cadastrar_slackJira,
    listar_funcionarios,
    excluir_funcionario
}
