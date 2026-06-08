// routes/ransomware.js
const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/ransomwareController");

// POST /ransomware/dados
// Body: { "MacServer": "bc:cd:99:c2:86:34" }
router.post("/dados", function (req, res) {
    controller.buscarDadosRansomware(req, res);
});

module.exports = router;