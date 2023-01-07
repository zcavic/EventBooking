const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());

app.get("/", (req, res, next) => {
    return res.status(200).json({ status: "Success", data: {} });
});

app.listen(3000);
