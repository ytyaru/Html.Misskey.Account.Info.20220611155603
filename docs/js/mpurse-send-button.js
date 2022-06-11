class MpurseSendButton extends HTMLElement {
    constructor() {
        super();
        try {
            window.mpurse.updateEmitter.removeAllListeners()
              .on('stateChanged', isUnlocked => this.stateChanged(isUnlocked))
              .on('addressChanged', address => this.addressChanged(address));
        } catch(e) { console.debug(e) }
        this.title = '投げモナする'
        this.img = null
        this.imgSrc = null
        this.imgSize = '64'
        this.to = null
        this.asset = 'MONA'
        this.amount = '0.11411400'
        this.memo = null
        this.okMsg = '投げモナしました！\nありがとうございます！（ ´∀｀）'
        this.ngMsg = 'キャンセルしました(´・ω・｀)'
        this.icon = new MonacoinIconBase64()
    }
    static get observedAttributes() {
        return ['to', 'asset', 'amount', 'memo', 'img', 'img-src', 'img-size', 'title', 'ok-msg', 'ng-msg'];
    }
    async connectedCallback() {
        //const shadow = this.attachShadow({ mode: 'closed' });
        const shadow = this.attachShadow({ mode: 'open' }); // マウスイベント登録に必要だった。CSS的にはclosedにしたいのに。
        const button = await this.#make()
        await this.#makeClickEvent()
        console.debug(button.innerHTML)
        shadow.innerHTML = `<style>${this.#cssBase()}${this.#cssAnimation()}</style>${button.innerHTML}` 
        // pointer系 = mouse系 + touch系 + pen系
        this.shadowRoot.querySelector('img').addEventListener('pointerdown', (e)=>{ e.target.classList.add('jump'); }, false);
        //this.shadowRoot.querySelector('img').addEventListener('pointerover', (e)=>{ e.target.classList.add('flip'); }, false);
        //this.shadowRoot.querySelector('img').addEventListener('mouseover', (e)=>{ e.target.classList.add('flip'); }, false);
        this.shadowRoot.querySelector('img').addEventListener('animationend', (e)=>{ e.target.classList.remove('jump'); e.target.classList.remove('flip'); }, false);
    }
    #cssBase() { return `img{cursor:pointer; text-align:center; vertical-align:middle; user-select:none;}` }
    #cssAnimation() { return `
@keyframes jump {
  from {
    position:relative;
    bottom:0;
    transform: rotateY(0);
  }
  45% {
    position:relative;
    bottom: ${this.imgSize*2}px;
  }
  55% {
    position:relative;
    bottom: ${this.imgSize*2}px;
  }
  to {
    position:relative;
    bottom: 0;
    transform: rotateY(720deg);
  }
}
.jump {
  transform-origin: 50% 50%;
  animation: jump .5s linear alternate;
}
@keyframes flip {
  from {
    transform: rotateY(0);
  }
  to {
    transform: rotateY(180deg);
  }
}
.flip {
  transform-origin: 50% 50%;
  animation: flip .20s linear alternate;
}`; }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) { return; }
        if ('img-src' === property) { this.imgSrc = newValue}
        else if ('img-size' === property) { this.imgSize = newValue}
        else if ('ok-msg' === property) { this.okMsg = newValue}
        else if ('ng-msg' === property) { this.ngMsg = newValue}
        else { this[property] = newValue; }
    }
    stateChanged(isUnlocked) {
        console.debug(`Mpurseのロック状態が変更されました：${isUnlocked}`)
    }
    addressChanged(address) {
        console.debug(`Mpurseのログイン中アドレスが変更されました：${address}`)
        this.to = address
        this.#make().then(
            result=>{this.innerHTML = ''; this.appendChild(result); }, 
            error=>{console.debug('アドレス変更に伴いボタン更新を試みましたが失敗しました。', e);})
    }
    async #make() {
        const a = await this.#makeSendButtonA()
        const img = this.#makeSendButtonImg()
        a.appendChild(img)
        return a
    }
    async #makeClickEvent() {
        const to = this.to || await window.mpurse.getAddress()
        const asset = this.asset || 'MONA'
        const amount = Number(this.amount) || 0.11411400
        const memoType = (this.memo) ? 'plain' : 'no' // 'no', 'hex', 'plain'
        const memo = this.memo
        this.addEventListener('click', async(event) => {
            console.debug(`クリックしました。\n宛先：${to}\n金額：${amount} ${asset}\nメモ：${memo}`)
            const txHash = await window.mpurse.sendAsset(to, asset, amount, memoType, memo).catch((e) => this.ngMsg);
            if (txHash === this.ngMsg) { console.debug(this.ngMsg); alert(this.ngMsg); }
            else {
                console.debug(txHash)
                console.debug(`送金しました。\ntxHash: ${txHash}\n宛先：${to}\n金額：${amount} ${asset}\nメモ：${memo}`)
                alert(this.okMsg)
            }
        });
    }
    #makeSendButtonA() {
        const a = document.createElement('a')
        a.setAttribute('title', this.title)
        a.setAttribute('class', `vov swivel-horizontal-double`) // アニメーション用
        return a
    }
    #makeSendButtonImg() {
        const img = document.createElement('img')
        const size = this.#parseImgSize()
        const [width, height] = this.#parseImgSize()
        img.setAttribute('width', `${width}`)
        img.setAttribute('height', `${height}`)
        img.setAttribute('src', `${this.#getImgSrc()}`)
        //img.classList.add('flip'); // 初回アニメーション用
        return img
    }
    #getImgWidth() { return parseInt( (0 <= this.imgSize.indexOf('x')) ? this.imgSize.split('x')[0] : this.imgSize) }
    #getImgHeight() { return parseInt( (0 <= this.imgSize.indexOf('x')) ? this.imgSize.split('x')[1] : this.imgSize) }
    #parseImgSize() {
        if (0 <= this.imgSize.indexOf('x')) { return this.imgSize.split('x').map(v=>(parseInt(v)) ? parseInt(v) : 64) }
        else { return (parseInt(this.imgSize)) ? [parseInt(this.imgSize), parseInt(this.imgSize)] : [64, 64] }
    }
    #getImgSrc() {
        if (this.imgSrc) { return this.imgSrc }
        if (this.img) {
            const num = parseInt(this.img)
            if (isNaN(num)) {
                const key = this.icon.getKey(this.img, this.imgSize)
                return (this.icon.Base64.has(key)) ? this.icon.Base64.get(key) : this.icon.Default }
            else {
                if (this.icon.Base64.size <= num) { return this.icon.Default }
                if (num < this.icon.Base64.size) { return [...this.icon.Base64.values()][num] }
                return this.icon.get(this.img, this.imgSize)
            }
        }
        return this.icon.Default
    }
}
window.addEventListener('DOMContentLoaded', (event) => {
    customElements.define('mpurse-send-button', MpurseSendButton);
});


class MonacoinIconBase64 {
    constructor(map) {
        this.base64 = new Map()
        this.base64.set('coin-mark-64', null)
        this.base64.set('coin-monar-64', null)
        this.base64.set('monar-mark-64', null)
        this.base64.set('coin-mark-256', null)
        this.base64.set('coin-monar-256', null)
        this.base64.set('monar-mark-256', null)
        this.#setBase64()
    }
    get Default() { return this.base64.get('coin-monar-64') }
    get Base64() { return this.base64 }
    get(name, size) { return this.base64.get(this.getKey(name, size)) }
    getKey(name, size) { return name + '-' + this.getSize(size) }
    getSize(size) { return (64 < size) ? 256 : 64 }
    #setBase64() {
        this.base64.set('coin-monar-64', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAllBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAQDwofGQAAAAAAAAAAAAAAAAADAgD/////zgACAQH6ygDyxABmUgAwJwE+MgD29vbX19exjwDXrgBpaWmggQB5eXnn5+d5YQDpvADEnwC0tLTIyMi8mAA1NTUlJSSNcgBSQgDPpwBHRkZVVVVIOgCHh4aQkI/gtACioqKYmJhHPhzyHaTkAAAADnRSTlMAlj1817DG/v1WaSgR5IduBAwAAARASURBVFjDlVfnmqowEBUEEnWBoQkWmigqqLvv/3Q3pBB0A8s9P8QPMpPMmZrFYgz6WjMtw7YNy9TW+tfiv7BZW6jNDtXO9/3XrjhkLbKWm9niKwtnhee+wSsybK1mia/ttnKVKK72+k9x3bju3FG8AmP6FF9mWLiTuEXmBJ+6nXnuX6htfdR6TLb3p8XJ5xtequWX4YusSOop+SIjP3mkqeS1iG6ewQSJPo6oT68KDUsm70YQjvMQAHgjGtYhNx4BZGPyCQA/nxd98KDjF1uzg+YCI67MMRzhIP6/+eLLFjIHeJ4Aq11xhZ8YAhEQ9jAetExaeXKO/ao3HODuOBD18WAODJC8RbB1tmdQZEOOUOo4ZxBLvVBGtdGv9+DsOI7SCGIA+bSHWx/VRp++rQx12JNV1Ai/qoNrRNAGdfJiBjjOt2CxUyly07gN7Oy2cbYXwECBEHtiQHH3JR7ws7P5AaJhpJy6ZcQIdH+U8ZZqi8tng+BJPzgQDqxiLJiJfNVxSBHzZ4+YPyWLrltZNAaQfMM4nMSARdfFXZ1cD5zOOZzCkEU3W35YwDmcwpBFt+hsQNLlO8w5nAICuaOHSAuQrL6woHoKJzSI01ZfrPoT+SE8nBkoAfU1J1svlrWMgb0zC9+y5hw0yWEF5+08BcSVInsLc2HdRHJBPFO+i3RRf6yFtRMe7A0oH49S4b/H4ymN4My9jIXFdYWQ9iSpjdkDHMX/CzDn570CUgvFTmiMDKJBnOzB47FTwEyo4bu3j8mn6cDomGtAsYjHq1Bg3ni94evLZs/kUSMVPPnWx0ZEygULEjXmRow+D3yXYZ0i9GlUw0ioTBFIv/M4hsuR4y7s+5XVJJBYKHus4n1yJvC7ShxZ9yGhzJJJpSBFUJ46XBQ5yhVEpD/Z1BikKEVPFlslNCqX7ng682QIkTJiY/qb/v52pyRWXXdiJASqTCg7wx4y/gZgbgzWfVFVF7M7lAoX9oXNw7TBml1U5goWqSub3y6kHHaGJ6y/6rSxtMps3oOy0G8RPXbL26tV0HrSKFcqy+yTVpS+u7LeFoGiCDg/KrWEF192tu4ICW0qF1UWp0puO9oqQ073dBzIlEYo8ICW1sDBlKQFjMdZZfkHcN7t9zbpGQlrDPvtDHnaFgrjbeje4O5lHsI9/aMgHwHfaBcbjnlE14oey7/CpZxsrWegE7UfrkZG1RqgSSe2h6Bb5kdL1bCe0yoXAeyVLSY9IsA0dZXy3XWBFegkJPH7/NCRft/JxFXTnvgKRy4MK8T7ZNKSMnZpHuUpTtP4VD73F/IiPLCWWuHRe9PGCPi0kR+uCIZoa94CvcyYukBqWI4fr6rOAoKsTuQdpMLa9CV2Y0XVxI2ntfQZ99booBz3vSQy5t1ddRMFSf5xW0oCZOqzb89fK9MOyYxd7AiKpA5C21z95wV+sVktyf2fwNSWq3Hi/wFgNtTuiIirFAAAAABJRU5ErkJggg==')
    }
}
