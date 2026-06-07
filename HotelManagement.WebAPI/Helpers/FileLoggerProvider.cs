using System.Collections.Concurrent;

namespace DoAnWebQuanLyKhachSan.API.Helpers
{
    public sealed class FileLoggerProvider : ILoggerProvider
    {
        private readonly string _logDirectory;
        private readonly string _filePrefix;
        private readonly LogLevel _minLevel;
        private readonly object _writeLock = new();
        private readonly ConcurrentDictionary<string, FileLogger> _loggers = new();

        public FileLoggerProvider(string logDirectory, string filePrefix, LogLevel minLevel = LogLevel.Information)
        {
            _logDirectory = logDirectory;
            _filePrefix = filePrefix;
            _minLevel = minLevel;

            if (!string.IsNullOrWhiteSpace(_logDirectory))
            {
                Directory.CreateDirectory(_logDirectory);
            }
        }

        public ILogger CreateLogger(string categoryName)
        {
            return _loggers.GetOrAdd(
                categoryName,
                name => new FileLogger(name, _logDirectory, _filePrefix, _minLevel, _writeLock));
        }

        public void Dispose()
        {
        }

        private sealed class FileLogger : ILogger
        {
            private readonly string _categoryName;
            private readonly string _logDirectory;
            private readonly string _filePrefix;
            private readonly LogLevel _minLevel;
            private readonly object _writeLock;

            public FileLogger(string categoryName, string logDirectory, string filePrefix, LogLevel minLevel, object writeLock)
            {
                _categoryName = categoryName;
                _logDirectory = logDirectory;
                _filePrefix = filePrefix;
                _minLevel = minLevel;
                _writeLock = writeLock;
            }

            public IDisposable BeginScope<TState>(TState state)
            {
                return NullScope.Instance;
            }

            public bool IsEnabled(LogLevel logLevel)
            {
                return logLevel >= _minLevel && logLevel != LogLevel.None;
            }

            public void Log<TState>(
                LogLevel logLevel,
                EventId eventId,
                TState state,
                Exception? exception,
                Func<TState, Exception?, string> formatter)
            {
                if (!IsEnabled(logLevel))
                {
                    return;
                }

                var message = formatter(state, exception);
                var lines = new List<string>
                {
                    $"{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff} | {logLevel,-11} | {_categoryName} | {message}"
                };

                if (exception != null)
                {
                    lines.Add(exception.ToString());
                }

                var filePath = Path.Combine(_logDirectory, $"{_filePrefix}-{DateTime.Now:yyyy-MM-dd}.log");

                lock (_writeLock)
                {
                    File.AppendAllLines(filePath, lines);
                }
            }
        }

        private sealed class NullScope : IDisposable
        {
            public static readonly NullScope Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
