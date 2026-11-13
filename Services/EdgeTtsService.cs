using System.Net.WebSockets;
using System.Text;
using System.Text.RegularExpressions;

namespace StudyEnglish.Services;

public interface IEdgeTtsService
{
    Task<byte[]?> SynthesizeAsync(string text, string voice = "en-US-JennyNeural", string rate = "+0%", string pitch = "+0Hz", CancellationToken cancellationToken = default);
    Task<string?> SynthesizeToFileAsync(string text, string outputFolder, string voice = "en-US-JennyNeural", string rate = "+0%", string pitch = "+0Hz", CancellationToken cancellationToken = default);
}

public sealed class EdgeTtsService : IEdgeTtsService
{
    private const string WssEndpoint = "wss://speech.platform.bing.com/consumer/speech/synthesize/readahead/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    private static readonly HttpClient _probeClient = new() { Timeout = TimeSpan.FromSeconds(5) };

    public async Task<byte[]?> SynthesizeAsync(string text, string voice = "en-US-JennyNeural", string rate = "+0%", string pitch = "+0Hz", CancellationToken cancellationToken = default)
    {
        var clean = (text ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(clean)) return null;

        voice = string.IsNullOrWhiteSpace(voice) ? "en-US-JennyNeural" : voice.Trim();
        rate = string.IsNullOrWhiteSpace(rate) ? "+0%" : rate.Trim();
        pitch = string.IsNullOrWhiteSpace(pitch) ? "+0Hz" : pitch.Trim();

        try
        {
            using var ws = new ClientWebSocket();
            ws.Options.SetRequestHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0");
            ws.Options.SetRequestHeader("Origin", "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold");
            ws.Options.KeepAliveInterval = TimeSpan.FromSeconds(10);

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(15));

            await ws.ConnectAsync(new Uri(WssEndpoint), cts.Token);

            var reqId = Guid.NewGuid().ToString("N");
            var timestamp = DateTime.UtcNow.ToString("ddd MMM dd yyyy HH:mm:ss 'GMT+0000 (Coordinated Universal Time)'");

            // 1. Gửi cấu hình định dạng audio MP3
            var configMsg = $"X-Timestamp:{timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{{\"context\":{{\"synthesis\":{{\"audio\":{{\"metadataoptions\":{{\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"false\"}},\"outputFormat\":\"audio-24khz-48kbitrate-mono-mp3\"}}}}}}}}";
            await ws.SendAsync(Encoding.UTF8.GetBytes(configMsg), WebSocketMessageType.Text, true, cts.Token);

            // 2. Gửi lệnh SSML chứa nội dung và giọng đọc
            var ssml = $"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='{voice}'><prosody pitch='{pitch}' rate='{rate}'>{SecurityElementEscape(clean)}</prosody></voice></speak>";
            var ssmlMsg = $"X-RequestId:{reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:{timestamp}\r\nPath:ssml\r\n\r\n{ssml}";
            await ws.SendAsync(Encoding.UTF8.GetBytes(ssmlMsg), WebSocketMessageType.Text, true, cts.Token);

            // 3. Nhận các gói nhị phân chứa âm thanh MP3
            using var audioStream = new MemoryStream();
            var buffer = new byte[8192];

            while (ws.State == WebSocketState.Open && !cts.IsCancellationRequested)
            {
                var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), cts.Token);
                if (result.MessageType == WebSocketMessageType.Close) break;

                if (result.MessageType == WebSocketMessageType.Binary && result.Count > 2)
                {
                    // 2 byte đầu tiên chứa độ dài header metadata dạng text
                    int headerLen = (buffer[0] << 8) | buffer[1];
                    int audioStart = 2 + headerLen;
                    if (result.Count > audioStart)
                    {
                        audioStream.Write(buffer, audioStart, result.Count - audioStart);
                    }
                }
                else if (result.MessageType == WebSocketMessageType.Text)
                {
                    var textMsg = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    if (textMsg.Contains("Path:turn.end")) break;
                }
            }

            var audioBytes = audioStream.ToArray();
            return audioBytes.Length > 0 ? audioBytes : null;
        }
        catch
        {
            return null;
        }
    }

    public async Task<string?> SynthesizeToFileAsync(string text, string outputFolder, string voice = "en-US-JennyNeural", string rate = "+0%", string pitch = "+0Hz", CancellationToken cancellationToken = default)
    {
        var bytes = await SynthesizeAsync(text, voice, rate, pitch, cancellationToken);
        if (bytes == null || bytes.Length < 128) return null;

        Directory.CreateDirectory(outputFolder);
        var safeWord = Regex.Replace((text ?? "audio").Trim().ToLowerInvariant(), @"[^a-z0-9_-]", "");
        if (string.IsNullOrEmpty(safeWord)) safeWord = "word";
        if (safeWord.Length > 20) safeWord = safeWord[..20];

        var fileName = $"edge-{safeWord}-{Guid.NewGuid():N}.mp3";
        var fullPath = Path.Combine(outputFolder, fileName);
        await File.WriteAllBytesAsync(fullPath, bytes, cancellationToken);
        return fileName;
    }

    private static string SecurityElementEscape(string text)
    {
        return text
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;")
            .Replace("'", "&apos;");
    }
}
