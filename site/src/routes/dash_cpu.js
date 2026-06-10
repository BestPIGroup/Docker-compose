var express = require("express");
var router = express.Router();
const dash_cpuController = require("../controllers/dash_cpuController");

router.post("/buscarRegistros", function (req, res) {
    dash_cpuController.buscarRegistros(req, res);
});

router.post("/buscarLimites", function (req, res) {
    dash_cpuController.buscarLimites(req, res);
});

module.exports = router;
