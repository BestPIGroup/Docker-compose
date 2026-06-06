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
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 1, 85, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 3, 85, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 6, 80, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 7, 100, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 8, 100, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 9, 80, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 10, 85, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 11, 85, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 12, 85, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 13, 85, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 18, 85, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 20, 85, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 21, 85, 'TRUE'),
                                ((SELECT id_servidor FROM servidor WHERE endereco_mac = '${Mac}'), 22, 85, 'TRUE')                               
                                `;
        console.log("Executando a instrução SQL: \n" + instrucaoSql);
        return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar_servidor,
    cadastrar_componentes_servidor
}