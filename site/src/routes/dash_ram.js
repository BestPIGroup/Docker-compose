var express = require("express");
var router = express.Router();

var conexaoS3Controller = require ("../controllers/dash_ramController");

router.post("/buscar_registros", function (req, res) {
    conexaoS3Controller.buscarRegistros(req,res);
});

module.exports = router;