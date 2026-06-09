

CREATE DATABASE projeto_Argos;
USE projeto_Argos;

CREATE TABLE usuario(
idUsuario INT PRIMARY KEY AUTO_INCREMENT,
nome VARCHAR(45),
email VARCHAR(45),
senha VARCHAR(45),
telefone CHAR(11),
funcao VARCHAR(45),
matricula CHAR(7),
fkResponsavel INT,
FOREIGN KEY (fkResponsavel) REFERENCES usuario(idUsuario)
);

CREATE TABLE unidade(
idUnidade INT PRIMARY KEY AUTO_INCREMENT,
cod_Unidade VARCHAR(45),
CEP VARCHAR(45),
cidade VARCHAR(45),
rua VARCHAR(45),
bairro VARCHAR(45),
fkResponsavel int NOT NULL,
FOREIGN KEY (fkResponsavel) REFERENCES usuario (idUsuario)
);

CREATE TABLE slackJira(
id_unidade_slackJira INT UNIQUE NOT NULL PRIMARY KEY,
token_api VARCHAR(1000) NOT NULL,
email_jira VARCHAR(100) NOT NULL,
url_jira VARCHAR(250) NOT NULL,
key_url_jira VARCHAR(10) NOT NULL,
webhook_slack VARCHAR(250) NOT NULL,
CONSTRAINT id_unidade_slackJira
FOREIGN KEY(id_unidade_slackJira)
REFERENCES unidade(idUnidade)
);

CREATE TABLE servidor(
id_servidor INT PRIMARY KEY AUTO_INCREMENT,
alias VARCHAR(45),
endereco_mac VARCHAR(45) UNIQUE,
status_servidor VARCHAR(45),
fk_unidade INT NOT NULL,
FOREIGN KEY (fk_unidade) REFERENCES unidade (idUnidade)
);

CREATE TABLE componente(
id_componente INT PRIMARY KEY,
nome_componente VARCHAR(45) NOT NULL
);

INSERT INTO componente(id_componente, nome_componente) VALUES
(1, 'CPU'),
(3, 'RAM'),
(6, 'Disco'),
(7, 'Processos'),
(8, 'Rede'),
(20, 'Ransomware'),
(21, 'DDoS'),
(22, 'Malware');

CREATE TABLE componente_servidor (
    id_servidor INT NOT NULL,
    id_componente INT NOT NULL,
    limite_componente INT NOT NULL,
    exibir BOOLEAN,
    PRIMARY KEY (id_servidor, id_componente),
    CONSTRAINT fk_comp_servidor_servidor
        FOREIGN KEY (id_servidor)
            REFERENCES servidor(id_servidor),
    CONSTRAINT fk_comp_servidor_componente
        FOREIGN KEY (id_componente)
            REFERENCES componente(id_componente)
);

CREATE TABLE limite(
idLimite INT,
limiteCPU DECIMAL,
limiteRAM DECIMAL,
limiteDISCO DECIMAL,
fkServidor INT,
FOREIGN KEY (fkServidor) REFERENCES servidor (id_servidor),
    CONSTRAINT PRIMARY KEY (idLimite, fkServidor)
);

CREATE TABLE infor_serv(
idInfo INT,
uso_CPU DECIMAL,
uso_RAM DECIMAL,
uso_DISCO DECIMAL,
info_TIME DATETIME,
fkServidor INT,
FOREIGN KEY (fkServidor) REFERENCES servidor (id_servidor),
    CONSTRAINT PRIMARY KEY (idInfo, fkServidor)
);

CREATE TABLE tolken(
fkServidor INT,
fkUsuario INT,
tolken VARCHAR(45),
end_check DATETIME,
FOREIGN KEY (fkServidor) REFERENCES servidor (id_servidor),
FOREIGN KEY (fkUsuario) REFERENCES usuario (idUsuario),
    CONSTRAINT PRIMARY KEY (fkServidor, fkUsuario)
);

CREATE TABLE  permissoes(
idPermissao INT,
tipo_usuario VARCHAR(45),
fkUsuario INT,
FOREIGN KEY (fkUsuario) REFERENCES usuario (idUsuario),
CONSTRAINT PRIMARY KEY (idPermissao, fkUsuario)
);
