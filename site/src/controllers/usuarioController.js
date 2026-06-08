var usuarioModel = require("../models/usuarioModel");


function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;
    var matricula = req.body.matriculaServer;

    if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está indefinida!");
    } else if (matricula == undefined) {
        res.status(400).send("Sua matricula está indefinida!");
    } else {

        usuarioModel.autenticar(email, senha, matricula)
            .then(function (resultadoAutenticar) {

                console.log(`Resultados encontrados: ${resultadoAutenticar.length}`);

                if (resultadoAutenticar.length == 1) {

                    res.json({
                        id_usuario: resultadoAutenticar[0].id_usuario,
                        email: resultadoAutenticar[0].email,
                        nome: resultadoAutenticar[0].nome,
                        senha: resultadoAutenticar[0].senha,
                        matricula: resultadoAutenticar[0].matricula,
                        fk_unidade: resultadoAutenticar[0].fk_unidade,
                        fk_responsavel: resultadoAutenticar[0].fk_responsavel,
                        id_unidade_slackJira: resultadoAutenticar[0].id_unidade_slackJira,
                        token_api: resultadoAutenticar[0].token_api,
                        email_jira: resultadoAutenticar[0].email_jira,
                        url_jira: resultadoAutenticar[0].url_jira,
                        key_url_jira: resultadoAutenticar[0].key_url_jira,
                        webhook_slack: resultadoAutenticar[0].webhook_slack
                    });

                } else if (resultadoAutenticar.length == 0) {

                    res.status(403).send("Email e/ou senha inválido(s)");

                } else {

                    res.status(403).send("Mais de um usuário com o mesmo login!");

                }

            })
            .catch(function (erro) {
                console.log("Erro no login:", erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function cadastrar(req, res) {
    // Crie uma variável que vá recuperar os valores do arquivo cadastro.html
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var telefone = req.body.telefoneServer;
    var funcao = req.body.funcaoServer;
    var matricula = req.body.matriculaServer;
    var senha = req.body.senhaServer;
    var confirmacao_senha = senha;
    var fk_unidade = req.body.fk_unidadeServer;
    var id_unidade_slackJira = req.body.id_unidade_slackJira;
    var tokenApiJira = req.body.token_jira_input;
    var urlEquipeJira = req.body.url_jira_input;
    var chaveUrlJira = req.body.url_key_jira_input;
    var emailJira = req.body.email_jira_input;
    var webhook_slack = req.body.link_webhook_input;

    /* var fkEmpresa = req.body.idEmpresaVincularServer; */

    // Faça as validações dos valores
    if (nome == undefined) {
        res.status(400).send("Seu nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    } else if (telefone == undefined) {
        res.status(400).send("Sua empresa a vincular está undefined!");
    } else if(funcao == undefined) {
        res.status(400).send("Sua função está undefined!");
    } else if (matricula == undefined){
        res.status(400).send("Sua função está undefined!");
    } else if (confirmacao_senha != senha){
        res.status(400).send("Suas senhas não coincidem!");
    } else if (webhook_slack == undefined){
        res.status(400).send("Sua webhook está undefined!");
    } else if ( id_unidade_slackJira == undefined){
        res.status(400).send("Seu webhook está undefined!");
    } else if ( tokenApiJira == undefined){
        res.status(400).send("Seu tokenApiJira está undefined!");
    } else if ( urlEquipeJira == undefined){
        res.status(400).send("Sua urlEquipeJira está undefined!");
    } else if ( chaveUrlJira == undefined){
        res.status(400).send("Sua chaveUrlJira está undefined!");
    } else if ( emailJira == undefined){
        res.status(400).send("Sua emailJira está undefined!");
    }else {

        // Passe os valores como parâmetro e vá para o arquivo usuarioModel.js
        usuarioModel.cadastrar(nome, email, senha, telefone, funcao, matricula, fk_unidade, id_unidade_slackJira, tokenApiJira, urlEquipeJira, chaveUrlJira, emailJira, webhook_slack)
            .then(function (resultado) {
                  res.json(resultado);}
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

function ver_usuario(req, res){
    var email = req.body.emailServer
    var id_usuario = req.body.idServer

    if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (id_usuario == undefined) {
        res.status(400).send("Sua ID está indefinida!");
    } else {
        console.log("Entrei no controller")

        usuarioModel.ver_usuario(id_usuario, email)
            .then(function (resultadoAutenticar) {

                console.log(`Resultados encontrados: ${resultadoAutenticar.length}`);

                if (resultadoAutenticar.length == 1) {

                    res.json({
                        email: resultadoAutenticar[0].email,
                        nome: resultadoAutenticar[0].nome,
                        telefone: resultadoAutenticar[0].telefone,
                        funcao: resultadoAutenticar[0].funcao,
                        matricula: resultadoAutenticar[0].matricula,
                    });

                } else if (resultadoAutenticar.length == 0) {

                    res.status(403).send("Email e/ou senha inválido(s)");

                } else {

                    res.status(403).send("Mais de um usuário com o mesmo login!");

                }

            })
            .catch(function (erro) {
                console.log("Erro no login:", erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}
function cadastrar_Func(req, res) {
    // Crie uma variável que vá recuperar os valores do arquivo cadastro.html
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var telefone = req.body.telefoneServer;
    var funcao = req.body.funcaoServer;
    var matricula = req.body.matriculaServer;
    var senha = req.body.senhaServer;
    var fk_unidade = req.body.fk_unidadeServer;
    var fk_responsavel = req.body.fk_responsavelServer;
    

    /* var fkEmpresa = req.body.idEmpresaVincularServer; */

    // Faça as validações dos valores
    if (nome == undefined) {
        res.status(400).send("O nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("O email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("A está undefined!");
    } else if (telefone == undefined) {
        res.status(400).send("O telefone está undefined!");
    } else if(funcao == undefined) {
        res.status(400).send("A função está undefined!");
    } else if (matricula == undefined){
        res.status(400).send("A matrícula está undefined!");
    }else {

        // Passe os valores como parâmetro e vá para o arquivo usuarioModel.js
        usuarioModel.cadastrar_Func(nome, email, senha, telefone, funcao, matricula, fk_unidade,fk_responsavel)
            .then(function (resultado) {
                  res.json(resultado);}
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}
module.exports = {
    autenticar,
    cadastrar,
    ver_usuario,
    cadastrar_Func
}