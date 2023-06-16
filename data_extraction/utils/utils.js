import fs from "fs";

export default class Utils {
    constructor() {
        this.setDateScope();
        this.path = `${ process.env.PWD }/data_extraction`;
    }

    setDateScope() {
        const date = new Date();
        this.today = date.toLocaleString('us', { dateStyle: 'short' });
        
        const lastYearDate = new Date(date);
        lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
        lastYearDate.setDate(lastYearDate.getDate() + 1);
        this.lastYear = lastYearDate.toLocaleString('us', { dateStyle: 'short' });
      }
      

    sleep(sec) {
        return new Promise(resolve => setTimeout(resolve, sec * 1000));
    }

    listTempFiles(){
        return fs.readdirSync(`${ this.path }/temp`).filter(x => x.includes("xlsx"));
    }

    renameFile(oldPath, newPath) {
        console.log(`Renaming file ${ oldPath }`)
        fs.rename(oldPath, newPath, (err) => {
            if (err) {
                console.log(err)
            } else {
                console.log(`File renamed`)
            }
        })

        // fs.unlinkSync(oldPath);
    } 
}