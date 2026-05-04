let config_host = "https://fanqienovel.com"
let chap_host = "http://localhost:9999"
let chap_api_url = "http://localhost:8080"
let api_key = ""
let enable_translation = false
let target_lang = "vi_enhanced"

if (typeof baseUrl !== "undefined" && baseUrl !== '""') {
    chap_host = baseUrl.replace(/(^")|("$)/g, '')
}
if (typeof chapApiUrl !== "undefined" && chapApiUrl !== '""') {
    chap_api_url = chapApiUrl.replace(/(^")|("$)/g, '')
}
if (typeof apiKey !== "undefined" && apiKey !== '""') {
    api_key = apiKey.replace(/(^")|("$)/g, '')
}
if (typeof enableTranslation !== "undefined" && enableTranslation !== '""') {
    enable_translation = enableTranslation.replace(/(^")|("$)/g, '') === "true"
}
if (typeof targetLang !== "undefined" && targetLang !== '""') {
    target_lang = targetLang.replace(/(^")|("$)/g, '')
}

let replaceCover = (u) => {
    if (u.startsWith("https://")) u = u.substring(8)
    else u = u.substring(7)
    let uArr = u.split("/")
    uArr[0] = "https://i0.wp.com/p6-novel.byteimg.com/origin"
    let uArr2 = []
    uArr.forEach((x) => {
        if (!x.includes("?") && !x.includes("~")) uArr2.push(x)
        else uArr2.push(x.split("~")[0])
    })
    u = uArr2.join("/")
    return u
}
