load('config.js');

function translateWithOpenAI(content) {
    if (!openai_api_key) {
        return Response.error("OpenAI API key not configured");
    }
    
    // Build user message with name mapping instruction
    let name_mapping_instruction = buildNameMappingInstruction();
    let user_message = "Đây là văn bản cần dịch:" + name_mapping_instruction + "\n\n" + content;
    
    let response = fetch(openai_base_url + "/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + openai_api_key
        },
        body: JSON.stringify({
            ...openai_params,
            messages: [
                { role: "system", content: system_prompt },
                { role: "user", content: user_message }
            ]
        })
    });
    
    if (response.ok) {
        let responseText = response.text();
        try {
            let json = JSON.parse(responseText);
            if (json.choices && json.choices[0] && json.choices[0].message) {
                let translated_content = json.choices[0].message.content.replace(/<br\s*\/?>|\n/g, "<br><br>");
                return Response.success(translated_content);
            }
            return Response.error("Invalid response format from OpenAI API");
        } catch (e) {
            return Response.error("Failed to parse OpenAI response: " + e.message);
        }
    }
    return Response.error("OpenAI API request failed: " + response.status + " - " + response.text());
}

function execute(url) {
    const regex = /(?:item_id=|\/)(\d+)$/;
    let chap_id = url.match(regex)[1];
    let chapter_url = chap_host + "/content?item_id=" + chap_id;
    let response = fetch(chapter_url)
    if (response.ok) {
        let responseText = response.text();
        try {
            let json = JSON.parse(responseText);
            let content;
            try {
                // Try first format: json.data.data.content
                content = json.data.data.content.replace(/<br\s*\/?>|\n/g, "<br><br>");
            } catch (e) {
                // Try second format: json.data[0].content
                content = json.data[0].content.replace(/<header[\s\S]*?<\/header>/gi, "").replace(/<h1[\s\S]*?<\/h1>/gi, "").replace(/<br\s*\/?>|\n/g, "<br><br>");
            }
            
            if (enable_translation) {
                return translateWithOpenAI(content);
            }
            
            return Response.success(content);
        } catch (e) {
            return Response.error("Failed to parse chapter response: " + e.message);
        }
    }
    return Response.error("Vui lòng thiết lập FanqieAPI. Host: " + chap_host);
}
