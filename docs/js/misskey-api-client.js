class MisskeyApiClient {
    constructor(domain, i) {
        this._client = new MisskeyRestClient(domain)
        this._i = i
    }
    _params(params=null) { return (params) ? {...{i: this._i}, ...params} : {i: this._i} }
    async i() { return await this._client.post('i', null, this._params()) } // permission: 'read:account'
    async meta(detail=true) { // permission: No
        console.debug('----- meta -----')
        console.debug(detail)
        return await this._client.post('meta', null, {detail:detail})
    }
    async note(text) { // permission: 'write:notes'
        console.debug('----- note -----')
        console.debug(this._i)
        console.debug(text)
        return await this._client.post('notes/create', null, this._params({text:text}))
        //const params = this._params({text:text})
        //return await this._client.post('notes/create', null, params)
    }
}
