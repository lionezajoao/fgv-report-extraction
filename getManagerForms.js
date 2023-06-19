import DataExtraction from "./src/dataExtraction.js";

const main = async () => {
    const extract = new DataExtraction();
    await extract.setup();
    await extract.getManagerForms();
}

main()