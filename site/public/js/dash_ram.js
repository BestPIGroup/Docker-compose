window.onload = () => {
    acessarServidor();
    console.log("servidor 2")
};
function acessarServidor() {
    const servidor = JSON.parse(sessionStorage.getItem("servidor"));
    if (servidor) {
        document.getElementById("servidorAcesso").innerText = servidor.nome;
    }
}