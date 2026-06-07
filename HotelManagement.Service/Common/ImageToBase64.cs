namespace DoAnWebQuanLyKhachSan.Service.Common
{
	public class ImageToBase64
	{
		public static string HandleImage(string fileName, string folder)
		{
			var normalizedFolder = (folder ?? string.Empty).Trim().Trim('/');
			var normalizedFileName = (fileName ?? string.Empty).Trim();

			if (string.IsNullOrWhiteSpace(normalizedFileName))
			{
				return string.IsNullOrWhiteSpace(normalizedFolder)
					? string.Empty
					: $"/{normalizedFolder}/";
			}

			if (normalizedFileName.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
				|| normalizedFileName.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
				|| normalizedFileName.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
			{
				return normalizedFileName;
			}

			normalizedFileName = normalizedFileName.Replace("\\", "/").TrimStart('/');
			if (!string.IsNullOrWhiteSpace(normalizedFolder)
				&& normalizedFileName.StartsWith($"{normalizedFolder}/", StringComparison.OrdinalIgnoreCase))
			{
				return $"/{normalizedFileName}";
			}

			return string.IsNullOrWhiteSpace(normalizedFolder)
				? $"/{normalizedFileName}"
				: $"/{normalizedFolder}/{normalizedFileName}";
		}
	}
}
