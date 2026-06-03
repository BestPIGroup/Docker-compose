FROM mysql:8.4

COPY projeto_argos.sql /docker-entrypoint-initdb.d/

CMD ["mysqld", "--mysql-native-password=ON"]