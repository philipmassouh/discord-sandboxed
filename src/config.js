const {app} = require('electron')
const fs = require('graceful-fs')
const path = require('path')

function _saveToConfig (configObj) {
    return new Promise(function (resolve, reject) {
        const configFile = path.join(app.getPath('home'), '.config', 'discord-sandboxed', 'config.json');
        console.log('\tUpdating config.json', configObj)
        fs.writeFile(configFile, JSON.stringify(configObj, null, 2), (err) => {
            if (err) throw err;
            return resolve(configObj)
        })
    })
}

module.exports = {
    initConfig: function () {
        return new Promise((resolve, reject) => {
            const configDir = path.join(app.getPath('home'), '.config', 'discord-sandboxed');
            const configFile = path.join(app.getPath('home'), '.config', 'discord-sandboxed', 'config.json');
            console.log('init config at ', configFile);
            
            let configObj // Init configObj
            
            // If config dir does not exist create it
            if (!fs.existsSync(configDir)){
                fs.mkdirSync(configDir)
            }

            // If config.json does not exist, create it with blank values
            if (!fs.existsSync(configFile)) {
                console.log(`\tCreated Default Config at [${configFile}]`)
                configObj = {
                   'pttDevice': 'mouse',
                   'key': '4', 
                   'delay': '1000', 
                }
                return resolve(_saveToConfig(configObj))
            }
            try {
                configObj = JSON.parse(fs.readFileSync(configFile, 'utf8'))
                return resolve(configObj)
            } catch (err) {
                return reject(err)
            }
        })
    },
    saveConfig: function(configObj) {
        return _saveToConfig(configObj)
    }
}
