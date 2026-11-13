using Microsoft.EntityFrameworkCore;
using StudyEnglish.Models.Vocabulary;

namespace StudyEnglish.Data.Seed;

public static class VocabDbInitializer
{
    public static void Initialize(AppDbContext db)
    {
        // 1. Đảm bảo cấu trúc các bảng Vocabulary được tạo nếu chưa có
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'VocabCategories')
            BEGIN
                CREATE TABLE dbo.VocabCategories (
                    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
                    Name NVARCHAR(150) NOT NULL,
                    Code NVARCHAR(100) NOT NULL,
                    Description NVARCHAR(500) NULL,
                    Icon NVARCHAR(100) NULL CONSTRAINT DF_VocabCategories_Icon DEFAULT ('book-open'),
                    Color NVARCHAR(50) NULL CONSTRAINT DF_VocabCategories_Color DEFAULT ('fuchsia'),
                    SortOrder INT NOT NULL CONSTRAINT DF_VocabCategories_SortOrder DEFAULT (1),
                    IsActive BIT NOT NULL CONSTRAINT DF_VocabCategories_IsActive DEFAULT (1),
                    IsDeleted BIT NOT NULL CONSTRAINT DF_VocabCategories_IsDeleted DEFAULT (0),
                    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_VocabCategories_CreatedAt DEFAULT (GETUTCDATE()),
                    UpdatedAt DATETIME2 NULL
                );
            END

            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'VocabTopics')
            BEGIN
                CREATE TABLE dbo.VocabTopics (
                    TopicId INT IDENTITY(1,1) PRIMARY KEY,
                    CategoryId INT NOT NULL,
                    Title NVARCHAR(200) NOT NULL,
                    Code NVARCHAR(150) NULL,
                    Description NVARCHAR(1000) NULL,
                    Level NVARCHAR(50) NULL CONSTRAINT DF_VocabTopics_Level DEFAULT ('B1'),
                    ImageUrl NVARCHAR(500) NULL,
                    Icon NVARCHAR(100) NULL CONSTRAINT DF_VocabTopics_Icon DEFAULT ('folder'),
                    SortOrder INT NOT NULL CONSTRAINT DF_VocabTopics_SortOrder DEFAULT (1),
                    IsActive BIT NOT NULL CONSTRAINT DF_VocabTopics_IsActive DEFAULT (1),
                    IsDeleted BIT NOT NULL CONSTRAINT DF_VocabTopics_IsDeleted DEFAULT (0),
                    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_VocabTopics_CreatedAt DEFAULT (GETUTCDATE()),
                    UpdatedAt DATETIME2 NULL,
                    CONSTRAINT FK_VocabTopics_VocabCategories FOREIGN KEY (CategoryId) REFERENCES dbo.VocabCategories(CategoryId)
                );
            END

            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'VocabWords')
            BEGIN
                CREATE TABLE dbo.VocabWords (
                    WordId INT IDENTITY(1,1) PRIMARY KEY,
                    TopicId INT NOT NULL,
                    Word NVARCHAR(150) NOT NULL,
                    PartOfSpeech NVARCHAR(50) NULL CONSTRAINT DF_VocabWords_PartOfSpeech DEFAULT ('noun'),
                    PhoneticUs NVARCHAR(100) NULL,
                    PhoneticUk NVARCHAR(100) NULL,
                    Meaning NVARCHAR(500) NOT NULL,
                    EnglishDefinition NVARCHAR(1000) NULL,
                    AudioUrl NVARCHAR(500) NULL,
                    ImageUrl NVARCHAR(500) NULL,
                    ExampleSentence NVARCHAR(1000) NULL,
                    ExampleMeaning NVARCHAR(1000) NULL,
                    Collocations NVARCHAR(1000) NULL,
                    Synonyms NVARCHAR(500) NULL,
                    Antonyms NVARCHAR(500) NULL,
                    WordFamily NVARCHAR(1000) NULL,
                    MemoryTip NVARCHAR(1000) NULL,
                    SortOrder INT NOT NULL CONSTRAINT DF_VocabWords_SortOrder DEFAULT (1),
                    IsActive BIT NOT NULL CONSTRAINT DF_VocabWords_IsActive DEFAULT (1),
                    IsDeleted BIT NOT NULL CONSTRAINT DF_VocabWords_IsDeleted DEFAULT (0),
                    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_VocabWords_CreatedAt DEFAULT (GETUTCDATE()),
                    UpdatedAt DATETIME2 NULL,
                    CONSTRAINT FK_VocabWords_VocabTopics FOREIGN KEY (TopicId) REFERENCES dbo.VocabTopics(TopicId) ON DELETE CASCADE
                );
            END

            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'UserVocabProgresses')
            BEGIN
                CREATE TABLE dbo.UserVocabProgresses (
                    ProgressId INT IDENTITY(1,1) PRIMARY KEY,
                    UserId INT NOT NULL,
                    WordId INT NOT NULL,
                    Status NVARCHAR(50) NOT NULL CONSTRAINT DF_UserVocabProgresses_Status DEFAULT ('Learning'),
                    RepetitionLevel INT NOT NULL CONSTRAINT DF_UserVocabProgresses_RepetitionLevel DEFAULT (0),
                    NextReviewDate DATETIME2 NULL,
                    LastReviewedDate DATETIME2 NULL,
                    ReviewCount INT NOT NULL CONSTRAINT DF_UserVocabProgresses_ReviewCount DEFAULT (0),
                    CorrectCount INT NOT NULL CONSTRAINT DF_UserVocabProgresses_CorrectCount DEFAULT (0),
                    IsBookmarked BIT NOT NULL CONSTRAINT DF_UserVocabProgresses_IsBookmarked DEFAULT (0),
                    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_UserVocabProgresses_CreatedAt DEFAULT (GETUTCDATE()),
                    UpdatedAt DATETIME2 NULL,
                    CONSTRAINT FK_UserVocabProgresses_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
                    CONSTRAINT FK_UserVocabProgresses_VocabWords FOREIGN KEY (WordId) REFERENCES dbo.VocabWords(WordId) ON DELETE CASCADE,
                    CONSTRAINT UQ_UserVocabProgresses_User_Word UNIQUE (UserId, WordId)
                );
            END

            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'VocabPhrasePairs')
            BEGIN
                CREATE TABLE dbo.VocabPhrasePairs (
                    PairId INT IDENTITY(1,1) PRIMARY KEY,
                    TopicCategory NVARCHAR(100) NOT NULL CONSTRAINT DF_VocabPhrasePairs_TopicCategory DEFAULT ('business'),
                    SetTitle NVARCHAR(200) NULL,
                    LeftWord NVARCHAR(150) NOT NULL,
                    RightWord NVARCHAR(250) NOT NULL,
                    Meaning NVARCHAR(300) NOT NULL,
                    SentenceBefore NVARCHAR(500) NULL,
                    SentenceAfter NVARCHAR(500) NULL,
                    SortOrder INT NOT NULL CONSTRAINT DF_VocabPhrasePairs_SortOrder DEFAULT (1),
                    IsActive BIT NOT NULL CONSTRAINT DF_VocabPhrasePairs_IsActive DEFAULT (1),
                    IsDeleted BIT NOT NULL CONSTRAINT DF_VocabPhrasePairs_IsDeleted DEFAULT (0),
                    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_VocabPhrasePairs_CreatedAt DEFAULT (GETUTCDATE()),
                    UpdatedAt DATETIME2 NULL
                );
            END

            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'VocabSettings')
            BEGIN
                CREATE TABLE dbo.VocabSettings (
                    SettingKey NVARCHAR(100) PRIMARY KEY,
                    SettingValue NVARCHAR(1000) NOT NULL,
                    Description NVARCHAR(300) NULL,
                    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_VocabSettings_UpdatedAt DEFAULT (GETUTCDATE())
                );
            END

            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'UserPhraseProgresses')
            BEGIN
                CREATE TABLE dbo.UserPhraseProgresses (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    UserId INT NOT NULL,
                    TopicCategory NVARCHAR(100) NOT NULL,
                    SetTitle NVARCHAR(200) NOT NULL,
                    CompletedPairsCount INT NOT NULL CONSTRAINT DF_UserPhraseProgresses_CompletedPairsCount DEFAULT (0),
                    TotalPairsCount INT NOT NULL CONSTRAINT DF_UserPhraseProgresses_TotalPairsCount DEFAULT (0),
                    IsCompleted BIT NOT NULL CONSTRAINT DF_UserPhraseProgresses_IsCompleted DEFAULT (0),
                    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_UserPhraseProgresses_UpdatedAt DEFAULT (GETUTCDATE()),
                    CONSTRAINT FK_UserPhraseProgresses_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
                );
            END

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.VocabWords') AND name = 'CommonMistakeWrong')
            BEGIN
                ALTER TABLE dbo.VocabWords ADD 
                    CommonMistakeWrong NVARCHAR(500) NULL,
                    CommonMistakeRight NVARCHAR(500) NULL,
                    CommonMistakeNote NVARCHAR(1000) NULL;
            END

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.VocabWords') AND name = 'SensesJson')
            BEGIN
                ALTER TABLE dbo.VocabWords ADD SensesJson NVARCHAR(MAX) NULL;
            END

            UPDATE dbo.VocabWords
            SET EnglishDefinition = N'To accept and follow a rule, decision, agreement, or law.',
                ExampleSentence = N'Players who do not abide by the rules will be disqualified.',
                ExampleMeaning = N'Người chơi không tuân thủ luật sẽ bị loại.',
                Collocations = N'abide by the terms — tuân thủ các điều khoản, abide by the agreement — tuân thủ thỏa thuận, abide by the decision — chấp hành quyết định',
                Synonyms = N'comply with, obey, adhere to',
                Antonyms = N'violate, disregard',
                WordFamily = N'abide · verb · chịu đựng, tuân theo; abiding · adjective · lâu dài, bền lâu',
                CommonMistakeWrong = N'All employees must abide the safety rules in the contract.',
                CommonMistakeRight = N'All employees must abide by the safety rules in the contract.',
                CommonMistakeNote = N'''Abide by'' là cụm động từ cố định. Khi mang nghĩa tuân thủ, phải có giới từ ''by''; không dùng ''abide'' trực tiếp với tân ngữ.',
                MemoryTip = N'''Abide by'' = đi ''by'' (cạnh) luật mà sống, tức luôn đi cùng và tuân theo luật.'
            WHERE Word = 'abide by' AND (CommonMistakeWrong IS NULL OR CommonMistakeWrong = '');
        ");

        // 2. Nạp dữ liệu mẫu ban đầu nếu cơ sở dữ liệu chưa có danh mục nào
        if (!db.VocabCategories.Any())
        {
            var catBusiness = new VocabCategory
            {
                Name = "Business & Workplace",
                Code = "business",
                Description = "Từ vựng chuyên sâu về văn phòng, giao tiếp công sở, đàm phán hợp đồng, kinh doanh thương mại và TOEIC.",
                Icon = "briefcase",
                Color = "fuchsia",
                SortOrder = 1,
                IsActive = true
            };

            var catOffice = new VocabCategory
            {
                Name = "Office & Technology",
                Code = "office",
                Description = "Từ vựng về trang thiết bị văn phòng, công nghệ thông tin, máy tính và hội họp.",
                Icon = "building",
                Color = "cyan",
                SortOrder = 2,
                IsActive = true
            };

            var catTravel = new VocabCategory
            {
                Name = "Travel & Tourism",
                Code = "travel",
                Description = "Từ vựng về du lịch, khách sạn, sân bay, hải quan và phương tiện di chuyển.",
                Icon = "plane",
                Color = "emerald",
                SortOrder = 3,
                IsActive = true
            };

            var catDining = new VocabCategory
            {
                Name = "Dining & Hospitality",
                Code = "dining",
                Description = "Từ vựng nhà hàng, ẩm thực, thực đơn, dịch vụ tiệc và lễ tân khách sạn.",
                Icon = "utensils",
                Color = "amber",
                SortOrder = 4,
                IsActive = true
            };

            db.VocabCategories.AddRange(catBusiness, catOffice, catTravel, catDining);
            db.SaveChanges();

            // Chủ đề 1: Contracts (Hợp đồng)
            var topicContracts = new VocabTopic
            {
                CategoryId = catBusiness.CategoryId,
                Title = "Contracts",
                Code = "contracts",
                Description = "Các điều khoản hợp đồng, ký kết thỏa thuận và quy định pháp lý kinh doanh.",
                Level = "B1",
                Icon = "file-signature",
                SortOrder = 1,
                IsActive = true
            };

            // Chủ đề 2: Marketing (Tiếp thị)
            var topicMarketing = new VocabTopic
            {
                CategoryId = catBusiness.CategoryId,
                Title = "Marketing",
                Code = "marketing",
                Description = "Chiến dịch tiếp thị, quảng cáo, nghiên cứu thị trường và hành vi người tiêu dùng.",
                Level = "B2",
                Icon = "bullhorn",
                SortOrder = 2,
                IsActive = true
            };

            // Chủ đề 3: Warranties (Bảo hành & Cam kết)
            var topicWarranties = new VocabTopic
            {
                CategoryId = catBusiness.CategoryId,
                Title = "Warranties",
                Code = "warranties",
                Description = "Bảo hành sản phẩm, sửa chữa và các cam kết hậu mãi.",
                Level = "B1",
                Icon = "shield-check",
                SortOrder = 3,
                IsActive = true
            };

            // Chủ đề 4: Air Travel (Hàng không du lịch)
            var topicAirTravel = new VocabTopic
            {
                CategoryId = catTravel.CategoryId,
                Title = "Air Travel",
                Code = "air-travel",
                Description = "Thủ tục lên máy bay, hành lý, quá cảnh và thông báo sân bay.",
                Level = "A2",
                Icon = "plane-departure",
                SortOrder = 1,
                IsActive = true
            };

            db.VocabTopics.AddRange(topicContracts, topicMarketing, topicWarranties, topicAirTravel);
            db.SaveChanges();

            // Thêm các từ mẫu chất lượng cao
            var words = new List<VocabWord>
            {
                // Contracts
                new VocabWord
                {
                    TopicId = topicContracts.TopicId,
                    Word = "contract",
                    PartOfSpeech = "noun",
                    PhoneticUs = "/ˈkɑːn.trækt/",
                    PhoneticUk = "/ˈkɒn.trækt/",
                    Meaning = "hợp đồng, giao kèo, khế ước",
                    EnglishDefinition = "A formal written agreement between two or more parties that is legally binding.",
                    ExampleSentence = "Both parties agreed to sign the contract before the end of this month.",
                    ExampleMeaning = "Cả hai bên đã đồng ý ký hợp đồng trước khi kết thúc tháng này.",
                    Collocations = "sign a contract, breach a contract, enter into a contract, contract terms",
                    Synonyms = "agreement, compact, covenant, deal",
                    Antonyms = "breach, disagreement",
                    WordFamily = "contractual (adj), contractor (n), contractually (adv)",
                    MemoryTip = "Con + tract (rút gọn/kéo lại): các bên cùng kéo các điều khoản lại với nhau thành văn bản cam kết.",
                    SortOrder = 1,
                    IsActive = true
                },
                new VocabWord
                {
                    TopicId = topicContracts.TopicId,
                    Word = "abide by",
                    PartOfSpeech = "phrasal verb",
                    PhoneticUs = "/əˈbaɪd baɪ/",
                    PhoneticUk = "/əˈbaɪd baɪ/",
                    Meaning = "tuân thủ, tuân theo",
                    EnglishDefinition = "To accept and follow a rule, decision, agreement, or law.",
                    ExampleSentence = "Players who do not abide by the rules will be disqualified.",
                    ExampleMeaning = "Người chơi không tuân thủ luật sẽ bị loại.",
                    Collocations = "abide by the terms — tuân thủ các điều khoản, abide by the agreement — tuân thủ thỏa thuận, abide by the decision — chấp hành quyết định",
                    Synonyms = "comply with, obey, adhere to",
                    Antonyms = "violate, disregard",
                    WordFamily = "abide · verb · chịu đựng, tuân theo; abiding · adjective · lâu dài, bền lâu",
                    CommonMistakeWrong = "All employees must abide the safety rules in the contract.",
                    CommonMistakeRight = "All employees must abide by the safety rules in the contract.",
                    CommonMistakeNote = "'Abide by' là cụm động từ cố định. Khi mang nghĩa tuân thủ, phải có giới từ 'by'; không dùng 'abide' trực tiếp với tân ngữ.",
                    MemoryTip = "'Abide by' = đi 'by' (cạnh) luật mà sống, tức luôn đi cùng và tuân theo luật.",
                    SortOrder = 2,
                    IsActive = true
                },
                new VocabWord
                {
                    TopicId = topicContracts.TopicId,
                    Word = "assurance",
                    PartOfSpeech = "noun",
                    PhoneticUs = "/əˈʃʊr.əns/",
                    PhoneticUk = "/əˈʃɔː.rəns/",
                    Meaning = "sự cam đoan, sự đảm bảo, sự quả quyết",
                    EnglishDefinition = "A positive declaration intended to give confidence; a promise.",
                    ExampleSentence = "The supplier gave us an assurance that the raw materials would be delivered on time.",
                    ExampleMeaning = "Nhà cung cấp đã cho chúng tôi một sự cam đoan rằng nguyên vật liệu sẽ được giao đúng hạn.",
                    Collocations = "give an assurance, quality assurance, seek assurance",
                    Synonyms = "guarantee, pledge, promise, warrant",
                    Antonyms = "uncertainty, doubt",
                    WordFamily = "assure (v), assured (adj), assuredly (adv)",
                    MemoryTip = "Gốc 'sure' = chắc chắn, assurance là hành động mang lại cảm giác chắc chắn.",
                    SortOrder = 3,
                    IsActive = true
                },
                new VocabWord
                {
                    TopicId = topicContracts.TopicId,
                    Word = "cancellation",
                    PartOfSpeech = "noun",
                    PhoneticUs = "/ˌkæn.səˈleɪ.ʃən/",
                    PhoneticUk = "/ˌkæn.səˈleɪ.ʃən/",
                    Meaning = "sự hủy bỏ, việc bãi bỏ hợp đồng",
                    EnglishDefinition = "The act of stopping or ending an agreement, booking, or event.",
                    ExampleSentence = "The clause specifies the penalty fees in case of early contract cancellation.",
                    ExampleMeaning = "Điều khoản nêu rõ các khoản phí phạt trong trường hợp hủy bỏ hợp đồng sớm.",
                    Collocations = "cancellation clause, cancellation policy, cancel an order",
                    Synonyms = "annulment, termination, revocation",
                    Antonyms = "renewal, confirmation",
                    WordFamily = "cancel (v), cancelled (adj)",
                    MemoryTip = "Cancel + ation -> danh từ của sự hủy bỏ.",
                    SortOrder = 4,
                    IsActive = true
                },
                new VocabWord
                {
                    TopicId = topicContracts.TopicId,
                    Word = "obligate",
                    PartOfSpeech = "verb",
                    PhoneticUs = "/ˈɑː.blə.ɡeɪt/",
                    PhoneticUk = "/ˈɒb.lɪ.ɡeɪt/",
                    Meaning = "bắt buộc, ép buộc về mặt pháp lý hoặc đạo nghĩa",
                    EnglishDefinition = "To bind or compel legally or morally.",
                    ExampleSentence = "The new agreement obligates the enterprise to disclose financial statements quarterly.",
                    ExampleMeaning = "Thỏa thuận mới bắt buộc doanh nghiệp phải công khai báo cáo tài chính hàng quý.",
                    Collocations = "be obligated to do sth, legal obligation",
                    Synonyms = "require, compel, bind, mandate",
                    Antonyms = "exempt, free, release",
                    WordFamily = "obligation (n), obligatory (adj)",
                    MemoryTip = "Obligation = nghĩa vụ, vụ việc bắt buộc bạn phải làm.",
                    SortOrder = 5,
                    IsActive = true
                },

                // Marketing
                new VocabWord
                {
                    TopicId = topicMarketing.TopicId,
                    Word = "attract",
                    PartOfSpeech = "verb",
                    PhoneticUs = "/əˈtrækt/",
                    PhoneticUk = "/əˈtrækt/",
                    Meaning = "thu hút, lôi cuốn, hấp dẫn khách hàng",
                    EnglishDefinition = "To cause someone to be interested in a product, brand, or service.",
                    ExampleSentence = "The discounts offered during Black Friday are intended to attract new shoppers.",
                    ExampleMeaning = "Các chương trình giảm giá dịp Black Friday nhằm mục đích thu hút người mua sắm mới.",
                    Collocations = "attract customers, attract attention, attract investment",
                    Synonyms = "draw, captivate, allure, entice",
                    Antonyms = "repel, discourage, distract",
                    WordFamily = "attraction (n), attractive (adj), attractively (adv)",
                    MemoryTip = "Attraction: điểm thu hút, du lịch -> attract: thu hút ánh nhìn.",
                    SortOrder = 1,
                    IsActive = true
                },
                new VocabWord
                {
                    TopicId = topicMarketing.TopicId,
                    Word = "consume",
                    PartOfSpeech = "verb",
                    PhoneticUs = "/kənˈsuːm/",
                    PhoneticUk = "/kənˈsjuːm/",
                    Meaning = "tiêu thụ, sử dụng sản phẩm hoặc dịch vụ",
                    EnglishDefinition = "To buy goods or services for personal or business use.",
                    ExampleSentence = "Millennials consume a significant amount of media through mobile smartphones.",
                    ExampleMeaning = "Thế hệ Millennials tiêu thụ một lượng lớn phương tiện truyền thông thông qua điện thoại thông minh.",
                    Collocations = "consume energy, consume goods, consumer behavior",
                    Synonyms = "use, expend, absorb, devour",
                    Antonyms = "produce, save, create",
                    WordFamily = "consumer (n), consumption (n), consumable (adj)",
                    MemoryTip = "Consumer (người tiêu dùng) xuất phát từ động từ consume.",
                    SortOrder = 2,
                    IsActive = true
                },
                new VocabWord
                {
                    TopicId = topicMarketing.TopicId,
                    Word = "convince",
                    PartOfSpeech = "verb",
                    PhoneticUs = "/kənˈvɪns/",
                    PhoneticUk = "/kənˈvɪns/",
                    Meaning = "thuyết phục, làm cho tin",
                    EnglishDefinition = "To persuade someone through argument or evidence to believe something or take action.",
                    ExampleSentence = "The salesman managed to convince the client that the premium package was worth the price.",
                    ExampleMeaning = "Người bán hàng đã thuyết phục thành công khách hàng rằng gói cao cấp xứng đáng với mức giá.",
                    Collocations = "convince someone to do sth, fully convinced",
                    Synonyms = "persuade, satisfy, assure, win over",
                    Antonyms = "dissuade, discourage",
                    WordFamily = "convinced (adj), convincing (adj), convincingly (adv)",
                    MemoryTip = "Con (cùng) + vince (chiến thắng): thắng trong lập luận để thuyết phục đối phương.",
                    SortOrder = 3,
                    IsActive = true
                },

                // Air Travel
                new VocabWord
                {
                    TopicId = topicAirTravel.TopicId,
                    Word = "boarding pass",
                    PartOfSpeech = "noun",
                    PhoneticUs = "/ˈbɔːr.dɪŋ ˌpæs/",
                    PhoneticUk = "/ˈbɔː.dɪŋ ˌpɑːs/",
                    Meaning = "thẻ lên máy bay, thẻ lên tàu",
                    EnglishDefinition = "A card or digital document given to a passenger that confirms their seat assignment on a flight.",
                    ExampleSentence = "Please present your boarding pass and passport at the security gate.",
                    ExampleMeaning = "Vui lòng xuất trình thẻ lên máy bay và hộ chiếu tại cổng kiểm tra an ninh.",
                    Collocations = "issue a boarding pass, mobile boarding pass, show boarding pass",
                    Synonyms = "flight ticket, passenger card",
                    Antonyms = null,
                    WordFamily = "board (v), boarding (n)",
                    MemoryTip = "Boarding (lên tàu/máy bay) + pass (thẻ thông hành).",
                    SortOrder = 1,
                    IsActive = true
                },
                new VocabWord
                {
                    TopicId = topicAirTravel.TopicId,
                    Word = "carry-on luggage",
                    PartOfSpeech = "noun",
                    PhoneticUs = "/ˈkær.i.ɑːn ˈlʌɡ.ɪdʒ/",
                    PhoneticUk = "/ˈkær.i.ɒn ˈlʌɡ.ɪdʒ/",
                    Meaning = "hành lý xách tay",
                    EnglishDefinition = "Small bags or cases that passengers are allowed to carry onto the aircraft cabin.",
                    ExampleSentence = "Each passenger is permitted to bring one piece of carry-on luggage weighing up to 7kg.",
                    ExampleMeaning = "Mỗi hành khách được phép mang theo một kiện hành lý xách tay nặng tối đa 7kg.",
                    Collocations = "carry-on luggage size, carry-on bag, cabin luggage",
                    Synonyms = "hand luggage, cabin baggage",
                    Antonyms = "checked luggage",
                    WordFamily = "carry (v), luggage (n)",
                    MemoryTip = "Carry (mang/xách) + on (lên máy bay) = hành lý xách tay.",
                    SortOrder = 2,
                    IsActive = true
                }
            };

            db.VocabWords.AddRange(words);
            db.SaveChanges();
        }

        // 3. Nạp cấu hình mặc định nếu chưa có
        if (!db.VocabSettings.Any())
        {
            var defaultSettings = new List<VocabSetting>
            {
                new VocabSetting { SettingKey = "EnableFlashcards", SettingValue = "true", Description = "Bật chế độ Học thẻ từ vựng (Flashcard)" },
                new VocabSetting { SettingKey = "EnablePhrases", SettingValue = "true", Description = "Bật chế độ Ghép cụm từ (Phrases)" },
                new VocabSetting { SettingKey = "EnableReview", SettingValue = "true", Description = "Bật chế độ Ôn tập ngắt quãng (Spaced Repetition)" },
                new VocabSetting { SettingKey = "EnableQuiz", SettingValue = "true", Description = "Bật bài tập trắc nghiệm và gõ từ kiểm tra" },
                new VocabSetting { SettingKey = "EnableNotebook", SettingValue = "true", Description = "Bật tính năng Sổ tay từ vựng (Bookmarks)" },
                new VocabSetting { SettingKey = "EnableAutoAudio", SettingValue = "true", Description = "Tự động phát âm tiếng Anh khi xem từ mới" },
                new VocabSetting { SettingKey = "DailyNewWordsGoal", SettingValue = "10", Description = "Mục tiêu số từ mới mặc định cần học mỗi ngày" },
                new VocabSetting { SettingKey = "QuizQuestionCount", SettingValue = "5", Description = "Số câu hỏi trắc nghiệm kiểm tra sau mỗi bài học" },
                new VocabSetting { SettingKey = "BannerNotice", SettingValue = "Mỗi ngày 10 từ vựng - Bứt phá điểm số TOEIC và giao tiếp tự tin!", Description = "Thông báo tiêu đề hiển thị trên đầu trang từ vựng" }
            };

            db.VocabSettings.AddRange(defaultSettings);
            db.SaveChanges();
        }

        // 4. Nạp các cặp cụm từ ghép mẫu (Phrases) nếu chưa có
        if (!db.VocabPhrasePairs.Any())
        {
            var defaultPhrases = new List<VocabPhrasePair>
            {
                new VocabPhrasePair
                {
                    TopicCategory = "business",
                    SetTitle = "Contracts",
                    LeftWord = "sign",
                    RightWord = "a contract",
                    Meaning = "ký hợp đồng",
                    SentenceBefore = "Both parties must",
                    SentenceAfter = "before work begins.",
                    SortOrder = 1,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "business",
                    SetTitle = "Contracts",
                    LeftWord = "negotiate",
                    RightWord = "terms",
                    Meaning = "đàm phán điều khoản",
                    SentenceBefore = "The suppliers will",
                    SentenceAfter = "before signing the agreement.",
                    SortOrder = 2,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "business",
                    SetTitle = "Contracts",
                    LeftWord = "reach",
                    RightWord = "an agreement",
                    Meaning = "đạt thỏa thuận",
                    SentenceBefore = "After several discussions, both sides hope to",
                    SentenceAfter = "by Friday.",
                    SortOrder = 3,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "business",
                    SetTitle = "Contracts",
                    LeftWord = "terminate",
                    RightWord = "a contract",
                    Meaning = "chấm dứt hợp đồng",
                    SentenceBefore = "A serious breach may allow the company to",
                    SentenceAfter = "with the supplier.",
                    SortOrder = 4,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "business",
                    SetTitle = "Contracts",
                    LeftWord = "resolve",
                    RightWord = "a dispute",
                    Meaning = "giải quyết tranh chấp",
                    SentenceBefore = "The two parties hired a mediator to",
                    SentenceAfter = "over the payment.",
                    SortOrder = 5,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "business",
                    SetTitle = "Contracts",
                    LeftWord = "resolve",
                    RightWord = "an issue",
                    Meaning = "giải quyết một vấn đề",
                    SentenceBefore = "Please contact support to",
                    SentenceAfter = "with your order.",
                    SortOrder = 6,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "business",
                    SetTitle = "General",
                    LeftWord = "meet",
                    RightWord = "deadlines",
                    Meaning = "đáp ứng thời hạn",
                    SentenceBefore = "Careful planning helps employees",
                    SentenceAfter = "on important projects.",
                    SortOrder = 7,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "business",
                    SetTitle = "General",
                    LeftWord = "achieve",
                    RightWord = "goals",
                    Meaning = "đạt mục tiêu",
                    SentenceBefore = "The team will work together to",
                    SentenceAfter = "set for this quarter.",
                    SortOrder = 8,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "business",
                    SetTitle = "General",
                    LeftWord = "provide",
                    RightWord = "feedback",
                    Meaning = "đưa ra phản hồi",
                    SentenceBefore = "Please",
                    SentenceAfter = "on the draft before we publish it.",
                    SortOrder = 9,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "business",
                    SetTitle = "General",
                    LeftWord = "improve",
                    RightWord = "efficiency",
                    Meaning = "nâng cao hiệu quả",
                    SentenceBefore = "The new software is expected to",
                    SentenceAfter = "in daily operations.",
                    SortOrder = 10,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "toeic",
                    SetTitle = "General",
                    LeftWord = "place",
                    RightWord = "an order",
                    Meaning = "đặt hàng",
                    SentenceBefore = "Customers can",
                    SentenceAfter = "directly through our official website.",
                    SortOrder = 1,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "toeic",
                    SetTitle = "General",
                    LeftWord = "confirm",
                    RightWord = "a reservation",
                    Meaning = "xác nhận đặt chỗ",
                    SentenceBefore = "Please call the hotel to",
                    SentenceAfter = "at least two days prior to arrival.",
                    SortOrder = 2,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "toeic",
                    SetTitle = "General",
                    LeftWord = "submit",
                    RightWord = "an application",
                    Meaning = "nộp đơn",
                    SentenceBefore = "Interested candidates should",
                    SentenceAfter = "before next Monday.",
                    SortOrder = 3,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "finance",
                    SetTitle = "General",
                    LeftWord = "open",
                    RightWord = "an account",
                    Meaning = "mở tài khoản",
                    SentenceBefore = "You need a valid ID to",
                    SentenceAfter = "at the local bank branch.",
                    SortOrder = 1,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "finance",
                    SetTitle = "General",
                    LeftWord = "pay",
                    RightWord = "an invoice",
                    Meaning = "thanh toán hóa đơn",
                    SentenceBefore = "The accounting team will",
                    SentenceAfter = "within thirty business days.",
                    SortOrder = 2,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "travel",
                    SetTitle = "General",
                    LeftWord = "book",
                    RightWord = "a flight",
                    Meaning = "đặt chuyến bay",
                    SentenceBefore = "Travelers are advised to",
                    SentenceAfter = "at least two months early to get the best deal.",
                    SortOrder = 1,
                    IsActive = true
                },
                new VocabPhrasePair
                {
                    TopicCategory = "dining",
                    SetTitle = "General",
                    LeftWord = "reserve",
                    RightWord = "a table",
                    Meaning = "đặt bàn",
                    SentenceBefore = "We recommend calling ahead to",
                    SentenceAfter = "for weekend dinners.",
                    SortOrder = 1,
                    IsActive = true
                }
            };

            db.VocabPhrasePairs.AddRange(defaultPhrases);
            db.SaveChanges();
        }

        // 5. Đảm bảo đầy đủ các danh mục và chủ đề chuẩn MVC cho trang học viên (chỉ chạy khi DB chưa có bất kỳ danh mục nào)
        if (!db.VocabCategories.Any())
        {
            EnsureRichCategoriesAndTopics(db);
        }

        // 6. Tự động đồng bộ và dọn dẹp các cụm từ mồ côi (không thuộc bộ từ đang hoạt động nào)
        SyncAndCleanOrphanPhrases(db);
    }

    private static void SyncAndCleanOrphanPhrases(AppDbContext db)
    {
        try
        {
            var activeTopics = db.VocabTopics.AsNoTracking()
                .Where(t => !t.IsDeleted && t.IsActive && t.Category != null && !t.Category.IsDeleted && t.Category.IsActive)
                .Select(t => new { Category = t.Category!.Code.Trim().ToLower(), Title = t.Title.Trim().ToLower() })
                .ToList();
            var activeTopicSet = activeTopics.Select(t => $"{t.Category}:{t.Title}").ToHashSet();

            var orphanPhrases = db.VocabPhrasePairs
                .Where(p => !p.IsDeleted)
                .ToList();

            bool changed = false;
            foreach (var p in orphanPhrases)
            {
                var cat = (p.TopicCategory ?? "").Trim().ToLower();
                var title = (p.SetTitle ?? "").Trim().ToLower();
                if (string.Equals(title, "general", StringComparison.OrdinalIgnoreCase) || !activeTopicSet.Contains($"{cat}:{title}"))
                {
                    p.IsDeleted = true;
                    p.IsActive = false;
                    p.UpdatedAt = DateTime.UtcNow;
                    changed = true;
                }
            }

            if (changed)
            {
                db.SaveChanges();
            }
        }
        catch
        {
            // Bỏ qua lỗi nếu bảng chưa sẵn sàng
        }
    }

    private static void EnsureRichCategoriesAndTopics(AppDbContext db)
    {
        // Danh sách danh mục chuẩn
        var categoryDefs = new[]
        {
            new { Code = "business", Name = "Business & Workplace", Icon = "briefcase", Color = "fuchsia", Sort = 1 },
            new { Code = "office", Name = "Office & Technology", Icon = "building", Color = "cyan", Sort = 2 },
            new { Code = "toeic", Name = "TOEIC Essentials", Icon = "award", Color = "amber", Sort = 3 },
            new { Code = "finance", Name = "Finance & Banking", Icon = "chart-line", Color = "emerald", Sort = 4 },
            new { Code = "health", Name = "Health & Medical", Icon = "heart-pulse", Color = "rose", Sort = 5 },
            new { Code = "travel", Name = "Travel & Tourism", Icon = "plane", Color = "cyan", Sort = 6 },
            new { Code = "dining", Name = "Dining & Hospitality", Icon = "utensils", Color = "orange", Sort = 7 }
        };

        foreach (var c in categoryDefs)
        {
            var exists = db.VocabCategories.Any(x => x.Code == c.Code);
            if (!exists)
            {
                var cat = new VocabCategory
                {
                    Name = c.Name,
                    Code = c.Code,
                    Icon = c.Icon,
                    Color = c.Color,
                    SortOrder = c.Sort,
                    IsActive = true
                };
                db.VocabCategories.Add(cat);
                db.SaveChanges();
            }
        }

        // Đảm bảo các Topic chính tồn tại (chỉ tạo nếu chưa từng tồn tại kể cả khi đã xóa mềm)
        var catBiz = db.VocabCategories.FirstOrDefault(x => x.Code == "business" && !x.IsDeleted);
        var catOff = db.VocabCategories.FirstOrDefault(x => x.Code == "office" && !x.IsDeleted);
        var catToeic = db.VocabCategories.FirstOrDefault(x => x.Code == "toeic" && !x.IsDeleted);
        var catFin = db.VocabCategories.FirstOrDefault(x => x.Code == "finance" && !x.IsDeleted);
        var catHea = db.VocabCategories.FirstOrDefault(x => x.Code == "health" && !x.IsDeleted);
        var catTra = db.VocabCategories.FirstOrDefault(x => x.Code == "travel" && !x.IsDeleted);
        var catDin = db.VocabCategories.FirstOrDefault(x => x.Code == "dining" && !x.IsDeleted);

        if (catBiz != null)
        {
            EnsureTopic(db, catBiz.CategoryId, "Contracts", "contracts", "B1", "file-signature", 1);
            EnsureTopic(db, catBiz.CategoryId, "Business Planning", "business-planning", "B2", "chart-pie", 2);
            EnsureTopic(db, catBiz.CategoryId, "Conferences", "conferences", "B1", "users", 3);
            EnsureTopic(db, catBiz.CategoryId, "Marketing", "marketing", "B2", "bullhorn", 4);
            EnsureTopic(db, catBiz.CategoryId, "Salaries & Benefits", "salaries-benefits", "B1", "money-bill-wave", 5);
            EnsureTopic(db, catBiz.CategoryId, "Hiring & Training", "hiring-training", "B1", "user-plus", 6);
        }

        if (catOff != null)
        {
            EnsureTopic(db, catOff.CategoryId, "Office Technology", "office-technology", "B1", "laptop", 1);
            EnsureTopic(db, catOff.CategoryId, "Office Procedures", "office-procedures", "A2", "list-check", 2);
            EnsureTopic(db, catOff.CategoryId, "Correspondence", "correspondence", "B1", "envelope", 3);
        }

        if (catToeic != null)
        {
            EnsureTopic(db, catToeic.CategoryId, "General Business", "general-business", "TOEIC", "briefcase", 1);
            EnsureTopic(db, catToeic.CategoryId, "Invoices & Orders", "invoices-orders", "TOEIC", "file-invoice", 2);
        }

        if (catFin != null)
        {
            EnsureTopic(db, catFin.CategoryId, "Banking & Accounts", "banking-accounts", "B2", "building-columns", 1);
            EnsureTopic(db, catFin.CategoryId, "Investments", "investments", "C1", "piggy-bank", 2);
        }

        if (catHea != null)
        {
            EnsureTopic(db, catHea.CategoryId, "Doctor's Appointment", "doctors-appointment", "A2", "stethoscope", 1);
            EnsureTopic(db, catHea.CategoryId, "Healthy Lifestyle", "healthy-lifestyle", "B1", "apple-whole", 2);
        }

        if (catTra != null)
        {
            EnsureTopic(db, catTra.CategoryId, "Air Travel", "air-travel", "A2", "plane-departure", 1);
            EnsureTopic(db, catTra.CategoryId, "Hotels & Stays", "hotels-stays", "B1", "hotel", 2);
        }

        if (catDin != null)
        {
            EnsureTopic(db, catDin.CategoryId, "Dining Out", "dining-out", "A2", "utensils", 1);
            EnsureTopic(db, catDin.CategoryId, "Food & Menus", "food-menus", "B1", "bowl-food", 2);
        }

        // Nạp từ cho Business Planning nếu chưa có
        var topBp = db.VocabTopics.FirstOrDefault(t => t.Title == "Business Planning" && !t.IsDeleted);
        if (topBp != null && !db.VocabWords.Any(w => w.TopicId == topBp.TopicId))
        {
            db.VocabWords.AddRange(
                new VocabWord
                {
                    TopicId = topBp.TopicId,
                    Word = "strategy",
                    PartOfSpeech = "noun",
                    PhoneticUs = "/ˈstræt.ə.dʒi/",
                    PhoneticUk = "/ˈstræt.ə.dʒi/",
                    Meaning = "chiến lược",
                    EnglishDefinition = "A plan of action designed to achieve a long-term or overall aim.",
                    ExampleSentence = "The board approved a new marketing strategy for the coming year.",
                    ExampleMeaning = "Hội đồng quản trị đã phê duyệt chiến lược tiếp thị mới cho năm tới.",
                    Collocations = "business strategy, develop a strategy, long-term strategy",
                    Synonyms = "plan, approach, policy",
                    Antonyms = "improvisation",
                    WordFamily = "strategic (adj), strategist (n), strategically (adv)",
                    MemoryTip = "Strategy = bức tranh kế hoạch tổng thể dài hạn để đạt mục tiêu lớn.",
                    CommonMistakeWrong = "make a strategy for to grow",
                    CommonMistakeRight = "develop a strategy to grow",
                    CommonMistakeNote = "Dùng develop/formulate a strategy đi với to-infinitive.",
                    SortOrder = 1,
                    IsActive = true
                },
                new VocabWord
                {
                    TopicId = topBp.TopicId,
                    Word = "forecast",
                    PartOfSpeech = "noun",
                    PhoneticUs = "/ˈfɔːr.kæst/",
                    PhoneticUk = "/ˈfɔː.kɑːst/",
                    Meaning = "dự báo",
                    EnglishDefinition = "A statement about what will happen in the future, based on information available now.",
                    ExampleSentence = "The sales forecast for the next quarter looks very promising.",
                    ExampleMeaning = "Dự báo doanh số cho quý tới có vẻ rất khả quan.",
                    Collocations = "sales forecast, financial forecast",
                    Synonyms = "prediction, projection, estimate",
                    Antonyms = "hindsight",
                    WordFamily = "forecast (v), forecaster (n)",
                    MemoryTip = "Fore (trước) + cast (chiếu): nhìn thấy và dự báo trước tương lai.",
                    SortOrder = 2,
                    IsActive = true
                },
                new VocabWord
                {
                    TopicId = topBp.TopicId,
                    Word = "demonstrate",
                    PartOfSpeech = "verb",
                    PhoneticUs = "/ˈdem.ən.streɪt/",
                    PhoneticUk = "/ˈdem.ən.streɪt/",
                    Meaning = "thể hiện; chứng minh",
                    EnglishDefinition = "To show clearly that someone has a skill or that something is true.",
                    ExampleSentence = "Applicants must demonstrate strong communication skills during the interview.",
                    ExampleMeaning = "Ứng viên phải thể hiện kỹ năng giao tiếp tốt trong buổi phỏng vấn.",
                    Collocations = "demonstrate an ability, demonstrate commitment",
                    Synonyms = "show, prove, display",
                    WordFamily = "demonstration (n), demonstrator (n), demonstrable (adj)",
                    MemoryTip = "Demonstrate = đưa ra để người khác thấy rõ: vừa chứng minh, vừa trình diễn.",
                    SortOrder = 3,
                    IsActive = true
                }
            );
            db.SaveChanges();
        }

        // Nạp từ cho Office Technology nếu chưa có
        var topOt = db.VocabTopics.FirstOrDefault(t => t.Title == "Office Technology" && !t.IsDeleted);
        if (topOt != null && !db.VocabWords.Any(w => w.TopicId == topOt.TopicId))
        {
            db.VocabWords.AddRange(
                new VocabWord
                {
                    TopicId = topOt.TopicId,
                    Word = "affordable",
                    PartOfSpeech = "adjective",
                    PhoneticUs = "/əˈfɔːr.də.bəl/",
                    PhoneticUk = "/əˈfɔː.də.bl/",
                    Meaning = "có giá phải chăng; vừa túi tiền",
                    EnglishDefinition = "Not too expensive for people to buy.",
                    ExampleSentence = "The company offers affordable insurance plans for small businesses.",
                    ExampleMeaning = "Công ty cung cấp các gói bảo hiểm có giá phải chăng cho doanh nghiệp nhỏ.",
                    Collocations = "affordable price, affordable housing, affordable option",
                    Synonyms = "inexpensive, economical",
                    Antonyms = "expensive, unaffordable",
                    WordFamily = "afford (v), affordability (n)",
                    MemoryTip = "Afford (chi trả được) + able = có thể chi trả được.",
                    SortOrder = 1,
                    IsActive = true
                },
                new VocabWord
                {
                    TopicId = topOt.TopicId,
                    Word = "install",
                    PartOfSpeech = "verb",
                    PhoneticUs = "/ɪnˈstɔːl/",
                    PhoneticUk = "/ɪnˈstɔːl/",
                    Meaning = "cài đặt; lắp đặt",
                    EnglishDefinition = "To put a piece of equipment somewhere and connect it so that it is ready to be used.",
                    ExampleSentence = "The technician will install the new software tomorrow morning.",
                    ExampleMeaning = "Kỹ thuật viên sẽ cài đặt phần mềm mới vào sáng mai.",
                    Collocations = "install software, install a system",
                    Synonyms = "set up, fit",
                    WordFamily = "installation (n), installer (n)",
                    SortOrder = 2,
                    IsActive = true
                }
            );
            db.SaveChanges();
        }

        EnsureWordPartyWithSenses(db);
    }

    private static void EnsureWordPartyWithSenses(AppDbContext db)
    {
        try
        {
            var partySenses = new List<VocabWordSense>
            {
                new VocabWordSense
                {
                    PartOfSpeech = "noun",
                    Meaning = "bên (tham gia hợp đồng)",
                    EnglishDefinition = "A person or group involved in a legal contract, agreement, or dispute.",
                    Examples = new List<VocabSenseExample>
                    {
                        new VocabSenseExample { En = "Both parties must sign the agreement before it becomes valid.", Vi = "Cả hai bên phải ký vào thỏa thuận trước khi nó có hiệu lực." },
                        new VocabSenseExample { En = "The third party will mediate the negotiation between us.", Vi = "Bên thứ ba sẽ làm trung gian cho cuộc đàm phán giữa chúng tôi." }
                    },
                    Collocations = "third party — bên thứ ba, interested party — bên có liên quan, contracting party — bên ký kết, both parties — cả hai bên",
                    Synonyms = "side, signatory",
                    Antonyms = ""
                },
                new VocabWordSense
                {
                    PartOfSpeech = "noun",
                    Meaning = "buổi tiệc",
                    EnglishDefinition = "A social gathering of invited guests for entertainment.",
                    Examples = new List<VocabSenseExample>
                    {
                        new VocabSenseExample { En = "The company is hosting a party to celebrate its anniversary.", Vi = "Công ty tổ chức một bữa tiệc để kỷ niệm ngày thành lập." },
                        new VocabSenseExample { En = "We had a small party at home for her birthday.", Vi = "Chúng tôi đã tổ chức một bữa tiệc nhỏ tại nhà cho sinh nhật cô ấy." }
                    },
                    Collocations = "throw a party — tổ chức tiệc, birthday party — tiệc sinh nhật, office party — tiệc văn phòng",
                    Synonyms = "gathering, celebration",
                    Antonyms = ""
                },
                new VocabWordSense
                {
                    PartOfSpeech = "noun",
                    Meaning = "đảng phái chính trị",
                    EnglishDefinition = "A formally organized political group with shared opinions.",
                    Examples = new List<VocabSenseExample>
                    {
                        new VocabSenseExample { En = "He has been a member of the Labour Party for ten years.", Vi = "Ông ấy đã là thành viên Đảng Lao động được mười năm." },
                        new VocabSenseExample { En = "The two main political parties debated on national television.", Vi = "Hai đảng chính trị lớn đã tranh luận trên truyền hình quốc gia." }
                    },
                    Collocations = "political party — đảng chính trị, ruling party — đảng cầm quyền, opposition party — đảng đối lập",
                    Synonyms = "faction",
                    Antonyms = ""
                }
            };

            var sensesJson = System.Text.Json.JsonSerializer.Serialize(partySenses);
            var existingWord = db.VocabWords.FirstOrDefault(w => w.Word.ToLower() == "party" && !w.IsDeleted);

            if (existingWord != null)
            {
                existingWord.Meaning = "bên (tham gia hợp đồng)";
                existingWord.PartOfSpeech = "noun";
                existingWord.EnglishDefinition = "A person or group involved in a legal contract, agreement, or dispute.";
                existingWord.ExampleSentence = "Both parties must sign the agreement before it becomes valid.\nThe third party will mediate the negotiation between us.";
                existingWord.ExampleMeaning = "Cả hai bên phải ký vào thỏa thuận trước khi nó có hiệu lực.\nBên thứ ba sẽ làm trung gian cho cuộc đàm phán giữa chúng tôi.";
                existingWord.Collocations = "third party — bên thứ ba, interested party — bên có liên quan, contracting party — bên ký kết, both parties — cả hai bên";
                existingWord.Synonyms = "side, signatory";
                existingWord.SensesJson = sensesJson;
                db.SaveChanges();
            }
            else
            {
                var topic = db.VocabTopics.FirstOrDefault(t => t.Code == "contracts" || t.Title == "Contracts")
                            ?? db.VocabTopics.FirstOrDefault();
                if (topic != null)
                {
                    db.VocabWords.Add(new VocabWord
                    {
                        TopicId = topic.TopicId,
                        Word = "party",
                        PartOfSpeech = "noun",
                        PhoneticUs = "/ˈpɑːr.t̬i/",
                        PhoneticUk = "/ˈpɑː.ti/",
                        Meaning = "bên (tham gia hợp đồng)",
                        EnglishDefinition = "A person or group involved in a legal contract, agreement, or dispute.",
                        ExampleSentence = "Both parties must sign the agreement before it becomes valid.\nThe third party will mediate the negotiation between us.",
                        ExampleMeaning = "Cả hai bên phải ký vào thỏa thuận trước khi nó có hiệu lực.\nBên thứ ba sẽ làm trung gian cho cuộc đàm phán giữa chúng tôi.",
                        Collocations = "third party — bên thứ ba, interested party — bên có liên quan, contracting party — bên ký kết, both parties — cả hai bên",
                        Synonyms = "side, signatory",
                        WordFamily = "party · noun · bên tham gia, buổi tiệc, đảng phái",
                        SensesJson = sensesJson,
                        SortOrder = 3,
                        IsActive = true
                    });
                    db.SaveChanges();
                }
            }
        }
        catch
        {
            // Bỏ qua nếu có lỗi seed
        }
    }

    private static void EnsureTopic(AppDbContext db, int categoryId, string title, string code, string level, string icon, int sortOrder)
    {
        var existing = db.VocabTopics.Any(t => t.CategoryId == categoryId && (t.Title == title || t.Code == code));
        if (!existing)
        {
            db.VocabTopics.Add(new VocabTopic
            {
                CategoryId = categoryId,
                Title = title,
                Code = code,
                Level = level,
                Icon = icon,
                SortOrder = sortOrder,
                IsActive = true
            });
            db.SaveChanges();
        }
    }
}
