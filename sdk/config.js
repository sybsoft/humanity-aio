import fs from 'fs'
import toml from 'toml'

function parseConfig(filePath = 'config.toml') {
    const configContent = fs.readFileSync(filePath, 'utf8')
    return toml.parse(configContent)
}

export default parseConfig()
