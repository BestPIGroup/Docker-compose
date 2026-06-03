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

function cadastrar_Func(nome, email, senha, telefone, funcao, matricula, fk_unidade,fk_responsavel) {

    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, senha, telefone, funcao, matricula, fk_unidade,fk_responsavel);
    
    // Insira exatamente a query do banco aqui, lembrando da nomenclatura exata nos valores
    //  e na ordem de inserção dos dados.
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, telefone, funcao, identificador, fk_unidade,fk_responsavel) VALUES ('${nome}', '${email}', '${senha}', '${telefone}', '${funcao}', '${matricula}','${fk_unidade}','${fk_responsavel}');
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


module.exports = {
    autenticar,
    cadastrar,
    ver_usuario,
    cadastrar_Func
};