$ErrorActionPreference = "Stop"
$WorkspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$DbDir = Join-Path $WorkspaceRoot "database"
if (!(Test-Path $DbDir)) {
    New-Item -ItemType Directory -Path $DbDir | Out-Null
}

Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

public class IstiqomahDualServer {
    private HttpListener _listener;
    private string _rootDir;
    private string _dbFilePath;
    private object _dbLock = new object();
    private string _cachedStateJson = null;

    public IstiqomahDualServer(string rootDir) {
        _rootDir = rootDir;
        _dbFilePath = Path.Combine(rootDir, "database", "istiqomah_bulusari_db.json");
        if (File.Exists(_dbFilePath)) {
            _cachedStateJson = File.ReadAllText(_dbFilePath, Encoding.UTF8);
        }
    }

    public void Start() {
        _listener = new HttpListener();
        _listener.Prefixes.Add("http://localhost:3000/");
        _listener.Prefixes.Add("http://127.0.0.1:3000/");
        _listener.Prefixes.Add("http://localhost:3001/");
        _listener.Prefixes.Add("http://127.0.0.1:3001/");
        _listener.Start();
        Console.WriteLine("======================================================================");
        Console.WriteLine(" ISTIQOMAH GROSIR BULUSARI - DUAL SYNC SERVER ACTIVE");
        Console.WriteLine(" -> Port 3000 (Mobile Offline-First Preview): http://localhost:3000");
        Console.WriteLine(" -> Port 3001 (Windows Desktop Preview)     : http://localhost:3001");
        Console.WriteLine("======================================================================");

        while (_listener.IsListening) {
            try {
                var ctx = _listener.GetContext();
                ThreadPool.QueueUserWorkItem(_ => HandleRequest(ctx));
            } catch (Exception ex) {
                Console.WriteLine("Listener error: " + ex.Message);
            }
        }
    }

    private void HandleRequest(HttpListenerContext ctx) {
        var req = ctx.Request;
        var res = ctx.Response;

        try {
            res.Headers.Add("Access-Control-Allow-Origin", "*");
            res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
            res.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate");

            if (req.HttpMethod == "OPTIONS") {
                res.StatusCode = 204;
                res.Close();
                return;
            }

            string path = req.Url.AbsolutePath;
            int port = req.Url.Port;

            // API 1: GET /api/state
            if (path.Equals("/api/state", StringComparison.OrdinalIgnoreCase) && req.HttpMethod == "GET") {
                string json;
                lock (_dbLock) {
                    json = _cachedStateJson ?? "{}";
                }
                byte[] buf = Encoding.UTF8.GetBytes(json);
                res.ContentType = "application/json; charset=utf-8";
                res.ContentLength64 = buf.Length;
                res.OutputStream.Write(buf, 0, buf.Length);
                res.Close();
                return;
            }

            // API 2: POST /api/sync
            if (path.Equals("/api/sync", StringComparison.OrdinalIgnoreCase) && req.HttpMethod == "POST") {
                using (var reader = new StreamReader(req.InputStream, Encoding.UTF8)) {
                    string body = reader.ReadToEnd();
                    // Extract "state" object or store full state if posted
                    int stateIdx = body.IndexOf("\"state\":");
                    string stateJson = body;
                    if (stateIdx >= 0) {
                        int startBrace = body.IndexOf('{', stateIdx);
                        if (startBrace >= 0) {
                            int depth = 0;
                            bool inStr = false;
                            bool esc = false;
                            for (int i = startBrace; i < body.Length; i++) {
                                char c = body[i];
                                if (esc) { esc = false; continue; }
                                if (c == '\\') { esc = true; continue; }
                                if (c == '"') { inStr = !inStr; continue; }
                                if (!inStr) {
                                    if (c == '{') depth++;
                                    else if (c == '}') {
                                        depth--;
                                        if (depth == 0) {
                                            stateJson = body.Substring(startBrace, i - startBrace + 1);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    lock (_dbLock) {
                        _cachedStateJson = stateJson;
                        File.WriteAllText(_dbFilePath, stateJson, Encoding.UTF8);
                    }

                    string reply = "{\"ok\":true,\"state\":" + stateJson + "}";
                    byte[] buf = Encoding.UTF8.GetBytes(reply);
                    res.ContentType = "application/json; charset=utf-8";
                    res.ContentLength64 = buf.Length;
                    res.OutputStream.Write(buf, 0, buf.Length);
                    res.Close();
                    return;
                }
            }

            // Static file routing based on port (3000 -> mobile.html, 3001 -> desktop.html)
            if (path == "/" || path == "/index.html") {
                path = (port == 3001) ? "/desktop.html" : "/mobile.html";
            }

            string cleanRel = path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            string fullPath = Path.Combine(_rootDir, cleanRel);

            if (!File.Exists(fullPath)) {
                res.StatusCode = 404;
                byte[] notFound = Encoding.UTF8.GetBytes("Not Found: " + path);
                res.OutputStream.Write(notFound, 0, notFound.Length);
                res.Close();
                return;
            }

            string ext = Path.GetExtension(fullPath).ToLowerInvariant();
            switch (ext) {
                case ".html": res.ContentType = "text/html; charset=utf-8"; break;
                case ".css":  res.ContentType = "text/css; charset=utf-8"; break;
                case ".js":   res.ContentType = "application/javascript; charset=utf-8"; break;
                case ".json": res.ContentType = "application/json; charset=utf-8"; break;
                case ".svg":  res.ContentType = "image/svg+xml"; break;
                case ".png":  res.ContentType = "image/png"; break;
                default:      res.ContentType = "application/octet-stream"; break;
            }

            byte[] fileBytes = File.ReadAllBytes(fullPath);
            res.ContentLength64 = fileBytes.Length;
            res.OutputStream.Write(fileBytes, 0, fileBytes.Length);
            res.Close();
        } catch (Exception ex) {
            try {
                res.StatusCode = 500;
                byte[] err = Encoding.UTF8.GetBytes(ex.Message);
                res.OutputStream.Write(err, 0, err.Length);
                res.Close();
            } catch {}
        }
    }
}
"@

$server = New-Object IstiqomahDualServer($WorkspaceRoot)
$server.Start()

