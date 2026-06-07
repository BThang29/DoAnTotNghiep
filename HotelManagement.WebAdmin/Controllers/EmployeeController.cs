using Microsoft.AspNetCore.Mvc;

namespace DoAnWebQuanLyKhachSan.WebAppAdmin.Controllers
{
    public class EmployeeController : Controller
    {
        private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp"
        };
        private readonly IWebHostEnvironment _environment;

        public EmployeeController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public IActionResult Employees()
        {
            return View();
        }

        public IActionResult CreateEmployee()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> UploadAvatar(IFormFile file, CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn ảnh để tải lên." });
            }

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(extension) || !AllowedImageExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Chỉ hỗ trợ file ảnh .jpg, .jpeg, .png, .gif, .webp." });
            }

            var imagesDirectory = Path.Combine(_environment.WebRootPath, "images");
            Directory.CreateDirectory(imagesDirectory);

            var fileName = $"employee-{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var filePath = Path.Combine(imagesDirectory, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            return Json(new
            {
                message = "Tải ảnh lên thành công.",
                path = $"/images/{fileName}"
            });
        }
    }
}
