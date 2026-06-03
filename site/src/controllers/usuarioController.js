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
                        fk_responsavel: resultadoAutenticar[0].fk_responsavel
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
        res.status(400).send("Suas senhas não conhecidem!");
    }else {

        // Passe os valores como parâmetro e vá para o arquivo usuarioModel.js
        usuarioModel.cadastrar(nome, email, senha, telefone, funcao, matricula, fk_unidade)
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