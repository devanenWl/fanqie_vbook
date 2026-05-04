load('config.js');

function execute(url) {
    const regex = /(?:book_id=|\/)(\d+)$/;
    let matchUrl = url.match(regex);
    if (!matchUrl) return null;
    let book_id = matchUrl[1];

    // API cũ đã chết, đổi sang lấy HTML trang chi tiết
    let response = fetch("https://fanqienovel.com/page/" + book_id + "?force_mobile=1");
    if (response.ok) {
        let html = response.text();

        // Lấy dữ liệu từ __INITIAL_STATE__
        const stateRegex = /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/;
        let match = html.match(stateRegex);
        if (!match) return null;

        let state;
        try {
            state = JSON.parse(match[1].replace(/:\s*undefined/g, ':null'));
        } catch (e) {
            return null;
        }

        // Dữ liệu mới nằm trong state.page
        let book_info = state.page;
        if (!book_info) return null;

        let genres = [];
        try {
            let a_gen = JSON.parse(book_info.categoryV2 || "[]");
            a_gen.forEach(e => {
                genres.push({
                    title: e.Name,
                    input: "https://fanqienovel.com/api/author/library/book_list/v0/?category_id=" + e.ObjectId + "&book_type=-1&page_count=18&page_index={{page}}",
                    script: "gen2.js"
                });
            });
        } catch (e) {}

        let last_publish_time = book_info.lastPublishTime || 0;
        let last_publish_time_string = formatChineseDate(last_publish_time);
        let serial_count = book_info.chapterTotal || 0;
        let last_chapter_title = book_info.lastChapterTitle || "";
        let read_count = book_info.readCount || 0;
        let word_number = book_info.wordNumber || 0;

        // score không có trong state.page, lấy bằng API phụ như code mới
        let score = "0";
        try {
            let scoreRes = fetch("https://api5-normal-sinfonlinec.fqnovel.com/reading/user/share/info/v/?group_id=" + book_id + "&aid=1967&version_code=513");
            if (scoreRes.ok) {
                let scoreJson = scoreRes.json();
                if (scoreJson && scoreJson.data && scoreJson.data.book_info) {
                    score = scoreJson.data.book_info.score || "0";
                }
            }
        } catch (e) {}

        let ongoing = (book_info.creationStatus == '1') ? true : false;
        let authorID = book_info.authorId;

        return Response.success({
            name: book_info.bookName,
            cover: replaceCover((book_info.thumbUrl || "").replace(/\\u002F/g, "/")),
            author: book_info.author,
            description: (book_info.abstract || "").replace(/\n/g, "<br>"),
            genres: genres,
            detail: `评分: ${score}分<br>
                        章节数: ${serial_count}<br>
                        字数: ${word_number}<br>
                        查看次数: ${read_count}<br>
                        更新: ${last_publish_time_string}<br>
                        最后更新: ${last_chapter_title}`,
            suggests: [
                {
                    title: "Cùng tác giả",
                    input: `https://api5-normal-sinfonlinec.fqnovel.com/reading/user/basic_info/get/v?user_id=${authorID}&aid=1967&version_code=65532`,
                    script: "suggest.js"
                }
            ],
            comment: {
                input: `https://api5-normal-sinfonlinec.fqnovel.com/reading/ugc/novel_comment/book/v/?&book_id=${book_id}&aid=1967&offset={{page}}`,
                script: "comment.js"
            },
            ongoing: ongoing
        });
    }

    return null;
}

function formatChineseDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}