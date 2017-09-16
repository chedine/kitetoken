const puppeteer = require("puppeteer");
const BASEURL = "https://kite.trade/connect/login?api_key=";
/**
 * 
 * @param questionSet 
 * @param question 
 */
function getAnswer(questionSet, question) {
  const matchingQnA = questionSet.filter((qna) => qna.question === question.trim());
  return matchingQnA.length == 0 ? undefined : matchingQnA[0].answer;
}
/**
 * 
 * @param page 
 */
function pageWrapper(page: any) {
  return {
    inputInto: async function (selector: String, value: String) {
      await page.click(selector);
      await page.type(value);
    },
    extractInnerText: async function (selector: String) {
      const value = await page.evaluate((sel) => {
        return document.querySelector(sel).innerText;
      }, selector);
      return value;
    }
  }
}
/**
 * 
 */
function selectorDatabase() {
  return {
    userNameFieldSelector: "#inputone",
    passwordFieldSelector: "#inputtwo",
    loginBtnSelector: "#loginform > div.row > div:nth-child(1) > button",
    securityQSelector1: "#twofaform > div:nth-child(5) > span",
    securityQSelector2: "#twofaform > div:nth-child(6) > span",
    securityAnsSelector1: "#twofaform > div:nth-child(5) > input",
    securityAnsSelector2: "#twofaform > div:nth-child(6) > input",
    securitySubmitBtnSelector: "#twofaform > div.row > div:nth-child(1) > button"
  }
}
/**
 * 
 * @param userDetails 
 */
export async function login(userDetails: User, callback: any) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const pageHandle = pageWrapper(page);
  const selectors = selectorDatabase();
  // Start page
  await page.goto(BASEURL + userDetails.apiToken);
  // Login
  await pageHandle.inputInto(selectors.userNameFieldSelector, userDetails.name);
  await pageHandle.inputInto(selectors.passwordFieldSelector, userDetails.password);
  await page.click(selectors.loginBtnSelector);
  await page.waitForNavigation();

  // Two Factor authentication page.
  const firstQuestion = await pageHandle.extractInnerText(selectors.securityQSelector1);
  const secondQuestion = await pageHandle.extractInnerText(selectors.securityQSelector2);
  const firstAnswer = getAnswer(userDetails.twofa, firstQuestion);
  if (!firstAnswer) {
    throw new Error("Unfamiliar question : " + firstQuestion);
  }
  const secondAnswer = getAnswer(userDetails.twofa, secondQuestion);
  if (!secondAnswer) {
    throw new Error("Unfamiliar question : " + secondQuestion);
  }

  await pageHandle.inputInto(selectors.securityAnsSelector1, firstAnswer);
  await pageHandle.inputInto(selectors.securityAnsSelector2, secondAnswer);
  await page.click(selectors.securitySubmitBtnSelector);

  page.on("response", async function(response) {
    const res = await response.json();
    browser.close();
    console.log(res);
    callback(res);
  });
  await page.waitForNavigation();
  // browser.close();
}
