var database = require("../database/config");

function cadastrar_servidor(alias,Mac, status, fk_unidade){
        console.log("ACESSEI O MODEL DA UNIDADE \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar_Unidade(): ")
        var instrucaoSql = `INSERT INTO servidor(alias,endereco_mac, status_servidor, fk_unidade) VALUES('${alias}','${Mac}', '${status}', '${fk_unidade}');`;
        console.log("Executando a instrução SQL: \n" + instrucaoSql);
        return database.executar(instrucaoSql);
}

function cadastrar_componentes_servidor(Mac){
        console.log("ACESSEI O MODEL DA UNIDADE \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar_Unidade(): ")
        var instrucaoSql = `INSERT INTO componente_servidor(id_servidor,id_componente, limite_componente, exibir) VALUES
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 1, 80, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 3, 85, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 6, 90, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 7, 40000, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 8, 30000, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 9, 80, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 10, 85, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 11, 85, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 12, 85, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 13, 85, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 18, 1000, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 20, 85, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 21, 85, 1),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 22, 5, 1)                               
                                `;
        console.log("Executando a instrução SQL: \n" + instrucaoSql);
        return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar_servidor,
    cadastrar_componentes_servidor
}