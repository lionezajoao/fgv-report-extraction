import fs from "fs";

export default class Utils {
    constructor() {
        this.setDateScope();
        this.path = process.env.PWD;
    }

    setDateScope() {
        const date = new Date()
        this.today = date.toLocaleString('br', { dateStyle: 'short' });
        date.setFullYear(date.getFullYear() - 1);
        this.lastYear = date.toLocaleString('br', { dateStyle: 'short' });
    }

    sleep(sec) {
        return new Promise(resolve => setTimeout(resolve, sec * 1000));
    }

    listTempFiles(){
        return fs.readdirSync(`${ this.path }/temp`).filter(x => x.includes("xlsx"));
    }

    renameFile(oldPath, newPath) {
        fs.rename(oldPath, newPath, (err) => {
            if (err) {
                console.log(err)
            } else {
                console.log(`File renamed`)
            }
        })
    } 
}