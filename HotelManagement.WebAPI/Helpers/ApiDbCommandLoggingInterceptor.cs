using System.Data.Common;
using System.Diagnostics;
using System.Security.Claims;
using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace DoAnWebQuanLyKhachSan.API.Helpers
{
    public class ApiDbCommandLoggingInterceptor : DbCommandInterceptor
    {
        private const double SlowQueryThresholdMs = 300;
        private readonly ILogger<ApiDbCommandLoggingInterceptor> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ConcurrentDictionary<Guid, long> _startedCommands = new();

        public ApiDbCommandLoggingInterceptor(
            ILogger<ApiDbCommandLoggingInterceptor> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            MarkStart(eventData);
            return base.ReaderExecuting(command, eventData, result);
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            MarkStart(eventData);
            return base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
        }

        public override InterceptionResult<object> ScalarExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<object> result)
        {
            MarkStart(eventData);
            return base.ScalarExecuting(command, eventData, result);
        }

        public override ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<object> result,
            CancellationToken cancellationToken = default)
        {
            MarkStart(eventData);
            return base.ScalarExecutingAsync(command, eventData, result, cancellationToken);
        }

        public override InterceptionResult<int> NonQueryExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<int> result)
        {
            MarkStart(eventData);
            return base.NonQueryExecuting(command, eventData, result);
        }

        public override ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            MarkStart(eventData);
            return base.NonQueryExecutingAsync(command, eventData, result, cancellationToken);
        }

        public override DbDataReader ReaderExecuted(
            DbCommand command,
            CommandExecutedEventData eventData,
            DbDataReader result)
        {
            LogSuccess(command, eventData);
            return base.ReaderExecuted(command, eventData, result);
        }

        public override ValueTask<DbDataReader> ReaderExecutedAsync(
            DbCommand command,
            CommandExecutedEventData eventData,
            DbDataReader result,
            CancellationToken cancellationToken = default)
        {
            LogSuccess(command, eventData);
            return base.ReaderExecutedAsync(command, eventData, result, cancellationToken);
        }

        public override object ScalarExecuted(
            DbCommand command,
            CommandExecutedEventData eventData,
            object result)
        {
            LogSuccess(command, eventData);
            return base.ScalarExecuted(command, eventData, result);
        }

        public override ValueTask<object> ScalarExecutedAsync(
            DbCommand command,
            CommandExecutedEventData eventData,
            object result,
            CancellationToken cancellationToken = default)
        {
            LogSuccess(command, eventData);
            return base.ScalarExecutedAsync(command, eventData, result, cancellationToken);
        }

        public override int NonQueryExecuted(
            DbCommand command,
            CommandExecutedEventData eventData,
            int result)
        {
            LogSuccess(command, eventData);
            return base.NonQueryExecuted(command, eventData, result);
        }

        public override ValueTask<int> NonQueryExecutedAsync(
            DbCommand command,
            CommandExecutedEventData eventData,
            int result,
            CancellationToken cancellationToken = default)
        {
            LogSuccess(command, eventData);
            return base.NonQueryExecutedAsync(command, eventData, result, cancellationToken);
        }

        public override void CommandFailed(DbCommand command, CommandErrorEventData eventData)
        {
            LogFailure(command, eventData);
            base.CommandFailed(command, eventData);
        }

        public override Task CommandFailedAsync(
            DbCommand command,
            CommandErrorEventData eventData,
            CancellationToken cancellationToken = default)
        {
            LogFailure(command, eventData);
            return base.CommandFailedAsync(command, eventData, cancellationToken);
        }

        private void LogSuccess(DbCommand command, CommandExecutedEventData eventData)
        {
            var operation = ResolveOperation(command.CommandText);
            if (operation == null)
            {
                return;
            }

            var durationMs = ResolveDurationMs(eventData);
            if (durationMs < SlowQueryThresholdMs)
            {
                return;
            }

            var context = GetRequestContext();
            _logger.LogInformation(
                "Slow DB {Operation}. UserId={UserId}; Username={Username}; Request={Method} {Path}; DurationMs={DurationMs}; Sql={Sql}",
                operation,
                context.UserId,
                context.Username,
                context.Method,
                context.Path,
                durationMs,
                CompactSql(command.CommandText));
        }

        private void LogFailure(DbCommand command, CommandErrorEventData eventData)
        {
            var operation = ResolveOperation(command.CommandText) ?? "UNKNOWN";
            var context = GetRequestContext();
            _logger.LogError(
                eventData.Exception,
                "DB {Operation} failed. UserId={UserId}; Username={Username}; Request={Method} {Path}; DurationMs={DurationMs}; Sql={Sql}",
                operation,
                context.UserId,
                context.Username,
                context.Method,
                context.Path,
                ResolveDurationMs(eventData),
                CompactSql(command.CommandText));
        }

        private double ResolveDurationMs(CommandEndEventData eventData)
        {
            if (eventData.Duration != TimeSpan.Zero)
            {
                return Math.Round(eventData.Duration.TotalMilliseconds, 2);
            }

            if (_startedCommands.TryRemove(eventData.CommandId, out var startedAt))
            {
                return Math.Round(Stopwatch.GetElapsedTime(startedAt).TotalMilliseconds, 2);
            }

            return 0;
        }

        private double ResolveDurationMs(CommandErrorEventData eventData)
        {
            if (eventData.Duration != TimeSpan.Zero)
            {
                return Math.Round(eventData.Duration.TotalMilliseconds, 2);
            }

            if (_startedCommands.TryRemove(eventData.CommandId, out var startedAt))
            {
                return Math.Round(Stopwatch.GetElapsedTime(startedAt).TotalMilliseconds, 2);
            }

            return 0;
        }

        private static string? ResolveOperation(string sql)
        {
            if (string.IsNullOrWhiteSpace(sql))
            {
                return null;
            }

            var normalized = $" {CompactSql(sql).ToUpperInvariant()} ";

            if (normalized.Contains(" SELECT "))
            {
                return "SELECT";
            }

            if (normalized.Contains(" INSERT "))
            {
                return "INSERT";
            }

            if (normalized.Contains(" UPDATE "))
            {
                return "UPDATE";
            }

            if (normalized.Contains(" DELETE "))
            {
                return "DELETE";
            }

            return null;
        }

        private static string CompactSql(string sql)
        {
            return string.Join(" ", sql
                .Split(new[] { '\r', '\n', '\t' }, StringSplitOptions.RemoveEmptyEntries))
                .Trim();
        }

        private void MarkStart(CommandEventData eventData)
        {
            if (eventData.CommandId != Guid.Empty)
            {
                _startedCommands[eventData.CommandId] = Stopwatch.GetTimestamp();
            }
        }

        private (string? UserId, string? Username, string Method, string Path) GetRequestContext()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var user = httpContext?.User;

            return (
                user?.FindFirstValue(CustomClaimTypes.UserId),
                user?.FindFirstValue(ClaimTypes.NameIdentifier) ?? user?.Identity?.Name,
                httpContext?.Request?.Method ?? "N/A",
                httpContext?.Request?.Path.Value ?? "N/A");
        }
    }
}
