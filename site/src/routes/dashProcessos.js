var express = require("express");
var router = express.Router();

var dashProcessosController = require ("../controllers/dashProcessosController");

router.post("/buscar_registros", function (req, res) {
    dashProcessosController.buscarRegistros(req,res);
});

module.exports = router;

