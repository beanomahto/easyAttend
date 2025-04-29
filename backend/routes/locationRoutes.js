const express = require("express");
const { createLocation } = require("../controllers/locationController");
const router = express.Router();

router.post("/", createLocation);

module.exports = router;
