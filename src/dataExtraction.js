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
        this.browser;
        const baseUrl = await this.getRedirectUrl();
        if (baseUrl === "failed") throw new Error("LOGIN FAILED");
        try {
            this.browser = await puppeteer.launch({
                headless: false,
                ignoreHTTPSErrors: true,
                executablePath: executablePath(),
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--window-size=1920,1080",
                    `--download-default-directory=${ this.path }/temp`
                ],
            });

            this.page = await this.browser.newPage();
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
            
        } catch (error) {
            throw new Error(`Proccess failed, reason: ${error}`);
        }
    }

    async waitForClick(xpath) {
        await this.sleep(1);
        await this.page.waitForXPath(xpath, {
            visible: true,
            timeout: 15000
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

    async pressDate(page, date) {
        for (let i in date) {
            await page.keyboard.press(date[i]);
        }
    }

    async setToProfile(name) {
        console.log(`Setting to profile ${ name }`);
        await this.waitForClick('//*[contains(@class, "m-menu__link-text") and contains(text(), "S2")]');
        await this.sleep(2)
        await this.waitForClick(`//*[contains(text(), '${name}')]`);
    }

    async handlerManagerMethod(interested=null) {
        try {
            console.log("Getting form");
            const frame = await this.switchToFrame();
            await frame.select('#SistemaContentPlaceHolder_ddlAno', '2023');

            await this.sleep(2);
            
            if(interested) {
                await( await frame.$('xpath/' + '//*[@type="radio" and @value="2"]')).click();
            };

            await( await frame.$('xpath/' + '//*[@value="Consultar"]')).click();
            await this.sleep(10);

            await( await frame.$('#ctl00_SistemaContentPlaceHolder_rptCandidatosIncritos_ctl05_ctl04_ctl00_Button')).click();
            await( await frame.$('a[title="EXCEL"]') ).click();
            let newFile = this.listTempFiles();
            while (newFile.length == 0) {
                await this.sleep(1);
                newFile = this.listTempFiles();
            }
            await frame.click('input[name="ctl00$SistemaContentPlaceHolder$btnVoltar"]');
            await this.page.bringToFront();
            await this.sleep(5);
        } catch (e) {
            console.log(e);
        }
    }

    async fillDate(elem, date) {
        await this.sleep(1);
        await elem.type(date);
        await this.page.keyboard.press('Tab');
    } 

    async fillAgentForm() {
        const frame  = await this.switchToFrame();

        await frame.waitForSelector('input[id="SistemaContentPlaceHolder_UC_FiltroRelatorio_txtDataInicio"]');

        const startDate = await frame.$('input[id="SistemaContentPlaceHolder_UC_FiltroRelatorio_txtDataInicio"]');
        await startDate.click();
        await this.fillDate(startDate, this.lastYear);
        await this.sleep(1);
        
        const endDate = await frame.$('input[id="SistemaContentPlaceHolder_UC_FiltroRelatorio_txtDataTermino"]');
        await endDate.click();
        await this.fillDate(endDate, this.today);
        await this.sleep(5);
        
        await frame.select('select[id="SistemaContentPlaceHolder_UC_FiltroRelatorio_ddlPrograma"]', "TODOS");
        await this.sleep(2);

        await frame.click('input[id="SistemaContentPlaceHolder_UC_FiltroRelatorio_ConsultarButton"');

        await this.sleep(10);

        // await frame.waitForSelector('select[id="SistemaContentPlaceHolder_ReportInteressados_ctl01_ctl05_ctl00"');
        await frame.select('select#SistemaContentPlaceHolder_ReportInteressados_ctl01_ctl05_ctl00', 'EXCELOPENXML');
        await frame.click('a#SistemaContentPlaceHolder_ReportInteressados_ctl01_ctl05_ctl01');

        let newFile = this.listTempFiles();
        while (newFile.length == 0) {
            await this.sleep(1);
            newFile = this.listTempFiles();
        }
        
        await this.page.bringToFront();
        await this.sleep(3);
    }

    async getAgentInterested(){

        await this.waitForClick("//span[contains(@class, 'm-menu__link-text ng-star-inserted') and contains(text(), ' Relatório ')]");
        await this.waitForClick("//span[contains(@class, 'm-menu__link-text .expanded ng-star-inserted') and contains(text(), ' Relatório de Interessados ')]");

        await this.fillAgentForm();
    }

    async getAgentInscribed(){

        await this.sleep(1);
        await this.waitForClick("//span[contains(@class, 'm-menu__link-text .expanded ng-star-inserted') and contains(text(), ' Relatório de Inscritos ')]");

        await this.fillAgentForm();
    }

    async getManagerForms() {

        try {
            await this.sleep(10);
    
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
        } catch (err) {
            console.log(err)
        } finally {
            console.log("Browser closed");
            this.browser?.close();
        }

    }

    async getAgentForms() {
        try {
            let fileName;
            const agent_list = [
                "S2 - Agente de Vendas MAZZA 0 - Aracaju",
                "S2 - Agente de Vendas MAZZA 1 - Montes Claros",
                "S2 - Agente de Vendas NMAZZA 0 - Niterói",
                "S2 – Agente de vendas NMAZZA 1 – Macaé "
            ]

            for (let i in agent_list) {
                const agent = agent_list[i];

                if (agent.includes('Macaé')) {
                    fileName = agent.split(" – ").at(-1);
                } else {
                    fileName = agent.split(" - ").at(-1);
                }

                await this.sleep(15);
                await this.setToProfile(agent);
                
                console.log("Getting Interested forms");
                await this.getAgentInterested();
                await this.sleep(2);
                this.renameFile(`${ this.path }/temp/${  this.listTempFiles()[0] }`, `${ this.path }/forms/Agente de Vendas - ${ fileName } - ${ this.listTempFiles()[0] }`)
                console.log("Getting Inscribed forms");
                await this.getAgentInscribed();
                await this.sleep(2);
                this.renameFile(`${ this.path }/temp/${  this.listTempFiles()[0] }`, `${ this.path }/forms/Agente de Vendas - ${ fileName } - ${ this.listTempFiles()[0] }`)
            }
        } catch (err) {
            console.log(err)
        } finally {
            console.log("Browser closed");
            this.browser?.close();
        }
    }

        
    }