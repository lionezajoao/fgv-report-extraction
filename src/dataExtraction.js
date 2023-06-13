import axios from "axios";
import { config } from "dotenv";
import puppeteer from "puppeteer-extra";
import { executablePath } from "puppeteer";
import pluginStealth from "puppeteer-extra-plugin-stealth";
import Utils from "../utils/utils.js";

puppeteer.use(pluginStealth());

config();

export default class DataExtraction extends Utils {
    static page;
    constructor() {
        super();
        this.page = null;
    }

    async setPageConfig() {
        await this.page.setViewport({
            width: 1920,
            height: 1080,
        });
        this.page.setDefaultNavigationTimeout(2 * 60 * 1000);
    }

    async getRedirectUrl() {
        const response = await axios.post(process.env.URL, {
            "ApplicationId": "eb1e7422-2d0f-45a2-ab02-f49bd82c8e8d",
            "ReturnUrl": "",
            "TotpSecretKey": "",
            "TotpCode": "",
            "ScaeOk": "False",
            "usuario": process.env.LOGIN_EMAIL,
            "senha": process.env.LOGIN_PASS,
            "rememberMe": "on"
        });

        try { 
            return response.data.result.redirectTo;
        } catch(e) {
            console.log(e)
            return "failed"
        }
    }

    async setup() {
        let browser;
        const baseUrl = await this.getRedirectUrl();
        if (baseUrl === "failed") throw new Error("LOGIN FAILED");
        try {
            browser = await puppeteer.launch({
                headless: false,
                ignoreHTTPSErrors: true,
                executablePath: executablePath(),
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--window-size=1920,1080",
                ],
            });

            this.page = await browser.newPage();
            const client = await this.page.target().createCDPSession();
                await client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: `${ this.path }/temp`,
            });

            this.page.setExtraHTTPHeaders({ 
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', 
                'upgrade-insecure-requests': '1', 
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8', 
                'accept-encoding': 'gzip, deflate, br', 
                'accept-language': 'en-US,en;q=0.9,en;q=0.8' 
            })
            await this.setPageConfig();
            await this.page.goto(baseUrl);
            await this.getAgentForms();
            
        } catch (error) {
            throw new Error(`Proccess failed, reason: ${error}`);
        } finally {
            console.log("Browser closed");
            browser?.close();
        }
    }

    async waitForClick(xpath) {
        await this.sleep(1);
        await this.page.waitForXPath(xpath, {
            visible: true,
            timeout: 20000
        });
        await( await this.page.$x(xpath))[0].click();
    }

    async waitForElement(elem) {
        await this.page.waitForSelector(elem, {
            visible: true,
            timeout: 10000
        });

    }

    async switchToFrame(){
        await this.sleep(2);
        await this.waitForElement('iframe');
        return await (await this.page.$('iframe')).contentFrame();
    }

    async setToProfile(name) {
        console.log(`Setting to profile ${ name }`);
        await this.waitForClick('//*[contains(@class, "m-menu__link-text") and contains(text(), "S2")]');
        await this.sleep(2)
        await this.waitForClick(`//*[contains(text(), '${name}')]`);
    }

    async handlerManagerMethod(interested=null) {
        console.log("Getting form");
        const frame = await this.switchToFrame();
        const yearSelector = await frame.$('xpath/' + '//*[@name="ctl00$SistemaContentPlaceHolder$ddlAno"]');
        await yearSelector.select('2023');

        await this.sleep(2);
        
        if(interested) {
            await( await frame.$('xpath/' + '//*[@type="radio" and @value="2"]')).click();
        };

        await( await frame.$('xpath/' + '//*[@value="Consultar"]')).click();
        await this.sleep(10);

        await( await frame.$('#ctl00_SistemaContentPlaceHolder_rptCandidatosIncritos_ctl05_ctl04_ctl00_Button')).click();
        await( await frame.$('a[title="EXCEL"]') ).click();
        await frame.click('input[name="ctl00$SistemaContentPlaceHolder$btnVoltar"]');
        await this.page.bringToFront();
        await this.sleep(5);
    }

    async fillAgentForm() {
        const frame  = await this.switchToFrame();

        await frame.waitForSelector('input[name="ctl00$SistemaContentPlaceHolder$UC_FiltroRelatorio$txtDataInicio"]');
        const startDate = await frame.$('input[name="ctl00$SistemaContentPlaceHolder$UC_FiltroRelatorio$txtDataInicio"]');
        const endDate = await frame.$('input[name="ctl00$SistemaContentPlaceHolder$UC_FiltroRelatorio$txtDataTermino"]');
        await startDate.click();
        await this.sleep(1);
        await this.page.keyboard.down('Control');
        await this.page.keyboard.down('ArrowLeft');
        await this.page.keyboard.up('Control');
        await this.sleep(1);
        await startDate.type(this.lastYear);
        
        // await endDate.type(this.today);
        await this.sleep(100);
    }

    async getAgentInterested(){

        await this.waitForClick("//span[contains(@class, 'm-menu__link-text ng-star-inserted') and contains(text(), ' Relatório ')]");
        await this.waitForClick("//span[contains(@class, 'm-menu__link-text .expanded ng-star-inserted') and contains(text(), ' Relatório de Interessados ')]");

        await this.fillAgentForm();
        

    }

    async getManagerForms() {

        await this.sleep(5);

        await this.waitForElement('span.m-menu__link-text');

        const manager_list = [
            "S2 - Gestor Comercial da Unidade MAZZA 1 - Montes Claros - MAZZA01",
            "S2 - Gestor Comercial da Unidade NMAZZA 2 - Macaé - NMAZZA01",
            "S2 - Gestor Comercial MAZZA 0 - Aracaju",
            "S2 -  Gestor Comercial NMAZZA 0 - Niterói ",
        ]

        for (let i in manager_list) {
            const newFileName = manager_list[i].replace("- NMAZZA01", "").replace(" - MAZZA01", "").split("- ").at(-1);
            await this.setToProfile(manager_list[i]);
            await this.waitForElement('span.m-menu__link-text.ng-star-inserted');
            await this.waitForClick(
                "//span[contains(@class, 'm-menu__link-text ng-star-inserted') and contains(text(), ' Comercial - Relatórios ')]"
            );
            await this.sleep(1);
            await this.waitForClick("//*[contains(text(),'Inscritos/ Interessados')]");
            await this.handlerManagerMethod();
            
            let fileName = this.listTempFiles()[0];
            this.renameFile(`${ this.path }/temp/${ fileName }`, `${ this.path }/forms/${ newFileName } - ${ fileName }`)
            await this.handlerManagerMethod(true);
            
            fileName = this.listTempFiles()[0];
            this.renameFile(`${ this.path }/temp/${ fileName }`, `${ this.path }/forms/${ newFileName } - ${ fileName }`)

            await this.sleep(2);
        }
    }

    async getAgentForms() {
        const agent_list = [
            "S2 - Agente de Vendas MAZZA 0 - Aracaju",
            "S2 - Agente de Vendas MAZZA 1 - Montes Claros",
            "S2 - Agente de Vendas NMAZZA 0 - Niterói",
            "S2 – Agente de vendas NMAZZA 1 – Macaé "
        ]

        for (let i in agent_list) {
            let fileName;
            const agent = agent_list[i];

            if (agent.includes('Macaé')) {
                fileName = agent.split(" – ").at(-1);
            } else {
                fileName = agent.split(" - ").at(-1);
            }

            await this.sleep(5);
            await this.setToProfile(agent);
            
            await this.getAgentInterested();

            console.log(fileName);
        }
    }

        
    }