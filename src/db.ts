import sqlite3 = require("sqlite3");

export function getDBHandle(singleFileDb: string) {
    const _db = new sqlite3.Database(singleFileDb);

    function init() {
        _db.serialize(() => {
            _db.run(DROP_TWOFA_SQL)
                .run(DROP_USERS_SQL)
                .run(CREATE_USERS_SQL)
                .run(CREATE_TWOFA_SQL);
        });
    }

    function registerUser(userRecord: User, errorHandler: any) {
        _db.serialize(() => {
            _db.run("BEGIN TRANSACTION");
            let statement: any = _db.prepare(INSERT_USERS_SQL);
            statement.run([userRecord.name, userRecord.password, userRecord.apiToken], errorHandler);
            statement = _db.prepare(INSERT_TWOFA_SQL);
            userRecord.twofa.forEach((QnA: QnA) => {
                statement.run([userRecord.name, QnA.question, QnA.answer], errorHandler);
            })
            _db.run("COMMIT");
        });
    }

    function findUser(userName: String, callback: any) {
        const twoFASet = [];
        _db.get(FIND_USERS_SQL, [userName], (err: any, record: any) => {
            if (record) {
                _db.all(FIND_TWOFA_SQL, [userName], function (err, rows) {
                    rows.forEach(element => {
                        twoFASet.push({ question: element.question, answer: element.answer });
                    });
                    callback({
                        name: record.name,
                        password: record.password,
                        apiToken: record.apiToken,
                        twofa: twoFASet
                    });
                })
            }
            else {
                callback(undefined);
            }
        });
    }
    return {
        init,
        registerUser,
        findUser
    }
}
const CREATE_USERS_SQL = `
CREATE TABLE "USERS" (
  "id" INTEGER PRIMARY KEY,
  "name" varchar(25) NOT NULL,
  "password" varchar(50) NOT NULL,
  "apiToken" varchar(150) NOT NULL,
   UNIQUE ("name")
) ;
`;

const CREATE_TWOFA_SQL = `
CREATE TABLE "USERS_TWOFA" (
  "id" INTEGER PRIMARY KEY,
  "username" varchar(25) NOT NULL,
  "question" varchar(300) NOT NULL,
  "answer" varchar(200) NOT NULL,
   UNIQUE ("question"),
   FOREIGN KEY (username) REFERENCES USERS(name)
) ;
`;
const DROP_USERS_SQL = "DROP TABLE IF EXISTS USERS";
const DROP_TWOFA_SQL = "DROP TABLE IF EXISTS USERS_TWOFA";
const INSERT_USERS_SQL = "INSERT INTO USERS (NAME, PASSWORD,APITOKEN) VALUES (?, ?,?)";
const INSERT_TWOFA_SQL = "INSERT INTO USERS_TWOFA (USERNAME, QUESTION, ANSWER) VALUES (?, ?, ?)";
const FIND_USERS_SQL = "select * from users where name = ?";
const FIND_TWOFA_SQL = "select * from USERS_TWOFA where username = ?";
