using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;

namespace StudyEnglish.Services;

public sealed class VocabCoreSuggestionResult
{
    public string Word { get; set; } = string.Empty;
    public string PartOfSpeech { get; set; } = "noun";
    public string PhoneticUs { get; set; } = string.Empty;
    public string PhoneticUk { get; set; } = string.Empty;
    public string Meaning { get; set; } = string.Empty;
    public string AudioUrl { get; set; } = string.Empty;
    public string EnglishDefinition { get; set; } = string.Empty;
    public string Source { get; set; } = "dictionary-api";
}

public sealed class VocabExamplePairResult
{
    public string En { get; set; } = string.Empty;
    public string Vi { get; set; } = string.Empty;
}

public sealed class VocabLessonSuggestionResult
{
    public string EnglishDefinition { get; set; } = string.Empty;
    public List<VocabExamplePairResult> ExtraExamples { get; set; } = [];
    public List<string> Collocations { get; set; } = [];
    public List<string> Synonyms { get; set; } = [];
    public List<string> Antonyms { get; set; } = [];
    public List<string> WordFamily { get; set; } = [];
    public string CommonMistakeWrong { get; set; } = string.Empty;
    public string CommonMistakeRight { get; set; } = string.Empty;
    public string CommonMistakeNote { get; set; } = string.Empty;
    public string MemoryTip { get; set; } = string.Empty;
    public string Source { get; set; } = "smart-fallback";
}

public sealed class VocabQuizDbPreviewResult
{
    public List<string> Distractors { get; set; } = [];
    public int SameTopicCount { get; set; }
    public int SameTopicPosCount { get; set; }
    public bool IsLowTopicPool { get; set; }
    public string Source { get; set; } = "database-4-tier";
}

public sealed class VocabQuizAiTrapsResult
{
    public List<string> Distractors { get; set; } = [];
    public string Note { get; set; } = string.Empty;
    public string Source { get; set; } = "smart-fallback";
}

public sealed class VocabTypingSuggestionResult
{
    public string ExampleSentence { get; set; } = string.Empty;
    public string ExampleMeaning { get; set; } = string.Empty;
    public string Source { get; set; } = "smart-fallback";
}

public sealed class VocabPhraseSuggestionResult
{
    public string FocusWord { get; set; } = string.Empty;
    public string LeftWord { get; set; } = string.Empty;
    public string RightWord { get; set; } = string.Empty;
    public string Meaning { get; set; } = string.Empty;
    public string SentenceBefore { get; set; } = string.Empty;
    public string SentenceAfter { get; set; } = string.Empty;
    public string Source { get; set; } = "smart-fallback";
}

public sealed class VocabAiSuggestionService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(20) };

    public VocabAiSuggestionService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    private (string Provider, string ApiKey, string Model) ResolveAiCredentials()
    {
        var preferred = (_config["AiSettings:Provider"] ?? "Auto").Trim().ToLowerInvariant();
        var geminiKey = (_config["AiSettings:GeminiApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? string.Empty).Trim();
        var openAiKey = (_config["AiSettings:OpenAiApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty).Trim();

        if ((preferred == "openai" || (preferred == "auto" && string.IsNullOrEmpty(geminiKey))) && !string.IsNullOrEmpty(openAiKey))
        {
            var model = (_config["AiSettings:OpenAiModel"] ?? "gpt-4o-mini").Trim();
            return ("openai", openAiKey, model);
        }
        if (!string.IsNullOrEmpty(geminiKey))
        {
            var model = (_config["AiSettings:GeminiModel"] ?? "gemini-2.0-flash").Trim();
            return ("gemini", geminiKey, model);
        }
        return ("none", string.Empty, string.Empty);
    }

    // ===== PHẦN 1: THÔNG TIN TỪ (ƯU TIÊN DICTIONARY API = 0 TOKEN) =====
    public async Task<VocabCoreSuggestionResult> SuggestCoreInfoAsync(string rawWord, string? preferredPos = null)
    {
        var clean = (rawWord ?? string.Empty).Trim();
        var result = new VocabCoreSuggestionResult { Word = clean };
        if (string.IsNullOrWhiteSpace(clean)) return result;

        var hasExplicitPos = !string.IsNullOrWhiteSpace(preferredPos);
        var targetPos = hasExplicitPos ? NormalizePos(preferredPos) : string.Empty;

        // 1. Kiểm tra nếu từ đã tồn tại trong CSDL (ưu tiên khớp đúng PartOfSpeech nếu admin đã chọn)
        var dbMatches = await _context.VocabWords.AsNoTracking()
            .Where(w => !w.IsDeleted && w.Word.ToLower() == clean.ToLower())
            .OrderByDescending(w => !string.IsNullOrEmpty(w.AudioUrl))
            .ToListAsync();

        var exactPosDb = hasExplicitPos
            ? dbMatches.FirstOrDefault(w => NormalizePos(w.PartOfSpeech) == targetPos)
            : dbMatches.FirstOrDefault();
        var sharedPhoneticDb = exactPosDb ?? dbMatches.FirstOrDefault();

        if (sharedPhoneticDb != null)
        {
            result.PhoneticUs = sharedPhoneticDb.PhoneticUs ?? string.Empty;
            result.PhoneticUk = sharedPhoneticDb.PhoneticUk ?? string.Empty;
            result.AudioUrl = NormalizeAudioUrl(sharedPhoneticDb.AudioUrl);
        }

        if (exactPosDb != null)
        {
            result.PartOfSpeech = NormalizePos(exactPosDb.PartOfSpeech);
            result.Meaning = exactPosDb.Meaning ?? string.Empty;
            result.EnglishDefinition = exactPosDb.EnglishDefinition ?? string.Empty;
            result.Source = "database-cache";
        }
        else if (hasExplicitPos)
        {
            result.PartOfSpeech = targetPos;
        }

        // 2. Gọi Free Dictionary API chuẩn hóa IPA US/UK + Audio + Definition khớp POS (0 token)
        var dictData = await FetchDictionaryEntryAsync(clean, hasExplicitPos ? targetPos : null);
        if (dictData.Found)
        {
            if (string.IsNullOrWhiteSpace(result.PartOfSpeech) && !string.IsNullOrWhiteSpace(dictData.PartOfSpeech))
                result.PartOfSpeech = NormalizePos(dictData.PartOfSpeech);
            if (string.IsNullOrWhiteSpace(result.PhoneticUs)) result.PhoneticUs = dictData.PhoneticUs;
            if (string.IsNullOrWhiteSpace(result.PhoneticUk)) result.PhoneticUk = dictData.PhoneticUk;
            if (string.IsNullOrWhiteSpace(result.AudioUrl)) result.AudioUrl = dictData.AudioUrl;
            if (string.IsNullOrWhiteSpace(result.EnglishDefinition)) result.EnglishDefinition = dictData.EnglishDefinition;
            result.Source = exactPosDb != null ? "database+dictionary-api" : "dictionary-api";
        }

        var resolvedPos = string.IsNullOrWhiteSpace(result.PartOfSpeech) ? "noun" : result.PartOfSpeech;

        // 3. Nếu thiếu nghĩa tiếng Việt -> dịch nhanh theo ngữ cảnh từ loại (0 token)
        if (string.IsNullOrWhiteSpace(result.Meaning))
        {
            result.Meaning = await TranslateHeadwordByPosAsync(clean, resolvedPos) ?? string.Empty;
        }

        // 4. Chỉ dùng LLM cho Phần 1 nếu vẫn thiếu dữ liệu chuẩn tắc và có API key
        if (string.IsNullOrWhiteSpace(result.Meaning) || string.IsNullOrWhiteSpace(result.PhoneticUs) || string.IsNullOrWhiteSpace(result.EnglishDefinition))
        {
            var posHint = hasExplicitPos
                ? $"Use partOfSpeech=\"{targetPos}\" specifically."
                : "Choose the most common TOEIC/business partOfSpeech.";
            var prompt = $@"Return strict JSON for the English word ""{clean}"":
{posHint}
{{
  ""partOfSpeech"": ""noun|verb|adjective|adverb|phrase|preposition"",
  ""phoneticUs"": ""/IPA US/"",
  ""phoneticUk"": ""/IPA UK/"",
  ""englishDefinition"": ""concise learner-friendly English definition matching this part of speech"",
  ""meaning"": ""concise natural Vietnamese meaning (1-5 words)""
}}";
            var (aiJson, aiSource) = await CallLlmJsonAsync(prompt);
            if (aiJson != null)
            {
                if (!hasExplicitPos && string.IsNullOrWhiteSpace(result.PartOfSpeech))
                {
                    var pos = GetJsonString(aiJson.Value, "partOfSpeech");
                    if (!string.IsNullOrWhiteSpace(pos)) result.PartOfSpeech = NormalizePos(pos);
                }
                if (string.IsNullOrWhiteSpace(result.PhoneticUs)) result.PhoneticUs = GetJsonString(aiJson.Value, "phoneticUs");
                if (string.IsNullOrWhiteSpace(result.PhoneticUk)) result.PhoneticUk = GetJsonString(aiJson.Value, "phoneticUk");
                if (string.IsNullOrWhiteSpace(result.EnglishDefinition)) result.EnglishDefinition = GetJsonString(aiJson.Value, "englishDefinition");
                if (string.IsNullOrWhiteSpace(result.Meaning)) result.Meaning = GetJsonString(aiJson.Value, "meaning");
                result.Source = $"dictionary+{aiSource}";
            }
        }

        if (string.IsNullOrWhiteSpace(result.PhoneticUk)) result.PhoneticUk = result.PhoneticUs;
        if (string.IsNullOrWhiteSpace(result.PartOfSpeech)) result.PartOfSpeech = "noun";
        return result;
    }

    // ===== PHẦN 2: BÀI HỌC (100% LLM JSON TAGS + DICTIONARY/DATAMUSE ĐÃ KIỂM CHỨNG) =====
    public async Task<VocabLessonSuggestionResult> SuggestLessonContentAsync(string word, string? pos, string? meaning, string? topicTitle)
    {
        var clean = (word ?? string.Empty).Trim();
        var cleanPos = NormalizePos(pos);
        var cleanMeaning = await ResolveMissingMeaningAsync(clean, cleanPos, meaning);
        var cleanTopic = string.IsNullOrWhiteSpace(topicTitle) ? "Business & TOEIC" : topicTitle.Trim();

        var prompt = $@"You are an expert TOEIC / workplace English lexicographer for Vietnamese learners.
Generate accurate, strictly verified lesson data as JSON for:
- Headword: ""{clean}""
- PartOfSpeech: ""{cleanPos}"" (ALL definitions, examples, synonyms, antonyms, and collocations MUST match this exact part of speech!)
- Vietnamese Meaning: ""{cleanMeaning}""
- Topic: ""{cleanTopic}""

Quality rules:
1. Never invent non-existent English words in wordFamily. Only include real dictionary words sharing the same root (max 4 entries).
2. extraExamples sentences MUST be full, natural workplace/TOEIC sentences WITHOUT square brackets [...].
3. collocations MUST include ""{clean}"" (or its inflection) and follow exact format ""English phrase — concise Vietnamese meaning"".
4. synonyms and antonyms MUST share the exact PartOfSpeech ""{cleanPos}"" and must NOT include ""{clean}"" itself.
5. commonMistakeWrong / commonMistakeRight must show a realistic grammar/preposition/collocation mistake made by Vietnamese learners.

Return ONLY valid JSON with these exact keys:
{{
  ""englishDefinition"": ""concise learner-friendly English definition for {clean} ({cleanPos})"",
  ""extraExamples"": [{{ ""en"": ""natural workplace sentence 1"", ""vi"": ""Vietnamese translation 1"" }}, {{ ""en"": ""natural workplace sentence 2"", ""vi"": ""Vietnamese translation 2"" }}],
  ""collocations"": [""3-5 entries in exact format: 'English phrase — concise Vietnamese meaning'""],
  ""synonyms"": [""3-4 single-word/phrase synonyms matching {cleanPos}""],
  ""antonyms"": [""2-4 antonyms matching {cleanPos}""],
  ""wordFamily"": [""real_word · noun|verb|adjective|adverb · ngắn gọn nghĩa tiếng Việt""],
  ""commonMistakeWrong"": ""one common incorrect English sentence by Vietnamese learners"",
  ""commonMistakeRight"": ""the corrected English sentence"",
  ""commonMistakeNote"": ""brief Vietnamese explanation of the mistake"",
  ""memoryTip"": ""concise Vietnamese mnemonic or root-word memory tip""
}}";

        var (aiJson, aiSource) = await CallLlmJsonAsync(prompt);
        if (aiJson != null)
        {
            var root = aiJson.Value;
            var cleanedExamples = GetJsonExamplePairs(root, "extraExamples")
                .Select(ex => new VocabExamplePairResult { En = StripBrackets(ex.En), Vi = ex.Vi })
                .ToList();

            var synonyms = CleanRelatedWordList(GetJsonStringArray(root, "synonyms"), clean, 5);
            var antonyms = CleanRelatedWordList(GetJsonStringArray(root, "antonyms"), clean, 4);
            var family = GetJsonStringArray(root, "wordFamily")
                .Where(x => x.Contains('·') || x.Contains('-'))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(5)
                .ToList();

            return new VocabLessonSuggestionResult
            {
                EnglishDefinition = GetJsonString(root, "englishDefinition"),
                ExtraExamples = cleanedExamples,
                Collocations = NormalizeCollocationPairs(GetJsonStringArray(root, "collocations")),
                Synonyms = synonyms,
                Antonyms = antonyms,
                WordFamily = family,
                CommonMistakeWrong = GetJsonString(root, "commonMistakeWrong"),
                CommonMistakeRight = GetJsonString(root, "commonMistakeRight"),
                CommonMistakeNote = GetJsonString(root, "commonMistakeNote"),
                MemoryTip = GetJsonString(root, "memoryTip"),
                Source = aiSource
            };
        }

        // Fallback không cần API key: Dictionary API (đúng POS) + Datamuse verified words (không tự bịa từ)
        var dictData = await FetchDictionaryEntryAsync(clean, cleanPos);
        var (dmCollocs, dmSyns, dmAnts, dmFamily) = await FetchDatamuseRichDataAsync(clean, cleanPos, cleanMeaning);

        var fbSynonyms = dictData.Synonyms.Concat(dmSyns)
            .Where(s => !string.Equals(s, clean, StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        var fbAntonyms = dictData.Antonyms.Concat(dmAnts)
            .Where(s => !string.Equals(s, clean, StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(4)
            .ToList();

        var rawCollocations = dmCollocs
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(4)
            .ToList();

        var collocations = rawCollocations.Count > 0
            ? await EnrichCollocationsWithVietnameseAsync(rawCollocations)
            : BuildFallbackCollocations(clean, cleanPos, cleanMeaning);

        var extraExamples = await BuildFallbackExtraExamplesAsync(clean, cleanPos, cleanMeaning, dictData.ExampleSentence);

        var (_, _, note) = BuildFallbackCommonMistake(clean, cleanPos);
        var firstCollocEn = (collocations.FirstOrDefault() ?? clean).Split(" — ")[0];
        var tip = !string.IsNullOrWhiteSpace(cleanMeaning)
            ? $"Gắn \"{clean}\" ({cleanPos}) với cụm \"{firstCollocEn}\" để nhớ nghĩa \"{cleanMeaning}\" theo ngữ cảnh TOEIC."
            : $"Học \"{clean}\" qua cụm \"{firstCollocEn}\" trong chủ đề {cleanTopic}.";

        return new VocabLessonSuggestionResult
        {
            EnglishDefinition = dictData.EnglishDefinition,
            ExtraExamples = extraExamples,
            Collocations = collocations,
            Synonyms = fbSynonyms,
            Antonyms = fbAntonyms,
            WordFamily = dmFamily,
            CommonMistakeWrong = string.Empty,
            CommonMistakeRight = string.Empty,
            CommonMistakeNote = note,
            MemoryTip = tip,
            Source = $"dictionary+datamuse-fallback ({aiSource})"
        };
    }

    // ===== PHẦN 3A: QUIZ MẶC ĐỊNH TỪ CSDL (0 TOKEN) =====
    public async Task<VocabQuizDbPreviewResult> PreviewDatabaseQuizDistractorsAsync(int wordId, int topicId, string? pos, string? meaning)
    {
        var targetPos = NormalizePos(pos);
        var targetMeaning = (meaning ?? string.Empty).Trim();
        var targetNorm = NormalizePhrase(targetMeaning);
        var targetLen = targetMeaning.Length;

        var targetInfo = wordId > 0
            ? await _context.VocabWords.AsNoTracking()
                .Where(w => w.WordId == wordId)
                .Select(w => new { w.Word, w.Synonyms })
                .FirstOrDefaultAsync()
            : null;

        var targetWordNorm = NormalizePhrase(targetInfo?.Word);
        var targetSynonymSet = new HashSet<string>(SplitTokens(targetInfo?.Synonyms), StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrEmpty(targetWordNorm)) targetSynonymSet.Add(targetWordNorm);

        var candidates = await _context.VocabWords.AsNoTracking()
            .Where(w => !w.IsDeleted && w.IsActive && w.WordId != wordId && !string.IsNullOrEmpty(w.Meaning))
            .Select(w => new
            {
                w.WordId,
                w.Word,
                w.TopicId,
                w.PartOfSpeech,
                w.Meaning,
                w.Synonyms
            })
            .ToListAsync();

        int sameTopicCount = candidates.Count(c => c.TopicId == topicId) + (wordId > 0 || !string.IsNullOrWhiteSpace(targetMeaning) ? 1 : 0);
        int sameTopicPosCount = candidates.Count(c => c.TopicId == topicId && NormalizePos(c.PartOfSpeech) == targetPos) + 1;

        var valid = candidates.Where(c =>
        {
            if (HasOverlappingMeaning(c.Meaning, targetMeaning)) return false;

            var candWordNorm = NormalizePhrase(c.Word);
            if (!string.IsNullOrEmpty(candWordNorm) && targetSynonymSet.Contains(candWordNorm)) return false;

            var candSyns = SplitTokens(c.Synonyms);
            if (!string.IsNullOrEmpty(targetWordNorm) && candSyns.Contains(targetWordNorm)) return false;
            if (targetSynonymSet.Count > 0 && candSyns.Any(s => targetSynonymSet.Contains(s))) return false;

            return true;
        }).ToList();

        var tiers = new[]
        {
            valid.Where(c => c.TopicId == topicId && NormalizePos(c.PartOfSpeech) == targetPos),
            valid.Where(c => c.TopicId != topicId && NormalizePos(c.PartOfSpeech) == targetPos),
            valid.Where(c => c.TopicId == topicId && NormalizePos(c.PartOfSpeech) != targetPos),
            valid.Where(c => c.TopicId != topicId && NormalizePos(c.PartOfSpeech) != targetPos)
        };

        var wrongOptions = new List<string>(3);
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrEmpty(targetNorm)) seen.Add(targetNorm);

        foreach (var tier in tiers)
        {
            if (wrongOptions.Count >= 3) break;
            var ranked = tier.OrderBy(c => Math.Abs(c.Meaning.Trim().Length - targetLen)).ToList();
            foreach (var c in ranked)
            {
                var trimmed = c.Meaning.Trim();
                if (wrongOptions.Any(w => HasOverlappingMeaning(w, trimmed))) continue;
                if (seen.Add(NormalizePhrase(trimmed)))
                {
                    wrongOptions.Add(trimmed);
                    if (wrongOptions.Count >= 3) break;
                }
            }
        }

        return new VocabQuizDbPreviewResult
        {
            Distractors = wrongOptions,
            SameTopicCount = sameTopicCount,
            SameTopicPosCount = sameTopicPosCount,
            IsLowTopicPool = sameTopicCount < 4,
            Source = "database-4-tier"
        };
    }

    // ===== PHẦN 3B: TÙY CHỌN AI GỢI Ý 3 ĐÁP ÁN BẪY QUIZ =====
    public async Task<VocabQuizAiTrapsResult> SuggestQuizTrapsByAiAsync(string word, string? pos, string? meaning, string? topicTitle, int topicId, int wordId)
    {
        var clean = (word ?? string.Empty).Trim();
        var cleanPos = NormalizePos(pos);
        var cleanMeaning = await ResolveMissingMeaningAsync(clean, cleanPos, meaning);
        var cleanTopic = string.IsNullOrWhiteSpace(topicTitle) ? "Business & TOEIC" : topicTitle.Trim();

        var knownSynonyms = wordId > 0
            ? await _context.VocabWords.AsNoTracking()
                .Where(w => w.WordId == wordId)
                .Select(w => w.Synonyms)
                .FirstOrDefaultAsync()
            : null;
        var avoidSynonymsNote = !string.IsNullOrWhiteSpace(knownSynonyms)
            ? $"\nAlso avoid meanings of these synonyms of \"{clean}\": {knownSynonyms}."
            : string.Empty;

        var prompt = $@"You create tricky multiple-choice distractors for Vietnamese English learners.
Target word: ""{clean}"" ({cleanPos})
Correct Vietnamese meaning: ""{cleanMeaning}""
Topic: ""{cleanTopic}""{avoidSynonymsNote}

Generate 3 plausible BUT CLEARLY WRONG Vietnamese meanings of the same part of speech ({cleanPos}) and similar length (2-6 Vietnamese words) that confuse learners (false friends, nearby domain terms, or easily mixed-up TOEIC words). None of them may translate ""{clean}"" or overlap semantically with ""{cleanMeaning}"".
Return ONLY strict JSON:
{{
  ""distractors"": [""wrong trap 1 in Vietnamese"", ""wrong trap 2 in Vietnamese"", ""wrong trap 3 in Vietnamese""],
  ""note"": ""short Vietnamese note on why these distractors are tricky""
}}";

        var (aiJson, aiSource) = await CallLlmJsonAsync(prompt);
        if (aiJson != null)
        {
            var rawList = GetJsonStringArray(aiJson.Value, "distractors");
            var list = new List<string>(3);
            foreach (var item in rawList)
            {
                if (HasOverlappingMeaning(item, cleanMeaning)) continue;
                if (list.Any(existing => HasOverlappingMeaning(existing, item))) continue;
                list.Add(item.Trim());
                if (list.Count >= 3) break;
            }

            if (list.Count >= 3)
            {
                return new VocabQuizAiTrapsResult
                {
                    Distractors = list,
                    Note = GetJsonString(aiJson.Value, "note"),
                    Source = aiSource
                };
            }
        }

        // Smart Fallback: bốc từ CSDL cùng từ loại có độ dài gần nhất hoặc bổ sung bẫy cùng loại từ
        var dbPreview = await PreviewDatabaseQuizDistractorsAsync(wordId, topicId, cleanPos, cleanMeaning);
        var traps = new List<string>(dbPreview.Distractors);
        var posFallbackTraps = cleanPos switch
        {
            "verb" => new[] { "trì hoãn kế hoạch", "từ chối đề nghị", "kiểm tra lại hồ sơ", "phân bổ ngân sách" },
            "adjective" => new[] { "tạm thời, ngắn hạn", "bắt buộc theo quy định", "thiếu tính nhất quán", "khả thi về mặt tài chính" },
            "adverb" => new[] { "một cách tạm thời", "gần như ngay lập tức", "hiếm khi xảy ra", "về mặt kỹ thuật" },
            _ => new[] { "điều khoản bổ sung", "biên bản thỏa thuận", "quy trình kiểm duyệt", "nghĩa vụ tài chính" }
        };

        foreach (var cand in posFallbackTraps)
        {
            if (traps.Count >= 3) break;
            if (!traps.Any(t => HasOverlappingMeaning(t, cand)) && !HasOverlappingMeaning(cand, cleanMeaning))
            {
                traps.Add(cand);
            }
        }

        return new VocabQuizAiTrapsResult
        {
            Distractors = traps.Take(3).ToList(),
            Note = "Đã gợi ý 3 đáp án nhiễu cùng từ loại để kiểm tra phân biệt nghĩa.",
            Source = $"smart-db-fallback ({aiSource})"
        };
    }

    // ===== PHẦN 4: GÕ (100% LLM SINH CÂU TOEIC [TỪ] + DỊCH TIẾNG VIỆT) =====
    public async Task<VocabTypingSuggestionResult> SuggestTypingContextAsync(string word, string? pos, string? meaning, string? topicTitle)
    {
        var clean = (word ?? string.Empty).Trim();
        var cleanPos = NormalizePos(pos);
        var cleanMeaning = await ResolveMissingMeaningAsync(clean, cleanPos, meaning);
        var cleanTopic = string.IsNullOrWhiteSpace(topicTitle) ? "Business & TOEIC" : topicTitle.Trim();

        var prompt = $@"Create ONE natural workplace / TOEIC fill-in-the-blank practice sentence for a Vietnamese learner.
Target word: ""{clean}"" ({cleanPos})
Vietnamese meaning: ""{cleanMeaning}""
Topic context: ""{cleanTopic}""

Requirements:
1. Write ONE clear, realistic English business/workplace sentence (10-18 words) using ""{clean}"" specifically as a {cleanPos} with the meaning ""{cleanMeaning}"".
2. Wrap ONLY the target word/phrase (or its inflected form, e.g. [assured], [contracts], [applied]) inside square brackets [...] ONCE — never bracket more than one token.
3. Provide an accurate, natural Vietnamese translation of the full sentence.

Return ONLY strict JSON:
{{
  ""exampleSentence"": ""English sentence with [target_word] in brackets"",
  ""exampleMeaning"": ""Natural Vietnamese translation""
}}";

        var (aiJson, aiSource) = await CallLlmJsonAsync(prompt);
        if (aiJson != null)
        {
            var sent = EnsureBracketedWord(GetJsonString(aiJson.Value, "exampleSentence"), clean);
            var trans = GetJsonString(aiJson.Value, "exampleMeaning");
            if (!string.IsNullOrWhiteSpace(sent))
            {
                if (string.IsNullOrWhiteSpace(trans))
                {
                    trans = await TranslateEnToViAsync(StripBrackets(sent)) ?? string.Empty;
                }
                return new VocabTypingSuggestionResult
                {
                    ExampleSentence = sent,
                    ExampleMeaning = trans,
                    Source = aiSource
                };
            }
        }

        // Fallback: thử lấy câu ví dụ đúng PartOfSpeech từ Dictionary API rồi dịch, hoặc sinh mẫu TOEIC chuẩn
        var dictData = await FetchDictionaryEntryAsync(clean, cleanPos);
        string fallbackSentence = dictData.ExampleSentence;
        if (!string.IsNullOrWhiteSpace(fallbackSentence))
        {
            fallbackSentence = EnsureBracketedWord(fallbackSentence, clean);
        }
        else
        {
            fallbackSentence = cleanPos switch
            {
                "verb" => $"The project team agreed to [{clean}] the updated schedule before Friday's client meeting.",
                "adjective" => $"Our department prepared a very [{clean}] report for the quarterly board review.",
                "adverb" => $"The regional manager responded [{clean}] to every urgent request from key suppliers.",
                "phrase" => $"All staff members must [{clean}] the updated company guidelines during the audit.",
                "preposition" => $"Please submit your signed expense forms [{clean}] the finance office deadline.",
                _ => $"The supplier provided a written [{clean}] confirming that all goods will arrive on schedule."
            };
        }

        var plainForTranslate = StripBrackets(fallbackSentence);
        var translatedVi = await TranslateEnToViAsync(plainForTranslate);
        if (string.IsNullOrWhiteSpace(translatedVi))
        {
            translatedVi = !string.IsNullOrWhiteSpace(cleanMeaning)
                ? $"Câu ví dụ minh họa cách dùng \"{clean}\" ({cleanMeaning}) trong ngữ cảnh công việc."
                : $"Câu ví dụ minh họa từ \"{clean}\" trong ngữ cảnh công sở.";
        }

        return new VocabTypingSuggestionResult
        {
            ExampleSentence = fallbackSentence,
            ExampleMeaning = translatedVi,
            Source = $"dictionary+template-fallback ({aiSource})"
        };
    }

    // ===== PRIVATE HTTP & LLM HELPERS =====
    private async Task<(JsonElement? Root, string Source)> CallLlmJsonAsync(string prompt)
    {
        var (provider, apiKey, model) = ResolveAiCredentials();
        if (provider == "none" || string.IsNullOrEmpty(apiKey))
        {
            return (null, "no-api-key");
        }

        try
        {
            if (provider == "gemini")
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={Uri.EscapeDataString(apiKey)}";
                var payload = JsonSerializer.Serialize(new
                {
                    contents = new[]
                    {
                        new { parts = new[] { new { text = prompt } } }
                    },
                    generationConfig = new
                    {
                        temperature = 0.35,
                        responseMimeType = "application/json"
                    }
                });

                using var content = new StringContent(payload, Encoding.UTF8, "application/json");
                using var res = await _httpClient.PostAsync(url, content);
                if (!res.IsSuccessStatusCode) return (null, $"gemini-http-{(int)res.StatusCode}");

                using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
                if (doc.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                {
                    var rawText = candidates[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();

                    var parsed = ParseJsonPayload(rawText);
                    if (parsed != null) return (parsed, "llm-gemini");
                    return (null, "gemini-parse-error");
                }
                return (null, "gemini-empty");
            }
            else if (provider == "openai")
            {
                using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
                req.Headers.TryAddWithoutValidation("Authorization", $"Bearer {apiKey}");
                var payload = JsonSerializer.Serialize(new
                {
                    model,
                    temperature = 0.35,
                    response_format = new { type = "json_object" },
                    messages = new[]
                    {
                        new { role = "system", content = "You always reply with valid JSON only." },
                        new { role = "user", content = prompt }
                    }
                });
                req.Content = new StringContent(payload, Encoding.UTF8, "application/json");
                using var res = await _httpClient.SendAsync(req);
                if (!res.IsSuccessStatusCode) return (null, $"openai-http-{(int)res.StatusCode}");

                using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
                var rawText = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                var parsed = ParseJsonPayload(rawText);
                if (parsed != null) return (parsed, "llm-openai");
                return (null, "openai-parse-error");
            }
        }
        catch (TaskCanceledException)
        {
            return (null, $"{provider}-timeout");
        }
        catch
        {
            return (null, $"{provider}-error");
        }

        return (null, "no-api-key");
    }

    private static JsonElement? ParseJsonPayload(string? rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText)) return null;
        var clean = rawText.Trim();
        if (clean.StartsWith("```"))
        {
            clean = Regex.Replace(clean, @"^```(?:json)?\s*|\s*```$", "", RegexOptions.IgnoreCase).Trim();
        }
        try
        {
            using var doc = JsonDocument.Parse(clean);
            return doc.RootElement.Clone();
        }
        catch
        {
            // Trích khối {...} ngoài cùng nếu model chèn giải thích trước/sau JSON
            var firstBrace = clean.IndexOf('{');
            var lastBrace = clean.LastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace)
            {
                try
                {
                    using var doc = JsonDocument.Parse(clean[firstBrace..(lastBrace + 1)]);
                    return doc.RootElement.Clone();
                }
                catch { /* Ignore */ }
            }
            return null;
        }
    }

    private sealed class DictionaryLookupData
    {
        public bool Found { get; set; }
        public string PartOfSpeech { get; set; } = string.Empty;
        public string PhoneticUs { get; set; } = string.Empty;
        public string PhoneticUk { get; set; } = string.Empty;
        public string AudioUrl { get; set; } = string.Empty;
        public string EnglishDefinition { get; set; } = string.Empty;
        public string ExampleSentence { get; set; } = string.Empty;
        public List<string> Synonyms { get; set; } = [];
        public List<string> Antonyms { get; set; } = [];
    }

    private static async Task<DictionaryLookupData> FetchDictionaryEntryAsync(string word, string? preferredPos = null)
    {
        var data = new DictionaryLookupData();
        if (string.IsNullOrWhiteSpace(word)) return data;

        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, $"https://api.dictionaryapi.dev/api/v2/entries/en/{Uri.EscapeDataString(word)}");
            req.Headers.TryAddWithoutValidation("User-Agent", "StudyEnglishAdmin/1.0");
            using var res = await _httpClient.SendAsync(req);
            if (!res.IsSuccessStatusCode) return data;

            using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
            if (doc.RootElement.ValueKind != JsonValueKind.Array || doc.RootElement.GetArrayLength() == 0) return data;

            data.Found = true;
            var normPref = !string.IsNullOrWhiteSpace(preferredPos) ? NormalizePos(preferredPos) : null;

            JsonElement? matchedMeaning = null;
            JsonElement? firstMeaning = null;

            foreach (var entry in doc.RootElement.EnumerateArray())
            {
                if (entry.TryGetProperty("phonetics", out var phoneticsEl) && phoneticsEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var ph in phoneticsEl.EnumerateArray())
                    {
                        var text = ph.TryGetProperty("text", out var t) ? t.GetString() : null;
                        var audio = NormalizeAudioUrl(ph.TryGetProperty("audio", out var a) ? a.GetString() : null);

                        if (!string.IsNullOrWhiteSpace(audio))
                        {
                            if (audio.Contains("-us", StringComparison.OrdinalIgnoreCase) || string.IsNullOrEmpty(data.AudioUrl))
                                data.AudioUrl = audio;
                            if (audio.Contains("-us", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(text))
                                data.PhoneticUs = text;
                            else if (audio.Contains("-uk", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(text))
                                data.PhoneticUk = text;
                        }
                        if (string.IsNullOrWhiteSpace(data.PhoneticUs) && !string.IsNullOrWhiteSpace(text))
                            data.PhoneticUs = text;
                    }
                }

                if (string.IsNullOrWhiteSpace(data.PhoneticUs) && entry.TryGetProperty("phonetic", out var topPh))
                    data.PhoneticUs = topPh.GetString() ?? string.Empty;

                if (entry.TryGetProperty("meanings", out var meaningsEl) && meaningsEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var m in meaningsEl.EnumerateArray())
                    {
                        firstMeaning ??= m.Clone();
                        var rawPos = m.TryGetProperty("partOfSpeech", out var posEl) ? posEl.GetString() : null;
                        if (normPref != null && matchedMeaning == null && !string.IsNullOrWhiteSpace(rawPos) && NormalizePos(rawPos) == normPref)
                        {
                            matchedMeaning = m.Clone();
                        }
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(data.PhoneticUk))
                data.PhoneticUk = data.PhoneticUs;

            var chosen = matchedMeaning ?? firstMeaning;
            if (chosen is JsonElement meaningObj)
            {
                data.PartOfSpeech = meaningObj.TryGetProperty("partOfSpeech", out var posEl) ? (posEl.GetString() ?? string.Empty) : string.Empty;

                if (meaningObj.TryGetProperty("synonyms", out var synEl) && synEl.ValueKind == JsonValueKind.Array)
                    data.Synonyms.AddRange(synEl.EnumerateArray().Select(s => s.GetString() ?? "").Where(s => !string.IsNullOrWhiteSpace(s)).Take(6));

                if (meaningObj.TryGetProperty("antonyms", out var antEl) && antEl.ValueKind == JsonValueKind.Array)
                    data.Antonyms.AddRange(antEl.EnumerateArray().Select(s => s.GetString() ?? "").Where(s => !string.IsNullOrWhiteSpace(s)).Take(4));

                if (meaningObj.TryGetProperty("definitions", out var defsEl) && defsEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var defObj in defsEl.EnumerateArray())
                    {
                        if (string.IsNullOrWhiteSpace(data.EnglishDefinition) && defObj.TryGetProperty("definition", out var defText))
                            data.EnglishDefinition = defText.GetString() ?? string.Empty;
                        if (string.IsNullOrWhiteSpace(data.ExampleSentence) && defObj.TryGetProperty("example", out var exText))
                            data.ExampleSentence = exText.GetString() ?? string.Empty;
                    }
                }
            }
        }
        catch { /* Ignore external network failure */ }

        return data;
    }

    private static readonly HashSet<string> _stopNeighborWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "as",
        "is", "are", "was", "were", "be", "been", "being", "it", "this", "that", "these", "those", "he", "she",
        "they", "we", "you", "i", "my", "your", "his", "her", "their", "our", "not", "no", "so", "if", "than"
    };

    private static async Task<(List<string> Collocations, List<string> Synonyms, List<string> Antonyms, List<string> WordFamily)> FetchDatamuseRichDataAsync(string word, string pos, string meaning)
    {
        var collocs = new List<string>();
        var syns = new List<string>();
        var ants = new List<string>();
        var family = new List<string> { $"{word} · {pos} · {(string.IsNullOrWhiteSpace(meaning) ? "nghĩa chính" : meaning)}" };

        if (string.IsNullOrWhiteSpace(word) || word.Contains(' '))
            return (collocs, syns, ants, family);

        try
        {
            var encoded = Uri.EscapeDataString(word);
            var synTask = _httpClient.GetAsync($"https://api.datamuse.com/words?rel_syn={encoded}&max=5");
            var antTask = _httpClient.GetAsync($"https://api.datamuse.com/words?rel_ant={encoded}&max=4");

            // Chọn endpoint ngữ cảnh tự nhiên theo PartOfSpeech
            var colUrl = pos switch
            {
                "noun" => $"https://api.datamuse.com/words?rel_jjb={encoded}&max=6", // adj + noun
                "adjective" => $"https://api.datamuse.com/words?rel_jja={encoded}&max=6", // adj + noun
                "verb" => $"https://api.datamuse.com/words?lc={encoded}&md=p&max=8", // verb + right neighbor
                _ => $"https://api.datamuse.com/words?rc={encoded}&md=p&max=8"
            };
            var colTask = _httpClient.GetAsync(colUrl);

            // Truy vấn Datamuse từ có thật dùng chung gốc từ để dựng Họ từ (tránh tự ghép hậu tố giả)
            var stem = GetRootStemForFamily(word);
            Task<HttpResponseMessage>? famTask = stem.Length >= 4
                ? _httpClient.GetAsync($"https://api.datamuse.com/words?sp={Uri.EscapeDataString(stem)}*&md=p&max=14")
                : null;

            if (famTask != null) await Task.WhenAll(synTask, antTask, colTask, famTask);
            else await Task.WhenAll(synTask, antTask, colTask);

            if (synTask.Result.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(await synTask.Result.Content.ReadAsStringAsync());
                syns.AddRange(doc.RootElement.EnumerateArray().Select(e => GetJsonString(e, "word")).Where(IsCleanAlphaWord));
            }
            if (antTask.Result.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(await antTask.Result.Content.ReadAsStringAsync());
                ants.AddRange(doc.RootElement.EnumerateArray().Select(e => GetJsonString(e, "word")).Where(IsCleanAlphaWord));
            }
            if (colTask.Result.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(await colTask.Result.Content.ReadAsStringAsync());
                foreach (var el in doc.RootElement.EnumerateArray())
                {
                    var w = GetJsonString(el, "word");
                    if (!IsCleanAlphaWord(w) || _stopNeighborWords.Contains(w) || string.Equals(w, word, StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (pos == "noun" || pos == "adverb") collocs.Add($"{w} {word}");
                    else collocs.Add($"{word} {w}");
                    if (collocs.Count >= 4) break;
                }
            }

            if (famTask != null && famTask.Result.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(await famTask.Result.Content.ReadAsStringAsync());
                var candidates = new List<(string Word, string Pos)>();
                foreach (var el in doc.RootElement.EnumerateArray())
                {
                    var cand = GetJsonString(el, "word");
                    if (!IsCleanAlphaWord(cand) || cand.Length < 4 || string.Equals(cand, word, StringComparison.OrdinalIgnoreCase))
                        continue;
                    if (cand.Equals(word + "s", StringComparison.OrdinalIgnoreCase) || cand.Equals(word + "ed", StringComparison.OrdinalIgnoreCase) || cand.Equals(word + "ing", StringComparison.OrdinalIgnoreCase))
                        continue;

                    var dmPos = MapDatamusePosTag(el);
                    if (string.IsNullOrEmpty(dmPos)) continue;
                    candidates.Add((cand, dmPos));
                    if (candidates.Count >= 3) break;
                }

                if (candidates.Count > 0)
                {
                    var translated = await Task.WhenAll(candidates.Select(async c =>
                    {
                        var vi = await TranslateHeadwordByPosAsync(c.Word, c.Pos);
                        var viText = string.IsNullOrWhiteSpace(vi) ? $"dạng {c.Pos}" : vi;
                        return $"{c.Word} · {c.Pos} · {viText}";
                    }));
                    family.AddRange(translated);
                }
            }
        }
        catch { /* Ignore network failure */ }

        return (collocs, syns, ants, family);
    }

    private static string GetRootStemForFamily(string word)
    {
        var lower = word.ToLowerInvariant();
        foreach (var suffix in new[] { "ization", "isation", "ation", "ition", "ment", "ness", "able", "ible", "tive", "sive", "tion", "sion", "ally", "ing", "ous", "ive", "ful", "less", "ize", "ise", "ate", "ify", "ly", "ed", "er", "or", "al" })
        {
            if (lower.EndsWith(suffix, StringComparison.Ordinal) && lower.Length - suffix.Length >= 4)
            {
                return lower[..^suffix.Length];
            }
        }
        if (lower.Length >= 5 && lower.EndsWith("e", StringComparison.Ordinal)) return lower[..^1];
        return lower.Length >= 5 ? lower[..Math.Min(lower.Length, 6)] : lower;
    }

    private static string MapDatamusePosTag(JsonElement el)
    {
        if (!el.TryGetProperty("tags", out var tags) || tags.ValueKind != JsonValueKind.Array) return string.Empty;
        foreach (var tag in tags.EnumerateArray())
        {
            var t = tag.GetString();
            if (t == "n") return "noun";
            if (t == "v") return "verb";
            if (t == "adj") return "adjective";
            if (t == "adv") return "adverb";
        }
        return string.Empty;
    }

    private static bool IsCleanAlphaWord(string? w)
        => !string.IsNullOrWhiteSpace(w) && w.Length >= 2 && Regex.IsMatch(w, @"^[a-zA-Z\-]+$");

    private async Task<string> ResolveMissingMeaningAsync(string word, string pos, string? providedMeaning)
    {
        var clean = (providedMeaning ?? string.Empty).Trim();
        if (!string.IsNullOrWhiteSpace(clean)) return clean;
        if (string.IsNullOrWhiteSpace(word)) return string.Empty;

        var dbWords = await _context.VocabWords.AsNoTracking()
            .Where(w => !w.IsDeleted && w.Word.ToLower() == word.ToLower() && !string.IsNullOrEmpty(w.Meaning))
            .Select(w => new { w.PartOfSpeech, w.Meaning })
            .ToListAsync();

        var exact = dbWords.FirstOrDefault(w => NormalizePos(w.PartOfSpeech) == pos) ?? dbWords.FirstOrDefault();
        if (exact != null && !string.IsNullOrWhiteSpace(exact.Meaning))
            return exact.Meaning.Trim();

        return await TranslateHeadwordByPosAsync(word, pos) ?? string.Empty;
    }

    private static async Task<string?> TranslateHeadwordByPosAsync(string word, string pos)
    {
        if (pos == "verb" && !word.Contains(' '))
        {
            var verbVi = await TranslateEnToViAsync($"to {word}");
            if (!string.IsNullOrWhiteSpace(verbVi))
            {
                var cleaned = Regex.Replace(verbVi, @"^(để mà|để|nhằm)\s+", "", RegexOptions.IgnoreCase).Trim();
                if (!string.IsNullOrWhiteSpace(cleaned)) return cleaned;
            }
        }
        return await TranslateEnToViAsync(word);
    }

    private static async Task<string?> TranslateEnToViAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        try
        {
            using var res = await _httpClient.GetAsync($"https://api.mymemory.translated.net/get?q={Uri.EscapeDataString(text)}&langpair=en|vi");
            if (!res.IsSuccessStatusCode) return null;
            using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
            if (doc.RootElement.TryGetProperty("responseData", out var rd) && rd.TryGetProperty("translatedText", out var tt))
            {
                var decoded = WebUtility.HtmlDecode(tt.GetString() ?? string.Empty).Trim();
                if (!string.IsNullOrWhiteSpace(decoded)
                    && !decoded.Equals(text, StringComparison.OrdinalIgnoreCase)
                    && !decoded.Contains("MYMEMORY WARNING", StringComparison.OrdinalIgnoreCase))
                {
                    return decoded;
                }
            }
        }
        catch { /* Ignore */ }
        return null;
    }

    private static string EnsureBracketedWord(string sentence, string targetWord)
    {
        var cleanSent = Regex.Replace((sentence ?? string.Empty).Trim(), @"\s+", " ");
        if (string.IsNullOrWhiteSpace(cleanSent) || string.IsNullOrWhiteSpace(targetWord)) return cleanSent;

        var bracketCount = Regex.Matches(cleanSent, @"\[[^\[\]]+\]").Count;
        if (bracketCount == 1) return cleanSent;

        // Nếu AI vô tình bọc 2+ từ trong ngoặc vuông, gỡ toàn bộ để bọc chuẩn 1 vị trí duy nhất
        if (bracketCount > 1) cleanSent = StripBrackets(cleanSent);

        var trimmedTarget = targetWord.Trim();
        // Hỗ trợ cụm từ nhiều từ (phrasal verb / phrase)
        if (trimmedTarget.Contains(' '))
        {
            var parts = trimmedTarget.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var firstStem = parts[0].Length >= 4 && parts[0].EndsWith("e", StringComparison.OrdinalIgnoreCase)
                ? Regex.Escape(parts[0][..^1]) + @"[a-z]*"
                : Regex.Escape(parts[0]) + @"[a-z]*";
            var rest = string.Join(@"\s+", parts.Skip(1).Select(Regex.Escape));
            var phraseRegex = new Regex($@"\b({firstStem}\s+{rest})\b", RegexOptions.IgnoreCase);
            var phraseReplaced = phraseRegex.Replace(cleanSent, "[$1]", 1);
            if (phraseReplaced != cleanSent) return phraseReplaced;
        }

        // Từ đơn: khớp từ gốc và các dạng chia (-s, -es, -ed, -ing, -er...) tại vị trí đầu tiên
        var exactRegex = new Regex($@"\b({Regex.Escape(trimmedTarget)}[a-z]*)\b", RegexOptions.IgnoreCase);
        var replaced = exactRegex.Replace(cleanSent, "[$1]", 1);
        if (replaced != cleanSent) return replaced;

        // Xử lý biến đổi đuôi -e (assure -> assured/assuring) và -y (apply -> applied/applies)
        if (trimmedTarget.Length >= 4)
        {
            var baseStem = trimmedTarget.EndsWith("e", StringComparison.OrdinalIgnoreCase) || trimmedTarget.EndsWith("y", StringComparison.OrdinalIgnoreCase)
                ? Regex.Escape(trimmedTarget[..^1])
                : Regex.Escape(trimmedTarget);
            var stemRegex = new Regex($@"\b({baseStem}[a-z]*)\b", RegexOptions.IgnoreCase);
            replaced = stemRegex.Replace(cleanSent, "[$1]", 1);
        }
        return replaced;
    }

    public async Task<(List<VocabExamplePairResult> Examples, string Source)> SuggestExtraExamplesAsync(
        string word,
        string? pos,
        string? meaning,
        string? topicTitle,
        IReadOnlyList<string>? existingSentences)
    {
        var clean = (word ?? string.Empty).Trim();
        var cleanPos = NormalizePos(pos);
        var cleanMeaning = await ResolveMissingMeaningAsync(clean, cleanPos, meaning);
        var cleanTopic = string.IsNullOrWhiteSpace(topicTitle) ? "Business & TOEIC" : topicTitle.Trim();

        var existingSet = new HashSet<string>(
            (existingSentences ?? Array.Empty<string>())
                .Select(s => StripBrackets(s).Trim())
                .Where(s => !string.IsNullOrWhiteSpace(s)),
            StringComparer.OrdinalIgnoreCase);

        var avoidClause = existingSet.Count > 0
            ? $"\nDo NOT repeat or closely paraphrase any of these existing sentences:\n- {string.Join("\n- ", existingSet.Take(6))}"
            : string.Empty;

        var prompt = $@"You are an expert TOEIC / workplace English curriculum designer for Vietnamese learners.
Generate 2 fresh, natural, workplace/TOEIC-style example sentences with accurate Vietnamese translations for:
- Word: ""{clean}""
- PartOfSpeech: ""{cleanPos}"" (Use the word specifically as {cleanPos} with meaning ""{cleanMeaning}"")
- Topic: ""{cleanTopic}""{avoidClause}
Do NOT include square brackets [...] inside the sentences.

Return ONLY valid JSON:
{{
  ""examples"": [
    {{ ""en"": ""natural English example 1"", ""vi"": ""natural Vietnamese translation 1"" }},
    {{ ""en"": ""natural English example 2"", ""vi"": ""natural Vietnamese translation 2"" }}
  ]
}}";

        var (aiJson, aiSource) = await CallLlmJsonAsync(prompt);
        if (aiJson != null)
        {
            var aiPairs = GetJsonExamplePairs(aiJson.Value, "examples")
                .Select(p => new VocabExamplePairResult { En = StripBrackets(p.En), Vi = p.Vi })
                .Where(p => !existingSet.Contains(p.En))
                .Take(2)
                .ToList();
            if (aiPairs.Count > 0)
            {
                return (aiPairs, aiSource);
            }
        }

        // Fallback không cần API key: Dictionary API đúng POS + kho mẫu ngữ cảnh TOEIC + dịch MyMemory
        var dictData = await FetchDictionaryEntryAsync(clean, cleanPos);
        var candidates = new List<(string En, string FallbackVi)>();

        if (!string.IsNullOrWhiteSpace(dictData.ExampleSentence))
        {
            var cleanDict = Regex.Replace(dictData.ExampleSentence, @"\s+", " ").Trim();
            if (!existingSet.Contains(cleanDict))
            {
                candidates.Add((cleanDict, string.Empty));
            }
        }

        foreach (var item in BuildFallbackExtraExamplePool(clean, cleanPos, cleanMeaning))
        {
            if (!existingSet.Contains(item.En) && !candidates.Any(c => string.Equals(c.En, item.En, StringComparison.OrdinalIgnoreCase)))
            {
                candidates.Add(item);
            }
        }

        var selected = candidates.Take(2).ToList();
        var translateTasks = selected.Select(async item =>
        {
            var vi = await TranslateEnToViAsync(item.En);
            return new VocabExamplePairResult
            {
                En = item.En,
                Vi = !string.IsNullOrWhiteSpace(vi) ? vi! : item.FallbackVi
            };
        });

        var resolved = (await Task.WhenAll(translateTasks)).ToList();
        var fbTag = !string.IsNullOrWhiteSpace(dictData.ExampleSentence) ? "dictionary+toeic-fallback" : "toeic-fallback";
        return (resolved, $"{fbTag} ({aiSource})");
    }

    private static List<VocabExamplePairResult> GetJsonExamplePairs(JsonElement root, string propName)
    {
        var list = new List<VocabExamplePairResult>();
        if (!root.TryGetProperty(propName, out var arr) || arr.ValueKind != JsonValueKind.Array) return list;
        foreach (var item in arr.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object) continue;
            var en = Regex.Replace(GetJsonString(item, "en"), @"\s+", " ").Trim();
            var vi = Regex.Replace(GetJsonString(item, "vi"), @"\s+", " ").Trim();
            if (!string.IsNullOrWhiteSpace(en))
            {
                list.Add(new VocabExamplePairResult { En = en, Vi = vi });
            }
        }
        return list;
    }

    private static async Task<List<VocabExamplePairResult>> BuildFallbackExtraExamplesAsync(
        string word,
        string pos,
        string meaning,
        string dictExample)
    {
        var results = new List<VocabExamplePairResult>();
        var shortMean = (meaning ?? string.Empty).Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim();

        if (!string.IsNullOrWhiteSpace(dictExample))
        {
            var cleanEx = Regex.Replace(dictExample, @"\s+", " ").Trim();
            var vi = await TranslateEnToViAsync(cleanEx);
            results.Add(new VocabExamplePairResult
            {
                En = cleanEx,
                Vi = !string.IsNullOrWhiteSpace(vi) ? vi! : (string.IsNullOrWhiteSpace(shortMean) ? string.Empty : $"Ví dụ minh họa cho từ \"{shortMean}\".")
            });
        }

        if (results.Count == 0)
        {
            var fallback = BuildFallbackExtraExamplePool(word, pos, meaning).FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(fallback.En))
            {
                var vi = await TranslateEnToViAsync(fallback.En);
                results.Add(new VocabExamplePairResult
                {
                    En = fallback.En,
                    Vi = !string.IsNullOrWhiteSpace(vi) ? vi! : fallback.FallbackVi
                });
            }
        }

        return results;
    }

    internal static List<(string En, string FallbackVi)> BuildFallbackExtraExamplePool(string word, string? pos, string? meaning)
    {
        var cleanPos = NormalizePos(pos);
        var shortMean = (meaning ?? string.Empty).Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim();
        var meanLabel = string.IsNullOrWhiteSpace(shortMean) ? word : shortMean!;

        return cleanPos switch
        {
            "verb" =>
            [
                ($"The team worked closely to {word} the project before Friday's deadline.", $"Nhóm đã phối hợp chặt chẽ để {meanLabel} dự án trước hạn chót thứ Sáu."),
                ($"All department heads were asked to {word} the new procedure during the briefing.", $"Tất cả trưởng bộ phận được yêu cầu {meanLabel} quy trình mới trong buổi họp."),
                ($"We plan to {word} this proposal with our partners early next quarter.", $"Chúng tôi dự định {meanLabel} đề xuất này cùng đối tác vào đầu quý tới.")
            ],
            "adjective" =>
            [
                ($"Our department issued a {word} report for the quarterly review meeting.", $"Bộ phận của chúng tôi đã phát hành một báo cáo {meanLabel} cho cuộc họp đánh giá quý."),
                ($"Management appreciated the {word} feedback from our long-term clients.", $"Ban quản lý đánh giá cao những phản hồi {meanLabel} từ các khách hàng lâu năm."),
                ($"Maintaining {word} standards is essential across every regional branch.", $"Duy trì các tiêu chuẩn {meanLabel} là điều thiết yếu tại mọi chi nhánh khu vực.")
            ],
            "adverb" =>
            [
                ($"All staff members responded {word} to the updated client guidelines.", $"Toàn bộ nhân viên đã phản hồi {meanLabel} trước hướng dẫn khách hàng mới."),
                ($"The supplier handled the urgent shipment {word} without any delays.", $"Nhà cung cấp đã xử lý lô hàng khẩn {meanLabel} mà không bị chậm trễ.")
            ],
            _ =>
            [
                ($"The company held a briefing on {word} for all long-term clients.", $"Công ty đã tổ chức buổi phổ biến về {meanLabel} cho toàn bộ khách hàng lâu năm."),
                ($"Please attach the signed {word} before submitting the expense claim.", $"Vui lòng đính kèm {meanLabel} đã ký trước khi gửi yêu cầu thanh toán chi phí."),
                ($"Every supervisor received clear guidelines regarding {word} this month.", $"Mỗi giám sát viên đều nhận được hướng dẫn rõ ràng về {meanLabel} trong tháng này.")
            ]
        };
    }

    private static List<string> NormalizeCollocationPairs(List<string> items)
    {
        return items
            .Select(s => Regex.Replace(s.Trim(), @"\s+[-–—:]\s+", " — "))
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static List<string> CleanRelatedWordList(List<string> items, string headword, int maxCount)
    {
        return items
            .Select(s => s.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s) && !string.Equals(s, headword, StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(maxCount)
            .ToList();
    }

    private static async Task<List<string>> EnrichCollocationsWithVietnameseAsync(List<string> phrases)
    {
        var tasks = phrases.Select(async phrase =>
        {
            var vi = await TranslateEnToViAsync(phrase);
            return !string.IsNullOrWhiteSpace(vi) ? $"{phrase} — {vi.ToLowerInvariant()}" : phrase;
        });
        return (await Task.WhenAll(tasks)).ToList();
    }

    private static List<string> BuildFallbackCollocations(string word, string pos, string meaning)
    {
        var shortMean = (meaning ?? string.Empty).Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim();
        var hasMean = !string.IsNullOrWhiteSpace(shortMean);
        var meanTarget = hasMean ? shortMean! : word;

        return pos switch
        {
            "verb" =>
            [
                $"{word} effectively — {meanTarget} hiệu quả",
                $"{word} on time — {meanTarget} đúng hạn"
            ],
            "adjective" =>
            [
                $"{word} policy — chính sách {meanTarget}",
                $"highly {word} — rất {meanTarget}"
            ],
            "adverb" =>
            [
                $"work {word} — làm việc {meanTarget}",
                $"respond {word} — phản hồi {meanTarget}"
            ],
            _ =>
            [
                $"official {word} — {meanTarget} chính thức",
                $"regarding {word} — liên quan đến {meanTarget}"
            ]
        };
    }

    private static (string Wrong, string Right, string Note) BuildFallbackCommonMistake(string word, string pos)
    {
        // Không tự bịa câu sai/đúng giả mạo nếu không có AI xác thực ngữ pháp
        var note = pos switch
        {
            "verb" => $"Kiểm tra \"{word}\" là ngoại động từ (cần tân ngữ trực tiếp) hay nội động từ đi kèm giới từ cố định.",
            "noun" => $"Kiểm tra \"{word}\" là danh từ đếm được (cần a/an/the hoặc -s) hay danh từ không đếm được trước khi đặt câu.",
            "adjective" => $"Lưu ý giới từ đi kèm sau tính từ \"{word}\" (ví dụ: to / with / for) và vị trí đứng trước danh từ hoặc sau be/seem.",
            "adverb" => $"Chú ý đặt trạng từ \"{word}\" đúng vị trí (trước động từ thường, sau trợ động từ hoặc cuối mệnh đề).",
            _ => string.Empty
        };
        return (string.Empty, string.Empty, note);
    }

    private static string NormalizeAudioUrl(string? url)
    {
        var clean = (url ?? string.Empty).Trim();
        if (clean.StartsWith("//")) return "https:" + clean;
        return clean;
    }

    private static string StripBrackets(string? sentence)
        => Regex.Replace((sentence ?? string.Empty).Trim(), @"\[([^\[\]]+)\]", "$1");

    private static IEnumerable<string> SplitTokens(string? raw)
        => (raw ?? string.Empty)
            .Split(new[] { ',', ';', '|', '/' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(NormalizePhrase)
            .Where(t => !string.IsNullOrEmpty(t));

    private static bool HasOverlappingMeaning(string? meaningA, string? meaningB)
    {
        var normA = NormalizePhrase(meaningA);
        var normB = NormalizePhrase(meaningB);
        if (string.IsNullOrEmpty(normA) || string.IsNullOrEmpty(normB)) return false;
        if (normA == normB || normA.Contains(normB) || normB.Contains(normA)) return true;

        var segsA = SplitTokens(meaningA).ToList();
        var segsB = SplitTokens(meaningB).ToList();
        return segsA.Any(a => segsB.Any(b => a == b || (a.Length >= 4 && b.Length >= 4 && (a.Contains(b) || b.Contains(a)))));
    }

    private static string NormalizePos(string? raw)
    {
        var clean = (raw ?? string.Empty).Trim().ToLowerInvariant();
        return clean switch
        {
            "adj" or "adjective" => "adjective",
            "adv" or "adverb" => "adverb",
            "v" or "verb" => "verb",
            "prep" or "preposition" => "preposition",
            "phrase" => "phrase",
            _ => "noun"
        };
    }

    private static string NormalizePhrase(string? value)
        => Regex.Replace(Regex.Replace((value ?? string.Empty).Trim().ToLowerInvariant(), @"[\p{P}]+", " "), @"\s+", " ").Trim();

    public async Task<VocabPhraseSuggestionResult> SuggestPhrasePairAsync(
        string focusWord,
        string? pos = null,
        string? meaning = null,
        string? topicTitle = null,
        string? existingCollocations = null,
        string? exampleSentence = null)
    {
        var cleanWord = (focusWord ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(cleanWord))
            return new VocabPhraseSuggestionResult();

        var normPos = NormalizePos(pos);
        var prompt = $@"You are an English TOEIC & collocation curriculum designer.
Create ONE natural English collocation (2-part phrase matching question) built around the focus vocabulary word ""{cleanWord}"" ({normPos}, Vietnamese meaning: ""{meaning ?? ""}"", topic: ""{topicTitle ?? "Business/TOEIC"}"").

Rules:
- Split the collocation naturally into leftWord and rightWord (for example: ""abide by"" + ""the rules"", ""cancellation"" + ""fee"", ""key"" + ""provision"", ""determine"" + ""the cause"").
- One of leftWord or rightWord MUST contain or be the focus word ""{cleanWord}"".
- Provide a concise, natural Vietnamese meaning for the whole collocation.
- Provide a short, realistic TOEIC-style English sentence split into sentenceBefore (text before the collocation) and sentenceAfter (text after the collocation, including ending punctuation).
- Return ONLY valid JSON with keys: leftWord, rightWord, meaning, sentenceBefore, sentenceAfter.

Example format:
{{
  ""leftWord"": ""abide by"",
  ""rightWord"": ""the rules"",
  ""meaning"": ""tuân thủ luật lệ"",
  ""sentenceBefore"": ""All employees must"",
  ""sentenceAfter"": ""during working hours.""
}}";

        var (root, source) = await CallLlmJsonAsync(prompt);
        if (root.HasValue)
        {
            var left = GetJsonString(root.Value, "leftWord");
            var right = GetJsonString(root.Value, "rightWord");
            var viMeaning = GetJsonString(root.Value, "meaning");
            var before = GetJsonString(root.Value, "sentenceBefore");
            var after = GetJsonString(root.Value, "sentenceAfter");
            if (!string.IsNullOrWhiteSpace(left) && !string.IsNullOrWhiteSpace(right) && !string.IsNullOrWhiteSpace(viMeaning))
            {
                return new VocabPhraseSuggestionResult
                {
                    FocusWord = cleanWord,
                    LeftWord = left,
                    RightWord = right,
                    Meaning = viMeaning,
                    SentenceBefore = string.IsNullOrWhiteSpace(before) ? "The team needs to" : before,
                    SentenceAfter = string.IsNullOrWhiteSpace(after) ? "as soon as possible." : after,
                    Source = source
                };
            }
        }

        return BuildPhraseFallback(cleanWord, normPos, meaning, existingCollocations, exampleSentence);
    }

    public async Task<List<VocabPhraseSuggestionResult>> SuggestPhraseBatchAsync(
        IEnumerable<(string Word, string? Pos, string? Meaning, string? Collocations, string? ExampleSentence)> focusWords,
        string? topicTitle)
    {
        var items = focusWords
            .Where(x => !string.IsNullOrWhiteSpace(x.Word))
            .Take(10)
            .ToList();
        var results = new List<VocabPhraseSuggestionResult>();
        if (items.Count == 0) return results;

        var wordLines = string.Join("\n", items.Select((x, idx) =>
            $"{idx + 1}. word=\"{x.Word.Trim()}\", pos=\"{NormalizePos(x.Pos)}\", meaning=\"{(x.Meaning ?? "").Trim()}\""));

        var prompt = $@"You are an English TOEIC & collocation curriculum designer for topic ""{topicTitle ?? "Business"}"".
For EACH focus vocabulary word below, generate ONE natural 2-part English collocation question (leftWord + rightWord) containing that focus word, its Vietnamese meaning, and a sentence split into sentenceBefore and sentenceAfter.

Focus words:
{wordLines}

Return ONLY a valid JSON object with a ""items"" array, where each element has: focusWord, leftWord, rightWord, meaning, sentenceBefore, sentenceAfter.";

        var (root, source) = await CallLlmJsonAsync(prompt);
        if (root.HasValue && root.Value.ValueKind == JsonValueKind.Object && root.Value.TryGetProperty("items", out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var el in arr.EnumerateArray())
            {
                var fw = GetJsonString(el, "focusWord");
                var left = GetJsonString(el, "leftWord");
                var right = GetJsonString(el, "rightWord");
                var vi = GetJsonString(el, "meaning");
                var before = GetJsonString(el, "sentenceBefore");
                var after = GetJsonString(el, "sentenceAfter");
                if (!string.IsNullOrWhiteSpace(left) && !string.IsNullOrWhiteSpace(right) && !string.IsNullOrWhiteSpace(vi))
                {
                    results.Add(new VocabPhraseSuggestionResult
                    {
                        FocusWord = string.IsNullOrWhiteSpace(fw) ? left : fw,
                        LeftWord = left,
                        RightWord = right,
                        Meaning = vi,
                        SentenceBefore = string.IsNullOrWhiteSpace(before) ? "The company will" : before,
                        SentenceAfter = string.IsNullOrWhiteSpace(after) ? "this week." : after,
                        Source = source
                    });
                }
            }
        }

        // Fill any missing items with smart fallback
        foreach (var item in items)
        {
            var already = results.Any(r =>
                r.FocusWord.Equals(item.Word.Trim(), StringComparison.OrdinalIgnoreCase)
                || r.LeftWord.Contains(item.Word.Trim(), StringComparison.OrdinalIgnoreCase)
                || r.RightWord.Contains(item.Word.Trim(), StringComparison.OrdinalIgnoreCase));
            if (!already)
            {
                results.Add(BuildPhraseFallback(item.Word, item.Pos, item.Meaning, item.Collocations, item.ExampleSentence));
            }
        }

        return results;
    }

    private static VocabPhraseSuggestionResult BuildPhraseFallback(
        string focusWord,
        string? pos,
        string? meaning,
        string? existingCollocations,
        string? exampleSentence)
    {
        var cleanWord = focusWord.Trim();
        var normPos = NormalizePos(pos);
        var left = string.Empty;
        var right = string.Empty;
        var viMeaning = (meaning ?? string.Empty).Trim();

        if (!string.IsNullOrWhiteSpace(existingCollocations))
        {
            var firstEntry = existingCollocations
                .Split(new[] { '\n', ';' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim())
                .FirstOrDefault();

            if (!string.IsNullOrWhiteSpace(firstEntry))
            {
                var splitMeaning = firstEntry.Split(new[] { "—", " - ", ":" }, 2, StringSplitOptions.TrimEntries);
                var phrasePart = splitMeaning[0].Trim();
                if (splitMeaning.Length > 1 && !string.IsNullOrWhiteSpace(splitMeaning[1]))
                    viMeaning = splitMeaning[1].Trim();

                var idx = phrasePart.IndexOf(cleanWord, StringComparison.OrdinalIgnoreCase);
                if (idx == 0 && phrasePart.Length > cleanWord.Length)
                {
                    left = phrasePart[..cleanWord.Length].Trim();
                    right = phrasePart[cleanWord.Length..].Trim();
                }
                else if (idx > 0)
                {
                    left = phrasePart[..idx].Trim();
                    right = phrasePart[idx..].Trim();
                }
                else
                {
                    var tokens = phrasePart.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                    if (tokens.Length == 2)
                    {
                        left = tokens[0];
                        right = tokens[1];
                    }
                }
            }
        }

        if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
        {
            switch (normPos)
            {
                case "verb":
                    left = cleanWord;
                    right = "the issue";
                    break;
                case "adjective":
                    left = cleanWord;
                    right = "details";
                    break;
                default:
                    left = "review the";
                    right = cleanWord;
                    break;
            }
        }

        var before = "The team needs to";
        var after = "before the deadline.";
        if (!string.IsNullOrWhiteSpace(exampleSentence))
        {
            var full = $"{left} {right}".Trim();
            var mIdx = exampleSentence.IndexOf(full, StringComparison.OrdinalIgnoreCase);
            if (mIdx < 0) mIdx = exampleSentence.IndexOf(cleanWord, StringComparison.OrdinalIgnoreCase);
            var matchLen = exampleSentence.IndexOf(full, StringComparison.OrdinalIgnoreCase) >= 0 ? full.Length : cleanWord.Length;
            if (mIdx >= 0)
            {
                before = exampleSentence[..mIdx].Trim();
                after = exampleSentence[(mIdx + matchLen)..].Trim();
            }
        }

        return new VocabPhraseSuggestionResult
        {
            FocusWord = cleanWord,
            LeftWord = left,
            RightWord = right,
            Meaning = string.IsNullOrWhiteSpace(viMeaning) ? cleanWord : viMeaning,
            SentenceBefore = before,
            SentenceAfter = after,
            Source = "smart-fallback"
        };
    }

    private static string GetJsonString(JsonElement el, string propName)
    {
        if (el.ValueKind == JsonValueKind.Object && el.TryGetProperty(propName, out var prop) && prop.ValueKind == JsonValueKind.String)
            return prop.GetString()?.Trim() ?? string.Empty;
        return string.Empty;
    }

    private static List<string> GetJsonStringArray(JsonElement el, string propName)
    {
        if (el.ValueKind == JsonValueKind.Object && el.TryGetProperty(propName, out var prop) && prop.ValueKind == JsonValueKind.Array)
        {
            return prop.EnumerateArray()
                .Where(x => x.ValueKind == JsonValueKind.String)
                .Select(x => x.GetString()?.Trim() ?? string.Empty)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList();
        }
        return [];
    }
}
