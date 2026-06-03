var database = require("../database/config");

function cadastrar_servidor(alias,Mac, status, fk_unidade){
        console.log("ACESSEI O MODEL DA UNIDADE \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar_Unidade(): ")
        var instrucaoSql = `INSERT INTO servidor(alias,endereco_mac, status_servidor, fk_unidade) VALUES('${alias}','${Mac}', '${status}', '${fk_unidade}');`;
        console.log("Executando a instrução SQL: \n" + instrucaoSql);
        return database.executar(instrucaoSql);
}

function cadastrar_componentes_servidor(id_servidor){
        console.log("ACESSEI O MODEL DA UNIDADE \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar_Unidade(): ")
        var instrucaoSql = `INSERT INTO componente_servidor(id_servidor,id_componente, limite_componente, exibir) VALUES
                                ('${id_servidor}', 1, 85, 'TRUE'),
                                ('${id_servidor}', 3, 85, 'TRUE'),
                                ('${id_servidor}', 6, 80, 'TRUE'),
                                ('${id_servidor}', 7, 100, 'TRUE'),
                                ('${id_servidor}', 8, 100, 'TRUE'),
                                ('${id_servidor}', 9, 80, 'TRUE'),
                                ('${id_servidor}', 10, 85, 'TRUE'),
                                ('${id_servidor}', 11, 85, 'TRUE'),
                                ('${id_servidor}', 12, 85, 'TRUE'),
                                ('${id_servidor}', 13, 85, 'TRUE'),
                                ('${id_servidor}', 18, 85, 'TRUE'),
                                ('${id_servidor}', 20, 85, 'TRUE'),
                                ('${id_servidor}', 21, 85, 'TRUE'),
                                ('${id_servidor}', 22, 85, 'TRUE'),
                                ('${id_servidor}', 23, 3000, 'TRUE')
                                
                                ;`;
        console.log("Executando a instrução SQL: \n" + instrucaoSql);
        return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar_servidor,
    cadastrar_componentes_servidor
}