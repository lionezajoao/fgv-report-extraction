import DataExtraction from "./src/dataExtraction.js";

const data = async () => {
    const extract = new DataExtraction();
    await extract.setup();
}

data()