class ProfileGenerator {
    constructor() {
        this._addressRegExp = /[a-zA-Z0-9]{34,}/g
    }
    generate(json) {
        const address = this.#getAddress(json)
        const avatar = `<td>${this.#makeAvatar(json)}<br>${this.#makeName(json)}<br></td>`
        const intro = `<td>${this.#makeMpurseSendButton(address)}${address}<br>${this.#getName(json)}<br>${json.note}</td>`
        return `<table><tr>${avatar}${intro}</tr></table>`
    }
    #makeAvatar(json) {
        return `<a href="${json.url}"><img src="${json.avatar}" title="${this.#getName(json)}" width="128" height="128"></a>`
    }
    #makeName(json) { return `<a href="${json.url}">${this.#getName(json)}</a>` }
    #getName(json) { return json.display_name || json.username || json.acct }
    #makeMpurseSendButton(address) { // マストドンのプロフィール情報にアドレスらしき文字列があれば投げモナボタンを配置する
        return (address) ? `<mpurse-send-button img-size="32" amount="0.00004649" to="${address}"></mpurse-send-button>` : ''
    }
    #getAddress(json) {
        let address = this.#getAddressFirst(json.source.note)
        if (address) { return address }
        for (const field of json.source.fields) {
            if ('モナコイン' == field.name || 'MONACOIN' == field.name.toUpperCase()) {
                address = this.#getAddressFirst(field.value)
                if (address) { return address }
            }
        }
        address = this.#getAddressFirst(json.note)
        if (address) { return address }
        return ''
    }
    #getAddressFirst(str) {
        const founds = str.match(this._addressRegExp)
        console.debug(founds)
        if (Array.isArray(founds) && 0 < founds.length) { return founds[0] }
        return null
    }

}

