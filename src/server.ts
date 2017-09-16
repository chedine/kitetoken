import express = require("express");
import bodyparser = require("body-parser");
import * as db from "./db";
import * as puppet from "./puppet";

const app = express();
const dbHandle = db.getDBHandle("db/userbase.db");
app.use(bodyparser.json());

app.get("/echo", (request, response) => {
    response.json({
        echo: "Hello from Token server!"
    })
});

app.get("/token", (request, response) => {
    const userName = request.query.user;
    console.log("Logging in for " + userName);
    dbHandle.findUser(userName, async function (user: User) {
        if (user) {
            const token = await puppet.login(user, (results: any) => {
                response.json(results);
            });
        }
        else {
            response.json({ status: "fail", msg: `user ${userName} not found in registry` });
        }
    });

});
// http://127.0.0.1/?status=success&request_token=li4sj0tws4xwdltkq0tfvbq766kz8966
app.get("/callback", (request, response) => {
    response.json({
        status: request.query.status,
        requestToken: request.query.request_token
    });
});

app.listen(3000, () => {
    console.log("Server listening on 3000");
});