using DoAnWebQuanLyKhachSan.Service;
using DoAnWebQuanLyKhachSan.API.Commons;
using DoAnWebQuanLyKhachSan.API.Helpers;
using DoAnWebQuanLyKhachSan.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Linq;

namespace DoAnWebQuanLyKhachSan.API.Controllers
{
    [Route("api/auth")]
    public class AuthController : BaseController
    {
        private const int HotelManagerRoleId = 86;
        private AuthorizationService _authorizationService;
        private EmailService _emailService;
        private IOptions<Audience> _settings;

        public AuthController(IOptions<Audience> settings, AuthorizationService authorizationService, EmailService emailService)
        {
            _settings = settings;
            _authorizationService = authorizationService;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<ApiResult<int>> Register([FromForm] UserCreateDto newUser)
        {
            ApiResult<int> result = new ApiResult<int>();

            newUser.IsAdministrator = await _authorizationService.HasAdministratorRoleAsync(newUser.RoleIds);
            newUser.backgroundImage = string.IsNullOrWhiteSpace(newUser.backgroundImage) ? "user.png" : newUser.backgroundImage;
            var id = await _authorizationService.CreateUser(newUser);
            if (id > 0)
            {
                result.ResultObj = id;
                result.Message = "Tai khoan da duoc tao. Ban phai cho quan tri vien duyet.";
                result.statusCode = 201;
                return result;
            }
            else
            {
                result.ResultObj = id;
                result.Message = "A system error occurred. Please try again.";
                result.statusCode = 500;
                return result;
            }
        }

        [HttpPost("register-admin")]
        public async Task<ApiResult<int>> RegisterAdmin([FromForm] UserCreateDto newUser)
        {
            ApiResult<int> result = new ApiResult<int>();

            var deletedRegistrationConflictMessage = await _authorizationService.GetDeletedRegistrationConflictMessageAsync(
                newUser.UserName,
                newUser.Email,
                newUser.PhoneNumber);

            if (!string.IsNullOrWhiteSpace(deletedRegistrationConflictMessage))
            {
                result.ResultObj = 0;
                result.Message = deletedRegistrationConflictMessage;
                result.statusCode = 409;
                return result;
            }

            newUser.Active = 0;
            newUser.RoleIds = new List<int> { HotelManagerRoleId };
            newUser.IsAdministrator = await _authorizationService.HasAdministratorRoleAsync(newUser.RoleIds);
            newUser.backgroundImage = string.IsNullOrWhiteSpace(newUser.backgroundImage) ? "user.png" : newUser.backgroundImage;
            var id = await _authorizationService.CreateUser(newUser);
            if (id > 0)
            {
                result.ResultObj = id;
                result.Message = "Tai khoan da duoc tao. Ban phai cho quan tri vien duyet.";
                result.statusCode = 201;
                return result;
            }
            else
            {
                result.ResultObj = id;
                result.Message = "A system error occurred. Please try again.";
                result.statusCode = 500;
                return result;
            }
        }

        [HttpPost("login")]
        public async Task<ApiResult<object>> Login([FromBody] TokenRequestParams parameters)
        {
            if (!ModelState.IsValid)
            {
                return new ApiResult<object>
                {
                    ResultObj = "ModelState is valid .",
                    Message = "ModelState is valid .",
                    statusCode = 400
                };
            }

            var serviceResult = await _authorizationService.LoginAsync(
                parameters.grant_type,
                parameters.client_id,
                parameters.client_secret,
                parameters.username,
                parameters.password,
                parameters.refresh_token,
                _settings.Value.Secret,
                _settings.Value.Iss,
                _settings.Value.Aud);

            return new ApiResult<object>
            {
                ResultObj = serviceResult.ResultObj,
                Message = serviceResult.Message,
                statusCode = serviceResult.StatusCode
            };
        }

        [HttpPut("forgotpassword")]
        public async Task<ApiResult<string>> forgotpassword(ForgotPasswordDto model)
        {
            ApiResult<string> result = new ApiResult<string>();
            var a = await _authorizationService.forgotPassword(string.Empty, model);
            if (a[0] == "1")
            {
                var displayName = model.Email?.Split('@').FirstOrDefault() ?? "ban";
                await _emailService.SendForgotPasswordEmail(model.Email, displayName, a[1]);

                result.ResultObj = string.Empty;
                result.Message = "Mat khau moi da duoc gui vao email cua ban.";
                result.statusCode = 200;
                return result;
            }
            else
            {
                result.ResultObj = string.Empty;
                result.Message = a[1];
                result.statusCode = 404;
                return result;
            }
        }
    }
}
