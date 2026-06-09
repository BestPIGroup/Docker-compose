// const ambiente_processo = "producao";
const ambiente_processo = "desenvolvimento";
const caminho_env = ambiente_processo === "producao" ? ".env" : ".env.dev";

require("dotenv").config({ path: caminho_env });
process.env.AMBIENTE_PROCESSO = process.env.AMBIENTE_PROCESSO || ambiente_processo;

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORTA_APP = process.env.APP_PORT;
const HOST_APP = process.env.APP_HOST;

const indexRouter = require("./src/routes/index");
const usuarioRouter = require("./src/routes/usuarios");
const unidadeRouter = require("./src/routes/unidade");
const servidorRouter = require("./src/routes/servidores");
const conexaoS3Router = require("./src/routes/conexaoS3");
const dash_cpuRouter = require("./src/routes/dash_cpu");
const ransomwareRouter = require("./src/routes/ransomware");
const alertasS3Router = require("./src/routes/alertasS3");
const limitesComponentesRouter = require("./src/routes/limitesComponentes");
const dash_ramRouter = require("./src/routes/dash_ram");
const dash_ramsomware = require("./src/routes/ransomware")
var dashProcessosRouter = require("./src/routes/dashProcessos");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

app.use("/", indexRouter);
app.use("/usuarios", usuarioRouter);
app.use("/unidade", unidadeRouter);
app.use("/servidores", servidorRouter);
app.use("/conexaoS3", conexaoS3Router);
app.use("/dashProcessos", dashProcessosRouter);
app.use("/dash_cpu", dash_cpuRouter);
app.use("/ransomware", ransomwareRouter);
app.use("/alertasS3", alertasS3Router);
app.use("/limitesComponentes", limitesComponentesRouter);
app.use("/dash_ram", dash_ramRouter)
app.use("/ramsomware",dash_ramsomware)

app.listen(PORTA_APP, function () {
    console.log(`
       ###    ########   ######    #######   ######  
      ## ##   ##     ## ##    ##  ##     ## ##    ## 
     ##   ##  ##     ## ##        ##     ## ##       
    ##     ## ########  ##   #### ##     ##  ######  
    ######### ##   ##   ##    ##  ##     ##       ## 
    ##     ## ##    ##  ##    ##  ##     ## ##    ## 
    ##     ## ##     ##  ######    #######   ######  

    Servidor do seu site já está rodando! Acesse: http://${HOST_APP}:${PORTA_APP}

    Você está rodando sua aplicação em ambiente de .:${process.env.AMBIENTE_PROCESSO}:.
    `);
});
