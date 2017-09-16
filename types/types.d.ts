
type User = {
    id?: number,
    name: String,
    password: String,
    apiToken: String,
    twofa : [QnA]
}

type QnA = {
    id?: number,
    question: String,
    answer: String
}