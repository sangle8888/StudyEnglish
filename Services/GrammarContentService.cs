using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;
using StudyEnglish.Models.Grammar;

namespace StudyEnglish.Services;

public sealed class GrammarQuestionDto
{
    public string Id { get; set; } = "";
    public int DbId { get; set; }
    public string TopicId { get; set; } = "";
    public int TopicDbId { get; set; }
    public string TopicTitle { get; set; } = "";
    public GrammarTheoryDto? Theory { get; set; }
    public string Question { get; set; } = "";
    public List<string> Options { get; set; } = [];
    public int Answer { get; set; }
    public string Explanation { get; set; } = "";
    public GrammarTranslationDto? Translation { get; set; }
    public GrammarReasoningDto Reasoning { get; set; } = new();
}

public sealed class GrammarTranslationDto
{
    public string Question { get; set; } = "";
    public List<string> Options { get; set; } = [];
}

public sealed class GrammarReasoningStepDto
{
    public string Title { get; set; } = "";
    public string Text { get; set; } = "";
    public List<string> Eliminated { get; set; } = [];
}

public sealed class GrammarReasoningDto
{
    public string Context { get; set; } = "";
    public List<string> Distractors { get; set; } = [];
    public string Rule { get; set; } = "";
    public List<GrammarReasoningStepDto> Steps { get; set; } = [];
}

public sealed class GrammarTopicDto
{
    public string Id { get; set; } = "";
    public int DbId { get; set; }
    public string Title { get; set; } = "";
    public string Exam { get; set; } = "";
    public GrammarTheoryDto? Theory { get; set; }
    public List<GrammarQuestionDto> Questions { get; set; } = [];
}

public sealed class GrammarUsageDto
{
    public string Title { get; set; } = "";
    public string Text { get; set; } = "";
    public string Result { get; set; } = "";
    public bool Green { get; set; }
}

public sealed class GrammarTheoryDto
{
    public List<string> GoldenRules { get; set; } = [];
    public string Summary { get; set; } = "";
    public string QuickIntro { get; set; } = "";
    public List<string[]> QuickItems { get; set; } = [];
    public string[] Model { get; set; } = [];
    public string MentalDescription { get; set; } = "";
    public List<string> Formulas { get; set; } = [];
    public List<GrammarUsageDto> Usage { get; set; } = [];
    public List<string> Mistakes { get; set; } = [];
    public List<string> Examples { get; set; } = [];
}

public sealed class GrammarGroupDto
{
    public string Id { get; set; } = "";
    public int DbId { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Icon { get; set; } = "";
    public GrammarTheoryDto? Theory { get; set; }
    public List<GrammarTopicDto> Topics { get; set; } = [];
}

public sealed class GrammarNoteDto
{
    public string Id { get; set; } = "";
    public string Topic { get; set; } = "";
    public string Type { get; set; } = "";
    public string TypeLabel { get; set; } = "";
    public string Content { get; set; } = "";
    public string? SubContent { get; set; }
}

public sealed class GrammarTopicStatDto
{
    public int Done { get; set; }
    public int Correct { get; set; }
    public int Wrong { get; set; }
}

public sealed class GrammarStateDto
{
    public Dictionary<string, GrammarTopicStatDto> TopicStats { get; set; } = [];
    public int AnsweredTotal { get; set; }
    public int CorrectTotal { get; set; }
    public List<string> AnsweredQuestions { get; set; } = [];
    public List<string> Bookmarks { get; set; } = [];
    public List<GrammarNoteDto> Notes { get; set; } = [];
}

public sealed class GrammarPageDto
{
    public List<GrammarGroupDto> Groups { get; set; } = [];
    public GrammarStateDto State { get; set; } = new();
}

public sealed class GrammarContentService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public GrammarContentService(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    private static bool IsMojibake(string? text)
    {
        if (string.IsNullOrEmpty(text)) return false;
        return text.Contains('Ã') || text.Contains("á»") || text.Contains("áº") ||
               text.Contains('Â') || text.Contains("CÃ") || text.Contains("á»i") ||
               text.Contains("Æ°") || text.Contains("Ä‘") || text.Contains("Ä ") ||
               text.Contains("â€”") || text.Contains("â†’") || text.Contains("Náº") ||
               text.Contains("TrÆ");
    }

    public async Task<GrammarPageDto> BuildPageAsync(int userId)
    {
        // 1. Tải danh mục và chủ đề từ database
        var categories = await _db.GrammarCategories
            .Where(c => c.IsActive && !c.IsDeleted)
            .Include(c => c.Topics.Where(t => t.IsActive && !t.IsDeleted).OrderBy(t => t.SortOrder).ThenBy(t => t.TopicId))
                .ThenInclude(t => t.Questions.Where(q => !q.IsDeleted).OrderBy(q => q.SortOrder).ThenBy(q => q.QuestionId))
                    .ThenInclude(q => q.Options.OrderBy(o => o.SortOrder))
            .Include(c => c.Topics)
                .ThenInclude(t => t.TopicExams)
                    .ThenInclude(te => te.Exam)
            .Include(c => c.Topics)
                .ThenInclude(t => t.Theory)
                    .ThenInclude(th => th!.Items.OrderBy(i => i.SortOrder))
            .OrderBy(c => c.SortOrder).ThenBy(c => c.CategoryId)
            .AsSplitQuery()
            .ToListAsync();

        // 2. Tự động phát hiện và sửa lỗi font chữ (Mojibake) hoặc sai lệch lý thuyết nếu CSDL chứa chuỗi lỗi
        var seed = LoadSeed();
        if (seed != null)
        {
            var needsRepair = categories.Any(c => IsMojibake(c.Title) || IsMojibake(c.Description) ||
                                                   c.Topics.Any(t => IsMojibake(t.Title) ||
                                                                     (t.Theory != null && (IsMojibake(t.Theory.Summary) ||
                                                                                           IsMojibake(t.Theory.QuickIntro) ||
                                                                                           IsMojibake(t.Theory.MentalDescription) ||
                                                                                           t.Theory.Items.Any(i => IsMojibake(i.Content) || IsMojibake(i.Title) || IsMojibake(i.Result)))) ||
                                                                     (t.Title.Contains("quá khứ") && t.Theory != null && (
                                                                         (t.Theory.MentalDescription != null && t.Theory.MentalDescription.Contains("Hiện tại")) ||
                                                                         !t.Theory.Items.Any(i => i.ItemType == "QuickItem" && i.Content != null && i.Content.Contains("Past Simple"))
                                                                     ))));
            if (needsRepair)
            {
                await FixDatabaseEncodingAsync(categories, seed);
            }
        }

        var page = new GrammarPageDto();

        foreach (var c in categories)
        {
            var firstTheory = c.Topics.FirstOrDefault(t => t.Theory != null)?.Theory;

            var group = new GrammarGroupDto
            {
                Id = string.IsNullOrWhiteSpace(c.Code) ? $"cat-{c.CategoryId}" : c.Code,
                DbId = c.CategoryId,
                Title = c.Title,
                Description = c.Description ?? "",
                Icon = string.IsNullOrWhiteSpace(c.Icon) ? "fa-book-open" : c.Icon,
                Theory = firstTheory != null ? ToTheoryDto(firstTheory) : null
            };

            foreach (var t in c.Topics)
            {
                var examCodes = t.TopicExams.Select(te => te.Exam.Code).ToList();
                var examLabel = examCodes.Count > 0 ? string.Join(" · ", examCodes) : "TOEIC · VSTEP";
                var topicTheory = t.Theory != null ? ToTheoryDto(t.Theory) : (firstTheory != null ? ToTheoryDto(firstTheory) : null);

                var topic = new GrammarTopicDto
                {
                    Id = $"t{t.TopicId}",
                    DbId = t.TopicId,
                    Title = t.Title,
                    Exam = examLabel,
                    Theory = topicTheory
                };

                foreach (var q in t.Questions.OrderBy(q => q.SortOrder).ThenBy(q => q.QuestionId))
                {
                    var options = q.Options.OrderBy(o => o.SortOrder).ToList();
                    var correctIdx = options.FindIndex(o => o.IsCorrect);
                    if (correctIdx < 0) correctIdx = 0;

                    var hasTranslation = !string.IsNullOrWhiteSpace(q.StemVi) || options.Any(o => !string.IsNullOrWhiteSpace(o.ContentVi));

                    topic.Questions.Add(new GrammarQuestionDto
                    {
                        Id = $"q{q.QuestionId}",
                        DbId = q.QuestionId,
                        TopicId = topic.Id,
                        TopicDbId = t.TopicId,
                        TopicTitle = t.Title,
                        Theory = topicTheory,
                        Question = q.Stem,
                        Options = options.Select(o => o.Content).ToList(),
                        Answer = correctIdx,
                        Explanation = q.ShortExplanation ?? "",
                        Translation = hasTranslation
                            ? new GrammarTranslationDto
                            {
                                Question = q.StemVi ?? "",
                                Options = options.Select(o => o.ContentVi ?? "").ToList()
                            }
                            : null,
                        Reasoning = BuildReasoningDto(q, options)
                    });
                }

                if (topic.Questions.Count > 0)
                {
                    group.Topics.Add(topic);
                }
            }

            if (group.Topics.Count > 0)
            {
                page.Groups.Add(group);
            }
        }

        // 3. Thống kê theo chủ đề
        var userStats = await _db.UserTopicStats.AsNoTracking()
            .Where(uts => uts.UserId == userId)
            .ToListAsync();

        foreach (var s in userStats)
        {
            var key = $"t{s.TopicId}";
            page.State.TopicStats[key] = new GrammarTopicStatDto
            {
                Done = s.TotalAttempted,
                Correct = s.CorrectCount,
                Wrong = s.WrongCount
            };
            page.State.AnsweredTotal += s.TotalAttempted;
            page.State.CorrectTotal += s.CorrectCount;
        }

        // 4. Danh sách câu hỏi đã từng làm
        page.State.AnsweredQuestions = await _db.PracticeAnswers.AsNoTracking()
            .Where(pa => pa.Session.UserId == userId)
            .Select(pa => $"q{pa.QuestionId}")
            .Distinct()
            .ToListAsync();

        // 5. Bookmark câu hỏi
        page.State.Bookmarks = await _db.UserQuestionBookmarks.AsNoTracking()
            .Where(b => b.UserId == userId)
            .Select(b => $"q{b.QuestionId}")
            .ToListAsync();

        // 6. Bookmark lý thuyết (công thức, ví dụ)
        var theoryBookmarks = await _db.UserTheoryItemBookmarks.AsNoTracking()
            .Where(b => b.UserId == userId)
            .Include(b => b.Item)
                .ThenInclude(i => i.Theory)
                    .ThenInclude(th => th.Topic)
            .OrderBy(b => b.CreatedAt)
            .ToListAsync();

        page.State.Notes = theoryBookmarks.Select(b => new GrammarNoteDto
        {
            Id = $"n{b.ItemId}",
            Topic = b.Item.Theory?.Topic?.Title ?? "NGỮ PHÁP",
            Type = string.Equals(b.Item.ItemType, "Formula", StringComparison.OrdinalIgnoreCase) ? "formula" : "example",
            TypeLabel = string.Equals(b.Item.ItemType, "Formula", StringComparison.OrdinalIgnoreCase) ? "Công thức" : "Ví dụ",
            Content = b.Item.Content ?? "",
            SubContent = b.Item.Result
        }).ToList();

        return page;
    }

    public static GrammarTheoryDto ToTheoryDto(GrammarTheory th)
    {
        var items = th.Items.OrderBy(i => i.SortOrder).ToList();
        return new GrammarTheoryDto
        {
            GoldenRules = items
                .Where(i => string.Equals(i.ItemType, "GoldenRule", StringComparison.OrdinalIgnoreCase))
                .Select(i => i.Content ?? i.Title ?? "")
                .Where(s => !string.IsNullOrEmpty(s))
                .ToList(),
            Summary = th.Summary ?? "",
            QuickIntro = th.QuickIntro ?? "",
            QuickItems = items
                .Where(i => string.Equals(i.ItemType, "QuickItem", StringComparison.OrdinalIgnoreCase))
                .Select(i =>
                {
                    if (!string.IsNullOrWhiteSpace(i.Result))
                    {
                        return new[] { i.Title ?? i.Content ?? "", i.Result };
                    }
                    return new[] { i.Content ?? i.Title ?? "", "" };
                })
                .ToList(),
            Model = [th.ModelLeft ?? "Ai / Điều gì", th.ModelRight ?? "làm gì?"],
            MentalDescription = th.MentalDescription ?? "",
            Formulas = items
                .Where(i => string.Equals(i.ItemType, "Formula", StringComparison.OrdinalIgnoreCase))
                .Select(i => i.Content ?? "")
                .Where(s => !string.IsNullOrEmpty(s))
                .ToList(),
            Usage = items
                .Where(i => string.Equals(i.ItemType, "Usage", StringComparison.OrdinalIgnoreCase))
                .Select(i => new GrammarUsageDto
                {
                    Title = i.Title ?? "",
                    Text = i.Content ?? "",
                    Result = i.Result ?? "",
                    Green = i.IsGreen == true
                })
                .ToList(),
            Mistakes = items
                .Where(i => string.Equals(i.ItemType, "Mistake", StringComparison.OrdinalIgnoreCase))
                .Select(i => string.IsNullOrEmpty(i.Title) ? (i.Content ?? "") : $"{i.Title}: {i.Content}")
                .ToList(),
            Examples = items
                .Where(i => string.Equals(i.ItemType, "Example", StringComparison.OrdinalIgnoreCase))
                .Select(i => string.IsNullOrEmpty(i.Result) ? (i.Content ?? "") : $"{i.Content} — {i.Result}")
                .ToList()
        };
    }

    private static GrammarReasoningDto BuildReasoningDto(Question q, List<QuestionOption> options)
    {
        var dto = new GrammarReasoningDto
        {
            Context = q.ContextNote ?? "",
            Distractors = options.Select(o => o.IsCorrect ? "" : (o.WhyWrong ?? "")).ToList(),
            Rule = q.RuleNote ?? ""
        };

        if (!string.IsNullOrWhiteSpace(q.ContextNote) && q.ContextNote.TrimStart().StartsWith("{"))
        {
            try
            {
                using var doc = JsonDocument.Parse(q.ContextNote);
                if (doc.RootElement.TryGetProperty("steps", out var stepsEl) && stepsEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var s in stepsEl.EnumerateArray())
                    {
                        var title = s.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "";
                        var text = s.TryGetProperty("text", out var tx) ? tx.GetString() ?? "" : "";
                        var elim = new List<string>();
                        if (s.TryGetProperty("elim", out var el) && el.ValueKind == JsonValueKind.Array)
                        {
                            elim = el.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrEmpty(x)).ToList();
                        }
                        if (!string.IsNullOrWhiteSpace(text))
                        {
                            dto.Steps.Add(new GrammarReasoningStepDto
                            {
                                Title = title,
                                Text = text,
                                Eliminated = elim
                            });
                        }
                    }
                }
            }
            catch
            {
                // Fallback nếu JSON lỗi
            }
        }

        // Tự động tạo các bước suy luận cho dữ liệu seed hoặc cũ
        if (dto.Steps.Count == 0)
        {
            if (!string.IsNullOrWhiteSpace(q.ContextNote))
            {
                dto.Steps.Add(new GrammarReasoningStepDto
                {
                    Title = "Vị trí chỗ trống",
                    Text = q.ContextNote,
                    Eliminated = []
                });
            }

            for (int i = 0; i < options.Count; i++)
            {
                if (!options[i].IsCorrect && !string.IsNullOrWhiteSpace(options[i].WhyWrong))
                {
                    var optLetter = ((char)('A' + i)).ToString();
                    dto.Steps.Add(new GrammarReasoningStepDto
                    {
                        Title = $"Xét \"{options[i].Content}\"",
                        Text = options[i].WhyWrong!,
                        Eliminated = [optLetter]
                    });
                }
            }
        }

        return dto;
    }

    private SeedFile? LoadSeed()
    {
        try
        {
            var seedPath = Path.Combine(_env.ContentRootPath, "Data", "Seed", "grammar-seed.json");
            if (!File.Exists(seedPath)) seedPath = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "grammar-seed.json");
            if (!File.Exists(seedPath)) return null;
            var json = File.ReadAllText(seedPath, System.Text.Encoding.UTF8);
            return JsonSerializer.Deserialize<SeedFile>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch
        {
            return null;
        }
    }

    private async Task FixDatabaseEncodingAsync(List<GrammarCategory> categories, SeedFile seed)
    {
        try
        {
            for (int gIdx = 0; gIdx < seed.Groups.Count; gIdx++)
            {
                var group = seed.Groups[gIdx];
                var cat = categories.FirstOrDefault(c => string.Equals(c.Code, group.Id, StringComparison.OrdinalIgnoreCase))
                          ?? categories.ElementAtOrDefault(gIdx);
                if (cat == null) continue;

                cat.Title = group.Title;
                cat.Description = group.Description;
                if (!string.IsNullOrEmpty(group.Icon)) cat.Icon = group.Icon;

                var topics = cat.Topics.OrderBy(t => t.SortOrder).ThenBy(t => t.TopicId).ToList();

                for (int tIdx = 0; tIdx < group.Topics.Count; tIdx++)
                {
                    var topicItem = group.Topics[tIdx];
                    var topic = topics.ElementAtOrDefault(tIdx);
                    if (topic == null) continue;

                    var key = $"{group.Id}-{tIdx}";
                    seed.Translations.TryGetValue(key, out var tr);
                    seed.Reasoning.TryGetValue(key, out var rs);

                    topic.Title = topicItem[0].GetString() ?? topic.Title;

                    var question = topic.Questions.OrderBy(q => q.QuestionId).FirstOrDefault();
                    if (question != null)
                    {
                        var stem = topicItem[2].GetString();
                        if (!string.IsNullOrEmpty(stem)) question.Stem = stem;
                        if (tr?.Question != null) question.StemVi = tr.Question;
                        var explanation = topicItem[5].GetString();
                        if (!string.IsNullOrEmpty(explanation)) question.ShortExplanation = explanation;
                        if (rs?.Context != null) question.ContextNote = rs.Context;
                        if (rs?.Rule != null) question.RuleNote = rs.Rule;

                        var opts = topicItem[3].EnumerateArray().Select(o => o.GetString() ?? "").ToList();
                        var correctPos = topicItem[4].GetInt32();
                        var qOptions = question.Options.OrderBy(o => o.SortOrder).ToList();
                        for (int i = 0; i < opts.Count && i < qOptions.Count; i++)
                        {
                            qOptions[i].Content = opts[i];
                            if (tr != null && i < tr.Options.Count) qOptions[i].ContentVi = tr.Options[i];
                            if (rs != null && i < rs.Distractors.Count && i != correctPos) qOptions[i].WhyWrong = rs.Distractors[i];
                        }
                    }
                }
            }

            // Sửa lỗi phông chữ cho lý thuyết (GrammarTheories và GrammarTheoryItems)
            if (seed.Theory != null && seed.Theory.Count > 0)
            {
                foreach (var cat in categories)
                {
                    foreach (var topic in cat.Topics)
                    {
                        JsonElement thEl = default;
                        bool found = false;

                        if (seed.Theory.TryGetValue(topic.Title, out var topicSeed))
                        {
                            thEl = topicSeed;
                            found = true;
                        }
                        else if (cat.Topics.FirstOrDefault() == topic)
                        {
                            var code = string.IsNullOrWhiteSpace(cat.Code) ? "tenses" : cat.Code;
                            if (seed.Theory.TryGetValue(code, out var catSeed))
                            {
                                thEl = catSeed;
                                found = true;
                            }
                        }

                        if (!found) continue;

                        if (topic.Theory == null)
                        {
                            topic.Theory = new GrammarTheory { TopicId = topic.TopicId };
                            _db.GrammarTheories.Add(topic.Theory);
                            ApplySeedTheory(topic.Theory, thEl);
                        }
                        else
                        {
                            var isMoji = IsMojibake(topic.Theory.Summary) || IsMojibake(topic.Theory.QuickIntro) || IsMojibake(topic.Theory.MentalDescription) ||
                                         topic.Theory.Items.Any(i => IsMojibake(i.Content) || IsMojibake(i.Title) || IsMojibake(i.Result));
                            var isWrongTopicTheory = topic.Title.Contains("quá khứ") && 
                                ((topic.Theory.MentalDescription != null && topic.Theory.MentalDescription.Contains("Hiện tại")) ||
                                 !topic.Theory.Items.Any(i => i.ItemType == "QuickItem" && i.Content != null && i.Content.Contains("Past Simple")));

                            if (isMoji || isWrongTopicTheory)
                            {
                                ApplySeedTheory(topic.Theory, thEl);
                            }
                        }
                    }
                }
            }

            await _db.SaveChangesAsync();
        }
        catch
        {
            // Bỏ qua lỗi lưu DB, dữ liệu trong bộ nhớ đã được cập nhật chuẩn tiếng Việt
        }
    }

    private void ApplySeedTheory(GrammarTheory th, JsonElement tEl)
    {
        if (tEl.TryGetProperty("summary", out var sum)) th.Summary = sum.GetString();
        if (tEl.TryGetProperty("quickIntro", out var qi)) th.QuickIntro = qi.GetString();
        if (tEl.TryGetProperty("mentalDescription", out var md)) th.MentalDescription = md.GetString();

        if (tEl.TryGetProperty("model", out var modelEl) && modelEl.ValueKind == JsonValueKind.Array)
        {
            var mList = modelEl.EnumerateArray().Select(x => x.GetString() ?? "").ToList();
            th.ModelLeft = mList.ElementAtOrDefault(0);
            th.ModelRight = mList.ElementAtOrDefault(1);
        }

        th.Items.Clear();
        var sortOrder = 0;

        if (tEl.TryGetProperty("goldenRules", out var grEl) && grEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var r in grEl.EnumerateArray())
            {
                var s = r.GetString();
                if (!string.IsNullOrEmpty(s))
                    th.Items.Add(new GrammarTheoryItem { TheoryId = th.TheoryId, ItemType = "GoldenRule", SortOrder = ++sortOrder, Content = s });
            }
        }

        if (tEl.TryGetProperty("quickItems", out var qiEl) && qiEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in qiEl.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.Array)
                {
                    var pair = item.EnumerateArray().Select(x => x.GetString() ?? "").ToList();
                    if (pair.Count >= 2 && !string.IsNullOrWhiteSpace(pair[1]))
                    {
                        th.Items.Add(new GrammarTheoryItem
                        {
                            TheoryId = th.TheoryId,
                            ItemType = "QuickItem",
                            SortOrder = ++sortOrder,
                            Title = pair.ElementAtOrDefault(0),
                            Result = pair.ElementAtOrDefault(1)
                        });
                    }
                    else
                    {
                        th.Items.Add(new GrammarTheoryItem
                        {
                            TheoryId = th.TheoryId,
                            ItemType = "QuickItem",
                            SortOrder = ++sortOrder,
                            Content = pair.ElementAtOrDefault(0)
                        });
                    }
                }
                else if (item.ValueKind == JsonValueKind.String)
                {
                    var str = item.GetString();
                    if (!string.IsNullOrWhiteSpace(str))
                    {
                        th.Items.Add(new GrammarTheoryItem
                        {
                            TheoryId = th.TheoryId,
                            ItemType = "QuickItem",
                            SortOrder = ++sortOrder,
                            Content = str
                        });
                    }
                }
            }
        }

        if (tEl.TryGetProperty("formulas", out var fEl) && fEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var f in fEl.EnumerateArray())
            {
                var s = f.GetString();
                if (!string.IsNullOrEmpty(s))
                    th.Items.Add(new GrammarTheoryItem { TheoryId = th.TheoryId, ItemType = "Formula", SortOrder = ++sortOrder, Content = s });
            }
        }

        if (tEl.TryGetProperty("usage", out var uEl) && uEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var u in uEl.EnumerateArray())
            {
                var title = u.TryGetProperty("title", out var ut) ? ut.GetString() : null;
                var text = u.TryGetProperty("text", out var ux) ? ux.GetString() : null;
                var result = u.TryGetProperty("result", out var ur) ? ur.GetString() : null;
                var isGreen = u.TryGetProperty("green", out var ug) && ug.GetBoolean();
                th.Items.Add(new GrammarTheoryItem
                {
                    TheoryId = th.TheoryId,
                    ItemType = "Usage",
                    SortOrder = ++sortOrder,
                    Title = title,
                    Content = text,
                    Result = result,
                    IsGreen = isGreen
                });
            }
        }

        if (tEl.TryGetProperty("mistakes", out var misEl) && misEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var m in misEl.EnumerateArray())
            {
                var s = m.GetString();
                if (!string.IsNullOrEmpty(s))
                    th.Items.Add(new GrammarTheoryItem { TheoryId = th.TheoryId, ItemType = "Mistake", SortOrder = ++sortOrder, Content = s });
            }
        }

        if (tEl.TryGetProperty("examples", out var exEl) && exEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var ex in exEl.EnumerateArray())
            {
                var s = ex.GetString();
                if (!string.IsNullOrEmpty(s))
                    th.Items.Add(new GrammarTheoryItem { TheoryId = th.TheoryId, ItemType = "Example", SortOrder = ++sortOrder, Content = s });
            }
        }
    }

    private sealed class SeedFile
    {
        public List<SeedGroup> Groups { get; set; } = [];
        public Dictionary<string, SeedTranslation> Translations { get; set; } = [];
        public Dictionary<string, SeedReasoning> Reasoning { get; set; } = [];
        public Dictionary<string, JsonElement> Theory { get; set; } = [];
    }

    private sealed class SeedGroup
    {
        public string Id { get; set; } = "";
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string Icon { get; set; } = "";
        public List<JsonElement> Topics { get; set; } = [];
    }

    private sealed class SeedTranslation
    {
        public string Question { get; set; } = "";
        public List<string> Options { get; set; } = [];
    }

    private sealed class SeedReasoning
    {
        public string Context { get; set; } = "";
        public List<string> Distractors { get; set; } = [];
        public string Rule { get; set; } = "";
    }
}
