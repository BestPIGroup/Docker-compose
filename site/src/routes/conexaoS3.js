var express = require("express");
var router = express.Router();

var conexaoS3Controller = require ("../controllers/conexaoS3Controller");

router.post("/buscar_registros", function (req, res) {
    conexaoS3Controller.buscarRegistros(req,res);
});

module.exports = router;