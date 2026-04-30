let config_host = "https://fanqienovel.com"
let chap_host = "http://localhost:9999"

if (typeof baseUrl !== "undefined" && baseUrl !== '""') {
    chap_host = baseUrl.replace(/(^")|("$)/g, '')
}

let openai_api_key = "sk-key"
let openai_base_url = "https://api.openai.com/v1"
let enable_translation = false

let openai_params = {
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    max_tokens: 8192
}

let system_prompt = `You are a helpful assistant that translates Chinese to Vietnamese. Provide clear and accurate translations while maintaining the original meaning and context.`

let name_mapping = {}

if (typeof openaiApiKey !== "undefined" && openaiApiKey !== '""') {
    openai_api_key = openaiApiKey.replace(/(^")|("$)/g, '')
}

if (typeof openaiBaseUrl !== "undefined" && openaiBaseUrl !== '""') {
    openai_base_url = openaiBaseUrl.replace(/(^")|("$)/g, '')
}

if (typeof openaiParams !== "undefined" && openaiParams !== '""') {
    try {
        let custom_params = JSON.parse(openaiParams.replace(/(^")|("$)/g, ''))
        openai_params = { ...openai_params, ...custom_params }
    } catch (e) {
    }
}

if (typeof enableTranslation !== "undefined" && enableTranslation !== '""') {
    enable_translation = enableTranslation.replace(/(^")|("$)/g, '') === "true"
}

if (typeof systemPrompt !== "undefined" && systemPrompt !== '""' && systemPrompt.trim() !== "") {
    system_prompt = systemPrompt.replace(/(^")|("$)/g, '')
}

if (typeof nameMapping !== "undefined" && nameMapping !== '""') {
    try {
        name_mapping = JSON.parse(nameMapping.replace(/(^")|("$)/g, ''))
    } catch (e) {
    }
}

function buildNameMappingInstruction() {
    let entries = Object.entries(name_mapping)
    if (entries.length === 0) {
        return ""
    }
    let mapping_lines = entries.map(([chinese, vietnamese]) => `  "${chinese}" phải dịch thành "${vietnamese}"`).join("\n")
    return `\n\nQUAN TRỌNG - QUY TẮC DỊCH TÊN NHÂN VẬT:\nKhi gặp các tên nhân vật sau trong văn bản, bắt buộc phải dịch theo đúng quy tắc:\n${mapping_lines}\n\nLưu ý: Phải tuân thủ chính xác các tên đã quy định ở trên, không được dịch khác đi.`
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
