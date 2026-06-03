

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

CREATE TABLE servidor(
idServidor INT PRIMARY KEY AUTO_INCREMENT,
fornecedor VARCHAR(45),
modelo VARCHAR(45),
numero_Manutenção VARCHAR(45),
numero_Serie VARCHAR(45),
ultima_Manutenção VARCHAR(45),
statuss VARCHAR(45),
fkUnidade INT NOT NULL,
FOREIGN KEY (fkUnidade) REFERENCES unidade (idUnidade)
);

CREATE TABLE limite(
idLimite INT,
limiteCPU DECIMAL,
limiteRAM DECIMAL,
limiteDISCO DECIMAL,
fkServidor INT,
FOREIGN KEY (fkServidor) REFERENCES servidor (idServidor),
    CONSTRAINT PRIMARY KEY (idLimite, fkServidor)
);

CREATE TABLE infor_serv(
idInfo INT,
uso_CPU DECIMAL,
uso_RAM DECIMAL,
uso_DISCO DECIMAL,
info_TIME DATETIME,
fkServidor INT,
FOREIGN KEY (fkServidor) REFERENCES servidor (idServidor),
    CONSTRAINT PRIMARY KEY (idInfo, fkServidor)
);

CREATE TABLE tolken(
fkServidor INT,
fkUsuario INT,
tolken VARCHAR(45),
end_check DATETIME,
FOREIGN KEY (fkServidor) REFERENCES servidor (idServidor),
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