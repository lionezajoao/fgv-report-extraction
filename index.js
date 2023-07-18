import DataExtraction from "./src/dataExtraction.js";


const getAgents = async(lib) => {
    try {
        await lib.getAgentForms();
        await lib?.browser?.close();
    } catch(err) {
        console.log("An error ocurred, trying again", err);
        await getAgents(lib);
    }
}

const getManagers = async (lib) => {
    try {
        await lib.getManagerForms();
        await lib?.browser?.close();
    } catch(err) {
        console.log("An error ocurred, trying again", err);
        await getManagers(lib);
    }
    
}

const main = async () => {
    const lib = new DataExtraction();
    await getAgents(lib);
    await getManagers(lib); 
}

main()