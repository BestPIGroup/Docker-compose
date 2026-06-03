var express = require("express");
var router = express.Router();

var servidoresController = require ("../controllers/servidoresController");

router.post("/cadastrar_servidor",  function (req, res) {
    servidoresController.cadastrar_servidor(req, res);
})

module.exports = router;