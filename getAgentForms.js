// import DataExtraction from "./src/dataExtraction.js";

// const main = async () => {
//     const extract = new DataExtraction();
//     await extract.setup();
//     await extract.getAgentForms();
// }

// main()

import DataExtraction from "./src/dataExtraction.js";

const extraction = async (extract) => {
    await extract.setup();
    await extract.getAgentForms();
    await extract?.browser?.close();
}

const main = async () => {
    const extract = new DataExtraction();
    await extract.retry(extraction, extract);
}

main()