var express = require("express");
var router = express.Router();

var dash_cpuController = require("../controllers/dash_cpuController");

router.post("/buscar_registros", function (req, res) {
    dash_cpuController.buscarRegistros(req, res);
});

module.exports = router;