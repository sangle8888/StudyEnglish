/* =========================================================
 * MAIN JS MODULE: grammar catalog and practice interactions
 * ========================================================= */
(() => {
  // Main grammar interactions. The host page supplies #dashboardLayout and the shared feedback fallback.
  const grammarGroups = [
    {
      id: "tenses",
      title: "Thì thời gian (Verb Tenses)",
      description:
        "Nắm vững cấu trúc, cách dùng và dấu hiệu nhận biết của các thì trong tiếng Anh.",
      icon: "fa-book-open",
      topics: [
        [
          "Các thì hiện tại",
          "TOEIC · VSTEP",
          "The train usually ___ at 8 a.m.",
          ["leave", "leaves", "is leave", "leaving"],
          1,
          "Chủ ngữ số ít “The train” dùng động từ thêm -s ở thì hiện tại đơn.",
        ],
        [
          "Các thì quá khứ",
          "TOEIC · VSTEP",
          "We ___ the report yesterday.",
          ["finish", "have finished", "finished", "are finishing"],
          2,
          "“Yesterday” là dấu hiệu của thì quá khứ đơn.",
        ],
        [
          "Các thì tương lai",
          "TOEIC · VSTEP",
          "The manager ___ the results tomorrow.",
          ["announces", "announced", "will announce", "has announced"],
          2,
          "“Tomorrow” diễn tả thời điểm tương lai; dùng will + động từ nguyên mẫu.",
        ],
        [
          "Các thì hoàn thành",
          "TOEIC · VSTEP",
          "She ___ here since 2021.",
          ["works", "worked", "has worked", "will work"],
          2,
          "“Since 2021” thường đi với hiện tại hoàn thành.",
        ],
        [
          "Thì tiếp diễn",
          "TOEIC · VSTEP",
          "They ___ a meeting right now.",
          ["have", "had", "are having", "will have"],
          2,
          "“Right now” diễn tả hành động đang xảy ra: am/is/are + V-ing.",
        ],
        [
          "Sự hòa hợp các thì",
          "VSTEP",
          "He said that he ___ busy.",
          ["is", "was", "will be", "has been"],
          1,
          "Trong câu tường thuật ở quá khứ, lùi thì hiện tại đơn thành quá khứ đơn.",
        ],
      ],
    },
    {
      id: "structures",
      title: "Cấu trúc câu (Sentence Structures)",
      description:
        "Luyện cách kết hợp mệnh đề và xây dựng câu rõ ràng, chính xác.",
      icon: "fa-diagram-project",
      topics: [
        [
          "Câu bị động",
          "TOEIC · VSTEP",
          "The documents ___ every Friday.",
          ["review", "are reviewed", "reviewed", "are reviewing"],
          1,
          "Câu bị động hiện tại đơn: am/is/are + quá khứ phân từ.",
        ],
        [
          "Câu điều kiện",
          "TOEIC · VSTEP",
          "If it rains, the event ___ indoors.",
          ["moves", "moved", "would move", "moving"],
          0,
          "Câu điều kiện loại 1: If + hiện tại đơn, mệnh đề chính dùng hiện tại đơn hoặc will.",
        ],
        [
          "Câu tường thuật",
          "TOEIC · VSTEP",
          "Mia said she ___ the email.",
          ["sends", "will send", "had sent", "is sending"],
          2,
          "Câu tường thuật ở quá khứ thường lùi hiện tại hoàn thành thành quá khứ hoàn thành.",
        ],
        [
          "Mệnh đề quan hệ",
          "TOEIC · VSTEP",
          "The applicant ___ we interviewed was qualified.",
          ["who", "whose", "whom", "which"],
          2,
          "“Whom” làm tân ngữ chỉ người trong mệnh đề quan hệ trang trọng.",
        ],
        [
          "Câu hỏi đuôi",
          "VSTEP",
          "You have met our director, ___?",
          ["have you", "haven’t you", "do you", "didn’t you"],
          1,
          "Mệnh đề khẳng định hiện tại hoàn thành đi với câu hỏi đuôi phủ định “haven’t you?”.",
        ],
        [
          "Đảo ngữ cơ bản",
          "VSTEP",
          "Never ___ such a helpful team.",
          ["I have met", "have I met", "I met", "did I met"],
          1,
          "Khi “Never” đứng đầu câu, dùng đảo ngữ: trợ động từ + chủ ngữ + động từ.",
        ],
      ],
    },
    {
      id: "parts",
      title: "Từ loại (Parts of Speech)",
      description:
        "Nhận biết vị trí danh từ, động từ, tính từ và trạng từ trong câu.",
      icon: "fa-spell-check",
      topics: [
        [
          "Danh từ và mạo từ",
          "TOEIC · VSTEP",
          "Please send ___ updated schedule.",
          ["a", "an", "the", "some"],
          2,
          "Dùng “the” khi nói đến lịch trình cụ thể đã được xác định.",
        ],
        [
          "Động từ và dạng động từ",
          "TOEIC · VSTEP",
          "The team decided ___ the proposal.",
          ["revise", "revising", "to revise", "revised"],
          2,
          "“Decide” thường đi với to-infinitive: decide to do something.",
        ],
        [
          "Tính từ và trạng từ",
          "TOEIC · VSTEP",
          "The new system works ___.",
          ["efficient", "efficiency", "efficiently", "more efficient"],
          2,
          "Trạng từ “efficiently” bổ nghĩa cho động từ “works”.",
        ],
        [
          "Đại từ",
          "TOEIC · VSTEP",
          "Each employee should bring ___ ID card.",
          ["they", "their", "them", "theirs"],
          1,
          "Tính từ sở hữu “their” đứng trước danh từ “ID card”.",
        ],
        [
          "Lượng từ",
          "TOEIC · VSTEP",
          "There are ___ seats available.",
          ["much", "a little", "several", "any of"],
          2,
          "“Several” dùng với danh từ đếm được số nhiều “seats”.",
        ],
        [
          "So sánh hơn và nhất",
          "TOEIC · VSTEP",
          "This route is ___ than the old one.",
          ["short", "shorter", "shortest", "more short"],
          1,
          "So sánh hơn của tính từ ngắn “short” là “shorter”.",
        ],
      ],
    },
    {
      id: "clauses",
      title: "Mệnh đề (Clauses)",
      description:
        "Phân biệt các loại mệnh đề và chọn liên từ phù hợp với ngữ cảnh.",
      icon: "fa-puzzle-piece",
      topics: [
        [
          "Mệnh đề danh từ",
          "VSTEP",
          "We don’t know ___ the package will arrive.",
          ["what", "whether", "whose", "which one"],
          1,
          "“Whether” mở đầu mệnh đề danh từ mang nghĩa “liệu rằng”.",
        ],
        [
          "Mệnh đề trạng ngữ",
          "TOEIC · VSTEP",
          "___ the meeting ended, staff returned to work.",
          ["Although", "After", "Unless", "Despite"],
          1,
          "“After” nối hai hành động theo trình tự thời gian.",
        ],
        [
          "Liên từ kết hợp",
          "TOEIC · VSTEP",
          "The offer is attractive, ___ it expires today.",
          ["or", "but", "so", "for"],
          1,
          "“But” diễn tả sự tương phản giữa hai vế câu.",
        ],
        [
          "Rút gọn mệnh đề",
          "VSTEP",
          "Employees ___ in the survey received a gift.",
          ["participate", "participating", "participated", "to participate"],
          1,
          "“Participating” rút gọn mệnh đề quan hệ chủ động “who participated”.",
        ],
        [
          "Cụm phân từ",
          "VSTEP",
          "___ by the announcement, staff asked questions.",
          ["Surprising", "Surprised", "Surprise", "To surprise"],
          1,
          "Nhân viên nhận tác động nên dùng quá khứ phân từ “Surprised”.",
        ],
        [
          "Câu ghép và câu phức",
          "VSTEP",
          "The store was closed, ___ we returned later.",
          ["so", "although", "unless", "because"],
          0,
          "“So” nối nguyên nhân với kết quả trong câu ghép.",
        ],
      ],
    },
    {
      id: "prepositions",
      title: "Giới từ & cụm từ (Prepositions)",
      description:
        "Ghi nhớ giới từ đi kèm thời gian, địa điểm và các cụm từ thông dụng.",
      icon: "fa-link",
      topics: [
        [
          "Giới từ chỉ thời gian",
          "TOEIC · VSTEP",
          "The office closes ___ 6 p.m.",
          ["in", "on", "at", "by"],
          2,
          "Dùng “at” trước thời điểm cụ thể trong ngày.",
        ],
        [
          "Giới từ chỉ địa điểm",
          "TOEIC · VSTEP",
          "The files are ___ the cabinet.",
          ["at", "in", "on", "to"],
          1,
          "Dùng “in” khi vật nằm bên trong một không gian chứa.",
        ],
        [
          "Tính từ đi với giới từ",
          "TOEIC · VSTEP",
          "The client is satisfied ___ the service.",
          ["at", "for", "with", "by"],
          2,
          "Cụm đúng là “satisfied with something”.",
        ],
        [
          "Động từ đi với giới từ",
          "TOEIC · VSTEP",
          "Our team is looking ___ the issue.",
          ["at", "into", "for", "after"],
          1,
          "“Look into” có nghĩa là xem xét hoặc điều tra vấn đề.",
        ],
        [
          "Cụm động từ",
          "TOEIC · VSTEP",
          "Please ___ the form before submitting it.",
          ["fill out", "take off", "put away", "bring up"],
          0,
          "“Fill out a form” nghĩa là điền vào biểu mẫu.",
        ],
        [
          "Liên từ và từ nối",
          "VSTEP",
          "The flight was delayed ___ bad weather.",
          ["because", "because of", "although", "despite of"],
          1,
          "“Because of” đứng trước cụm danh từ “bad weather”.",
        ],
      ],
    },
  ];

  const totalTopics = grammarGroups.reduce(
    (sum, group) => sum + group.topics.length,
    0,
  );
  const grammarTranslations = {
    "tenses-0": {
      question: "Chuyến tàu thường ___ lúc 8 giờ sáng.",
      options: ["rời đi", "rời đi", "đang rời đi", "việc rời đi"],
    },
    "tenses-1": {
      question: "Chúng tôi ___ báo cáo ngày hôm qua.",
      options: [
        "hoàn thành",
        "đã hoàn thành",
        "đã hoàn thành",
        "đang hoàn thành",
      ],
    },
    "tenses-2": {
      question: "Người quản lý ___ kết quả vào ngày mai.",
      options: ["công bố", "đã công bố", "sẽ công bố", "đã công bố"],
    },
    "tenses-3": {
      question: "Cô ấy ___ ở đây kể từ năm 2021.",
      options: ["làm việc", "đã làm việc", "đã làm việc", "sẽ làm việc"],
    },
    "tenses-4": {
      question: "Họ ___ một cuộc họp ngay lúc này.",
      options: ["có", "đã có", "đang có", "sẽ có"],
    },
    "tenses-5": {
      question: "Anh ấy nói rằng anh ấy ___ bận.",
      options: ["đang", "đã", "sẽ", "đã từng"],
    },
    "structures-0": {
      question: "Các tài liệu ___ vào mỗi thứ Sáu.",
      options: ["xem xét", "được xem xét", "đã xem xét", "đang xem xét"],
    },
    "structures-1": {
      question: "Nếu trời mưa, sự kiện ___ trong nhà.",
      options: [
        "diễn ra",
        "đã diễn ra",
        "sẽ diễn ra (giả định)",
        "đang diễn ra",
      ],
    },
    "structures-2": {
      question: "Mia nói rằng cô ấy ___ email.",
      options: ["gửi", "sẽ gửi", "đã gửi trước đó", "đang gửi"],
    },
    "structures-3": {
      question: "Ứng viên ___ mà chúng tôi phỏng vấn đã đủ tiêu chuẩn.",
      options: ["người mà", "có (sở hữu)", "người mà (tân ngữ)", "vật mà"],
    },
    "structures-4": {
      question: "Bạn đã gặp giám đốc của chúng tôi rồi, ___?",
      options: ["đã bạn?", "chưa phải không?", "bạn có?", "đã không?"],
    },
    "structures-5": {
      question: "Chưa bao giờ ___ một đội ngũ hữu ích đến vậy.",
      options: [
        "tôi đã gặp",
        "đã gặp tôi",
        "tôi gặp",
        "đã gặp tôi (sai cấu trúc)",
      ],
    },
    "parts-0": {
      question: "Vui lòng gửi ___ lịch trình đã cập nhật.",
      options: ["một", "một (trước nguyên âm)", "cái/đó", "một vài"],
    },
    "parts-1": {
      question: "Nhóm đã quyết định ___ đề xuất.",
      options: [
        "điều chỉnh",
        "việc điều chỉnh",
        "điều chỉnh (to + động từ)",
        "đã điều chỉnh",
      ],
    },
    "parts-2": {
      question: "Hệ thống mới hoạt động ___.",
      options: [
        "hiệu quả (tính từ)",
        "hiệu suất",
        "một cách hiệu quả",
        "hiệu quả hơn",
      ],
    },
    "parts-3": {
      question: "Mỗi nhân viên nên mang theo thẻ ID ___.",
      options: [
        "họ (chủ ngữ)",
        "của họ",
        "họ (tân ngữ)",
        "của họ (đại từ sở hữu)",
      ],
    },
    "parts-4": {
      question: "Có ___ chỗ ngồi còn trống.",
      options: [
        "nhiều (danh từ không đếm được)",
        "một ít",
        "một vài",
        "bất kỳ trong số",
      ],
    },
    "parts-5": {
      question: "Tuyến đường này ___ tuyến đường cũ.",
      options: [
        "ngắn",
        "ngắn hơn",
        "ngắn nhất",
        "ngắn hơn (không đúng cấu trúc)",
      ],
    },
    "clauses-0": {
      question: "Chúng tôi không biết ___ kiện hàng sẽ đến.",
      options: ["điều gì", "liệu rằng", "của ai", "cái nào"],
    },
    "clauses-1": {
      question: "___ cuộc họp kết thúc, nhân viên quay lại làm việc.",
      options: ["Mặc dù", "Sau khi", "Trừ khi", "Mặc cho"],
    },
    "clauses-2": {
      question: "Đề nghị này rất hấp dẫn, ___ nó sẽ hết hạn hôm nay.",
      options: ["hoặc", "nhưng", "vì vậy", "bởi vì"],
    },
    "clauses-3": {
      question: "Những nhân viên ___ trong khảo sát đã nhận được một món quà.",
      options: ["tham gia", "đang/đã tham gia", "đã tham gia", "để tham gia"],
    },
    "clauses-4": {
      question: "___ trước thông báo, nhân viên đã đặt câu hỏi.",
      options: [
        "Gây ngạc nhiên",
        "Ngạc nhiên (bị tác động)",
        "Sự ngạc nhiên",
        "Để gây ngạc nhiên",
      ],
    },
    "clauses-5": {
      question: "Cửa hàng đã đóng cửa, ___ chúng tôi quay lại sau.",
      options: ["vì vậy", "mặc dù", "trừ khi", "bởi vì"],
    },
    "prepositions-0": {
      question: "Văn phòng đóng cửa ___ 6 giờ tối.",
      options: [
        "vào (tháng/năm)",
        "vào (thứ/ngày)",
        "lúc (thời điểm cụ thể)",
        "trước/trong hạn",
      ],
    },
    "prepositions-1": {
      question: "Các tập hồ sơ ở ___ chiếc tủ.",
      options: ["tại", "trong", "trên", "đến"],
    },
    "prepositions-2": {
      question: "Khách hàng hài lòng ___ dịch vụ.",
      options: ["tại", "cho", "với", "bởi"],
    },
    "prepositions-3": {
      question: "Nhóm chúng tôi đang xem xét ___ vấn đề.",
      options: ["nhìn vào", "điều tra/xem xét", "tìm kiếm", "chăm sóc"],
    },
    "prepositions-4": {
      question: "Vui lòng ___ biểu mẫu trước khi nộp.",
      options: ["điền vào", "cất cánh", "cất đi", "đề cập đến"],
    },
    "prepositions-5": {
      question: "Chuyến bay bị hoãn ___ thời tiết xấu.",
      options: [
        "bởi vì",
        "bởi vì (đứng trước cụm danh từ)",
        "mặc dù",
        "mặc cho (dạng sai)",
      ],
    },
  };
  // Each entry follows the option order; the correct option has no elimination reason.
  const grammarReasoning = {
    "tenses-0": {
      context:
        'Chỗ trống là động từ chính của chủ ngữ "The train". "Usually" diễn tả một hành động thường xuyên.',
      distractors: [
        '"The train" là chủ ngữ số ít, nên không dùng động từ nguyên mẫu "leave" trong câu khẳng định hiện tại đơn.',
        "",
        '"Is leave" sai cấu trúc: hiện tại tiếp diễn phải dùng is + V-ing.',
        '"Leaving" đứng một mình không thể làm động từ chính; dạng tiếp diễn cần có trợ động từ.',
      ],
      rule: "Hiện tại đơn diễn tả thói quen và lịch trình. He, she, it hoặc danh từ số ít đi với V(s/es); I, you, we, they đi với V nguyên mẫu.",
    },
    "tenses-1": {
      context:
        'Chỗ trống là động từ chính sau "We". "Yesterday" xác định một thời điểm đã kết thúc trong quá khứ.',
      distractors: [
        '"Finish" là hiện tại đơn, không phù hợp với "yesterday".',
        'Hiện tại hoàn thành "have finished" không dùng với thời điểm quá khứ đã kết thúc như "yesterday".',
        "",
        '"Are finishing" diễn tả hành động đang xảy ra, không phù hợp với "yesterday".',
      ],
      rule: "Quá khứ đơn: S + V2/ed. Các dấu hiệu thường gặp: yesterday, last week, ago. Finish là động từ có quy tắc: finished.",
    },
    "tenses-2": {
      context:
        'Chỗ trống là động từ chính sau "The manager". "Tomorrow" hướng hành động công bố đến tương lai.',
      distractors: [
        '"Announces" có thể dùng cho lịch trình cố định, nhưng câu này không đưa ra ngữ cảnh lịch trình; "will announce" phù hợp nhất.',
        '"Announced" diễn tả quá khứ, không phù hợp với "tomorrow".',
        "",
        '"Has announced" diễn tả hành động đã xảy ra, không phù hợp với việc sẽ công bố ngày mai.',
      ],
      rule: "Tương lai đơn: S + will + V nguyên mẫu. Động từ sau will không thêm -s hoặc -ed.",
    },
    "tenses-3": {
      context:
        '"Since 2021" chỉ mốc bắt đầu của việc làm việc kéo dài đến hiện tại; chủ ngữ "She" là số ít.',
      distractors: [
        '"Works" không thể hiện khoảng thời gian kéo dài từ năm 2021 đến hiện tại.',
        '"Worked" mô tả một việc trong quá khứ, không thể hiện sự tiếp diễn đến hiện tại trong câu này.',
        "",
        '"Will work" chỉ tương lai, không phù hợp với mốc bắt đầu "since 2021".',
      ],
      rule: "Hiện tại hoàn thành: S + have/has + V3/ed. Since + mốc thời gian; for + khoảng thời gian. She/he/it dùng has.",
    },
    "tenses-4": {
      context:
        '"Right now" cho biết cuộc họp đang diễn ra ngay lúc nói. Chủ ngữ "They" cần trợ động từ "are".',
      distractors: [
        '"Have" là hiện tại đơn, không diễn tả cuộc họp đang diễn ra ngay bây giờ.',
        '"Had" là quá khứ đơn, không phù hợp với "right now".',
        "",
        '"Will have" diễn tả tương lai, không phải hành động đang diễn ra.',
      ],
      rule: "Hiện tại tiếp diễn: S + am/is/are + V-ing. Now, right now và at the moment thường là dấu hiệu nhận biết.",
    },
    "tenses-5": {
      context:
        'Động từ tường thuật "said" ở quá khứ. Chỗ trống đứng trước tính từ "busy", cần một dạng của động từ be.',
      distractors: [
        'Theo quy tắc lùi thì thông thường của bài này, "is" đổi thành "was" sau "said".',
        "",
        '"Will be" chưa được lùi thì; nếu tường thuật ý tương lai thì thường đổi thành "would be".',
        '"Has been" chưa được lùi thì và câu không có ngữ cảnh cho một khoảng thời gian kéo dài đến hiện tại.',
      ],
      rule: "Khi động từ tường thuật ở quá khứ, hiện tại đơn thường lùi thành quá khứ đơn. Có thể giữ thì nếu thông tin vẫn đúng, nhưng bài này kiểm tra cách lùi thì cơ bản.",
    },
    "structures-0": {
      context:
        '"The documents" nhận hành động xem xét. "Every Friday" cho biết đây là một việc định kỳ.',
      distractors: [
        '"Review" ở thể chủ động, khiến câu mang nghĩa các tài liệu tự xem xét một thứ gì đó.',
        "",
        '"Reviewed" thiếu trợ động từ be để tạo câu bị động.',
        '"Are reviewing" là chủ động tiếp diễn, không phù hợp với tài liệu là đối tượng được xem xét.',
      ],
      rule: 'Bị động hiện tại đơn: S + am/is/are + V3/ed. Chủ ngữ số nhiều "documents" dùng are reviewed.',
    },
    "structures-1": {
      context:
        'Mệnh đề "If it rains" nêu điều kiện có thể xảy ra. Mệnh đề chính mô tả cách tổ chức sự kiện khi có mưa.',
      distractors: [
        "",
        '"Moved" ở quá khứ, không hòa hợp với điều kiện hiện tại "If it rains".',
        '"Would move" thường đi với điều kiện loại 2: If it rained.',
        '"Moving" thiếu trợ động từ, không tạo thành động từ chính của "the event".',
      ],
      rule: "Điều kiện loại 1 thường dùng If + hiện tại đơn, will + V. Mệnh đề chính cũng có thể dùng hiện tại đơn để nêu cách xử lý đã được quy định.",
    },
    "structures-2": {
      context:
        '"Said" là động từ tường thuật ở quá khứ. Trong ngữ cảnh bài này, việc gửi email xảy ra trước lúc Mia nói.',
      distractors: [
        '"Sends" là hiện tại đơn, không thể hiện việc gửi trước thời điểm nói trong quá khứ.',
        '"Will send" là tương lai chưa lùi thì; trong câu tường thuật quá khứ thường dùng "would send".',
        "",
        '"Is sending" là hiện tại tiếp diễn chưa lùi thì, không diễn tả hành động đã hoàn tất trước lúc nói.',
      ],
      rule: "Quá khứ hoàn thành: S + had + V3/ed, diễn tả hành động xảy ra trước một mốc quá khứ. Trong câu tường thuật, quá khứ đơn hoặc hiện tại hoàn thành có thể lùi thành quá khứ hoàn thành.",
    },
    "structures-3": {
      context:
        '"The applicant" chỉ người. Trong mệnh đề "we interviewed ___", từ còn thiếu làm tân ngữ của "interviewed".',
      distractors: [
        '"Who" cũng được dùng làm tân ngữ trong tiếng Anh thông dụng; bài này chọn "whom" theo văn phong trang trọng.',
        '"Whose" chỉ sở hữu và cần đi với danh từ, không làm tân ngữ trong cấu trúc này.',
        "",
        '"Which" thay cho vật hoặc sự việc, không phù hợp với "the applicant".',
      ],
      rule: "Who chỉ người, thường làm chủ ngữ; whom làm tân ngữ trong văn phong trang trọng; whose chỉ sở hữu. Với tân ngữ chỉ người, who hoặc lược bỏ đại từ cũng có thể đúng trong văn phong thông dụng.",
    },
    "structures-4": {
      context:
        'Mệnh đề chính "You have met our director" là câu khẳng định ở hiện tại hoàn thành.',
      distractors: [
        '"Have you?" cùng dạng khẳng định; câu hỏi đuôi xác nhận thông thường cần dạng phủ định.',
        "",
        '"Do you?" dùng trợ động từ hiện tại đơn, không khớp với "have met".',
        '"Didn’t you?" dùng quá khứ đơn, không khớp với hiện tại hoàn thành.',
      ],
      rule: "Câu hỏi đuôi xác nhận: mệnh đề khẳng định + đuôi phủ định, và ngược lại. Giữ đúng trợ động từ và đại từ chủ ngữ: have met → haven’t you?",
    },
    "structures-5": {
      context:
        'Trạng từ phủ định "Never" đứng đầu câu, nên câu cần đảo trợ động từ lên trước chủ ngữ.',
      distractors: [
        '"I have met" giữ trật tự câu thông thường, chưa đảo ngữ sau "Never".',
        "",
        '"I met" chưa đảo ngữ sau trạng từ phủ định đứng đầu câu.',
        'Sau trợ động từ "did", động từ phải ở dạng nguyên mẫu "meet", không phải "met".',
      ],
      rule: "Never + trợ động từ + S + động từ. Với hiện tại hoàn thành: Never + have/has + S + V3/ed.",
    },
    "parts-0": {
      context:
        'Chỗ trống đứng trước cụm danh từ số ít "updated schedule". Bài này giả định lịch trình đã được xác định.',
      distractors: [
        '"A" không đứng trước âm nguyên âm đầu của "updated".',
        '"An" đúng về âm và có thể dùng cho lịch trình chưa xác định; bài này chọn "the" theo ngữ cảnh lịch trình cụ thể.',
        "",
        '"Some" không dùng trực tiếp với danh từ đếm được số ít "schedule" theo nghĩa thông thường của câu này.',
      ],
      rule: 'The dùng cho đối tượng cụ thể đã được xác định. A/an dùng cho đối tượng chưa xác định; chọn an trước âm nguyên âm. Nếu thiếu ngữ cảnh, "an updated schedule" cũng là một cụm đúng.',
    },
    "parts-1": {
      context:
        'Chỗ trống nằm sau "decided", cần dạng động từ được phép đi sau decide.',
      distractors: [
        '"Decide" không đi trực tiếp với động từ nguyên mẫu "revise".',
        "Cấu trúc thông thường là decide to do, không phải decide doing.",
        "",
        '"Revised" là dạng quá khứ/phân từ, không phù hợp sau "decided" trong câu này.',
      ],
      rule: "Decide + to-infinitive: decide to do something. Một số động từ tương tự: plan, hope, want và agree.",
    },
    "parts-2": {
      context:
        'Chỗ trống bổ nghĩa cho động từ "works", diễn tả cách hệ thống hoạt động; cần một trạng từ.',
      distractors: [
        '"Efficient" là tính từ, không phù hợp để bổ nghĩa trực tiếp cho "works" trong câu này.',
        '"Efficiency" là danh từ, không diễn tả cách hoạt động ở vị trí này.',
        "",
        '"More efficient" là cụm tính từ so sánh, không phải trạng từ bổ nghĩa cho "works".',
      ],
      rule: "Tính từ bổ nghĩa cho danh từ; trạng từ bổ nghĩa cho động từ. Efficient → efficiently; works efficiently = hoạt động hiệu quả.",
    },
    "parts-3": {
      context:
        'Chỗ trống đứng ngay trước danh từ "ID card", cần từ thể hiện quyền sở hữu.',
      distractors: [
        '"They" là đại từ chủ ngữ, không đứng trước danh từ để chỉ sở hữu.',
        "",
        '"Them" là đại từ tân ngữ, không thể bổ nghĩa sở hữu cho "ID card".',
        '"Theirs" là đại từ sở hữu đứng độc lập, không đi kèm danh từ phía sau.',
      ],
      rule: 'Tính từ sở hữu + danh từ: my card, your card, their card. Their có thể dùng với "each employee" khi không xác định giới tính (singular they).',
    },
    "parts-4": {
      context:
        '"Seats" là danh từ đếm được số nhiều; cần một lượng từ phù hợp.',
      distractors: [
        '"Much" đi với danh từ không đếm được, không dùng với "seats".',
        '"A little" đi với danh từ không đếm được, không dùng với "seats".',
        "",
        '"Any of" cần một cụm xác định như "any of the seats", không phải "any of seats".',
      ],
      rule: "Several, many và a few đi với danh từ đếm được số nhiều. Much, a little và little đi với danh từ không đếm được.",
    },
    "parts-5": {
      context:
        '"Than the old one" cho biết câu đang so sánh hai tuyến đường; cần dạng so sánh hơn của "short".',
      distractors: [
        '"Short" là dạng tính từ gốc, chưa thể hiện so sánh hơn trước "than".',
        "",
        '"Shortest" là so sánh nhất, không dùng cho cấu trúc so sánh hai đối tượng với "than".',
        'Tính từ ngắn "short" thường thêm -er, không dùng "more short" trong cấu trúc này.',
      ],
      rule: "Tính từ ngắn: adjective + -er + than. Tính từ dài thường dùng more + adjective + than.",
    },
    "clauses-0": {
      context:
        'Sau "don’t know" là một mệnh đề với đầy đủ chủ ngữ và động từ: "the package will arrive".',
      distractors: [
        '"What" thường thay cho một thành phần còn thiếu; mệnh đề "the package will arrive" đã đầy đủ.',
        "",
        '"Whose" chỉ sở hữu, không diễn tả ý "liệu kiện hàng có đến hay không".',
        '"Which one" chỉ sự lựa chọn một đối tượng, không nối được với mệnh đề đầy đủ ở đây.',
      ],
      rule: 'Whether/if có thể mở đầu mệnh đề danh từ mang nghĩa "liệu... hay không". Trật tự trong mệnh đề là chủ ngữ + động từ, không đảo như câu hỏi.',
    },
    "clauses-1": {
      context:
        "Hai hành động được kể theo trình tự: cuộc họp kết thúc, sau đó nhân viên quay lại làm việc.",
      distractors: [
        '"Although" diễn tả nhượng bộ, không thể hiện trình tự thời gian mà câu đang hướng đến.',
        "",
        '"Unless" diễn tả điều kiện "trừ khi", không phù hợp với hai hành động đã xảy ra.',
        '"Despite" đi với danh từ hoặc V-ing, không đi trực tiếp với mệnh đề "the meeting ended".',
      ],
      rule: "After + S + V diễn tả một hành động xảy ra sau một hành động khác. Despite + danh từ/V-ing; although + mệnh đề.",
    },
    "clauses-2": {
      context:
        "Đề nghị hấp dẫn là một điểm thuận lợi, còn việc hết hạn hôm nay là một hạn chế; hai vế tương phản.",
      distractors: [
        '"Or" đưa ra lựa chọn, không nêu quan hệ tương phản giữa hai vế.',
        "",
        '"So" nêu kết quả; việc hấp dẫn không phải nguyên nhân khiến đề nghị hết hạn hôm nay.',
        '"For" nêu lý do; việc hết hạn không giải thích tại sao đề nghị hấp dẫn.',
      ],
      rule: "But nối hai ý tương phản. And bổ sung, or nêu lựa chọn, so nêu kết quả và for nêu lý do.",
    },
    "clauses-3": {
      context:
        'Cụm sau "Employees" bổ nghĩa cho nhân viên; động từ chính của câu đã là "received".',
      distractors: [
        '"Participate" tạo thêm một động từ đã chia nhưng không có liên từ hoặc đại từ quan hệ.',
        "",
        '"Participated" không dùng trực tiếp như một cụm phân từ chủ động ở đây; cần "who participated".',
        '"To participate" gợi mục đích hoặc hành động cần thực hiện, không diễn tả những người đã tham gia khảo sát.',
      ],
      rule: "Mệnh đề quan hệ chủ động có thể rút gọn thành V-ing: employees who participated → employees participating. Dạng V-ing rút gọn không tự xác định thì của cả câu.",
    },
    "clauses-4": {
      context:
        '"Staff" là những người cảm thấy ngạc nhiên do thông báo tác động đến; cần phân từ mang nghĩa bị tác động.',
      distractors: [
        '"Surprising" diễn tả việc gây ngạc nhiên, không phải cảm giác của nhân viên trước thông báo.',
        "",
        '"Surprise" là danh từ hoặc động từ nguyên mẫu, không phù hợp cho cụm phân từ đầu câu.',
        '"To surprise" diễn tả mục đích gây ngạc nhiên, không phù hợp với "by the announcement".',
      ],
      rule: "V-ed thường diễn tả cảm xúc của người nhận tác động; V-ing diễn tả đặc điểm gây cảm xúc: surprised staff, a surprising announcement.",
    },
    "clauses-5": {
      context:
        "Cửa hàng đóng cửa là nguyên nhân; việc quay lại sau là kết quả.",
      distractors: [
        "",
        '"Although" nêu nhượng bộ, không thể hiện kết quả trực tiếp trong câu này.',
        '"Unless" đặt ra điều kiện, không phù hợp với hai sự việc đã được kể.',
        '"Because" sẽ làm việc quay lại sau trở thành nguyên nhân khiến cửa hàng đóng cửa, đảo ngược quan hệ ý nghĩa.',
      ],
      rule: "Cause, so + result: nguyên nhân, vì vậy + kết quả. Result + because + cause: kết quả + bởi vì + nguyên nhân.",
    },
    "prepositions-0": {
      context: 'Sau chỗ trống là "6 p.m.", một giờ cụ thể trong ngày.',
      distractors: [
        '"In" thường dùng với tháng, năm hoặc buổi trong ngày, không dùng trực tiếp với giờ cụ thể.',
        '"On" dùng với ngày hoặc thứ, không dùng trực tiếp với "6 p.m.".',
        "",
        '"By 6 p.m." có nghĩa "chậm nhất lúc 6 giờ", khác với giờ đóng cửa chính xác mà bài này muốn diễn tả.',
      ],
      rule: "At + giờ; on + thứ/ngày; in + tháng/năm/buổi. By + thời điểm nêu hạn chót, không phải một giờ chính xác.",
    },
    "prepositions-1": {
      context:
        "Câu mô tả vị trí của hồ sơ bên trong chiếc tủ theo ngữ cảnh của bài.",
      distractors: [
        '"At" chỉ một vị trí chung, không thể hiện hồ sơ nằm bên trong tủ.',
        "",
        '"On" diễn tả hồ sơ trên bề mặt tủ, khác với vị trí bên trong mà bài này muốn nói.',
        '"To" chỉ hướng di chuyển đến nơi nào đó, không phù hợp sau "are" để mô tả vị trí đứng yên.',
      ],
      rule: 'In = bên trong; on = trên bề mặt; at = tại một điểm/vị trí. Chọn giới từ theo vị trí thực tế; "on the cabinet" cũng đúng nếu hồ sơ ở trên nóc tủ.',
    },
    "prepositions-2": {
      context:
        'Chỗ trống nối tính từ "satisfied" với đối tượng khiến khách hàng hài lòng: "the service".',
      distractors: [
        'Không dùng "satisfied at" để nói hài lòng với dịch vụ trong cụm này.',
        '"Satisfied for" không phải cụm kết hợp thông thường với đối tượng gây hài lòng.',
        "",
        'Bài này kiểm tra cụm cố định "satisfied with the service"; "by" không phải lựa chọn thông thường ở đây.',
      ],
      rule: "Satisfied with + danh từ: hài lòng với điều gì. Ghi nhớ cả cụm tính từ + giới từ thay vì học riêng từng từ.",
    },
    "prepositions-3": {
      context:
        'Câu muốn diễn tả nhóm đang xem xét hoặc điều tra vấn đề, cần đúng cụm động từ với "look".',
      distractors: [
        '"Look at" nghĩa là nhìn vào hoặc xem; "look into" chính xác hơn cho ý điều tra vấn đề của bài.',
        "",
        '"Look for" nghĩa là tìm kiếm, không phải điều tra một vấn đề đã biết.',
        '"Look after" nghĩa là chăm sóc, không phù hợp với việc điều tra vấn đề.',
      ],
      rule: "Look into = điều tra/xem xét; look for = tìm kiếm; look after = chăm sóc; look at = nhìn/xem.",
    },
    "prepositions-4": {
      context:
        "Đây là câu yêu cầu hoàn tất biểu mẫu trước khi nộp; cần một cụm động từ mang nghĩa điền thông tin.",
      distractors: [
        "",
        '"Take off" thường mang nghĩa cất cánh hoặc cởi bỏ, không diễn tả điền biểu mẫu.',
        '"Put away" nghĩa là cất đi, không diễn tả hoàn tất thông tin trong biểu mẫu.',
        '"Bring up" nghĩa là đề cập hoặc nuôi dưỡng, không phù hợp với yêu cầu điền biểu mẫu.',
      ],
      rule: "Fill out a form = điền vào biểu mẫu. Câu mệnh lệnh bắt đầu bằng động từ nguyên mẫu: Please fill out...",
    },
    "prepositions-5": {
      context:
        'Sau chỗ trống là cụm danh từ "bad weather", nêu nguyên nhân chuyến bay bị hoãn.',
      distractors: [
        '"Because" phải đứng trước một mệnh đề có chủ ngữ và động từ, không phải chỉ "bad weather".',
        "",
        '"Although" cần một mệnh đề và mang nghĩa nhượng bộ, không phù hợp với cụm danh từ chỉ nguyên nhân.',
        '"Despite of" là dạng sai; despite không đi với of và mang nghĩa "mặc dù", không phải nguyên nhân.',
      ],
      rule: "Because + S + V; because of + danh từ/V-ing. Although + S + V; despite/in spite of + danh từ/V-ing.",
    },
  };
  const savedTopics = new Set(
    JSON.parse(localStorage.getItem("grammarBookmarks") || "[]"),
  );
  const savedQuestions = new Set(
    JSON.parse(localStorage.getItem("grammarQuestionBookmarks") || "[]"),
  );
  const savedTheories = JSON.parse(
    localStorage.getItem("grammarSavedTheories") || "[]",
  );
  const topicStats = JSON.parse(
    localStorage.getItem("grammarTopicStats") || "{}",
  );
  let answeredTotal = Number(localStorage.getItem("grammarAnsweredTotal") || 0);
  let correctTotal = Number(localStorage.getItem("grammarCorrectTotal") || 0);
  let activeExam = "all";
  let activeCategory = "all";
  let activeSort = "default";
  let activeTab = "learning";
  let selectedTestSize = 20;
  let sessionQuestions = [];
  let sessionAnswers = [];
  let questionIndex = 0;
  let questionAnswered = false;
  let sessionCorrect = 0;
  let sessionAttempted = 0;
  let practiceComplete = false;
  let isMiniTest = false;
  let miniTestTimeRemaining = 60;
  let miniTestTimerId = null;
  let translationVisible = false;
  let explanationVisible = false;
  let questionMapFilter = "all";
  let modalTrigger = null;
  let catalogWindowScrollY = 0;

  const dashboardLayout = document.getElementById("dashboardLayout");
  const topicSections = document.getElementById("topicSections");
  const filterPanel = document.getElementById("filterPanel");
  const categoryFilters = document.getElementById("categoryFilters");
  const filterBackdrop = document.getElementById("filterBackdrop");
  const filterToggle = document.getElementById("filterToggle");
  const grammarPage = document.getElementById("grammarPage");
  const grammarCatalog = document.getElementById("grammarCatalog");
  const practicePage = document.getElementById("practicePage");
  const practiceOptions = document.getElementById("practiceOptions");
  const practiceNext = document.getElementById("practiceNext");
  const practiceReportDialog = document.getElementById("practiceReportDialog");

  function allTopicRecords() {
    return grammarGroups.flatMap((group) =>
      group.topics.map((topic, index) => ({
        id: `${group.id}-${index}`,
        group,
        index,
        title: topic[0],
        exam: topic[1],
        question: topic[2],
        options: topic[3],
        answer: topic[4],
        explanation: topic[5],
        translation: grammarTranslations[`${group.id}-${index}`],
      })),
    );
  }

  function saveProgress() {
    localStorage.setItem("grammarTopicStats", JSON.stringify(topicStats));
    localStorage.setItem("grammarAnsweredTotal", String(answeredTotal));
    localStorage.setItem("grammarCorrectTotal", String(correctTotal));
    localStorage.setItem("grammarBookmarks", JSON.stringify([...savedTopics]));
  }

  function updateSummary() {
    const weakTopics = Object.values(topicStats).filter(
      (stat) => stat.wrong > 0,
    ).length;
    const accuracy = answeredTotal
      ? Math.round((correctTotal / answeredTotal) * 100)
      : 0;
    document.getElementById("answeredCount").textContent = answeredTotal;
    document.getElementById("topicCount").textContent = totalTopics;
    document.getElementById("weakCount").textContent = weakTopics;
    document.getElementById("bookmarkCount").textContent = savedQuestions.size + savedTheories.length;
    document.getElementById("accuracyValue").textContent = `${accuracy}%`;
    document.getElementById("accuracyFill").style.width = `${accuracy}%`;
    document
      .querySelector(".grammar-progress-track")
      .setAttribute("aria-valuenow", accuracy);
  }

  function updatePracticeActions(question) {
    const translationButton = document.getElementById(
      "practiceTranslationToggle",
    );
    const bookmarkButton = document.getElementById("practiceBookmarkToggle");
    const isSaved = savedQuestions.has(question.id);
    translationButton.setAttribute("aria-pressed", String(translationVisible));
    bookmarkButton.setAttribute("aria-pressed", String(isSaved));
    bookmarkButton.setAttribute(
      "aria-label",
      isSaved ? "Bỏ đánh dấu câu hỏi" : "Đánh dấu câu hỏi",
    );
    bookmarkButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${isSaved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg> <span>${isSaved ? "Đã đánh dấu" : "Đánh dấu"}</span>`;
    document
      .getElementById("practiceExplainToggle")
      .setAttribute("aria-pressed", String(explanationVisible));
    document.getElementById("practiceExplainToggle").disabled =
      !questionAnswered;
    practiceOptions
      .querySelectorAll(".practice-option-explanation")
      .forEach((note) => {
        note.hidden = !explanationVisible || !questionAnswered;
        const button = note.previousElementSibling;
        if (note.hidden) button.removeAttribute("aria-describedby");
        else button.setAttribute("aria-describedby", note.id);
      });
  }

  function makeTopicCard(record) {
    const stat = topicStats[record.id] || { done: 0, wrong: 0, correct: 0 };
    const accuracy = stat.done
      ? Math.round((stat.correct / stat.done) * 100)
      : 0;
    const article = document.createElement("article");
    article.className = "topic-card";
    article.dataset.topicId = record.id;
    article.dataset.group = record.group.id;
    article.dataset.exam = record.exam;
    article.dataset.title = record.title.toLocaleLowerCase("vi");
    article.dataset.wrong = stat.wrong;
    article.innerHTML = `
          <div class="topic-card-top">
            <span class="topic-card-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open"><path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></svg></span>
            <span class="topic-card-title">${record.title}</span>
            ${stat.done > 0 ? `
              <button class="topic-bookmark" type="button" data-reset-topic="${record.id}"
                aria-label="Làm lại từ đầu chủ đề ${record.title}"
                title="Làm lại từ đầu">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              </button>
            ` : ""}
            <span class="topic-exam-badge">${record.exam}</span>
          </div>
          <div class="topic-progress">
            <div class="topic-progress-heading"><span>Mức độ chính xác</span><strong>${accuracy}%</strong></div>
            <div class="topic-progress-track"><div class="topic-progress-fill" style="width:${accuracy}%"></div></div>
          </div>
          <div class="topic-card-footer">
            <span class="topic-question-count">${stat.done}/50 câu</span>
            <button class="practice-button" type="button" data-practice="${record.id}">
              Luyện ngay <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>
          </div>`;
    return article;
  }

  function renderTopics() {
    topicSections.replaceChildren();
    const query = document
      .getElementById("topicSearch")
      .value.trim()
      .toLocaleLowerCase("vi");

    if (activeTab === "notebook") {
      renderNotebookTab(query);
      return;
    }

    let visibleCount = 0;

    grammarGroups.forEach((group) => {
      if (activeCategory !== "all" && activeCategory !== group.id) return;
      let records = group.topics.map((_, index) =>
        allTopicRecords().find(
          (record) => record.id === `${group.id}-${index}`,
        ),
      );
      records = records.filter((record) => {
        const matchesSearch =
          !query ||
          record.title.toLocaleLowerCase("vi").includes(query) ||
          group.title.toLocaleLowerCase("vi").includes(query);
        const matchesExam =
          activeExam === "all" || record.exam.includes(activeExam);
        const matchesTab =
          activeTab === "learning" || savedTopics.has(record.id);
        return matchesSearch && matchesExam && matchesTab;
      });
      if (activeSort === "weak") {
        records.sort(
          (a, b) =>
            (topicStats[b.id]?.wrong || 0) - (topicStats[a.id]?.wrong || 0),
        );
      }
      if (!records.length) return;
      visibleCount += records.length;

      const section = document.createElement("section");
      section.className = "topic-section";
      section.dataset.group = group.id;
      const heading = document.createElement("div");
      heading.className = "topic-section-heading";
      heading.innerHTML = `<div><h2>${group.title}</h2><p>${group.description}</p></div><span class="topic-section-count">${records.length} chủ đề</span>`;
      const grid = document.createElement("div");
      grid.className = "topic-grid";
      records.forEach((record) => grid.appendChild(makeTopicCard(record)));

      if (
        group.id === "tenses" &&
        activeTab === "learning" &&
        !query &&
        activeExam !== "VSTEP"
      ) {
        grid.appendChild(makeReviewCard(group));
        grid.appendChild(makeMiniTestCard(group));
      }
      section.append(heading, grid);
      topicSections.appendChild(section);
    });

    document
      .getElementById("emptyState")
      .classList.toggle("visible", visibleCount === 0);
    topicSections.setAttribute(
      "aria-labelledby",
      activeTab === "learning" ? "learningTab" : "notebookTab",
    );
  }

  function renderNotebookTab(query) {
    topicSections.replaceChildren();
    document.getElementById("emptyState").classList.remove("visible");
    topicSections.setAttribute("aria-labelledby", "notebookTab");

    const allRecords = allTopicRecords();
    let bookmarkedQuestions = allRecords.filter((rec) => savedQuestions.has(rec.id));
    if (query) {
      bookmarkedQuestions = bookmarkedQuestions.filter((rec) =>
        rec.title.toLocaleLowerCase("vi").includes(query) ||
        rec.question.toLocaleLowerCase("vi").includes(query) ||
        rec.group.title.toLocaleLowerCase("vi").includes(query)
      );
    }

    const container = document.createElement("div");
    container.className = "grammar-notebook-container";

    // Section 1: Câu hỏi đã đánh dấu
    const qSection = document.createElement("div");
    qSection.className = "notebook-section";

    const qHeader = document.createElement("div");
    qHeader.className = "notebook-section-header";
    qHeader.innerHTML = `
      <div class="notebook-section-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag text-red-500"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
        <span>Câu hỏi đã đánh dấu</span>
      </div>
      <span class="notebook-section-count">${bookmarkedQuestions.length} câu</span>
    `;
    qSection.appendChild(qHeader);

    if (bookmarkedQuestions.length > 0) {
      const qGrid = document.createElement("div");
      qGrid.className = "notebook-questions-grid";

      bookmarkedQuestions.forEach((rec) => {
        const card = document.createElement("div");
        card.className = "notebook-question-card";
        const groupTitleUpper = rec.group.title.toUpperCase();
        const questionNumber = `Câu ${rec.index + 1}`;

        card.innerHTML = `
          <div class="notebook-card-header">
            <div class="notebook-card-badges">
              <span class="notebook-badge-topic">${escapeHtml(groupTitleUpper)}</span>
              <span class="notebook-badge-num">${escapeHtml(questionNumber)}</span>
            </div>
            <button type="button" class="notebook-card-delete" data-remove-question="${rec.id}" title="Xóa khỏi câu hỏi đã đánh dấu" aria-label="Xóa khỏi câu hỏi đã đánh dấu">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
          <div class="notebook-card-body">
            <p class="notebook-card-question">${escapeHtml(rec.question)}</p>
          </div>
          <div class="notebook-card-footer">
            <button type="button" class="notebook-card-retry" data-retry-topic="${rec.id}">
              Luyện lại chủ đề này <span class="arrow">&rarr;</span>
            </button>
          </div>
        `;

        card.querySelector("[data-remove-question]").addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const targetId = e.currentTarget.dataset.removeQuestion || rec.id;
          savedQuestions.delete(targetId);
          savedTopics.delete(targetId);
          localStorage.setItem(
            "grammarQuestionBookmarks",
            JSON.stringify([...savedQuestions]),
          );
          saveProgress();
          updateSummary();
          card.remove();
          const remainingCards = qGrid.querySelectorAll(".notebook-question-card");
          const countElem = qSection.querySelector(".notebook-section-count");
          if (countElem) {
            countElem.textContent = `${remainingCards.length} câu`;
          }
          if (remainingCards.length === 0) {
            const currentQuery = document
              .getElementById("topicSearch")
              .value.trim()
              .toLocaleLowerCase("vi");
            renderNotebookTab(currentQuery);
          }
        });

        card.querySelector("[data-retry-topic]").addEventListener("click", (e) => {
          openPractice([rec], e.currentTarget);
        });

        qGrid.appendChild(card);
      });

      qSection.appendChild(qGrid);
    } else {
      const emptyCard = document.createElement("div");
      emptyCard.className = "notebook-empty-subcard";
      emptyCard.textContent = "Chưa có câu hỏi nào được đánh dấu. Bạn có thể nhấn biểu tượng 'Đánh dấu' khi luyện tập để lưu câu hỏi vào đây.";
      qSection.appendChild(emptyCard);
    }

    container.appendChild(qSection);

    // Section 2: Sổ tay Ngữ pháp Cá nhân
    const grammarSection = document.createElement("div");
    grammarSection.className = "notebook-section";

    let filteredTheories = savedTheories;
    if (query) {
      filteredTheories = filteredTheories.filter((t) =>
        t.topic.toLocaleLowerCase("vi").includes(query) ||
        t.content.toLocaleLowerCase("vi").includes(query) ||
        (t.subContent && t.subContent.toLocaleLowerCase("vi").includes(query))
      );
    }

    const grammarHeader = document.createElement("div");
    grammarHeader.className = "notebook-section-header";
    grammarHeader.innerHTML = `
      <div class="notebook-section-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-text text-purple-600"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
        <span>Sổ tay Ngữ pháp Cá nhân</span>
      </div>
      <span class="notebook-section-badge-pill">Đã lưu ${filteredTheories.length} cấu trúc</span>
    `;
    grammarSection.appendChild(grammarHeader);

    if (filteredTheories.length > 0) {
      const gGrid = document.createElement("div");
      gGrid.className = "notebook-theories-grid";

      filteredTheories.forEach((theoryItem) => {
        const card = document.createElement("div");
        card.className = "notebook-theory-card";
        const topicUpper = (theoryItem.topic || "NGỮ PHÁP").toUpperCase();
        const typeBadge = theoryItem.typeLabel || (theoryItem.type === "formula" ? "Công thức" : "Ví dụ");

        card.innerHTML = `
          <div class="notebook-card-header">
            <div class="notebook-card-badges">
              <span class="notebook-badge-topic">${escapeHtml(topicUpper)}</span>
              <span class="notebook-badge-type">${escapeHtml(typeBadge)}</span>
            </div>
            <button type="button" class="notebook-card-delete" data-remove-theory="${theoryItem.id}" title="Xóa khỏi sổ tay cá nhân" aria-label="Xóa khỏi sổ tay cá nhân">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
          <div class="notebook-card-body">
            <div class="notebook-theory-content-box">
              <code>${escapeHtml(theoryItem.content)}</code>
              ${theoryItem.subContent ? `<p class="notebook-theory-sub">${escapeHtml(theoryItem.subContent)}</p>` : ""}
            </div>
          </div>
        `;

        card.querySelector("[data-remove-theory]").addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const targetId = e.currentTarget.dataset.removeTheory || theoryItem.id;
          const idx = savedTheories.findIndex((t) => t.id === targetId);
          if (idx !== -1) {
            savedTheories.splice(idx, 1);
            localStorage.setItem("grammarSavedTheories", JSON.stringify(savedTheories));
            updateSummary();
            card.remove();
            const remaining = gGrid.querySelectorAll(".notebook-theory-card");
            const countElem = grammarSection.querySelector(".notebook-section-badge-pill");
            if (countElem) {
              countElem.textContent = `Đã lưu ${remaining.length} cấu trúc`;
            }
            if (remaining.length === 0) {
              const currentQuery = document
                .getElementById("topicSearch")
                .value.trim()
                .toLocaleLowerCase("vi");
              renderNotebookTab(currentQuery);
            }
          }
        });

        gGrid.appendChild(card);
      });

      grammarSection.appendChild(gGrid);
    } else {
      const grammarEmptyBox = document.createElement("div");
      grammarEmptyBox.className = "notebook-grammar-empty-box";
      grammarEmptyBox.innerHTML = `
        <div class="notebook-grammar-empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
        </div>
        <p class="notebook-grammar-empty-title">Chưa có công thức hoặc ví dụ nào được lưu.</p>
        <p class="notebook-grammar-empty-desc">Nhấp vào biểu tượng bookmark bên cạnh công thức/câu ví dụ mẫu trong các bài học ngữ pháp để lưu vào đây.</p>
      `;
      grammarSection.appendChild(grammarEmptyBox);
    }

    container.appendChild(grammarSection);
    topicSections.appendChild(container);
  }

  function makeReviewCard(group) {
    const card = document.createElement("article");
    card.className = "topic-utility-card";
    card.innerHTML = `
          <div class="utility-content">
            <div class="utility-heading">
              <span class="utility-icon" aria-hidden="true"><i class="fa-solid fa-shuffle"></i></span>
              <h3 class="utility-title">Ôn tập ngẫu nhiên</h3>
            </div>
            <p class="utility-description">Luyện câu hỏi ngẫu nhiên từ các chủ đề trong <strong>${group.title}</strong>.</p>
            <div class="utility-footer">
              <div class="choice-pills" data-size-group="review" role="group" aria-label="Số câu ôn tập">
                ${[20, 30, 50].map((size) => `<button type="button" data-size="${size}" aria-pressed="${selectedTestSize === size}">${selectedTestSize === size ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : ""}${size} câu</button>`).join("")}
              </div>
              <button class="practice-button" type="button" data-start-group="${group.id}" data-mode="review">Bắt đầu ôn tập <i class="fa-solid fa-arrow-right"></i></button>
            </div>
          </div>
        `;
    return card;
  }

  function makeMiniTestCard(group) {
    const card = document.createElement("article");
    card.className = "topic-utility-card test-card";
    card.innerHTML = `
          <h3 class="utility-title"><span class="utility-icon"><i class="fa-regular fa-clipboard"></i></span>Mini Test <span class="topic-exam-badge">TOEIC</span></h3>
          <p class="utility-description">Bản xem thử giao diện Mini Test TOEIC: 50 lượt câu hỏi, mỗi câu 60 giây.</p>
          <div class="utility-footer">
            <div class="choice-pills"><button type="button" aria-pressed="true"><i class="fa-regular fa-clock"></i> 60s/câu</button></div>
            <button class="practice-button" type="button" data-start-group="${group.id}" data-mode="test">Bắt đầu kiểm tra <i class="fa-solid fa-arrow-right"></i></button>
          </div>`;
    return card;
  }

  function renderCategoryFilters() {
    grammarGroups.forEach((group) => {
      const button = document.createElement("button");
      button.className = "category-filter filter-option";
      button.type = "button";
      button.dataset.category = group.id;
      button.setAttribute("aria-pressed", "false");
      button.textContent = group.title;
      categoryFilters.appendChild(button);
    });
  }

  function openPractice(records, trigger, limit = records.length) {
    if (!records.length) return;
    stopMiniTestTimer();
    modalTrigger = trigger;
    sessionQuestions = [...records]
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
    sessionAnswers = [];
    questionIndex = 0;
    sessionCorrect = 0;
    sessionAttempted = 0;
    practiceComplete = false;
    explanationVisible = false;
    questionMapFilter = "all";
    isMiniTest = trigger.dataset.mode === "test";
    practicePage.classList.toggle("is-mini-test", isMiniTest);
    practicePage.classList.toggle("is-regular-practice", !isMiniTest);
    document.getElementById("miniTestStatus").hidden = !isMiniTest;
    closePracticeQuestionMap(false);
    document
      .getElementById("practiceTheoryToggle")
      .setAttribute("aria-pressed", "false");
    catalogWindowScrollY = window.scrollY;
    grammarCatalog.hidden = true;
    practicePage.hidden = false;
    dashboardLayout.classList.add("practice-active");
    window.scrollTo(
      0,
      window.scrollY + grammarPage.getBoundingClientRect().top,
    );
    const practiceTitle = isMiniTest
      ? "Mini Test"
      : sessionQuestions.length === 1
        ? sessionQuestions[0].title
        : `Ôn tập ngẫu nhiên · ${sessionQuestions[0].group.title}`;
    document.getElementById("practiceTitle").textContent = practiceTitle;
    const topicCrumb = document.getElementById("practiceTopicCrumb");
    const topicCrumbWrap = document.getElementById("practiceTopicCrumbWrap");
    const topicChevron = document.getElementById("practiceTopicCrumbChevron");
    if (topicCrumbWrap) {
      topicCrumbWrap.hidden = isMiniTest;
    }
    if (topicCrumb) {
      topicCrumb.hidden = isMiniTest;
      topicCrumb.textContent = sessionQuestions[0].title;
    }
    if (topicChevron) {
      topicChevron.hidden = isMiniTest;
    }
    document.getElementById("practiceBreadcrumbTitle").textContent = "Luyện";
    renderQuestion();
    document.getElementById("practiceClose").focus({ preventScroll: true });
  }

  function stopMiniTestTimer() {
    if (miniTestTimerId !== null) {
      window.clearInterval(miniTestTimerId);
      miniTestTimerId = null;
    }
  }

  function updateMiniTestTimer() {
    const minutes = Math.floor(miniTestTimeRemaining / 60);
    const seconds = miniTestTimeRemaining % 60;
    document.getElementById("miniTestTimer").textContent =
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    document
      .getElementById("miniTestTimerWrap")
      .classList.toggle("is-urgent", miniTestTimeRemaining <= 10);
  }

  function startMiniTestTimer() {
    stopMiniTestTimer();
    miniTestTimeRemaining = 60;
    updateMiniTestTimer();
    miniTestTimerId = window.setInterval(() => {
      miniTestTimeRemaining -= 1;
      updateMiniTestTimer();
      if (miniTestTimeRemaining <= 0) {
        stopMiniTestTimer();
        sessionAnswers[questionIndex] = null;
        questionAnswered = true;
        sessionAttempted += 1;
        advancePractice();
      }
    }, 1000);
  }

  function renderQuestion() {
    const question = sessionQuestions[questionIndex];
    questionAnswered =
      !isMiniTest && sessionAnswers[questionIndex] !== undefined;
    translationVisible = false;
    document.getElementById("practiceProgress").innerHTML =
      `Câu <strong class="progress-current">${questionIndex + 1}</strong>/${sessionQuestions.length} <span class="progress-sep">·</span> Đúng <strong class="progress-correct">${sessionCorrect}</strong>`;
    if (isMiniTest) {
      document.getElementById("miniTestQuestionNumber").textContent =
        questionIndex + 1;
      document.getElementById("practiceProgress").innerHTML =
        `Câu <strong class="progress-current">${questionIndex + 1}</strong>/${sessionQuestions.length} <span class="progress-sep">·</span> Mini Test`;
    }
    const progress = Math.round(
      ((questionIndex + 1) / sessionQuestions.length) * 100,
    );
    const progressTrack = document.querySelector(".practice-progress-track");
    progressTrack.setAttribute("aria-valuenow", progress);
    document.getElementById("practiceProgressFill").style.width =
      `${progress}%`;
    document.getElementById("practiceQuestion").textContent = question.question;
    document.getElementById("practicePromptBadge").textContent = isMiniTest
      ? "CHỌN MỘT ĐÁP ÁN"
      : "CHỌN ĐÁP ÁN ĐÚNG ĐỂ HOÀN THÀNH CÂU";
    const translation = question.translation;
    const questionTranslation = document.getElementById(
      "practiceQuestionTranslation",
    );
    const questionTranslationText = document.getElementById(
      "practiceQuestionTranslationText",
    );
    const translationContent = translation
      ? translation.question
      : "Chưa có bản dịch cho câu hỏi này.";
    if (questionTranslationText) {
      questionTranslationText.textContent = translationContent;
    } else {
      questionTranslation.textContent = translationContent;
    }
    questionTranslation.hidden = !translationVisible;
    document.getElementById("practiceFeedback").textContent = "";
    document.getElementById("practiceFeedback").className = "";
    document.getElementById("practiceResultBanner").hidden = true;
    document
      .getElementById("practiceResultBanner")
      .classList.remove("is-correct");
    document.getElementById("practiceAnswerSummary").hidden = true;
    document.getElementById("practiceGrammarReminder").hidden = true;
    document.getElementById("practiceExplanation").replaceChildren();
    document
      .getElementById("practiceExplanationPanel")
      .classList.toggle("is-awaiting-answer", !isMiniTest && !questionAnswered);
    document.getElementById("practiceNextLabel").textContent = isMiniTest
      ? questionIndex === sessionQuestions.length - 1
        ? "Nộp bài"
        : "Câu tiếp theo"
      : "Câu tiếp theo";
    practiceNext.disabled = !questionAnswered;
    document.getElementById("practicePrevious").disabled = questionIndex === 0;
    const nextSvg = practiceNext.querySelector("svg");
    if (nextSvg) {
      nextSvg.innerHTML = '<path d="m9 18 6-6-6-6"/>';
    }
    practiceOptions.replaceChildren();
    question.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-option";
      const marker = document.createElement("span");
      marker.className = "answer-option-marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = String.fromCharCode(65 + index);
      const optionContent = document.createElement("span");
      optionContent.className = "answer-option-content";
      const optionLabel = document.createElement("span");
      optionLabel.className = "answer-option-label";
      optionLabel.textContent = option;
      optionContent.appendChild(optionLabel);
      button.append(marker, optionContent);
      if (translation?.options[index]) {
        const optionTranslation = document.createElement("span");
        optionTranslation.className = "practice-option-translation";
        optionTranslation.textContent = translation.options[index];
        optionTranslation.hidden = true;
        optionContent.appendChild(optionTranslation);
      }
      button.addEventListener("click", () => answerQuestion(index, question));
      const item = document.createElement("div");
      item.className = "practice-option-item";
      const note = document.createElement("p");
      note.className = "practice-option-explanation";
      note.id = `practiceOptionExplanation${index}`;
      note.hidden = true;
      item.append(button, note);
      practiceOptions.appendChild(item);
    });
    if (questionAnswered) {
      renderPracticeAnswer(question, sessionAnswers[questionIndex]);
    }
    renderPracticeQuestionMap();
    document.querySelector(".practice-actions").hidden = isMiniTest;
    if (!isMiniTest) updatePracticeActions(question);
    else startMiniTestTimer();
  }

  function renderPracticeAnswer(question, selectedIndex) {
    const isCorrect = selectedIndex === question.answer;
    const answerLetter = String.fromCharCode(65 + question.answer);
    const details = grammarReasoning[question.id];
    practiceOptions
      .querySelectorAll(".answer-option")
      .forEach((button, index) => {
        const correct = index === question.answer;
        const incorrect = index === selectedIndex && !isCorrect;
        button.disabled = true;
        button.classList.toggle("correct", correct);
        button.classList.toggle("incorrect", incorrect);
        button.classList.toggle("eliminated", !correct && !incorrect);
        const letter = String.fromCharCode(65 + index);
        const status = correct
          ? "Đáp án đúng"
          : incorrect
            ? "Bạn đã chọn, chưa đúng"
            : "Đáp án bị loại";
        button.setAttribute(
          "aria-label",
          `${letter}. ${question.options[index]}. ${status}`,
        );
        const note = document.getElementById(
          `practiceOptionExplanation${index}`,
        );
        note.textContent = correct
          ? `Chính xác. ${question.explanation}`
          : `Sai. ${details?.distractors[index] || "Lựa chọn này không phù hợp với quy tắc và ngữ cảnh của câu."}`;
        note.classList.toggle("is-correct", correct);
        note.hidden = !explanationVisible;
        if (!note.hidden) button.setAttribute("aria-describedby", note.id);
        const marker = button.querySelector(".answer-option-marker");
        marker.replaceChildren();
        if (correct || incorrect) {
          const icon = document.createElement("i");
          icon.className = correct ? "fa-solid fa-check" : "fa-solid fa-xmark";
          marker.appendChild(icon);
        } else {
          marker.textContent = letter;
        }
      });

    const feedback = document.getElementById("practiceFeedback");
    feedback.textContent = isCorrect
      ? "Chính xác! Đáp án bạn chọn là đáp án đúng."
      : `Chưa đúng. Đáp án đúng là ${answerLetter}: "${question.options[question.answer]}".`;
    feedback.classList.toggle("is-correct", isCorrect);
    feedback.classList.toggle("is-incorrect", !isCorrect);
    document.getElementById("practiceResultBanner").hidden = false;
    document
      .getElementById("practiceResultBanner")
      .classList.toggle("is-correct", isCorrect);
    document.getElementById("practiceResultIcon").className = isCorrect
      ? "fa-regular fa-circle-check"
      : "fa-regular fa-circle-xmark";
    document.getElementById("practiceResultText").textContent = isCorrect
      ? "Chính xác"
      : "Chưa đúng";
    document.getElementById("practiceCorrectLetter").textContent =
      `Đáp án: ${answerLetter}`;

    const explanation = document.getElementById("practiceExplanation");
    explanation.replaceChildren();
    const steps = document.createElement("ol");
    steps.className = "practice-reasoning-steps";
    function addStep(title, text, eliminatedIndex) {
      const step = document.createElement("li");
      step.className = "practice-reasoning-step";
      const heading = document.createElement("h4");
      heading.textContent = title;
      const description = document.createElement("p");
      description.textContent = text;
      step.append(heading, description);
      if (eliminatedIndex !== undefined) {
        const tag = document.createElement("span");
        tag.className = "practice-elimination";
        tag.textContent = `Loại ${String.fromCharCode(65 + eliminatedIndex)}`;
        step.appendChild(tag);
      }
      steps.appendChild(step);
    }
    if (details) {
      addStep("Vị trí chỗ trống", details.context);
      details.distractors.forEach((reason, index) => {
        if (index !== question.answer && reason) {
          addStep(`Xét "${question.options[index]}"`, reason, index);
        }
      });
    } else {
      addStep("Áp dụng quy tắc", question.explanation);
    }
    explanation.appendChild(steps);
    document.getElementById("practiceAnswerText").textContent =
      `Chọn ${answerLetter}: "${question.options[question.answer]}".`;
    document.getElementById("practiceAnswerSummary").hidden = false;
    document.getElementById("practiceGrammarRule").textContent =
      details?.rule || question.explanation;
    document.getElementById("practiceGrammarReminder").hidden = false;
    document
      .getElementById("practiceExplanationPanel")
      .classList.remove("is-awaiting-answer");
  }

  function answerQuestion(selectedIndex, question) {
    if (questionAnswered) return;
    questionAnswered = true;
    sessionAnswers[questionIndex] = selectedIndex;
    if (isMiniTest) {
      sessionAttempted += 1;
      stopMiniTestTimer();
      practiceOptions
        .querySelectorAll(".answer-option")
        .forEach((button, index) => {
          button.disabled = true;
          if (index === selectedIndex) button.classList.add("selected");
        });
      document.getElementById("practiceProgress").textContent =
        `Câu ${questionIndex + 1}/${sessionQuestions.length} · Đã chọn đáp án`;
      practiceNext.disabled = false;
      return;
    }
    sessionAttempted += 1;
    answeredTotal += 1;
    const isCorrect = selectedIndex === question.answer;
    const stat = topicStats[question.id] || { done: 0, wrong: 0, correct: 0 };
    stat.done += 1;
    if (isCorrect) {
      correctTotal += 1;
      sessionCorrect += 1;
      stat.correct += 1;
    } else {
      stat.wrong += 1;
    }
    topicStats[question.id] = stat;
    saveProgress();

    renderPracticeAnswer(question, selectedIndex);
    updatePracticeActions(question);
    practiceNext.disabled = false;
    document.getElementById("practiceProgress").innerHTML =
      `Câu <strong class="progress-current">${questionIndex + 1}</strong>/${sessionQuestions.length} <span class="progress-sep">·</span> Đúng <strong class="progress-correct">${sessionCorrect}</strong>`;
    updateSummary();
    renderTopics();
    renderPracticeQuestionMap();
  }

  function renderPracticeQuestionMap() {
    const content = document.getElementById("practiceQuestionMapContent");
    const answered = sessionQuestions.filter(
      (_, index) => sessionAnswers[index] !== undefined,
    ).length;
    const percent = sessionQuestions.length
      ? Math.round((answered / sessionQuestions.length) * 100)
      : 0;
    document.getElementById("practiceQuestionMapProgress").textContent =
      `Câu ${questionIndex + 1}/${sessionQuestions.length} · ${percent}% hoàn thành`;
    document.querySelectorAll("[data-map-filter]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.mapFilter === questionMapFilter),
      );
    });
    content.replaceChildren();
    const groups = new Map();
    sessionQuestions.forEach((question, index) => {
      if (!groups.has(question.title)) groups.set(question.title, []);
      groups.get(question.title).push({ question, index });
    });
    groups.forEach((entries, title) => {
      const visible = entries.filter(({ question, index }) => {
        const selected = sessionAnswers[index];
        if (questionMapFilter === "unanswered") return selected === undefined;
        if (questionMapFilter === "incorrect")
          return selected !== undefined && selected !== question.answer;
        return true;
      });
      if (!visible.length) return;
      const section = document.createElement("section");
      section.className = "practice-map-group";
      const heading = document.createElement("div");
      heading.className = "practice-map-group-heading";
      const name = document.createElement("h3");
      name.textContent = title;
      const count = document.createElement("span");
      count.className = "practice-map-group-count";
      count.textContent = `${entries.filter(({ index }) => sessionAnswers[index] !== undefined).length}/${entries.length}`;
      count.setAttribute("aria-label", `${count.textContent} câu đã làm`);
      heading.append(name, count);
      const grid = document.createElement("div");
      grid.className = "practice-map-grid";
      visible.forEach(({ question, index }) => {
        const selected = sessionAnswers[index];
        const state =
          selected === undefined
            ? "unanswered"
            : selected === question.answer
              ? "correct"
              : "incorrect";
        const current = index === questionIndex;
        const label = {
          unanswered: "Chưa làm",
          correct: "Đúng",
          incorrect: "Làm sai",
        }[state];
        const button = document.createElement("button");
        button.type = "button";
        button.className = `practice-map-question is-${state}`;
        button.dataset.questionIndex = index;
        button.textContent = index + 1;
        button.setAttribute(
          "aria-label",
          `Câu ${index + 1}: ${current ? "Đang làm, " : ""}${label.toLowerCase()}`,
        );
        button.title = `Câu ${index + 1}: ${current ? "Đang làm" : label}`;
        if (current) button.setAttribute("aria-current", "step");
        else {
          const icon = document.createElement("i");
          icon.className = `practice-map-status-icon ${state === "correct" ? "fa-regular fa-circle-check" : state === "incorrect" ? "fa-solid fa-triangle-exclamation" : "fa-regular fa-circle"}`;
          icon.setAttribute("aria-hidden", "true");
          button.appendChild(icon);
        }
        button.addEventListener("click", () => {
          closePracticeQuestionMap(false);
          questionIndex = index;
          renderQuestion();
          const target =
            practiceOptions.querySelector("button:not(:disabled)") ||
            practiceNext;
          target.focus({ preventScroll: true });
        });
        grid.appendChild(button);
      });
      section.append(heading, grid);
      content.appendChild(section);
    });
    if (!content.children.length) {
      const empty = document.createElement("p");
      empty.className = "practice-map-empty";
      empty.setAttribute("role", "status");
      empty.textContent =
        questionMapFilter === "incorrect"
          ? "Chưa có câu trả lời sai."
          : "Bạn đã làm tất cả câu hỏi.";
      content.appendChild(empty);
    }
  }

  function openPracticeQuestionMap() {
    renderPracticeQuestionMap();
    document.getElementById("practiceQuestionMap").hidden = false;
    document
      .getElementById("practiceQuestionMapToggle")
      .setAttribute("aria-expanded", "true");
    document.body.classList.add("question-map-open");
    dashboardLayout.inert = true;
    document
      .getElementById("practiceQuestionMapClose")
      .focus({ preventScroll: true });
    document.getElementById("practiceQuestionMapContent").scrollTop = 0;
    document
      .querySelector('.practice-map-question[aria-current="step"]')
      ?.scrollIntoView({ block: "nearest" });
  }

  function closePracticeQuestionMap(restoreFocus = true) {
    const map = document.getElementById("practiceQuestionMap");
    const wasOpen = !map.hidden;
    map.hidden = true;
    document
      .getElementById("practiceQuestionMapToggle")
      .setAttribute("aria-expanded", "false");
    document.body.classList.remove("question-map-open");
    dashboardLayout.inert = false;
    if (wasOpen && restoreFocus) {
      document
        .getElementById("practiceQuestionMapToggle")
        .focus({ preventScroll: true });
    }
  }

  const grammarTheoryContent = {
    tenses: {
      goldenRules: ["S + V(s/es)", "S + am/is/are + V-ing"],
      summary:
        "Nắm chắc quy tắc này để tăng tốc khi gặp câu hỏi ngữ pháp trong bài thi.",
      quickIntro: "Trước khi sang phần luyện tập, tự kiểm tra nhanh:",
      quickItems: [
        ["He, She, It, danh từ số ít", "→ V(s/es)"],
        ["We, They, danh từ số nhiều", "→ V nguyên mẫu"],
      ],
      model: ["Ai / Điều gì", "làm gì?"],
      mentalDescription:
        "Thì hiện tại gồm 4 thì chính: Hiện tại đơn, Hiện tại tiếp diễn, Hiện tại hoàn thành và Hiện tại hoàn thành tiếp diễn.",
      formulas: [
        "S + V(s/es)",
        "S + am/is/are + V-ing",
        "S + have/has + V3/ed",
        "S + have/has + been + V-ing",
      ],
      usage: [
        {
          title: "Số ít",
          text: "He, She, It, danh từ số ít, Each, Every",
          result: "→ V(s/es)",
        },
        {
          title: "Số nhiều",
          text: "We, They, danh từ số nhiều, These, Those",
          result: "→ V nguyên mẫu",
          green: true,
        },
      ],
      mistakes: [
        "Quên thêm -s/-es cho động từ ngôi thứ ba số ít ở hiện tại đơn.",
        "Dùng am/is/are với động từ nguyên mẫu; thì tiếp diễn cần V-ing.",
        "Nhầm hiện tại hoàn thành với quá khứ đơn; chú ý since, for và mốc thời gian.",
        "Dùng have với He/She/It thay vì has.",
      ],
      examples: [
        "Mr. Tanaka usually submits his monthly reports on the first Friday of each month.",
        "The students are preparing for their final examination now.",
        "She has worked at this company since 2021.",
        "We have been waiting for the bus for twenty minutes.",
      ],
    },
  };

  function fillTheoryMistakes(containerId, items) {
    const list = document.getElementById(containerId);
    if (!list) return;
    list.replaceChildren();
    items.forEach((text, index) => {
      const card = document.createElement("div");
      card.className = "mistake-item";
      card.innerHTML = `
        <div class="mistake-item-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>
          <span>Bẫy ${index + 1}: ${escapeHtml(text.split(":")[0] || "Lưu ý")}</span>
        </div>
        <p class="mistake-item-body">${escapeHtml(text.includes(":") ? text.substring(text.indexOf(":") + 1).trim() : text)}</p>
      `;
      list.appendChild(card);
    });
  }

  function showTheoryToast(message = "Đã lưu vào sổ tay cá nhân", isRemoved = false) {
    const toast = document.getElementById("theoryToast");
    if (!toast) return;
    toast.querySelector("span").textContent = message;
    toast.classList.toggle("is-removed", isRemoved);
    const icon = toast.querySelector("svg");
    if (icon) {
      if (isRemoved) {
        icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>';
      } else {
        icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>';
      }
    }
    toast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.hidden = true;
    }, 2500);
  }

  function fillTheoryExamples(containerId, items, topicTitle) {
    const list = document.getElementById(containerId);
    if (!list) return;
    list.replaceChildren();
    items.forEach((text) => {
      const card = document.createElement("div");
      card.className = "example-item";
      const parts = text.split("—");
      const en = parts[0]?.trim() || text;
      const vi = parts[1]?.trim() || "";
      const isSaved = savedTheories.some((t) => t.type === "example" && t.content === en);

      card.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote quote-icon"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path></svg>
        <div class="example-copy">
          <p class="example-text">${escapeHtml(en)}</p>
          ${vi ? `<p class="example-subtext">${escapeHtml(vi)}</p>` : ""}
        </div>
        <button type="button" aria-label="Lưu ví dụ" class="${isSaved ? "saved" : ""}" aria-pressed="${isSaved}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
        </button>
      `;

      const saveBtn = card.querySelector("button");
      saveBtn.addEventListener("click", () => {
        const currentlySaved = saveBtn.getAttribute("aria-pressed") === "true";
        if (currentlySaved) {
          const idx = savedTheories.findIndex((t) => t.type === "example" && t.content === en);
          if (idx !== -1) savedTheories.splice(idx, 1);
          saveBtn.setAttribute("aria-pressed", "false");
          saveBtn.classList.remove("saved");
          saveBtn.querySelector("svg").setAttribute("fill", "none");
          showTheoryToast("Đã xóa khỏi sổ tay", true);
        } else {
          savedTheories.push({
            id: `theory-ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            topic: topicTitle || "NGỮ PHÁP",
            type: "example",
            typeLabel: "Ví dụ",
            content: en,
            subContent: vi,
          });
          saveBtn.setAttribute("aria-pressed", "true");
          saveBtn.classList.add("saved");
          saveBtn.querySelector("svg").setAttribute("fill", "currentColor");
          showTheoryToast("Đã lưu vào sổ tay cá nhân");
        }
        localStorage.setItem("grammarSavedTheories", JSON.stringify(savedTheories));
        updateSummary();
        if (activeTab === "notebook") renderTopics();
      });

      list.appendChild(card);
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function renderGrammarTheory(question) {
    const group = question.group;
    const theory = grammarTheoryContent[group.id] || {
      goldenRules: [question.title, "Xác định cấu trúc và ngữ cảnh câu"],
      summary: group.description,
      quickIntro: "Ghi nhớ nhanh các điểm trọng tâm của chủ đề:",
      quickItems: group.topics.slice(0, 2).map((topic) => [topic[0], topic[5]]),
      model: ["Cấu trúc", "ngữ cảnh?"],
      mentalDescription: group.description,
      formulas: group.topics.slice(0, 4).map((topic) => topic[5]),
      usage: group.topics.slice(0, 2).map((topic, index) => ({
        title: topic[0],
        text: topic[5],
        result: `→ ${topic[3][topic[4]]}`,
        green: index === 1,
      })),
      mistakes: [
        "Đọc cả câu để xác định ngữ cảnh trước khi chọn đáp án.",
        "Kiểm tra vai trò ngữ pháp của chỗ trống.",
        "Loại đáp án không phù hợp về cấu trúc.",
        "Để ý các từ khóa chỉ quan hệ hoặc thời gian.",
      ],
      examples: group.topics
        .slice(0, 4)
        .map(
          (topic) =>
            `${topic[2].replace("___", topic[3][topic[4]])} — ${topic[5]}`,
        ),
    };

    document.getElementById("grammarTheoryDialogTitle").textContent =
      "Lý thuyết";
    document.getElementById("grammarTheoryDialogSubtitle").textContent =
      question.title;
    const goldenRules = document.getElementById("theoryGoldenRules");
    goldenRules.replaceChildren();
    theory.goldenRules.forEach((rule) => {
      const line = document.createElement("span");
      line.textContent = rule;
      goldenRules.appendChild(line);
    });
    document.getElementById("theorySummary").textContent = theory.summary;
    document.getElementById("theoryQuickIntro").textContent = theory.quickIntro;

    const quickList = document.getElementById("theoryQuickList");
    quickList.replaceChildren();
    theory.quickItems.forEach(([label, result]) => {
      const item = document.createElement("li");
      item.className = "grammar-theory-quick-item";
      item.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
        <span><span>${escapeHtml(label)}</span><strong>${escapeHtml(result)}</strong></span>
      `;
      quickList.appendChild(item);
    });

    document.getElementById("theoryModelLeft").textContent = theory.model[0];
    document.getElementById("theoryModelRight").textContent = theory.model[1];
    document.getElementById("theoryMentalDescription").textContent =
      theory.mentalDescription;
    const formulaList = document.getElementById("theoryFormulaList");
    formulaList.replaceChildren();
    theory.formulas.forEach((formula) => {
      const isSaved = savedTheories.some((t) => t.type === "formula" && t.content === formula);
      const row = document.createElement("div");
      row.className = "grammar-theory-formula";
      row.innerHTML = `
        <code>${escapeHtml(formula)}</code>
        <button type="button" aria-label="Lưu công thức" class="${isSaved ? "saved" : ""}" aria-pressed="${isSaved}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
        </button>
      `;
      const saveButton = row.querySelector("button");
      saveButton.addEventListener("click", () => {
        const currentlySaved = saveButton.getAttribute("aria-pressed") === "true";
        if (currentlySaved) {
          const idx = savedTheories.findIndex((t) => t.type === "formula" && t.content === formula);
          if (idx !== -1) savedTheories.splice(idx, 1);
          saveButton.setAttribute("aria-pressed", "false");
          saveButton.classList.remove("saved");
          saveButton.querySelector("svg").setAttribute("fill", "none");
          showTheoryToast("Đã xóa khỏi sổ tay", true);
        } else {
          savedTheories.push({
            id: `theory-f-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            topic: question.group.title || "NGỮ PHÁP",
            type: "formula",
            typeLabel: "Công thức",
            content: formula,
          });
          saveButton.setAttribute("aria-pressed", "true");
          saveButton.classList.add("saved");
          saveButton.querySelector("svg").setAttribute("fill", "currentColor");
          showTheoryToast("Đã lưu vào sổ tay cá nhân");
        }
        localStorage.setItem("grammarSavedTheories", JSON.stringify(savedTheories));
        updateSummary();
        if (activeTab === "notebook") renderTopics();
      });
      formulaList.appendChild(row);
    });

    const usageList = document.getElementById("theoryUsageList");
    usageList.replaceChildren();
    theory.usage.forEach((item) => {
      const box = document.createElement("div");
      box.className = `grammar-theory-usage-box ${item.green ? "usage-plural" : "usage-singular"}`;
      box.innerHTML = `
        <div class="usage-box-header">
          ${item.green 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-round"><path d="M18 21a8 8 0 0 0-16 0"></path><circle cx="10" cy="8" r="5"></circle><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg>'
          }
          <strong>${escapeHtml(item.title)}</strong>
        </div>
        <p class="usage-box-text">${escapeHtml(item.text)}</p>
        <p class="usage-box-result ${item.green ? 'text-green' : 'text-purple'}">${escapeHtml(item.result)}</p>
      `;
      usageList.appendChild(box);
    });
    fillTheoryMistakes("theoryMistakes", theory.mistakes);
    fillTheoryExamples("theoryExamples", theory.examples, question.group.title);
  }

  function openGrammarTheory() {
    const question = sessionQuestions[questionIndex];
    if (!question) return;
    renderGrammarTheory(question);
    document
      .getElementById("practiceTheoryToggle")
      .setAttribute("aria-pressed", "true");
    const dialog = document.getElementById("grammarTheoryDialog");
    document.querySelector(".grammar-theory-scroll").scrollTop = 0;
    dialog.hidden = false;
    document
      .getElementById("grammarTheoryClose")
      .focus({ preventScroll: true });
  }

  function closeGrammarTheory() {
    document.getElementById("grammarTheoryDialog").hidden = true;
    document
      .getElementById("practiceTheoryToggle")
      .setAttribute("aria-pressed", "false");
    document
      .getElementById("practiceTheoryToggle")
      .focus({ preventScroll: true });
  }

  function advancePractice() {
    if (!questionAnswered) return;
    closePracticeQuestionMap(false);
    if (questionIndex < sessionQuestions.length - 1) {
      questionIndex += 1;
      renderQuestion();
      return;
    }
    finishPractice();
  }

  function finishPractice() {
    stopMiniTestTimer();
    if (isMiniTest) {
      sessionCorrect = sessionQuestions.reduce(
        (total, question, index) =>
          total + (sessionAnswers[index] === question.answer ? 1 : 0),
        0,
      );
      sessionAttempted = sessionQuestions.length;
    }
    document.getElementById("practiceTitle").textContent = isMiniTest
      ? "Hoàn thành Mini Test"
      : "Hoàn thành luyện tập";
    document.getElementById("practiceBreadcrumbTitle").textContent = isMiniTest
      ? "Hoàn thành Mini Test"
      : "Hoàn thành luyện tập";
    document.getElementById("practiceProgress").textContent =
      `Bạn đã làm ${sessionAttempted} câu`;
    document
      .querySelector(".practice-progress-track")
      .setAttribute("aria-valuenow", 100);
    document.getElementById("practiceProgressFill").style.width = "100%";
    document.getElementById("practiceQuestion").textContent = isMiniTest
      ? `Bạn trả lời đúng ${sessionCorrect}/${sessionQuestions.length} câu. Mini Test đã hoàn thành!`
      : `Bạn trả lời đúng ${sessionCorrect}/${sessionAttempted} câu. Hãy tiếp tục luyện tập để củng cố kiến thức nhé!`;
    document.getElementById("practiceQuestionTranslation").hidden = true;
    document.getElementById("miniTestStatus").hidden = true;
    closePracticeQuestionMap(false);
    document
      .getElementById("practiceTheoryToggle")
      .setAttribute("aria-pressed", "false");
    document
      .getElementById("practiceQuestionMapToggle")
      .setAttribute("aria-expanded", "false");
    practiceOptions.replaceChildren();
    document.querySelector(".practice-actions").hidden = true;
    document.getElementById("practiceFeedback").textContent = "";
    document.getElementById("practiceResultBanner").hidden = true;
    document.getElementById("practiceAnswerSummary").hidden = true;
    document.getElementById("practiceGrammarReminder").hidden = true;
    document
      .getElementById("practiceExplanationPanel")
      .classList.remove("is-awaiting-answer");
    document.getElementById("practiceExplanation").textContent = isMiniTest
      ? `Kết quả demo: ${sessionCorrect} câu đúng trên tổng số ${sessionQuestions.length} câu.`
      : `Bạn đã hoàn thành bài luyện với ${sessionCorrect} câu trả lời đúng trên tổng số ${sessionAttempted} câu.`;
    document.getElementById("practiceNextLabel").textContent = "Đóng";
    practiceNext.querySelector("i").className = "fa-solid fa-xmark";
    practiceNext.disabled = false;
    practiceComplete = true;
  }

  function closePractice() {
    closePracticeQuestionMap(false);
    stopMiniTestTimer();
    practicePage.classList.remove("is-mini-test");
    practicePage.classList.remove("is-regular-practice");
    document.getElementById("miniTestStatus").hidden = true;
    const topicCrumbWrap = document.getElementById("practiceTopicCrumbWrap");
    if (topicCrumbWrap) topicCrumbWrap.hidden = true;
    if (document.getElementById("practiceTopicCrumb")) {
      document.getElementById("practiceTopicCrumb").hidden = true;
    }
    if (document.getElementById("practiceTopicCrumbChevron")) {
      document.getElementById("practiceTopicCrumbChevron").hidden = true;
    }
    practicePage.hidden = true;
    grammarCatalog.hidden = false;
    dashboardLayout.classList.remove("practice-active");
    window.scrollTo(0, catalogWindowScrollY);
    if (modalTrigger && modalTrigger.isConnected)
      modalTrigger.focus({ preventScroll: true });
    else document.getElementById("learningTab").focus({ preventScroll: true });
  }

  let topicToReset = null;
  const resetTopicModal = document.getElementById("resetTopicModal");
  const resetTopicClose = document.getElementById("resetTopicClose");
  const resetTopicCancel = document.getElementById("resetTopicCancel");
  const resetTopicConfirm = document.getElementById("resetTopicConfirm");

  function openResetTopicModal(topicId) {
    topicToReset = topicId;
    if (resetTopicModal) {
      resetTopicModal.hidden = false;
      if (resetTopicCancel) resetTopicCancel.focus();
    }
  }

  function closeResetTopicModal() {
    topicToReset = null;
    if (resetTopicModal) {
      resetTopicModal.hidden = true;
    }
  }

  if (resetTopicClose) resetTopicClose.addEventListener("click", closeResetTopicModal);
  if (resetTopicCancel) resetTopicCancel.addEventListener("click", closeResetTopicModal);
  if (resetTopicModal) {
    resetTopicModal.addEventListener("click", (e) => {
      if (e.target === resetTopicModal) closeResetTopicModal();
    });
  }
  if (resetTopicConfirm) {
    resetTopicConfirm.addEventListener("click", () => {
      if (topicToReset && topicStats[topicToReset]) {
        const stat = topicStats[topicToReset];
        answeredTotal = Math.max(0, answeredTotal - (stat.done || 0));
        correctTotal = Math.max(0, correctTotal - (stat.correct || 0));
        delete topicStats[topicToReset];
        saveProgress();
        updateSummary();
        renderTopics();
      }
      closeResetTopicModal();
    });
  }

  topicSections.addEventListener("click", (event) => {
    const resetTopicBtn = event.target.closest("[data-reset-topic]");
    if (resetTopicBtn) {
      event.preventDefault();
      event.stopPropagation();
      openResetTopicModal(resetTopicBtn.dataset.resetTopic);
      return;
    }
    const removeTheoryBtn = event.target.closest("[data-remove-theory]");
    if (removeTheoryBtn) {
      event.preventDefault();
      event.stopPropagation();
      const theoryId = removeTheoryBtn.dataset.removeTheory;
      const idx = savedTheories.findIndex((t) => t.id === theoryId);
      if (idx !== -1) {
        savedTheories.splice(idx, 1);
        localStorage.setItem("grammarSavedTheories", JSON.stringify(savedTheories));
        updateSummary();
        const card = removeTheoryBtn.closest(".notebook-theory-card");
        if (card) card.remove();
        const gGrid = topicSections.querySelector(".notebook-theories-grid");
        const remaining = gGrid ? gGrid.querySelectorAll(".notebook-theory-card") : [];
        const countElem = topicSections.querySelector(".notebook-section-badge-pill");
        if (countElem) {
          countElem.textContent = `Đã lưu ${remaining.length} cấu trúc`;
        }
        if (!remaining || remaining.length === 0) {
          const query = document
            .getElementById("topicSearch")
            .value.trim()
            .toLocaleLowerCase("vi");
          renderNotebookTab(query);
        }
      }
      return;
    }

    const removeQuestionBtn = event.target.closest("[data-remove-question]");
    if (removeQuestionBtn) {
      event.preventDefault();
      event.stopPropagation();
      const questionId = removeQuestionBtn.dataset.removeQuestion;
      savedQuestions.delete(questionId);
      savedTopics.delete(questionId);
      localStorage.setItem(
        "grammarQuestionBookmarks",
        JSON.stringify([...savedQuestions]),
      );
      saveProgress();
      updateSummary();
      const card = removeQuestionBtn.closest(".notebook-question-card");
      if (card) card.remove();
      const qGrid = topicSections.querySelector(".notebook-questions-grid");
      const remainingCards = qGrid ? qGrid.querySelectorAll(".notebook-question-card") : [];
      const countElem = topicSections.querySelector(".notebook-section-count");
      if (countElem) {
        countElem.textContent = `${remainingCards.length} câu`;
      }
      if (!remainingCards || remainingCards.length === 0) {
        const query = document
          .getElementById("topicSearch")
          .value.trim()
          .toLocaleLowerCase("vi");
        renderNotebookTab(query);
      }
      return;
    }

    const bookmarkButton = event.target.closest("[data-bookmark]");
    if (bookmarkButton) {
      const id = bookmarkButton.dataset.bookmark;
      if (savedTopics.has(id)) savedTopics.delete(id);
      else savedTopics.add(id);
      saveProgress();
      updateSummary();
      renderTopics();
      return;
    }

    const practiceButton = event.target.closest("[data-practice]");
    if (practiceButton) {
      const record = allTopicRecords().find(
        (item) => item.id === practiceButton.dataset.practice,
      );
      openPractice([record], practiceButton);
      return;
    }

    const sizeButton = event.target.closest("[data-size]");
    if (sizeButton) {
      selectedTestSize = Number(sizeButton.dataset.size);
      renderTopics();
      return;
    }

    const groupButton = event.target.closest("[data-start-group]");
    if (groupButton) {
      const group = grammarGroups.find(
        (item) => item.id === groupButton.dataset.startGroup,
      );
      if (!group) return;
      const isTest = groupButton.dataset.mode === "test";
      let records = allTopicRecords().filter((item) =>
        isTest ? item.exam.includes("TOEIC") : item.group.id === group.id,
      );
      if (isTest && records.length) {
        const shuffledQuestions = [];
        while (shuffledQuestions.length < 50) {
          const round = [...records].sort(() => Math.random() - 0.5);
          if (
            round.length > 1 &&
            shuffledQuestions.length &&
            round[0].id === shuffledQuestions[shuffledQuestions.length - 1].id
          ) {
            [round[0], round[1]] = [round[1], round[0]];
          }
          shuffledQuestions.push(...round);
        }
        records = shuffledQuestions.slice(0, 50);
      }
      openPractice(
        records,
        groupButton,
        isTest ? 50 : Math.min(selectedTestSize, records.length),
      );
    }
  });

  practiceNext.addEventListener("click", () => {
    if (practiceComplete) {
      closePractice();
      return;
    }
    advancePractice();
  });

  document.getElementById("practicePrevious").addEventListener("click", () => {
    if (questionIndex === 0) return;
    closePracticeQuestionMap(false);
    questionIndex -= 1;
    renderQuestion();
  });

  document
    .getElementById("practiceTheoryToggle")
    .addEventListener("click", openGrammarTheory);
  document
    .getElementById("practiceFullTheory")
    .addEventListener("click", openGrammarTheory);
  document
    .getElementById("grammarTheoryClose")
    .addEventListener("click", closeGrammarTheory);
  document
    .getElementById("grammarTheoryDialog")
    .addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeGrammarTheory();
    });

  document
    .getElementById("practiceQuestionMapToggle")
    .addEventListener("click", openPracticeQuestionMap);
  document
    .getElementById("practiceQuestionMapClose")
    .addEventListener("click", () => closePracticeQuestionMap());
  document
    .getElementById("practiceQuestionMap")
    .addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closePracticeQuestionMap();
    });
  document.querySelectorAll("[data-map-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      questionMapFilter = button.dataset.mapFilter;
      renderPracticeQuestionMap();
      document.getElementById("practiceQuestionMapContent").scrollTop = 0;
    });
  });

  document
    .getElementById("practiceClose")
    .addEventListener("click", closePractice);
  document
    .getElementById("practiceTranslationToggle")
    .addEventListener("click", (event) => {
      translationVisible = !translationVisible;
      event.currentTarget.setAttribute(
        "aria-pressed",
        String(translationVisible),
      );
      document.getElementById("practiceQuestionTranslation").hidden =
        !translationVisible;
    });
  document
    .getElementById("practiceExplainToggle")
    .addEventListener("click", (event) => {
      explanationVisible = !explanationVisible;
      updatePracticeActions(sessionQuestions[questionIndex]);
    });
  document
    .getElementById("practiceBookmarkToggle")
    .addEventListener("click", () => {
      const question = sessionQuestions[questionIndex];
      if (savedQuestions.has(question.id)) savedQuestions.delete(question.id);
      else savedQuestions.add(question.id);
      localStorage.setItem(
        "grammarQuestionBookmarks",
        JSON.stringify([...savedQuestions]),
      );
      updatePracticeActions(question);
      updateSummary();
      if (activeTab === "notebook") renderTopics();
    });
  document
    .getElementById("practiceReportToggle")
    .addEventListener("click", () => {
      const question = sessionQuestions[questionIndex];
      const options = question.options
        .map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`)
        .join(" · ");
      document.getElementById("practiceReportQuestion").textContent =
        `${question.title}: ${question.question} (${options})`;
      document.getElementById("practiceReportDetails").value = "";
      document.getElementById("practiceReportStatus").textContent = "";
      practiceReportDialog.hidden = false;
      document.getElementById("practiceReportDetails").focus();
    });
  document
    .getElementById("practiceReportCancel")
    .addEventListener("click", () => {
      practiceReportDialog.hidden = true;
      document.getElementById("practiceReportToggle").focus();
    });
  practiceReportDialog.addEventListener("click", (event) => {
    if (event.target === practiceReportDialog)
      practiceReportDialog.hidden = true;
  });
  document
    .getElementById("practiceReportSubmit")
    .addEventListener("click", () => {
      const details = document
        .getElementById("practiceReportDetails")
        .value.trim();
      const status = document.getElementById("practiceReportStatus");
      if (!details) {
        status.textContent = "Vui lòng mô tả lỗi trước khi gửi.";
        document.getElementById("practiceReportDetails").focus();
        return;
      }
      status.textContent =
        "Báo lỗi đã nhập trên trang này nhưng chưa kết nối hệ thống gửi báo lỗi.";
    });
  document
    .getElementById("practiceFeedbackToggle")
    .addEventListener("click", () => {
      if (typeof window.triggerFeedbackModal === "function")
        window.triggerFeedbackModal();
    });
  document.addEventListener("keydown", (event) => {
    if (!document.getElementById("practiceQuestionMap").hidden) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePracticeQuestionMap();
      } else if (event.key === "Tab") {
        const buttons = [
          ...document.querySelectorAll(
            ".practice-map-drawer button:not(:disabled)",
          ),
        ];
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }
    if (
      event.key === "Tab" &&
      !document.getElementById("grammarTheoryDialog").hidden
    ) {
      const dialog = document.querySelector(".grammar-theory-window");
      const focusable = [...dialog.querySelectorAll("button:not(:disabled)")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.key === "Tab" && !filterPanel.hidden) {
      const focusable = [...filterPanel.querySelectorAll("button:not(:disabled)")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === filterPanel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === filterPanel)) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.key !== "Escape") return;
    if (!filterPanel.hidden) {
      closeFilterDrawer();
      return;
    }
    if (!practiceReportDialog.hidden) {
      practiceReportDialog.hidden = true;
      document.getElementById("practiceReportToggle").focus();
    } else if (!document.getElementById("grammarTheoryDialog").hidden) {
      closeGrammarTheory();
    } else if (!practicePage.hidden) {
      closePractice();
    }
  });
  function updateFilterResetState() {
    const hasActiveFilters = activeCategory !== "all" || activeExam !== "all" ||
      activeSort !== "default" || document.getElementById("topicSearch").value.trim() !== "";
    document.getElementById("filterReset").disabled = !hasActiveFilters;
  }

  document.getElementById("topicSearch").addEventListener("input", () => {
    renderTopics();
    updateFilterResetState();
  });
  function openFilterDrawer() {
    filterPanel.hidden = false;
    filterBackdrop.hidden = false;
    filterToggle.setAttribute("aria-expanded", "true");
    filterPanel.focus({ preventScroll: true });
  }

  function closeFilterDrawer() {
    filterPanel.hidden = true;
    filterBackdrop.hidden = true;
    filterToggle.setAttribute("aria-expanded", "false");
    filterToggle.focus({ preventScroll: true });
  }

  function syncFilterButtons(attribute, value) {
    document.querySelectorAll(`[${attribute}]`).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset[attribute.slice(5)] === value));
    });
  }

  filterToggle.addEventListener("click", openFilterDrawer);
  document.getElementById("filterClose").addEventListener("click", closeFilterDrawer);
  filterBackdrop.addEventListener("click", closeFilterDrawer);

  function handleFilterControls(event) {
    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) {
      activeCategory = categoryButton.dataset.category;
      syncFilterButtons("data-category", activeCategory);
      updateFilterResetState();
      renderTopics();
      return;
    }
    const examButton = event.target.closest("[data-exam]");
    if (examButton) {
      activeExam = examButton.dataset.exam;
      syncFilterButtons("data-exam", activeExam);
      updateFilterResetState();
      renderTopics();
      return;
    }
    const sortButton = event.target.closest("[data-sort]");
    if (sortButton) {
      activeSort = sortButton.dataset.sort;
      syncFilterButtons("data-sort", activeSort);
      updateFilterResetState();
      renderTopics();
    }
  }

  document.querySelector(".grammar-tools").addEventListener("click", handleFilterControls);
  filterPanel.addEventListener("click", handleFilterControls);

  document.getElementById("filterReset").addEventListener("click", () => {
    activeCategory = "all";
    activeExam = "all";
    activeSort = "default";
    document.getElementById("topicSearch").value = "";
    syncFilterButtons("data-category", activeCategory);
    syncFilterButtons("data-exam", activeExam);
    syncFilterButtons("data-sort", activeSort);
    updateFilterResetState();
    renderTopics();
  });

  document.querySelector(".grammar-tabs").addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab) return;
    activeTab = tab.id === "notebookTab" ? "notebook" : "learning";
    document
      .querySelectorAll(".grammar-tab")
      .forEach((item) =>
        item.setAttribute("aria-selected", String(item === tab)),
      );
    renderTopics();
  });

  renderCategoryFilters();
  updateFilterResetState();
  updateSummary();
  renderTopics();
})();
